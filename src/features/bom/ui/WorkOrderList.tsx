import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus, CheckCircle, ArrowRightCircle, PlayCircle, Eye, XCircle } from 'lucide-react';
import { DataTable } from '@shared/ui/DataTable/DataTable';
import { TableActions, ActionButton } from '@shared/ui/TableActions/TableActions';
import { Button } from '@shared/ui/Button/Button';
import { Badge } from '@shared/ui/Badge/Badge';
import { Modal } from '@shared/ui/Modal/Modal';
import { Input } from '@shared/ui/Input/Input';
import { WorkOrderFormModal } from './WorkOrderFormModal';
import { WorkOrderDetailModal } from './WorkOrderDetailModal';
import { ConfirmModal } from '@shared/ui/Modal/ConfirmModal';
import { useToast } from '@shared/ui/Toast/Toast';
import { usePermission } from '@shared/hooks/usePermission';
import { formatDateVN } from '@shared/lib/formatDate';
import { formatNumber } from '@shared/lib/formatNumber';
import {
  useGetManufacturingWorkOrderListQuery,
  useGetManufacturingWorkOrderByWorkOrderIdQuery,
  usePostManufacturingWorkOrderByWorkOrderIdApproveMutation,
  usePostManufacturingWorkOrderByWorkOrderIdDeclareMutation,
  usePostManufacturingWorkOrderByWorkOrderIdDeclarePreviewMutation,
  usePostManufacturingWorkOrderByWorkOrderIdCompleteMutation,
  usePostManufacturingWorkOrderByWorkOrderIdCancelMutation,
  useDeleteManufacturingWorkOrderByWorkOrderIdPendingDeleteMutation,
  type WorkOrder,
  type MaterialPreviewDeclareItem,
} from '@features/manufacturing/api/manufacturingApi';
import { extractApiError } from '@shared/lib/extractApiError';
import { getDecimalsForUom } from '@shared/lib/uomDecimals';
import styles from './BomList.module.css';

const STATUS_MAP: Record<string, { label: string; variant: 'neutral' | 'warning' | 'success' | 'error' | 'info' }> = {
  pending_approval: { label: 'Nháp', variant: 'neutral' },
  in_progress: { label: 'Đang sản xuất', variant: 'warning' },
  pending_production_complete: { label: 'Chờ nghiệm thu', variant: 'info' },
  completed: { label: 'Hoàn tất', variant: 'success' },
  cancelled: { label: 'Đã hủy', variant: 'error' },
};

export function WorkOrderList() {
  const canCreate = usePermission('manufacturing.work_order_create');
  const canApprove = usePermission('manufacturing.work_order_approve');
  const canCancel = usePermission('manufacturing.work_order_cancel');
  const canDeclare = usePermission('manufacturing.work_order_declare');
  const canComplete = usePermission('manufacturing.work_order_complete');

  const [searchParams, setSearchParams] = useSearchParams();
  const urlStatus = searchParams.get('status');

  const [search, setSearch] = useState('');
  const [declaringWo, setDeclaringWo] = useState<WorkOrder | null>(null);
  const [producedQty, setProducedQty] = useState('');
  const [previewData, setPreviewData] = useState<MaterialPreviewDeclareItem[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [confirmState, setConfirmState] = useState<{ action: 'approve' | 'complete' | 'cancel' | 'delete', wo: WorkOrder, message: string } | null>(null);

  const queryId = searchParams.get('id');
  const { toast } = useToast();

  const { data, isLoading, isFetching, refetch } = useGetManufacturingWorkOrderListQuery({
    search: search || undefined,
    status: (urlStatus as WorkOrder['status']) || undefined,
  });

  const workOrders = data?.results || [];

  const viewingWo = useMemo(() => {
    if (!queryId || workOrders.length === 0) return null;
    return workOrders.find((w: WorkOrder) => w.id === queryId) || null;
  }, [queryId, workOrders]);

  const { data: detailWo, isFetching: isFetchingDetail } = useGetManufacturingWorkOrderByWorkOrderIdQuery(
    { workOrderId: queryId || '' },
    { skip: !queryId }
  );

  const selectedWo = detailWo || viewingWo;

  const remaining = useMemo(() => {
    if (!declaringWo) return 0;
    return Math.max(0, (declaringWo.quantity || 0) - (declaringWo.produced_qty || 0));
  }, [declaringWo]);

  const producedQtyError = useMemo(() => {
    if (!producedQty) return undefined;
    const v = Number(producedQty);
    if (isNaN(v) || v <= 0) return 'Số lượng phải lớn hơn 0';
    if (v > remaining) return `Số lượng vượt quá số còn lại cần sản xuất (${formatNumber(remaining)})`;
    return undefined;
  }, [producedQty, remaining]);

  const [approveWo, { isLoading: isApproving }] = usePostManufacturingWorkOrderByWorkOrderIdApproveMutation();
  const [declareWo, { isLoading: isDeclaring }] = usePostManufacturingWorkOrderByWorkOrderIdDeclareMutation();
  const [declarePreview] = usePostManufacturingWorkOrderByWorkOrderIdDeclarePreviewMutation();
  const [completeWo, { isLoading: isCompleting }] = usePostManufacturingWorkOrderByWorkOrderIdCompleteMutation();
  const [cancelWo, { isLoading: isCanceling }] = usePostManufacturingWorkOrderByWorkOrderIdCancelMutation();
  const [deleteWo, { isLoading: isDeleting }] = useDeleteManufacturingWorkOrderByWorkOrderIdPendingDeleteMutation();

  // Debounced preview fetch
  useEffect(() => {
    if (!declaringWo || !producedQty) {
      setPreviewData([]);
      return;
    }
    const v = Number(producedQty);
    if (isNaN(v) || v <= 0 || v > remaining) {
      setPreviewData([]);
      return;
    }
    const timer = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const res = await declarePreview({
          workOrderId: declaringWo.id || '',
          workOrderDeclarePreviewRequest: { produced_qty: v },
        }).unwrap();
        setPreviewData((res as any).results || []);
      } catch (e) {
        setPreviewData([]);
      } finally {
        setPreviewLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [producedQty, declaringWo, declarePreview, remaining]);

  const handleApprove = useCallback((wo: WorkOrder) => {
    setConfirmState({
      action: 'approve',
      wo,
      message: `Bạn có chắc chắn muốn phê duyệt lệnh ${wo.name}? Quá trình này sẽ xuất nguyên liệu từ kho nguồn.`
    });
  }, []);

  const handleComplete = useCallback((wo: WorkOrder) => {
    setConfirmState({
      action: 'complete',
      wo,
      message: `Bạn có chắc chắn muốn hoàn thành lệnh ${wo.name}? Quá trình này sẽ nhập thành phẩm vào kho đích.`
    });
  }, []);

  const handleCancel = useCallback((wo: WorkOrder) => {
    if (wo.status === 'pending_approval') {
      setConfirmState({
        action: 'delete',
        wo,
        message: `Bạn có chắc chắn muốn xóa lệnh sản xuất nháp ${wo.name}? Dữ liệu sẽ bị xóa vĩnh viễn.`
      });
    } else {
      setConfirmState({
        action: 'cancel',
        wo,
        message: `Bạn có chắc chắn muốn hủy lệnh ${wo.name}? Lệnh đã hủy sẽ không thể tiếp tục.`
      });
    }
  }, []);

  const handleConfirmAction = async () => {
    if (!confirmState) return;
    const { action, wo } = confirmState;
    try {
      if (action === 'approve') {
        await approveWo({ workOrderId: wo.id || '' }).unwrap();
        toast('success', `Phê duyệt lệnh ${wo.name} thành công.`);
      } else if (action === 'complete') {
        await completeWo({ workOrderId: wo.id || '' }).unwrap();
        toast('success', `Hoàn thành lệnh ${wo.name} thành công.`);
      } else if (action === 'cancel') {
        await cancelWo({ workOrderId: wo.id || '' }).unwrap();
        toast('success', `Hủy lệnh ${wo.name} thành công.`);
      } else if (action === 'delete') {
        await deleteWo({ workOrderId: wo.id || '' }).unwrap();
        toast('success', `Xóa lệnh ${wo.name} thành công.`);
      }
      refetch();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast('error', extractApiError(error, 'Lỗi khi thực hiện thao tác'));
    } finally {
      setConfirmState(null);
    }
  };

  const confirmDeclare = async () => {
    if (!declaringWo || !producedQty || producedQtyError) return;
    try {
      const qty = Number(producedQty);
      await declareWo({
        workOrderId: declaringWo.id || '',
        workOrderDeclareInput: {
          produced_qty: qty,
        },
      }).unwrap();
      
      toast('success', `Nhập liệu ${formatNumber(qty)} sản phẩm cho lệnh ${declaringWo.name} thành công`);
      setDeclaringWo(null);
      setProducedQty('');
      refetch();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast('error', extractApiError(error, 'Có lỗi xảy ra khi nhập liệu'));
    }
  };

  const columns = useMemo<ColumnDef<WorkOrder, unknown>[]>(
    () => [
      { accessorKey: 'name', header: 'Mã Lệnh', size: 140 },
      { 
        accessorKey: 'bom_name', 
        header: 'Định mức (BOM)',
        cell: ({ row }) => {
          const original = row.original as { bom?: { name?: string }; bom_name?: string };
          return original.bom?.name || original.bom_name || '-';
        }
      },
      {
        id: 'progress',
        header: 'Tiến độ',
        size: 160,
        cell: ({ row }) => {
          const wo = row.original;
          const produced = wo.produced_qty || 0;
          const total = wo.quantity || 0;
          const pct = total > 0 ? Math.min(100, Math.round((produced / total) * 100)) : 0;
          const uom = wo.production_uom ? ` ${wo.production_uom}` : '';
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ height: 6, background: 'var(--clr-surface-alt)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: 'var(--clr-primary)' }} />
              </div>
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                {formatNumber(produced)} / {formatNumber(total)}{uom} ({formatNumber(pct, 0)}%)
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Trạng Thái',
        size: 130,
        cell: ({ getValue }) => {
          const val = getValue<string>();
          const s = STATUS_MAP[val] || { label: val, variant: 'neutral' };
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return <Badge variant={s.variant as any}>{s.label}</Badge>;
        },
      },
      {
        accessorKey: 'planned_start_date',
        header: 'Bắt Đầu',
        size: 110,
        cell: ({ row }) => formatDateVN(row.original.planned_start_date)
      },
      {
        id: 'actions',
        header: 'Thao Tác',
        size: 160,
        enableSorting: false,
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <TableActions>
              <ActionButton
                icon={<Eye size={18} />}
                title="Chi tiết"
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  if (row.original.id) {
                    params.set('id', row.original.id);
                  } else {
                    params.delete('id');
                  }
                  setSearchParams(params);
                }}
              />
              {status === 'pending_approval' && (
                <>
                  {canApprove && (
                    <ActionButton
                      icon={<PlayCircle size={18} />}
                      title="Phê duyệt"
                      variant="info"
                      onClick={() => handleApprove(row.original)}
                      disabled={isApproving}
                    />
                  )}
                  {canCancel && (
                    <ActionButton
                      icon={<XCircle size={18} />}
                      title="Hủy"
                      variant="danger"
                      onClick={() => handleCancel(row.original)}
                      disabled={isCanceling}
                    />
                  )}
                </>
              )}
              {status === 'in_progress' && (
                <>
                  {Number(row.original.produced_qty || 0) < Number(row.original.quantity || 0) && canDeclare && (
                    <ActionButton
                      icon={<ArrowRightCircle size={18} />}
                      title="Nhập liệu"
                      variant="warning"
                      onClick={() => {
                        setDeclaringWo(row.original);
                        setProducedQty('');
                      }}
                    />
                  )}
                  {Number(row.original.produced_qty || 0) >= Number(row.original.quantity || 0) && canComplete && (
                    <ActionButton
                      icon={<CheckCircle size={18} />}
                      title="Hoàn thành"
                      variant="success"
                      onClick={() => handleComplete(row.original)}
                      disabled={isCompleting}
                    />
                  )}
                </>
              )}
              {status === 'pending_production_complete' && (
                <>
                  {canComplete && (
                    <ActionButton
                      icon={<CheckCircle size={18} />}
                      title="Phê duyệt hoàn tất"
                      variant="success"
                      onClick={() => handleComplete(row.original)}
                      disabled={isCompleting}
                    />
                  )}
                </>
              )}
            </TableActions>
          );
        }
      },
    ],
    [handleApprove, handleCancel, handleComplete, isApproving, isCanceling, isCompleting, canApprove, canCancel, canDeclare, canComplete],
  );



  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Lệnh Sản Xuất</h2>
          <p className={styles.subtitle}>{formatNumber(data?.count ?? 0, 0)} lệnh</p>
        </div>
        {canCreate && (
          <Button icon={<Plus size={16} />} onClick={() => setShowCreate(true)}>
            Tạo lệnh
          </Button>
        )}
      </div>

      <DataTable 
        columns={columns} 
        data={workOrders} 
        loading={isLoading || isFetching}
        searchPlaceholder="Tìm theo mã lệnh..." 
        onSearch={setSearch}
      />

      {showCreate && (
        <WorkOrderFormModal 
          open 
          onClose={() => setShowCreate(false)} 
          onSuccess={() => {
            setShowCreate(false);
            refetch();
          }} 
        />
      )}

      {declaringWo && (
        <Modal
          open
          onClose={() => setDeclaringWo(null)}
          title="Nhập Liệu Sản Xuất"
          size="lg"
          footer={
            <>
              <Button variant="ghost" onClick={() => setDeclaringWo(null)} disabled={isDeclaring}>Hủy</Button>
              <Button variant="primary" onClick={confirmDeclare} disabled={isDeclaring || !producedQty || !!producedQtyError}>
                {isDeclaring ? 'Đang xử lý...' : 'Xác nhận'}
              </Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
            <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <li><strong>Mã lệnh:</strong> {declaringWo.name}</li>
              <li><strong>Sản phẩm:</strong> {declaringWo.production_item_name}</li>
              <li><strong>SL yêu cầu:</strong> <span style={{ fontWeight: 700, color: 'var(--clr-primary)' }}>{formatNumber(declaringWo.quantity)} {declaringWo.production_uom}</span></li>
              <li><strong>Đã SX:</strong> <span style={{ fontWeight: 700 }}>{formatNumber(declaringWo.produced_qty)} {declaringWo.production_uom}</span></li>
              <li><strong>Còn lại:</strong> <span style={{ fontWeight: 700, color: 'var(--clr-success)' }}>{formatNumber(Math.max(0, (declaringWo.quantity || 0) - (declaringWo.produced_qty || 0)))} {declaringWo.production_uom}</span></li>
            </ul>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
              <label style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'var(--fs-sm)',
                fontWeight: 'var(--fw-medium)',
                color: 'var(--clr-text-secondary)'
              }}>
                Số lượng sản xuất đợt này <span style={{ color: 'var(--clr-error)' }}>*</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <Input
                    type="number"
                    min={0}
                    value={producedQty}
                    decimals={getDecimalsForUom(declaringWo.production_uom)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProducedQty(e.target.value)}
                    disabled={isDeclaring}
                    style={producedQtyError ? { borderColor: 'var(--clr-error)' } : undefined}
                  />
                </div>
                <span style={{ color: 'var(--clr-text-secondary)' }}>{declaringWo.production_uom}</span>
              </div>
              {producedQtyError && (
                <p style={{
                  fontSize: 'var(--fs-xs)',
                  color: 'var(--clr-error)',
                  marginTop: '2px'
                }}>
                  {producedQtyError}
                </p>
              )}
            </div>

            {previewLoading && (
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)', marginTop: 'var(--sp-2)' }}>
                Đang tải thông tin nguyên liệu...
              </div>
            )}

            {!previewLoading && previewData.length > 0 && (
              <div style={{ borderTop: '1px solid var(--clr-border)', paddingTop: 'var(--sp-3)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                <h4 style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, margin: 0 }}>
                  Nguyên liệu tại Kho Bán Thành Phẩm cần dùng ({declaringWo.production_warehouse})
                </h4>
                {previewData.some((m) => !m.is_sufficient) && (
                  <div style={{
                    background: 'var(--clr-warning-bg, #fff4e5)',
                    color: 'var(--clr-warning, #c2410c)',
                    padding: 'var(--sp-2)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--fs-xs)',
                    border: '1px solid var(--clr-warning-border, #fde8d0)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--sp-1)'
                  }}>
                    <span>⚠️</span>
                    <span>Có nguyên liệu không đủ tồn kho tại Kho Bán Thành Phẩm. Vui lòng bổ sung trước khi nhập liệu.</span>
                  </div>
                )}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: 'var(--fs-xs)', borderCollapse: 'collapse', border: '1px solid var(--clr-border)' }}>
                    <thead>
                      <tr style={{ background: 'var(--clr-surface-alt)', borderBottom: '1px solid var(--clr-border)' }}>
                        <th style={{ padding: '6px', textAlign: 'left', fontWeight: 600 }}>Mã NVL</th>
                        <th style={{ padding: '6px', textAlign: 'left', fontWeight: 600 }}>Tên NVL</th>
                        <th style={{ padding: '6px', textAlign: 'right', fontWeight: 600 }}>Cần dùng</th>
                        <th style={{ padding: '6px', textAlign: 'right', fontWeight: 600 }}>Tồn khả dụng</th>
                        <th style={{ padding: '6px', textAlign: 'right', fontWeight: 600 }}>Thiếu hụt</th>
                        <th style={{ padding: '6px', textAlign: 'center', fontWeight: 600 }}>ĐVT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((m) => (
                        <tr
                          key={m.item_id}
                          style={{
                            borderBottom: '1px solid var(--clr-border)',
                            background: !m.is_sufficient ? 'rgba(220, 38, 38, 0.08)' : undefined,
                          }}
                        >
                          <td style={{ padding: '6px' }}>{m.item_code}</td>
                          <td style={{ padding: '6px' }}>{m.item_name}</td>
                          <td style={{ padding: '6px', textAlign: 'right' }}>{formatNumber(m.required_qty, 2)}</td>
                          <td style={{
                            padding: '6px',
                            textAlign: 'right',
                            color: !m.is_sufficient ? 'var(--clr-error)' : 'inherit',
                            fontWeight: !m.is_sufficient ? 600 : 400,
                          }}>
                            {formatNumber(m.available_qty, 2)}
                          </td>
                          <td style={{
                            padding: '6px',
                            textAlign: 'right',
                            color: !m.is_sufficient ? 'var(--clr-error)' : 'inherit',
                            fontWeight: !m.is_sufficient ? 600 : 400,
                          }}>
                            {formatNumber(m.missing_qty, 2)}
                          </td>
                          <td style={{ padding: '6px', textAlign: 'center', color: 'var(--clr-text-muted)' }}>{m.uom ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {viewingWo && (
        <WorkOrderDetailModal
          open={!!viewingWo}
          workOrder={selectedWo}
          isLoading={isFetchingDetail}
          onClose={() => {
            const params = new URLSearchParams(searchParams);
            params.delete('id');
            setSearchParams(params);
          }}
          onApprove={handleApprove}
          onCancel={handleCancel}
          onDeclare={(wo) => {
            setDeclaringWo(wo);
            setProducedQty('');
          }}
          onComplete={handleComplete}
          canApprove={canApprove}
          canCancel={canCancel}
          canDeclare={canDeclare}
          canComplete={canComplete}
        />
      )}

      {confirmState && (
        <ConfirmModal
          open={!!confirmState}
          title="Xác nhận"
          message={confirmState.message}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmState(null)}
          isLoading={isApproving || isCompleting || isCanceling || isDeleting}
          nested={!!viewingWo}
          zIndex={viewingWo ? 1100 : undefined}
        />
      )}
    </div>
  );
}

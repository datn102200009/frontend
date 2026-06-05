import { useCallback, useMemo, useState } from 'react';
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
import { formatDateShort } from '@shared/lib/formatDate';
import {
  useGetManufacturingWorkOrderListQuery,
  usePostManufacturingWorkOrderByWorkOrderIdApproveMutation,
  usePostManufacturingWorkOrderByWorkOrderIdDeclareMutation,
  usePostManufacturingWorkOrderByWorkOrderIdCompleteMutation,
  usePostManufacturingWorkOrderByWorkOrderIdCancelMutation,
  type WorkOrder,
} from '@features/manufacturing/api/manufacturingApi';
import styles from './BomList.module.css';

const STATUS_MAP: Record<string, { label: string; variant: 'neutral' | 'warning' | 'success' | 'error' }> = {
  pending_approval: { label: 'Chờ duyệt', variant: 'neutral' },
  in_progress: { label: 'Đang thực hiện', variant: 'warning' },
  completed: { label: 'Hoàn thành', variant: 'success' },
  cancelled: { label: 'Đã hủy', variant: 'error' },
};

export function WorkOrderList() {
  const [search, setSearch] = useState('');
  const [declaringWo, setDeclaringWo] = useState<WorkOrder | null>(null);
  const [viewingWo, setViewingWo] = useState<WorkOrder | null>(null);
  const [producedQty, setProducedQty] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [confirmState, setConfirmState] = useState<{ action: 'approve' | 'complete' | 'cancel', wo: WorkOrder, message: string } | null>(null);
  const { toast } = useToast();

  const { data, isLoading, isFetching, refetch } = useGetManufacturingWorkOrderListQuery({
    search: search || undefined,
  });

  const [approveWo, { isLoading: isApproving }] = usePostManufacturingWorkOrderByWorkOrderIdApproveMutation();
  const [declareWo, { isLoading: isDeclaring }] = usePostManufacturingWorkOrderByWorkOrderIdDeclareMutation();
  const [completeWo, { isLoading: isCompleting }] = usePostManufacturingWorkOrderByWorkOrderIdCompleteMutation();
  const [cancelWo, { isLoading: isCanceling }] = usePostManufacturingWorkOrderByWorkOrderIdCancelMutation();

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
    setConfirmState({
      action: 'cancel',
      wo,
      message: `Bạn có chắc chắn muốn hủy lệnh ${wo.name}? Lệnh đã hủy sẽ không thể tiếp tục.`
    });
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
      }
      refetch();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast('error', error?.data?.detail || 'Lỗi khi thực hiện thao tác');
    } finally {
      setConfirmState(null);
    }
  };

  const confirmDeclare = async () => {
    if (!declaringWo || !producedQty) return;
    try {
      const qty = Number(producedQty);
      await declareWo({
        workOrderId: declaringWo.id || '',
        workOrderDeclareInput: {
          produced_qty: qty,
        },
      }).unwrap();
      
      toast('success', `Nhập liệu ${qty} sản phẩm cho lệnh ${declaringWo.name} thành công`);
      setDeclaringWo(null);
      setProducedQty('');
      refetch();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast('error', error?.data?.detail || 'Có lỗi xảy ra khi nhập liệu');
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
        accessorKey: 'quantity',
        header: 'SL Yêu Cầu',
        size: 100,
        cell: ({ getValue }) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{getValue<number>()}</span>,
      },
      {
        accessorKey: 'produced_qty',
        header: 'SL Đã SX',
        size: 100,
        cell: ({ getValue }) => <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: '500' }}>{getValue<number>() ?? 0}</span>,
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
        cell: ({ row }) => formatDateShort(row.original.planned_start_date)
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
                onClick={() => setViewingWo(row.original)}
              />
              {status === 'pending_approval' && (
                <>
                  <ActionButton
                    icon={<PlayCircle size={18} />}
                    title="Phê duyệt"
                    onClick={() => handleApprove(row.original)}
                    disabled={isApproving}
                  />
                  <ActionButton
                    icon={<XCircle size={18} />}
                    title="Hủy"
                    variant="danger"
                    onClick={() => handleCancel(row.original)}
                    disabled={isCanceling}
                  />
                </>
              )}
              {status === 'in_progress' && (
                <>
                  {(row.original.produced_qty || 0) < (row.original.quantity || 0) && (
                    <ActionButton
                      icon={<ArrowRightCircle size={18} />}
                      title="Nhập liệu"
                      onClick={() => {
                        setDeclaringWo(row.original);
                        setProducedQty('');
                      }}
                    />
                  )}
                  {(row.original.produced_qty || 0) >= (row.original.quantity || 0) && (
                    <ActionButton
                      icon={<CheckCircle size={18} />}
                      title="Hoàn thành"
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
    [handleApprove, handleCancel, handleComplete, isApproving, isCanceling, isCompleting],
  );

  const workOrders = data?.results || [];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Lệnh Sản Xuất</h2>
          <p className={styles.subtitle}>{data?.count ?? 0} lệnh</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setShowCreate(true)}>
          Tạo lệnh
        </Button>
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
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setDeclaringWo(null)} disabled={isDeclaring}>Hủy</Button>
              <Button variant="primary" onClick={confirmDeclare} disabled={isDeclaring || !producedQty}>
                {isDeclaring ? 'Đang xử lý...' : 'Xác nhận'}
              </Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
            <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text)' }}>
              Nhập số lượng sản phẩm hoàn thành cho lệnh <strong>"{declaringWo.name}"</strong>. 
              Thành phẩm sẽ được nhập vào kho đích.
              <br/>
              <em>Yêu cầu: {declaringWo.quantity || 0} | Đã sản xuất: {declaringWo.produced_qty || 0} | Còn lại: {Math.max(0, (declaringWo.quantity || 0) - (declaringWo.produced_qty || 0))}</em>
            </p>
            <Input
              label="Số lượng sản xuất đợt này"
              type="number"
              value={producedQty}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProducedQty(e.target.value)}
              min={1}
              max={Math.max(0, (declaringWo.quantity || 0) - (declaringWo.produced_qty || 0))}
              disabled={isDeclaring}
              required
            />
          </div>
        </Modal>
      )}

      {viewingWo && (
        <WorkOrderDetailModal
          open
          workOrder={viewingWo}
          onClose={() => setViewingWo(null)}
        />
      )}

      {confirmState && (
        <ConfirmModal
          open={!!confirmState}
          title="Xác nhận"
          message={confirmState.message}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmState(null)}
          isLoading={isApproving || isCompleting || isCanceling}
        />
      )}
    </div>
  );
}

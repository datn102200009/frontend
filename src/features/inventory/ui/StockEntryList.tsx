import { useMemo, useState, useEffect } from 'react';
import { 
  useGetInventoryStockEntryListQuery, 
  usePostInventoryStockInByStockEntryIdApproveMutation, 
  usePostInventoryStockIssueByStockEntryIdApproveMutation, 
  usePostInventoryStockTransferByStockEntryIdApproveMutation,
  useGetInventoryStockLedgerBalanceQuery,
  usePostInventoryStockEntryByStockEntryIdUpdateMutation
} from '@features/inventory/api/inventoryApi';
import { useGetMasterDataWarehousesListQuery } from '@features/inventory/api/masterDataApi';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus, CheckCircle, Eye } from 'lucide-react';
import { DataTable } from '@shared/ui/DataTable/DataTable';
import { TableActions, ActionButton } from '@shared/ui/TableActions/TableActions';
import { Button } from '@shared/ui/Button/Button';
import { Badge } from '@shared/ui/Badge/Badge';
import { Modal } from '@shared/ui/Modal/Modal';
import { useToast } from '@shared/ui/Toast/Toast';
import { StockEntryForm } from './StockEntryForm';
import { StockEntryDetailModal } from './StockEntryDetailModal';
import { formatDateTime } from '@shared/lib/formatDate';
import type { StockEntry } from '@features/inventory/api/inventoryApi';


const PURPOSE_LABELS: Record<string, string> = {
  receipt: 'Nhập kho',
  issue: 'Xuất kho SX',
  transfer: 'Chuyển kho',
  manufacture: 'Sản xuất',
  adjustment: 'Điều chỉnh',
};

const PURPOSE_VARIANTS: Record<string, 'success' | 'warning' | 'info' | 'default'> = {
  receipt: 'success',
  issue: 'warning',
  transfer: 'info',
  manufacture: 'info',
  adjustment: 'default',
};

const STATUS_LABELS: Record<string, { label: string; variant: 'neutral' | 'success' | 'warning' }> = {
  draft: { label: 'Nháp', variant: 'neutral' },
  submitted: { label: 'Chờ duyệt', variant: 'warning' },
  posted: { label: 'Đã duyệt', variant: 'success' },
};

export function StockEntryList() {
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'posted'>('all');
  const { data: entriesData, isLoading, refetch } = useGetInventoryStockEntryListQuery({ status: statusFilter === 'all' ? 'all' : statusFilter });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entries = (entriesData as any)?.results || (Array.isArray(entriesData) ? entriesData : []);
  
  const { data: warehouses } = useGetMasterDataWarehousesListQuery();
  const { data: stockBalances } = useGetInventoryStockLedgerBalanceQuery({});
  const [updateStockEntry, { isLoading: isUpdating }] = usePostInventoryStockEntryByStockEntryIdUpdateMutation();

  const [approveStockIn, { isLoading: isApprovingIn }] = usePostInventoryStockInByStockEntryIdApproveMutation();
  const [approveStockIssue, { isLoading: isApprovingIssue }] = usePostInventoryStockIssueByStockEntryIdApproveMutation();
  const [approveStockTransfer, { isLoading: isApprovingTransfer }] = usePostInventoryStockTransferByStockEntryIdApproveMutation();
  const [approving, setApproving] = useState<StockEntry | null>(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [viewingEntry, setViewingEntry] = useState<StockEntry | null>(null);
  const [showCreate, setShowCreate] = useState<'stock_in' | 'stock_issue' | 'internal_transfer' | null>(null);
  const { toast } = useToast();
  
  const isApproving = isApprovingIn || isApprovingIssue || isApprovingTransfer || isUpdating;

  useEffect(() => {
    if (approving) {
      let defaultWh = '';
      if (approving.details && approving.details.length > 0) {
        const firstDetail = approving.details[0];
        if (approving.purpose === 'receipt') {
          defaultWh = firstDetail.target_warehouse_id || '';
        } else if (approving.purpose === 'issue') {
          defaultWh = firstDetail.source_warehouse_id || '';
        }
      }
      setSelectedWarehouseId(defaultWh);
    } else {
      setSelectedWarehouseId('');
    }
  }, [approving]);

  const handleApprove = (entry: StockEntry) => {
    setApproving(entry);
  };

  const confirmApprove = async () => {
    if (!approving) return;
    try {
      if ((approving.purpose === 'receipt' || approving.purpose === 'issue') && selectedWarehouseId) {
        const isDirty = (approving.details || []).some(detail => {
          if (approving.purpose === 'receipt') {
            return detail.target_warehouse_id !== selectedWarehouseId;
          } else if (approving.purpose === 'issue') {
            return detail.source_warehouse_id !== selectedWarehouseId;
          }
          return false;
        });

        if (isDirty) {
          const payload = {
            remarks: approving.remarks,
            details: (approving.details || []).map(detail => ({
              detail_id: detail.id!,
              source_warehouse_id: approving.purpose === 'issue' ? selectedWarehouseId : detail.source_warehouse_id,
              target_warehouse_id: approving.purpose === 'receipt' ? selectedWarehouseId : detail.target_warehouse_id,
              quantity: detail.quantity
            }))
          };
          await updateStockEntry({
            stockEntryId: approving.id!,
            stockEntryUpdateInput: payload
          }).unwrap();
        }
      }

      if (approving.purpose === 'receipt') {
        await approveStockIn({ stockEntryId: approving.id! }).unwrap();
      } else if (approving.purpose === 'issue') {
        await approveStockIssue({ stockEntryId: approving.id! }).unwrap();
      } else if (approving.purpose === 'transfer') {
        await approveStockTransfer({ stockEntryId: approving.id! }).unwrap();
      }
      
      const purposeLabel = approving.purpose === 'issue' && approving.sales_order_id ? 'Xuất kho' : (PURPOSE_LABELS[approving.purpose || ''] || approving.purpose);
      toast('success', `Phê duyệt ${approving.name} (${purposeLabel}) thành công — đã ghi sổ cái`);
      setApproving(null);
      refetch();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast('error', error?.data?.detail || 'Có lỗi xảy ra khi phê duyệt');
    }
  };

  const columns = useMemo<ColumnDef<StockEntry, unknown>[]>(
    () => [
      { accessorKey: 'name', header: 'Mã Phiếu', size: 140 },
      {
        accessorKey: 'purpose',
        header: 'Loại',
        size: 130,
        cell: ({ row }) => {
          const entry = row.original;
          const t = entry.purpose || '';
          const label = t === 'issue' && entry.sales_order_id ? 'Xuất kho' : (PURPOSE_LABELS[t] || t);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return <Badge variant={PURPOSE_VARIANTS[t] as any}>{label}</Badge>;
        },
      },
      {
        accessorKey: 'remarks',
        header: 'Ghi Chú',
        cell: ({ getValue }) => <span style={{ color: 'var(--clr-text-secondary)', fontSize: 'var(--fs-sm)' }}>{getValue<string>() || '—'}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng Thái',
        size: 110,
        cell: ({ getValue }) => {
          const s = STATUS_LABELS[getValue<string>()] || { label: getValue<string>(), variant: 'neutral' };
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return <Badge variant={s.variant as any}>{s.label}</Badge>;
        },
      },
      {
        accessorKey: 'created_at',
        header: 'Ngày Tạo',
        size: 140,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cell: ({ row }) => formatDateTime((row.original as any).created_at),
      },
      {
        id: 'actions',
        header: 'Thao Tác',
        size: 100,
        enableSorting: false,
        cell: ({ row }) => (
          <TableActions>
            <ActionButton
              icon={<Eye size={18} />}
              title="Chi tiết"
              onClick={() => setViewingEntry(row.original)}
            />
            {row.original.status === 'draft' && (
              <ActionButton
                icon={<CheckCircle size={18} />}
                title="Duyệt"
                onClick={() => handleApprove(row.original)}
              />
            )}
          </TableActions>
        )
      },
    ],
    [],
  );

  const hasSufficientStock = useMemo(() => {
    if (approving?.purpose !== 'issue') return true;
    if (!selectedWarehouseId) return false;
    return (approving.details || []).every((detail: any) => {
      const balance = (stockBalances || []).find(
        (b: any) => b.warehouse_id === selectedWarehouseId && b.item_id === detail.item_id
      )?.total_quantity || 0;
      return balance >= (detail.quantity || 0);
    });
  }, [approving, selectedWarehouseId, stockBalances]);

  const canApprove = approving?.purpose === 'receipt'
    ? !!selectedWarehouseId
    : (approving?.purpose === 'issue' ? (!!selectedWarehouseId && hasSufficientStock) : true);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--fs-lg)', fontWeight: 600, margin: 0 }}>Phiếu Kho</h2>
            <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)', marginTop: 2 }}>{entries.length} phiếu</p>
          </div>
          <div style={{ display: 'flex', background: 'var(--clr-surface)', padding: 4, borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-border)' }}>
            <button 
              onClick={() => setStatusFilter('all')}
              style={{ padding: '6px 12px', fontSize: 'var(--fs-sm)', borderRadius: 'var(--radius-sm)', border: 'none', background: statusFilter === 'all' ? 'var(--clr-bg)' : 'transparent', color: statusFilter === 'all' ? 'var(--clr-text)' : 'var(--clr-text-muted)', cursor: 'pointer', fontWeight: statusFilter === 'all' ? 600 : 400 }}
            >
              Tất cả
            </button>
            <button 
              onClick={() => setStatusFilter('draft')}
              style={{ padding: '6px 12px', fontSize: 'var(--fs-sm)', borderRadius: 'var(--radius-sm)', border: 'none', background: statusFilter === 'draft' ? 'var(--clr-bg)' : 'transparent', color: statusFilter === 'draft' ? 'var(--clr-text)' : 'var(--clr-text-muted)', cursor: 'pointer', fontWeight: statusFilter === 'draft' ? 600 : 400 }}
            >
              Chờ duyệt
            </button>
            <button 
              onClick={() => setStatusFilter('posted')}
              style={{ padding: '6px 12px', fontSize: 'var(--fs-sm)', borderRadius: 'var(--radius-sm)', border: 'none', background: statusFilter === 'posted' ? 'var(--clr-bg)' : 'transparent', color: statusFilter === 'posted' ? 'var(--clr-text)' : 'var(--clr-text-muted)', cursor: 'pointer', fontWeight: statusFilter === 'posted' ? 600 : 400 }}
            >
              Đã duyệt
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button icon={<Plus size={16} />} onClick={() => setShowCreate('stock_in')}>Nhập Kho</Button>
          <Button icon={<Plus size={16} />} variant="secondary" onClick={() => setShowCreate('stock_issue')}>Xuất Kho</Button>
          <Button icon={<Plus size={16} />} variant="outline" onClick={() => setShowCreate('internal_transfer')}>Chuyển Kho</Button>
        </div>
      </div>
      <DataTable columns={columns} data={entries} searchPlaceholder="Tìm mã phiếu..." loading={isLoading} />

      {approving && (
        <Modal
          open
          onClose={() => setApproving(null)}
          title="Xác Nhận Phê Duyệt"
          size={approving.purpose === 'issue' ? 'md' : 'sm'}
          footer={
            <>
              <Button variant="ghost" onClick={() => setApproving(null)}>Hủy</Button>
              <Button variant="primary" onClick={confirmApprove} disabled={isApproving || !canApprove}>Phê duyệt</Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
            <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text)', margin: 0 }}>
              Bạn có chắc chắn muốn phê duyệt phiếu <strong>"{approving.name}"</strong> không? Hành động này sẽ ghi sổ cái và không thể hoàn tác.
            </p>

            {(approving.purpose === 'receipt' || approving.purpose === 'issue') && (
              <div>
                <label htmlFor="warehouse-select" style={{ display: 'block', fontSize: 'var(--fs-xs)', fontWeight: 600, color: 'var(--clr-text-secondary)', marginBottom: 'var(--sp-1)' }}>
                  {approving.purpose === 'receipt' ? 'Kho nhận hàng' : 'Kho xuất hàng'} <span style={{ color: 'var(--clr-error)' }}>*</span>
                </label>
                <select
                  id="warehouse-select"
                  value={selectedWarehouseId}
                  onChange={(e) => setSelectedWarehouseId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: 'var(--sp-2) var(--sp-3)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--clr-border)',
                    fontSize: 'var(--fs-sm)',
                    background: 'var(--clr-surface)',
                    color: 'var(--clr-text)',
                  }}
                  disabled={isApproving}
                >
                  <option value="">-- Chọn kho --</option>
                  {(warehouses || []).map((wh: any) => (
                    <option key={wh.id} value={wh.id}>{wh.name}</option>
                  ))}
                </select>
              </div>
            )}

            {approving.purpose === 'issue' && (
              <div>
                <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 600, color: 'var(--clr-text-secondary)', marginBottom: 'var(--sp-2)' }}>
                  Kiểm tra tồn kho khả dụng:
                </div>
                {selectedWarehouseId ? (
                  <div style={{ border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--fs-sm)' }}>
                      <thead style={{ background: 'var(--clr-surface-alt)', borderBottom: '1px solid var(--clr-border)', textAlign: 'left' }}>
                        <tr>
                          <th style={{ padding: '8px 12px' }}>Sản phẩm</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>Yêu cầu</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>Hiện có</th>
                          <th style={{ padding: '8px 12px', textAlign: 'center' }}>Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(approving.details || []).map((detail: any, idx: number) => {
                          const balance = (stockBalances || []).find(
                            (b: any) => b.warehouse_id === selectedWarehouseId && b.item_id === detail.item_id
                          )?.total_quantity || 0;
                          const isSufficient = balance >= (detail.quantity || 0);
                          return (
                            <tr key={idx} style={{ borderBottom: idx < (approving.details || []).length - 1 ? '1px solid var(--clr-border)' : 'none' }}>
                              <td style={{ padding: '8px 12px', fontWeight: 500 }}>{detail.item_name || detail.item_code}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'right' }}>{detail.quantity} {detail.uom_name || ''}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', color: isSufficient ? 'inherit' : 'var(--clr-error)' }}>{balance}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                <span style={{
                                  color: isSufficient ? 'var(--clr-success)' : 'var(--clr-error)',
                                  fontWeight: 600
                                }}>
                                  {isSufficient ? 'Đủ hàng' : `Thiếu ${detail.quantity - balance}`}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)', fontStyle: 'italic', padding: '16px', border: '1px dashed var(--clr-border)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                    Vui lòng chọn kho để kiểm tra tồn kho
                  </div>
                )}
              </div>
            )}

            {selectedWarehouseId && approving.purpose === 'issue' && !hasSufficientStock && (
              <div style={{
                padding: 'var(--sp-2) var(--sp-3)',
                background: 'var(--clr-error-bg)',
                color: 'var(--clr-error)',
                fontSize: 'var(--fs-xs)',
                borderRadius: 'var(--radius-md)',
                fontWeight: 500
              }}>
                Không đủ tồn kho để phê duyệt phiếu xuất này. Vui lòng chọn kho khác hoặc bổ sung tồn kho.
              </div>
            )}

            {((approving.purpose === 'receipt' || approving.purpose === 'issue') && !selectedWarehouseId) && (
              <div style={{
                padding: 'var(--sp-2) var(--sp-3)',
                background: 'var(--clr-warning-bg)',
                color: 'var(--clr-warning)',
                fontSize: 'var(--fs-xs)',
                borderRadius: 'var(--radius-md)',
                fontWeight: 500
              }}>
                Vui lòng chọn kho trước khi phê duyệt.
              </div>
            )}
          </div>
        </Modal>
      )}

      {showCreate && (
        <StockEntryForm
          open={true}
          type={showCreate}
          onClose={() => setShowCreate(null)}
          onSuccess={() => {
            setShowCreate(null);
            refetch();
          }}
        />
      )}

      {viewingEntry && (
        <StockEntryDetailModal
          open
          entry={viewingEntry}
          onClose={() => setViewingEntry(null)}
        />
      )}
    </div>
  );
}

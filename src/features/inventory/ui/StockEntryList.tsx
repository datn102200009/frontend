import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  useGetInventoryStockEntryListQuery, 
  usePostInventoryStockInByStockEntryIdApproveMutation, 
  usePostInventoryStockIssueByStockEntryIdApproveMutation, 
  usePostInventoryStockTransferByStockEntryIdApproveMutation,
  useGetInventoryStockLedgerBalanceQuery,
  usePostInventoryStockEntryByStockEntryIdUpdateMutation,
  usePostInventoryStockEntryByStockEntryIdDeleteMutation
} from '@features/inventory/api/inventoryApi';
import { useGetMasterDataWarehousesListQuery } from '@features/inventory/api/masterDataApi';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus, CheckCircle, Eye, ChevronDown, XCircle } from 'lucide-react';
import { DataTable } from '@shared/ui/DataTable/DataTable';
import { TableActions, ActionButton } from '@shared/ui/TableActions/TableActions';
import { Button } from '@shared/ui/Button/Button';
import { Badge, type BadgeVariant } from '@shared/ui/Badge/Badge';
import { Modal } from '@shared/ui/Modal/Modal';
import { useToast } from '@shared/ui/Toast/Toast';
import { StockEntryForm } from './StockEntryForm';
import { StockEntryDetailModal } from './StockEntryDetailModal';
import { formatDateTime } from '@shared/lib/formatDate';
import { formatNumber } from '@shared/lib/formatNumber';
import { getDecimalsForUom } from '@shared/lib/uomDecimals';
import type { StockEntry, StockEntryDetail, StockBalance } from '@features/inventory/api/inventoryApi';


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
  cancelled: { label: 'Đã hủy', variant: 'neutral' },
};

export function StockEntryList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = searchParams.get('status');
  const initialStatus = (statusParam === 'draft' || statusParam === 'posted' || statusParam === 'cancelled') ? statusParam : 'all';
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'posted' | 'cancelled'>(initialStatus);
  const [purposeFilter, setPurposeFilter] = useState<'all' | 'receipt' | 'issue' | 'transfer' | 'manufacture' | 'adjustment'>('all');
  const { data: entriesData, isLoading, refetch } = useGetInventoryStockEntryListQuery({
    status: statusFilter === 'all' ? undefined : statusFilter,
    purpose: purposeFilter === 'all' ? undefined : purposeFilter,
    limit: 100
  });
  const entries = (entriesData && 'results' in entriesData) ? (entriesData.results || []) : (Array.isArray(entriesData) ? entriesData : []);
  
  const { data: warehouses } = useGetMasterDataWarehousesListQuery();
  const { data: stockBalances } = useGetInventoryStockLedgerBalanceQuery({ detailed: true });
  const [updateStockEntry, { isLoading: isUpdating }] = usePostInventoryStockEntryByStockEntryIdUpdateMutation();
  const [deleteStockEntry, { isLoading: isDeleting }] = usePostInventoryStockEntryByStockEntryIdDeleteMutation();
  const [cancelling, setCancelling] = useState<StockEntry | null>(null);

  const [approveStockIn, { isLoading: isApprovingIn }] = usePostInventoryStockInByStockEntryIdApproveMutation();
  const [approveStockIssue, { isLoading: isApprovingIssue }] = usePostInventoryStockIssueByStockEntryIdApproveMutation();
  const [approveStockTransfer, { isLoading: isApprovingTransfer }] = usePostInventoryStockTransferByStockEntryIdApproveMutation();
  const [approving, setApproving] = useState<StockEntry | null>(null);
  const [prevApprovingId, setPrevApprovingId] = useState<string | null>(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [showCreate, setShowCreate] = useState<'stock_in' | 'stock_issue' | 'internal_transfer' | null>(null);
  const { toast } = useToast();
  
  const isApproving = isApprovingIn || isApprovingIssue || isApprovingTransfer || isUpdating || isDeleting;

  const queryId = searchParams.get('id');
  const searchQuery = searchParams.get('search') || '';

  const viewingEntry = useMemo(() => {
    if (!queryId || entries.length === 0) return null;
    return entries.find((e: StockEntry) => e.id === queryId) || null;
  }, [queryId, entries]);

  if (approving && approving.id !== prevApprovingId) {
    setPrevApprovingId(approving.id || null);
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
  } else if (!approving && prevApprovingId !== null) {
    setPrevApprovingId(null);
    setSelectedWarehouseId('');
  }

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
    } catch (error: unknown) {
      const err = error as { data?: { detail?: string } };
      toast('error', err?.data?.detail || 'Có lỗi xảy ra khi phê duyệt');
    }
  };

  const confirmCancel = async () => {
    if (!cancelling) return;
    try {
      await deleteStockEntry({ stockEntryId: cancelling.id! }).unwrap();
      toast('success', `Đã hủy phiếu ${cancelling.name}`);
      setCancelling(null);
      refetch();
    } catch (error: unknown) {
      const err = error as { data?: { error?: string; detail?: string } };
      const errMsg = err?.data?.error || err?.data?.detail || 'Có lỗi xảy ra khi hủy phiếu';
      toast('error', errMsg);
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
          return <Badge variant={PURPOSE_VARIANTS[t] as BadgeVariant}>{label}</Badge>;
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
          return <Badge variant={s.variant as BadgeVariant}>{s.label}</Badge>;
        },
      },
      {
        accessorKey: 'created_at',
        header: 'Ngày Tạo',
        size: 140,
        cell: ({ row }) => formatDateTime(row.original.created_at),
      },
      {
        id: 'actions',
        header: 'Thao Tác',
        size: 130,
        enableSorting: false,
        cell: ({ row }) => (
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
            {row.original.status === 'draft' && (
              <>
                <ActionButton
                  icon={<CheckCircle size={18} />}
                  title="Duyệt"
                  onClick={() => handleApprove(row.original)}
                />
                <ActionButton
                  icon={<XCircle size={18} color="var(--clr-error)" />}
                  title="Hủy"
                  onClick={() => setCancelling(row.original)}
                />
              </>
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
    return (approving.details || []).every((detail: StockEntryDetail) => {
      const balance = (stockBalances || []).find(
        (b: StockBalance) => b.warehouse_id === selectedWarehouseId && b.item_id === detail.item_id
      )?.total_quantity || 0;
      return balance >= (detail.quantity || 0);
    });
  }, [approving, selectedWarehouseId, stockBalances]);

  const canApprove = approving?.purpose === 'receipt'
    ? !!selectedWarehouseId
    : (approving?.purpose === 'issue' ? (!!selectedWarehouseId && hasSufficientStock) : true);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--fs-lg)', fontWeight: 600, margin: 0 }}>Phiếu Kho</h2>
          <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)', marginTop: 2 }}>{formatNumber(entries.length, 0)} phiếu</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button icon={<Plus size={16} />} onClick={() => setShowCreate('stock_in')}>Nhập Kho</Button>
          <Button icon={<Plus size={16} />} variant="secondary" onClick={() => setShowCreate('stock_issue')}>Xuất Kho</Button>
          <Button icon={<Plus size={16} />} variant="outline" onClick={() => setShowCreate('internal_transfer')}>Chuyển Kho</Button>
        </div>
      </div>

      {/* Filter toolbar using shared CSS class */}
      <div className="filterToolbar">
        <div className="filterGroup">
          <span className="filterLabel">Trạng thái:</span>
          <div className="filterSelectWrapper">
            <select
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value as 'all' | 'draft' | 'posted' | 'cancelled')}
              className="filterSelectInput"
              aria-label="Lọc trạng thái phiếu kho"
            >
              <option value="all">Tất cả phiếu kho</option>
              <option value="draft">Chờ duyệt (Nháp)</option>
              <option value="posted">Đã duyệt (Ghi sổ)</option>
              <option value="cancelled">Đã hủy</option>
            </select>
            <ChevronDown size={14} className="filterSelectIcon" />
          </div>
        </div>

        <div className="filterGroup">
          <span className="filterLabel">Loại phiếu:</span>
          <div className="filterSelectWrapper">
            <select
              value={purposeFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPurposeFilter(e.target.value as any)}
              className="filterSelectInput"
              aria-label="Lọc loại phiếu kho"
            >
              <option value="all">Tất cả loại</option>
              <option value="receipt">Nhập kho</option>
              <option value="issue">Xuất kho</option>
              <option value="transfer">Chuyển kho</option>
              <option value="manufacture">Sản xuất</option>
              <option value="adjustment">Điều chỉnh</option>
            </select>
            <ChevronDown size={14} className="filterSelectIcon" />
          </div>
        </div>
      </div>

      <DataTable columns={columns} data={entries} searchPlaceholder="Tìm mã phiếu..." loading={isLoading} initialSearch={searchQuery} />

      {approving && (
        <Modal
          open
          onClose={() => setApproving(null)}
          title="Xác Nhận Phê Duyệt"
          size="md"
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

            <div style={{
              padding: 'var(--sp-3)',
              background: 'var(--clr-surface-alt)',
              border: '1px solid var(--clr-border)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--fs-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}>
              <div style={{ fontWeight: 600, fontSize: 'var(--fs-xs)', color: 'var(--clr-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Thông tin tóm tắt phiếu
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '6px', fontSize: 'var(--fs-xs)' }}>
                <span style={{ color: 'var(--clr-text-muted)' }}>Loại phiếu:</span>
                <span style={{ fontWeight: 500 }}>
                  {approving.purpose === 'issue' && approving.sales_order_id ? 'Xuất kho' : (PURPOSE_LABELS[approving.purpose || ''] || approving.purpose)}
                </span>
                
                {approving.purpose === 'transfer' && (
                  <>
                    <span style={{ color: 'var(--clr-text-muted)' }}>Từ kho:</span>
                    <span style={{ fontWeight: 500 }}>
                      {approving.details?.[0]?.source_warehouse_name || '—'}
                    </span>
                    <span style={{ color: 'var(--clr-text-muted)' }}>Đến kho:</span>
                    <span style={{ fontWeight: 500 }}>
                      {approving.details?.[0]?.target_warehouse_name || '—'}
                    </span>
                  </>
                )}

                {approving.purpose === 'receipt' && !selectedWarehouseId && (
                  <>
                    <span style={{ color: 'var(--clr-text-muted)' }}>Kho nhận:</span>
                    <span style={{ fontWeight: 500 }}>
                      {approving.details?.[0]?.target_warehouse_name || '—'}
                    </span>
                  </>
                )}

                {approving.purpose === 'issue' && !selectedWarehouseId && (
                  <>
                    <span style={{ color: 'var(--clr-text-muted)' }}>Kho xuất:</span>
                    <span style={{ fontWeight: 500 }}>
                      {approving.details?.[0]?.source_warehouse_name || '—'}
                    </span>
                  </>
                )}
                
                {selectedWarehouseId && (
                  <>
                    <span style={{ color: 'var(--clr-text-muted)' }}>Kho chỉ định:</span>
                    <span style={{ fontWeight: 600, color: 'var(--clr-primary)' }}>
                      {(warehouses || []).find(w => w.id === selectedWarehouseId)?.name || '—'}
                    </span>
                  </>
                )}

                {approving.remarks && (
                  <>
                    <span style={{ color: 'var(--clr-text-muted)' }}>Ghi chú:</span>
                    <span style={{ fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>{approving.remarks}</span>
                  </>
                )}
              </div>

              <div style={{ marginTop: '4px', borderTop: '1px solid var(--clr-border)', paddingTop: '8px' }}>
                <div style={{ fontWeight: 600, fontSize: '11px', color: 'var(--clr-text-secondary)', marginBottom: '4px' }}>Danh sách vật tư ({formatNumber(approving.details?.length || 0, 0)}):</div>
                <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--fs-xs)' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--clr-border)', textAlign: 'left', color: 'var(--clr-text-secondary)' }}>
                        <th style={{ padding: '4px 0' }}>Vật tư</th>
                        <th style={{ padding: '4px 0', textAlign: 'right' }}>Số lượng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(approving.details || []).map((detail, idx) => (
                        <tr key={idx} style={{ borderBottom: idx < (approving.details || []).length - 1 ? '1px dashed var(--clr-border)' : 'none' }}>
                          <td style={{ padding: '5px 0', color: 'var(--clr-text)' }}>
                            {detail.item_name || detail.item_code}
                          </td>
                          <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 600 }}>
                            {formatNumber(detail.quantity, getDecimalsForUom(detail.uom_name))} {detail.uom_name || ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

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
                  {(warehouses || []).map((wh: { id?: string; name?: string }) => (
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
                        {(approving.details || []).map((detail: StockEntryDetail, idx: number) => {
                          const balance = (stockBalances || []).find(
                            (b: StockBalance) => b.warehouse_id === selectedWarehouseId && b.item_id === detail.item_id
                          )?.total_quantity || 0;
                          const isSufficient = balance >= (detail.quantity || 0);
                          return (
                            <tr key={idx} style={{ borderBottom: idx < (approving.details || []).length - 1 ? '1px solid var(--clr-border)' : 'none' }}>
                              <td style={{ padding: '8px 12px', fontWeight: 500 }}>{detail.item_name || detail.item_code}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'right' }}>{formatNumber(detail.quantity, getDecimalsForUom(detail.uom_name))} {detail.uom_name || ''}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', color: isSufficient ? 'inherit' : 'var(--clr-error)' }}>{formatNumber(balance, getDecimalsForUom(detail.uom_name))}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                <span style={{
                                  color: isSufficient ? 'var(--clr-success)' : 'var(--clr-error)',
                                  fontWeight: 600
                                }}>
                                  {isSufficient ? 'Đủ hàng' : `Thiếu ${formatNumber((detail.quantity || 0) - balance, getDecimalsForUom(detail.uom_name))}`}
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

      {cancelling && (
        <Modal
          open
          onClose={() => setCancelling(null)}
          title="Xác Nhận Hủy Phiếu"
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setCancelling(null)} disabled={isDeleting}>Đóng</Button>
              <Button variant="danger" onClick={confirmCancel} disabled={isDeleting}>
                {isDeleting ? 'Đang hủy...' : 'Xác nhận Hủy'}
              </Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            <p style={{ margin: 0 }}>
              Bạn có chắc chắn muốn <strong style={{ color: 'var(--clr-error)' }}>HỦY</strong> phiếu{' '}
              <strong>"{cancelling.name}"</strong> không?
            </p>
            <div style={{
              padding: 'var(--sp-2) var(--sp-3)',
              background: 'var(--clr-warning-bg)',
              color: 'var(--clr-warning)',
              fontSize: 'var(--fs-xs)',
              borderRadius: 'var(--radius-md)',
            }}>
              ⚠️ Hành động này sẽ xóa vĩnh viễn phiếu khỏi hệ thống và không thể khôi phục.
            </div>
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
          open={!!viewingEntry}
          entry={viewingEntry}
          onClose={() => {
            const params = new URLSearchParams(searchParams);
            params.delete('id');
            setSearchParams(params);
          }}
        />
      )}
    </div>
  );
}

import { Modal } from '@shared/ui/Modal/Modal';
import { Button } from '@shared/ui/Button/Button';
import { Badge } from '@shared/ui/Badge/Badge';
import { formatDateTime } from '@shared/lib/formatDate';
import { formatNumber } from '@shared/lib/formatNumber';
import { getDecimalsForUom } from '@shared/lib/uomDecimals';
import { useToast } from '@shared/ui/Toast/Toast';
import { Info } from 'lucide-react';
import { shortId } from '@shared/lib/shortId';
import { 
  usePostInventoryStockInByStockEntryIdApproveMutation,
  usePostInventoryStockIssueByStockEntryIdApproveMutation,
  usePostInventoryStockTransferByStockEntryIdApproveMutation,
  usePostInventoryStockEntryByStockEntryIdDeleteMutation,
  useGetInventoryStockLedgerBalanceQuery
} from '@features/inventory/api/inventoryApi';
import type { StockEntry, StockEntryDetail, StockBalance } from '@features/inventory/api/inventoryApi';

const PURPOSE_LABELS: Record<string, string> = {
  receipt: 'Nhập kho',
  issue: 'Xuất kho SX',
  transfer: 'Chuyển kho',
  manufacture: 'Sản xuất',
  adjustment: 'Điều chỉnh',
};

const PURPOSE_VARIANTS: Record<string, 'success' | 'warning' | 'info' | 'neutral'> = {
  receipt: 'success',
  issue: 'warning',
  transfer: 'info',
  manufacture: 'info',
  adjustment: 'neutral',
};

const STATUS_LABELS: Record<string, { label: string; variant: 'neutral' | 'success' | 'warning' }> = {
  draft: { label: 'Nháp', variant: 'neutral' },
  submitted: { label: 'Chờ duyệt', variant: 'warning' },
  posted: { label: 'Đã duyệt', variant: 'success' },
  cancelled: { label: 'Đã hủy', variant: 'neutral' },
};

interface Props {
  open: boolean;
  entry: StockEntry | null;
  onClose: () => void;
}

export function StockEntryDetailModal({ open, entry, onClose }: Props) {
  const { data: stockBalances } = useGetInventoryStockLedgerBalanceQuery({ detailed: true });
  const [approveStockIn, { isLoading: isApprovingIn }] = usePostInventoryStockInByStockEntryIdApproveMutation();
  const [approveStockIssue, { isLoading: isApprovingIssue }] = usePostInventoryStockIssueByStockEntryIdApproveMutation();
  const [approveStockTransfer, { isLoading: isApprovingTransfer }] = usePostInventoryStockTransferByStockEntryIdApproveMutation();
  const [deleteStockEntry, { isLoading: isDeleting }] = usePostInventoryStockEntryByStockEntryIdDeleteMutation();
  
  const { toast } = useToast();

  if (!entry) return null;

  const isDraft = entry.status === 'draft';
  const isApproving = isApprovingIn || isApprovingIssue || isApprovingTransfer;
  const isWorking = isApproving || isDeleting;

  const statusInfo = STATUS_LABELS[entry.status || 'draft'] || { label: entry.status, variant: 'neutral' };
  const purposeType = entry.purpose || 'unknown';
  const details = entry.details || [];

  const handleApprove = async () => {
    for (const detail of details) {
      if (purposeType === 'receipt' && !detail.target_warehouse_id) {
        toast('error', 'Dòng hàng chưa được chỉ định kho nhận.');
        return;
      }
      if (purposeType === 'issue' && !detail.source_warehouse_id) {
        toast('error', 'Dòng hàng chưa được chỉ định kho xuất.');
        return;
      }
      if (purposeType === 'transfer' && (!detail.source_warehouse_id || !detail.target_warehouse_id)) {
        toast('error', 'Dòng hàng chưa được chỉ định đầy đủ kho nguồn và kho nhận.');
        return;
      }

      if (purposeType === 'issue' || purposeType === 'transfer') {
        const balance = (stockBalances || []).find(
          (b: StockBalance) => b.warehouse_id === detail.source_warehouse_id && b.item_id === detail.item_id
        )?.total_quantity || 0;
        if (balance < (detail.quantity || 0)) {
          toast('error', `Không đủ tồn kho để xuất cho mặt hàng "${detail.item_name || detail.item_code}" (Yêu cầu: ${detail.quantity}, Hiện có: ${balance})`);
          return;
        }
      }
    }

    try {
      if (purposeType === 'receipt') {
        await approveStockIn({ stockEntryId: entry.id! }).unwrap();
      } else if (purposeType === 'issue') {
        await approveStockIssue({ stockEntryId: entry.id! }).unwrap();
      } else if (purposeType === 'transfer') {
        await approveStockTransfer({ stockEntryId: entry.id! }).unwrap();
      }

      toast('success', `Phê duyệt ${entry.name} thành công`);
      onClose();
    } catch (error) {
      const err = error as { data?: { error?: string; detail?: string } };
      toast('error', err?.data?.error || err?.data?.detail || 'Có lỗi xảy ra khi phê duyệt');
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Bạn có chắc chắn muốn HỦY phiếu "${entry.name}"? Hành động này không thể khôi phục.`)) return;
    try {
      await deleteStockEntry({ stockEntryId: entry.id! }).unwrap();
      toast('success', `Đã hủy phiếu ${entry.name}`);
      onClose();
    } catch (error) {
      const err = error as { data?: { error?: string; detail?: string } };
      toast('error', err?.data?.error || err?.data?.detail || 'Có lỗi xảy ra khi hủy phiếu');
    }
  };

  const isPurchaseReceipt = purposeType === 'receipt' && !!entry.purchase_order_id;
  const isReceipt = purposeType === 'receipt';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Chi Tiết Phiếu Kho: ${entry.name}`}
      size="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', width: '100%' }}>
          {isDraft && (
            <Button variant="danger" onClick={handleDelete} loading={isDeleting} disabled={isWorking}>
              Hủy Phiếu
            </Button>
          )}
          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
            <Button variant="ghost" onClick={onClose} disabled={isWorking}>Đóng</Button>
            {isDraft && !isReceipt && (
              <Button variant="primary" onClick={handleApprove} loading={isApproving} disabled={isWorking}>
                Duyệt Phiếu
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
        {isDraft && isPurchaseReceipt && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '12px', 
            background: 'rgba(59, 130, 246, 0.08)', 
            border: '1px solid rgba(59, 130, 246, 0.2)', 
            borderRadius: '8px',
            color: 'var(--clr-primary)',
            fontSize: '13px',
            marginBottom: '4px'
          }}>
            <Info size={16} style={{ flexShrink: 0 }} />
            <span>Phiếu nhập kho này thuộc chu trình mua hàng. Vui lòng thực hiện kiểm định QA/QC và gán kho nhận hàng tại tab <strong>Quản Lý Lô Hàng</strong>.</span>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
          <div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>Loại phiếu</div>
            <Badge variant={PURPOSE_VARIANTS[purposeType] || 'default'}>
              {purposeType === 'issue' && entry.sales_order_id ? 'Xuất kho' : (PURPOSE_LABELS[purposeType] || purposeType)}
            </Badge>
          </div>
          <div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>Trạng thái</div>
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          </div>
          <div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>Ngày tạo</div>
            <div>{formatDateTime(entry.created_at)}</div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>Ngày ghi sổ / duyệt</div>
            <div>{formatDateTime(entry.posted_at || entry.posting_date)}</div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--clr-border)', paddingTop: 'var(--sp-4)' }}>
          <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, marginBottom: 'var(--sp-2)' }}>Chi tiết ({details.length || 0} mục)</div>
          <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--fs-sm)' }}>
              <thead style={{ background: 'var(--clr-surface-alt)', textAlign: 'left' }}>
                <tr>
                  <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--clr-border)' }}>Mặt hàng</th>
                  <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--clr-border)', textAlign: 'right' }}>Số lượng</th>
                  <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--clr-border)' }}>Từ kho</th>
                  <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--clr-border)' }}>Đến kho</th>
                </tr>
              </thead>
              <tbody>
                {details.map((detail: StockEntryDetail, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--clr-border)' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 500 }}>{detail.item_name || detail.item_code || shortId(detail.item_id)}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>{formatNumber(detail.quantity, getDecimalsForUom(detail.uom_name))} {detail.uom_name || ''}</td>
                    <td style={{ padding: '8px 12px' }}>
                      {detail.source_warehouse_name || shortId(detail.source_warehouse_id) || '—'}
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      {detail.target_warehouse_name || shortId(detail.target_warehouse_id) || '—'}
                    </td>
                  </tr>
                ))}
                {details.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--clr-text-muted)' }}>Không có chi tiết</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {entry.remarks && (
          <div style={{ borderTop: '1px solid var(--clr-border)', paddingTop: 'var(--sp-4)' }}>
            <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, marginBottom: 'var(--sp-1)' }}>Ghi chú</div>
            <div style={{ 
              fontSize: 'var(--fs-sm)', 
              color: 'var(--clr-text-secondary)', 
              background: 'var(--clr-surface-alt)', 
              padding: 'var(--sp-3)', 
              borderRadius: 'var(--radius-md)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {entry.remarks}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

import { Modal } from '../../../shared/ui/Modal/Modal';
import { Button } from '../../../shared/ui/Button/Button';
import { Badge } from '../../../shared/ui/Badge/Badge';
import { formatDateTime } from '../../../shared/lib/formatDate';
import type { StockEntry } from '../api/inventoryApi';

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

interface Props {
  open: boolean;
  entry: StockEntry | null;
  onClose: () => void;
}

export function StockEntryDetailModal({ open, entry, onClose }: Props) {
  if (!entry) return null;

  const statusInfo = STATUS_LABELS[entry.status || 'draft'] || { label: entry.status, variant: 'neutral' };
  const purposeType = entry.purpose || 'unknown';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Chi Tiết Phiếu Kho: ${entry.name}`}
      size="md"
      footer={<Button onClick={onClose}>Đóng</Button>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
          <div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>Loại phiếu</div>
            <Badge variant={PURPOSE_VARIANTS[purposeType] as any}>{PURPOSE_LABELS[purposeType] || purposeType}</Badge>
          </div>
          <div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>Trạng thái</div>
            <Badge variant={statusInfo.variant as any}>{statusInfo.label}</Badge>
          </div>
          <div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>Ngày tạo</div>
            <div>{formatDateTime(entry.created_at)}</div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>Ngày ghi sổ</div>
            <div>{formatDateTime(entry.posting_date)}</div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--clr-border)', paddingTop: 'var(--sp-4)' }}>
          <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, marginBottom: 'var(--sp-2)' }}>Chi tiết ({entry.details?.length || 0} mục)</div>
          <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--fs-sm)' }}>
              <thead style={{ background: 'var(--clr-surface-alt)', textAlign: 'left' }}>
                <tr>
                  <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--clr-border)' }}>Mặt hàng</th>
                  <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--clr-border)' }}></th>
                  <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--clr-border)' }}>Từ kho</th>
                  <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--clr-border)' }}>Đến kho</th>
                </tr>
              </thead>
              <tbody>
                {entry.details?.map((detail: any, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--clr-border)' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 500 }}>{detail.item_name || detail.item_code || detail.item_id?.substring(0, 8)}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>{detail.quantity} {detail.uom_name || ''}</td>
                    <td style={{ padding: '8px 12px' }}>{detail.source_warehouse_name || detail.source_warehouse_id?.substring(0, 8) || '—'}</td>
                    <td style={{ padding: '8px 12px' }}>{detail.target_warehouse_name || detail.target_warehouse_id?.substring(0, 8) || '—'}</td>
                  </tr>
                ))}
                {(!entry.details || entry.details.length === 0) && (
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
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text-secondary)', background: 'var(--clr-surface-alt)', padding: 'var(--sp-3)', borderRadius: 'var(--radius-md)' }}>
              {entry.remarks}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

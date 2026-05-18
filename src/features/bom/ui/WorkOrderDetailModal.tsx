import { Modal } from '../../../shared/ui/Modal/Modal';
import { Button } from '../../../shared/ui/Button/Button';
import { Badge } from '../../../shared/ui/Badge/Badge';
import { formatDateShort } from '../../../shared/lib/formatDate';

const STATUS_MAP: Record<string, { label: string; variant: 'neutral' | 'warning' | 'success' | 'error' }> = {
  pending_approval: { label: 'Chờ duyệt', variant: 'neutral' },
  in_progress: { label: 'Đang thực hiện', variant: 'warning' },
  completed: { label: 'Hoàn thành', variant: 'success' },
  cancelled: { label: 'Đã hủy', variant: 'error' },
};

interface Props {
  open: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  workOrder: any;
  onClose: () => void;
}

export function WorkOrderDetailModal({ open, workOrder, onClose }: Props) {
  if (!workOrder) return null;

  const statusInfo = STATUS_MAP[workOrder.status] || { label: workOrder.status, variant: 'neutral' };
  const produced = workOrder.produced_qty || 0;
  const progress = workOrder.quantity > 0 ? Math.min(100, Math.round((produced / workOrder.quantity) * 100)) : 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Chi Tiết Lệnh Sản Xuất: ${workOrder.name}`}
      size="md"
      footer={<Button onClick={onClose}>Đóng</Button>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
          <div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>Định mức (BOM)</div>
            <div style={{ fontWeight: 500 }}>{workOrder.bom?.name || workOrder.bom_name || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>Trạng thái</div>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <Badge variant={statusInfo.variant as any}>{statusInfo.label}</Badge>
          </div>
          <div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>Ngày bắt đầu (Dự kiến)</div>
            <div>{formatDateShort(workOrder.planned_start_date)}</div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>Ngày kết thúc (Dự kiến)</div>
            <div>{formatDateShort(workOrder.planned_end_date)}</div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--clr-border)', paddingTop: 'var(--sp-4)' }}>
          <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, marginBottom: 'var(--sp-2)' }}>Tiến độ hoàn thành</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-xs)', marginBottom: '4px' }}>
            <span>{produced} / {workOrder.quantity} sản phẩm</span>
            <span>{progress}%</span>
          </div>
          <div style={{ height: '8px', background: 'var(--clr-surface-alt)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'var(--clr-primary)', transition: 'width 0.3s' }} />
          </div>
        </div>

        {workOrder.remarks && (
          <div style={{ borderTop: '1px solid var(--clr-border)', paddingTop: 'var(--sp-4)' }}>
            <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, marginBottom: 'var(--sp-1)' }}>Ghi chú</div>
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text-secondary)', background: 'var(--clr-surface-alt)', padding: 'var(--sp-3)', borderRadius: 'var(--radius-md)' }}>
              {workOrder.remarks}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

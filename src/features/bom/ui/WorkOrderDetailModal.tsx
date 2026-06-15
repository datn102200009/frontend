import { Modal } from '@shared/ui/Modal/Modal';
import { Button } from '@shared/ui/Button/Button';
import { Badge } from '@shared/ui/Badge/Badge';
import { formatDateShort } from '@shared/lib/formatDate';
import { PlayCircle, XCircle, ArrowRightCircle, CheckCircle } from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; variant: 'neutral' | 'warning' | 'success' | 'error' | 'info' }> = {
  pending_approval: { label: 'Nháp', variant: 'neutral' },
  in_progress: { label: 'Đang sản xuất', variant: 'warning' },
  pending_production_complete: { label: 'Chờ nghiệm thu', variant: 'info' },
  completed: { label: 'Hoàn tất', variant: 'success' },
  cancelled: { label: 'Đã hủy', variant: 'error' },
};

interface Props {
  open: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  workOrder: any;
  onClose: () => void;
  onApprove: (workOrder: any) => void;
  onCancel: (workOrder: any) => void;
  onDeclare: (workOrder: any) => void;
  onComplete: (workOrder: any) => void;
  canApprove?: boolean;
  canCancel?: boolean;
  canDeclare?: boolean;
  canComplete?: boolean;
}

export function WorkOrderDetailModal({
  open,
  workOrder,
  onClose,
  onApprove,
  onCancel,
  onDeclare,
  onComplete,
  canApprove = false,
  canCancel = false,
  canDeclare = false,
  canComplete = false,
}: Props) {
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
      footer={
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
          {workOrder.status === 'pending_approval' && canApprove && (
            <Button
              variant="primary"
              onClick={() => {
                onApprove(workOrder);
                onClose();
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <PlayCircle size={16} />
                Phê Duyệt
              </div>
            </Button>
          )}
          {(workOrder.status === 'pending_approval' || workOrder.status === 'in_progress') && canCancel && (
            <Button
              variant="danger"
              onClick={() => {
                onCancel(workOrder);
                onClose();
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <XCircle size={16} />
                Hủy
              </div>
            </Button>
          )}
          {workOrder.status === 'in_progress' && (workOrder.produced_qty || 0) < (workOrder.quantity || 0) && canDeclare && (
            <Button
              variant="secondary"
              onClick={() => {
                onDeclare(workOrder);
                onClose();
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ArrowRightCircle size={16} />
                Nhập Liệu
              </div>
            </Button>
          )}
          {((workOrder.status === 'in_progress' && (workOrder.produced_qty || 0) >= (workOrder.quantity || 0)) ||
            workOrder.status === 'pending_production_complete') && canComplete && (
            <Button
              variant="primary"
              onClick={() => {
                onComplete(workOrder);
                onClose();
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle size={16} />
                Xác Nhận Hoàn Thành
              </div>
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>Đóng</Button>
        </div>
      }
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

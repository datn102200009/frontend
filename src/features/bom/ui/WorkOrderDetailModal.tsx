import type { CSSProperties } from 'react';
import { Modal } from '@shared/ui/Modal/Modal';
import { Button } from '@shared/ui/Button/Button';
import { Badge } from '@shared/ui/Badge/Badge';
import { formatDateVN } from '@shared/lib/formatDate';
import { formatNumber } from '@shared/lib/formatNumber';
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
  isLoading?: boolean;
}

function SkeletonBlock({ width = '100%', height = '20px', style }: { width?: string | number; height?: string | number; style?: CSSProperties }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 'var(--radius-sm, 4px)',
        background: 'linear-gradient(90deg, var(--clr-surface-alt) 25%, var(--clr-border) 50%, var(--clr-surface-alt) 75%)',
        backgroundSize: '200% 100%',
        animation: 'modalShimmer 1.5s infinite linear',
        ...style
      }}
    />
  );
}

const ShimmerStyles = () => (
  <style>{`
    @keyframes modalShimmer {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }
  `}</style>
);

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
  isLoading = false,
}: Props) {
  if (isLoading) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        title="Chi Tiết Lệnh Sản Xuất"
        size="md"
        footer={
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="ghost" onClick={onClose}>Đóng</Button>
          </div>
        }
      >
        <ShimmerStyles />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
            <div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)', marginBottom: '4px' }}>Định mức (BOM)</div>
              <SkeletonBlock width="80%" height="18px" />
            </div>
            <div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)', marginBottom: '4px' }}>Trạng thái</div>
              <SkeletonBlock width="60px" height="20px" style={{ borderRadius: 'var(--radius-full)' }} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)', marginBottom: '4px' }}>Ngày bắt đầu (Dự kiến)</div>
              <SkeletonBlock width="70%" height="18px" />
            </div>
            <div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)', marginBottom: '4px' }}>Ngày kết thúc (Dự kiến)</div>
              <SkeletonBlock width="70%" height="18px" />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--clr-border)', paddingTop: 'var(--sp-4)' }}>
            <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, marginBottom: 'var(--sp-2)' }}>Tiến độ hoàn thành</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <SkeletonBlock width="40%" height="14px" />
              <SkeletonBlock width="10%" height="14px" />
            </div>
            <SkeletonBlock width="100%" height="8px" style={{ borderRadius: '4px' }} />
          </div>

          <div style={{ borderTop: '1px solid var(--clr-border)', paddingTop: 'var(--sp-4)' }}>
            <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, marginBottom: 'var(--sp-2)' }}>Nguyên liệu tiêu hao</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--fs-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--clr-border)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 4px', color: 'var(--clr-text-muted)', fontWeight: 500 }}>Mã linh kiện</th>
                    <th style={{ padding: '8px 4px', color: 'var(--clr-text-muted)', fontWeight: 500 }}>Tên linh kiện</th>
                    <th style={{ padding: '8px 4px', color: 'var(--clr-text-muted)', fontWeight: 500, textAlign: 'right' }}>Yêu cầu</th>
                    <th style={{ padding: '8px 4px', color: 'var(--clr-text-muted)', fontWeight: 500, textAlign: 'right' }}>Đã dùng</th>
                    <th style={{ padding: '8px 4px', color: 'var(--clr-text-muted)', fontWeight: 500 }}>ĐVT</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3].map((i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--clr-border-light)' }}>
                      <td style={{ padding: '8px 4px' }}><SkeletonBlock width="60px" height="14px" /></td>
                      <td style={{ padding: '8px 4px' }}><SkeletonBlock width="150px" height="14px" /></td>
                      <td style={{ padding: '8px 4px' }}><SkeletonBlock width="50px" height="14px" style={{ marginLeft: 'auto' }} /></td>
                      <td style={{ padding: '8px 4px' }}><SkeletonBlock width="50px" height="14px" style={{ marginLeft: 'auto' }} /></td>
                      <td style={{ padding: '8px 4px' }}><SkeletonBlock width="30px" height="14px" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--clr-border)', paddingTop: 'var(--sp-4)' }}>
            <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, marginBottom: 'var(--sp-2)' }}>Tài sản cố định sử dụng</div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <SkeletonBlock width="100px" height="24px" style={{ borderRadius: 'var(--radius-sm)' }} />
              <SkeletonBlock width="120px" height="24px" style={{ borderRadius: 'var(--radius-sm)' }} />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--clr-border)', paddingTop: 'var(--sp-4)' }}>
            <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, marginBottom: 'var(--sp-1)' }}>Ghi chú</div>
            <SkeletonBlock width="100%" height="48px" style={{ borderRadius: 'var(--radius-md)' }} />
          </div>
        </div>
      </Modal>
    );
  }

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
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <PlayCircle size={16} />
                Phê Duyệt
              </div>
            </Button>
          )}
          {workOrder.status === 'pending_approval' && canCancel && (
            <Button
              variant="danger"
              onClick={() => {
                onCancel(workOrder);
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
            <div>{formatDateVN(workOrder.planned_start_date)}</div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>Ngày kết thúc (Dự kiến)</div>
            <div>{formatDateVN(workOrder.planned_end_date)}</div>
          </div>
        </div>

        {workOrder.status !== 'pending_approval' && (
          <div style={{ borderTop: '1px solid var(--clr-border)', paddingTop: 'var(--sp-4)' }}>
            <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, marginBottom: 'var(--sp-2)' }}>Tiến độ hoàn thành</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-xs)', marginBottom: '4px' }}>
              <span>{formatNumber(produced)} / {formatNumber(workOrder.quantity)} sản phẩm</span>
              <span>{formatNumber(progress, 0)}%</span>
            </div>
            <div style={{ height: '8px', background: 'var(--clr-surface-alt)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'var(--clr-primary)', transition: 'width 0.3s' }} />
            </div>
          </div>
        )}

        {workOrder.materials && workOrder.materials.length > 0 && (
          <div style={{ borderTop: '1px solid var(--clr-border)', paddingTop: 'var(--sp-4)' }}>
            <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, marginBottom: 'var(--sp-2)' }}>Nguyên liệu tiêu hao</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--fs-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--clr-border)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 4px', color: 'var(--clr-text-muted)', fontWeight: 500 }}>Mã linh kiện</th>
                    <th style={{ padding: '8px 4px', color: 'var(--clr-text-muted)', fontWeight: 500 }}>Tên linh kiện</th>
                    <th style={{ padding: '8px 4px', color: 'var(--clr-text-muted)', fontWeight: 500, textAlign: 'right' }}>Yêu cầu</th>
                    <th style={{ padding: '8px 4px', color: 'var(--clr-text-muted)', fontWeight: 500, textAlign: 'right' }}>Đã dùng</th>
                    <th style={{ padding: '8px 4px', color: 'var(--clr-text-muted)', fontWeight: 500 }}>ĐVT</th>
                  </tr>
                </thead>
                <tbody>
                  {workOrder.materials.map((m: any) => (
                    <tr key={m.item_id} style={{ borderBottom: '1px solid var(--clr-border-light)' }}>
                      <td style={{ padding: '8px 4px', fontVariantNumeric: 'tabular-nums' }}>{m.item_code}</td>
                      <td style={{ padding: '8px 4px' }}>{m.item_name}</td>
                      <td style={{ padding: '8px 4px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatNumber(m.required_qty)}</td>
                      <td style={{ padding: '8px 4px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 500, color: m.consumed_qty > 0 ? 'var(--clr-primary)' : undefined }}>{formatNumber(m.consumed_qty)}</td>
                      <td style={{ padding: '8px 4px', color: 'var(--clr-text-secondary)' }}>{m.uom || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {workOrder.fixed_assets && workOrder.fixed_assets.length > 0 && (
          <div style={{ borderTop: '1px solid var(--clr-border)', paddingTop: 'var(--sp-4)' }}>
            <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, marginBottom: 'var(--sp-2)' }}>Tài sản cố định sử dụng</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {workOrder.fixed_assets.map((fa: any) => (
                <Badge key={fa.id || fa.fixed_asset_id} variant="neutral">
                  {fa.asset_name} ({fa.asset_code})
                </Badge>
              ))}
            </div>
          </div>
        )}

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

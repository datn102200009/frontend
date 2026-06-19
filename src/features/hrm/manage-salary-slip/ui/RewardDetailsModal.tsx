import React from 'react';
import type { RewardRecord } from '@entities/hrm/model/types';
import { Modal } from '@shared/ui/Modal/Modal';
import { getRewardTypeLabel } from '@shared/constants/hrmRewardDiscipline';
import { Button } from '@shared/ui/Button/Button';
import { Badge } from '@shared/ui/Badge/Badge';

interface RewardDetailsModalProps {
  open: boolean;
  onClose: () => void;
  record: RewardRecord;
}

export const RewardDetailsModal: React.FC<RewardDetailsModalProps> = ({
  open,
  onClose,
  record,
}) => {
  const formatVND = (value?: string | number | null) => {
    if (value === undefined || value === null) return '0 đ';
    const amount = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };


  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'pending_approval':
        return <Badge variant="warning">Chờ duyệt</Badge>;
      case 'approved':
        return <Badge variant="success">Đã duyệt</Badge>;
      case 'rejected':
        return <Badge variant="error">Từ chối</Badge>;
      case 'cancelled':
        return <Badge variant="neutral">Đã hủy</Badge>;
      default:
        return <Badge variant="neutral">{status || 'N/A'}</Badge>;
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Chi Tiết Quyết Định Khen Thưởng"
      size="md"
      footer={
        <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose}>
            Đóng
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--clr-text-secondary)' }}>Mã nhân viên</label>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--clr-text)', marginTop: '4px' }}>
              {record.employee_code || '-'}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--clr-text-secondary)' }}>Họ và Tên</label>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--clr-text)', marginTop: '4px' }}>
              {record.employee_name || '-'}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--clr-text-secondary)' }}>Ngày quyết định</label>
            <div style={{ fontSize: '14px', color: 'var(--clr-text)', marginTop: '4px' }}>
              {record.reward_date || '-'}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--clr-text-secondary)' }}>Loại khen thưởng</label>
            <div style={{ fontSize: '14px', color: 'var(--clr-text)', marginTop: '4px' }}>
              {getRewardTypeLabel(record.reward_type)}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--clr-text-secondary)' }}>Số tiền thưởng</label>
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--clr-success)', marginTop: '4px' }}>
              {formatVND(record.amount)}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--clr-text-secondary)' }}>Trạng thái</label>
            <div style={{ marginTop: '4px' }}>
              {getStatusBadge(record.status)}
            </div>
          </div>
        </div>

        {record.salary_slip_id && (
          <div>
            <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--clr-text-secondary)' }}>Liên kết phiếu lương</label>
            <div style={{ fontSize: '14px', color: 'var(--clr-text)', marginTop: '4px' }}>
              Bản ghi đã được áp dụng vào phiếu lương.
            </div>
          </div>
        )}

        {record.status === 'approved' && record.approved_by_username && (
          <div>
            <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--clr-text-secondary)' }}>Người phê duyệt</label>
            <div style={{ fontSize: '14px', color: 'var(--clr-text)', marginTop: '4px' }}>
              @{record.approved_by_username}
            </div>
          </div>
        )}

        {record.status === 'cancelled' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', backgroundColor: 'var(--clr-surface-muted)', padding: '12px', borderRadius: '6px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--clr-text-secondary)' }}>Người hủy bỏ</label>
              <div style={{ fontSize: '14px', color: 'var(--clr-text)', marginTop: '4px' }}>
                @{record.cancelled_by_username || 'N/A'}
              </div>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--clr-text-secondary)' }}>Thời gian hủy</label>
              <div style={{ fontSize: '14px', color: 'var(--clr-text)', marginTop: '4px' }}>
                {record.cancelled_at ? new Date(record.cancelled_at).toLocaleString('vi-VN') : '-'}
              </div>
            </div>
          </div>
        )}

        <div>
          <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--clr-text-secondary)' }}>Lý do/Mô tả chi tiết</label>
          <div style={{ 
            fontSize: '14px', 
            color: 'var(--clr-text)', 
            marginTop: '4px', 
            whiteSpace: 'pre-wrap', 
            backgroundColor: 'var(--clr-surface-muted)', 
            padding: '12px', 
            borderRadius: '6px',
            border: '1px solid var(--clr-border)'
          }}>
            {record.description || 'Chưa có mô tả'}
          </div>
        </div>
      </div>
    </Modal>
  );
};

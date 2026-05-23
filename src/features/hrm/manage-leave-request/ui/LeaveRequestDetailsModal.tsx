import React, { useState } from 'react';
import { usePostHrmLeaveRequestsByIdApproveMutation } from '@entities/hrm/api/hrmApi';
import type { LeaveRequest } from '@entities/hrm/model/types';
import { Modal } from '@shared/ui/Modal/Modal';
import { Button } from '@shared/ui/Button/Button';
import styles from './LeaveRequestDetailsModal.module.css';

interface LeaveRequestDetailsModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  leaveRequest: LeaveRequest;
}

export const LeaveRequestDetailsModal: React.FC<LeaveRequestDetailsModalProps> = ({
  open,
  onClose,
  onSuccess,
  leaveRequest,
}) => {
  const [approveRejectRequest, { isLoading }] = usePostHrmLeaveRequestsByIdApproveMutation();
  const [apiError, setApiError] = useState<string | null>(null);

  const handleAction = async (action: 'approve' | 'reject') => {
    setApiError(null);
    if (!leaveRequest.id) return;

    try {
      await approveRejectRequest({
        id: leaveRequest.id,
        body: { action },
      }).unwrap();
      onSuccess();
    } catch (err: any) {
      console.error(`Failed to ${action} leave request`, err);
      setApiError(
        err?.data?.detail || `Có lỗi xảy ra khi thực hiện thao tác. Vui lòng kiểm tra lại.`
      );
    }
  };

  const getLeaveTypeLabel = (type: string) => {
    switch (type) {
      case 'annual':
        return 'Nghỉ phép năm';
      case 'sick':
        return 'Nghỉ ốm/đau';
      case 'unpaid':
        return 'Nghỉ không lương';
      case 'maternity':
        return 'Nghỉ thai sản';
      case 'personal':
        return 'Nghỉ việc riêng';
      default:
        return 'Khác';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Chờ duyệt';
      case 'approved':
        return 'Đã duyệt';
      case 'rejected':
        return 'Từ chối';
      default:
        return status;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return `${styles.badge} ${styles.pending}`;
      case 'approved':
        return `${styles.badge} ${styles.approved}`;
      case 'rejected':
        return `${styles.badge} ${styles.rejected}`;
      default:
        return styles.badge;
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Chi Tiết Đơn Xin Nghỉ Phép"
      size="sm"
      footer={
        <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-end', gap: '8px' }}>
          {leaveRequest.status === 'pending' ? (
            <>
              <Button
                variant="ghost"
                onClick={() => handleAction('reject')}
                disabled={isLoading}
                style={{ color: 'var(--clr-error)', borderColor: 'var(--clr-error)' }}
              >
                Từ chối
              </Button>
              <Button
                variant="primary"
                onClick={() => handleAction('approve')}
                loading={isLoading}
              >
                Duyệt đơn
              </Button>
            </>
          ) : (
            <Button variant="primary" onClick={onClose}>
              Đóng
            </Button>
          )}
        </div>
      }
    >
      <div className={styles.details}>
        {apiError && (
          <div className={styles.errorSection}>
            <span>{apiError}</span>
          </div>
        )}

        <div className={styles.row}>
          <div className={styles.detailGroup}>
            <span className={styles.label}>Nhân viên</span>
            <span className={styles.value}>
              {(leaveRequest as any).employee_name || 'N/A'} (
              {(leaveRequest as any).employee_code || 'N/A'})
            </span>
          </div>
          <div className={styles.detailGroup}>
            <span className={styles.label}>Trạng thái</span>
            <span className={getStatusBadgeClass(leaveRequest.status)}>
              {getStatusLabel(leaveRequest.status)}
            </span>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.detailGroup}>
            <span className={styles.label}>Loại nghỉ phép</span>
            <span className={styles.value}>{getLeaveTypeLabel(leaveRequest.leave_type)}</span>
          </div>
          <div className={styles.detailGroup}>
            <span className={styles.label}>Số ngày nghỉ</span>
            <span className={styles.value}>{leaveRequest.days} ngày</span>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.detailGroup}>
            <span className={styles.label}>Từ ngày</span>
            <span className={styles.value}>{leaveRequest.start_date}</span>
          </div>
          <div className={styles.detailGroup}>
            <span className={styles.label}>Đến ngày</span>
            <span className={styles.value}>{leaveRequest.end_date}</span>
          </div>
        </div>

        <div className={styles.reasonSection}>
          <span className={styles.label}>Lý do nghỉ</span>
          <span className={styles.value} style={{ whiteSpace: 'pre-wrap', fontWeight: 'normal' }}>
            {(leaveRequest as any).reason || 'Không có lý do chi tiết'}
          </span>
        </div>
      </div>
    </Modal>
  );
};

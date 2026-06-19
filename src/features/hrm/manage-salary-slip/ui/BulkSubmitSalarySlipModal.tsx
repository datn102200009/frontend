import React, { useEffect, useState } from 'react';
import { usePostHrmSalarySlipsBulkSubmitForReviewMutation } from '@entities/hrm/api/hrmApi';
import { Modal } from '@shared/ui/Modal/Modal';
import { Button } from '@shared/ui/Button/Button';
import styles from './BulkSubmitSalarySlipModal.module.css';

interface BulkSubmitSalarySlipModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  salaryPeriod: string; // Format: YYYY-MM
}

export const BulkSubmitSalarySlipModal: React.FC<BulkSubmitSalarySlipModalProps> = ({
  open,
  onClose,
  onSuccess,
  salaryPeriod,
}) => {
  const [bulkSubmit, { isLoading }] = usePostHrmSalarySlipsBulkSubmitForReviewMutation();
  const [apiError, setApiError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [cooldown, setCooldown] = useState(true);
  const expectedText = 'XÁC NHẬN';

  useEffect(() => {
    if (open) {
      setApiError(null);
      setConfirmText('');
      setCooldown(true);
      const timer = setTimeout(() => setCooldown(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const onSubmit = async () => {
    setApiError(null);
    try {
      await bulkSubmit({
        body: { salary_period: salaryPeriod },
      }).unwrap();
      onSuccess();
    } catch (err: unknown) {
      console.error('Failed to execute bulk submit for review', err);
      const error = err as { data?: { error?: string; detail?: string } };
      setApiError(
        error?.data?.error || error?.data?.detail || 'Có lỗi xảy ra khi gửi duyệt bảng lương hàng loạt. Vui lòng kiểm tra lại.'
      );
    }
  };

  // Format salary period for display (e.g. 2026-05 -> Tháng 05/2026)
  const formatPeriod = (period: string) => {
    if (!period) return '';
    const [year, month] = period.split('-');
    return `Tháng ${month}/${year}`;
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Gửi Duyệt Bảng Lương Hàng Loạt"
      size="sm"
      footer={
        <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button 
            variant="primary" 
            onClick={onSubmit} 
            loading={isLoading}
            disabled={confirmText !== expectedText || cooldown}
          >
            {cooldown ? 'Vui lòng đợi...' : 'Xác nhận gửi duyệt'}
          </Button>
        </div>
      }
    >
      <div className={styles.form}>
        {apiError && (
          <div className={styles.errorSection}>
            <span>{apiError}</span>
          </div>
        )}

        <div className={styles.infoBox}>
          <div className={styles.infoTitle}>Kỳ lương gửi duyệt:</div>
          <div className={styles.infoValue}>{formatPeriod(salaryPeriod)}</div>
        </div>

        <div className={styles.warningBox}>
          <strong>⚠️ Cảnh báo hành động:</strong>
          <p>
            Hành động này sẽ gửi duyệt toàn bộ các phiếu lương đã tính toán trong {formatPeriod(salaryPeriod)} sang bộ phận Tài chính để phê duyệt. Trạng thái của các phiếu lương này sẽ chuyển sang chờ phê duyệt và hành động này không thể hoàn tác.
          </p>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="confirm_input">
            Nhập chữ "<strong>{expectedText}</strong>" để xác nhận hành động này <span className={styles.required}>*</span>
          </label>
          <input
            id="confirm_input"
            type="text"
            className={styles.textInput}
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder='Nhập "XÁC NHẬN" vào đây'
            autoComplete="off"
          />
        </div>
      </div>
    </Modal>
  );
};

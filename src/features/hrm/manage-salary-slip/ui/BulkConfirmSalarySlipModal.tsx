import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { usePostHrmSalarySlipsBulkConfirmPayMutation } from '@entities/hrm/api/hrmApi';
import { Modal } from '@shared/ui/Modal/Modal';
import { Button } from '@shared/ui/Button/Button';
import styles from './BulkConfirmSalarySlipModal.module.css';

interface BulkConfirmSalarySlipModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  salaryPeriod: string; // Format: YYYY-MM
}

interface FormValues {
  payment_method: 'cash' | 'bank_transfer';
}

export const BulkConfirmSalarySlipModal: React.FC<BulkConfirmSalarySlipModalProps> = ({
  open,
  onClose,
  onSuccess,
  salaryPeriod,
}) => {
  const [bulkConfirmPay, { isLoading }] = usePostHrmSalarySlipsBulkConfirmPayMutation();
  const [apiError, setApiError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [cooldown, setCooldown] = useState(true);
  const expectedText = 'XÁC NHẬN';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
  } = useForm<FormValues>({
    defaultValues: {
      payment_method: 'bank_transfer',
    },
  });

  const paymentMethod = watch('payment_method');

  useEffect(() => {
    if (open) {
      reset({
        payment_method: 'bank_transfer',
      });
      setApiError(null);
      setConfirmText('');
      setCooldown(true);
      const timer = setTimeout(() => setCooldown(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [open, reset]);

  const onSubmit = async (values: FormValues) => {
    setApiError(null);
    try {
      await bulkConfirmPay({
        body: {
          salary_period: salaryPeriod,
          payment_method: values.payment_method,
        },
      }).unwrap();
      onSuccess();
    } catch (err: unknown) {
      console.error('Failed to execute bulk confirm and pay', err);
      const error = err as { data?: { detail?: string } };
      setApiError(
        error?.data?.detail || 'Có lỗi xảy ra khi thanh toán lương nhanh. Vui lòng kiểm tra lại.'
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
      title="Thanh Toán Lương Nhanh"
      size="sm"
      footer={
        <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmit(onSubmit)} 
            loading={isLoading}
            disabled={confirmText !== expectedText || cooldown}
          >
            {cooldown ? 'Vui lòng đợi...' : 'Xác nhận thanh toán'}
          </Button>
        </div>
      }
    >
      <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
        {apiError && (
          <div className={styles.errorSection}>
            <span>{apiError}</span>
          </div>
        )}

        <div className={styles.infoBox}>
          <div className={styles.infoTitle}>Kỳ lương thanh toán:</div>
          <div className={styles.infoValue}>{formatPeriod(salaryPeriod)}</div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>
            Hình thức chi trả <span className={styles.required}>*</span>
          </label>
          <div className={styles.paymentOptions}>
            <div
              className={`${styles.paymentCard} ${
                paymentMethod === 'bank_transfer' ? styles.activeCard : ''
              }`}
              onClick={() => setValue('payment_method', 'bank_transfer')}
            >
              <input
                type="radio"
                id="method_bank"
                value="bank_transfer"
                {...register('payment_method')}
                className={styles.radioInput}
              />
              <div className={styles.paymentCardContent}>
                <span className={styles.paymentIcon}>🏦</span>
                <div className={styles.paymentText}>
                  <label htmlFor="method_bank" className={styles.paymentLabel}>
                    Chuyển khoản ngân hàng
                  </label>
                  <div className={styles.paymentDesc}>Tạo bút toán chi qua Ngân hàng</div>
                </div>
              </div>
            </div>

            <div
              className={`${styles.paymentCard} ${
                paymentMethod === 'cash' ? styles.activeCard : ''
              }`}
              onClick={() => setValue('payment_method', 'cash')}
            >
              <input
                type="radio"
                id="method_cash"
                value="cash"
                {...register('payment_method')}
                className={styles.radioInput}
              />
              <div className={styles.paymentCardContent}>
                <span className={styles.paymentIcon}>💵</span>
                <div className={styles.paymentText}>
                  <label htmlFor="method_cash" className={styles.paymentLabel}>
                    Tiền mặt
                  </label>
                  <div className={styles.paymentDesc}>Tạo bút toán chi qua Quỹ tiền mặt</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.warningBox}>
          <strong>⚠️ Cảnh báo hành động:</strong>
          <p>
            Hành động này sẽ duyệt và thanh toán <strong>TẤT CẢ</strong> các phiếu lương đang ở trạng thái <strong>Chưa thanh toán (Draft)</strong> trong <strong>{formatPeriod(salaryPeriod)}</strong>.
          </p>
          <p>
            Trạng thái của các phiếu lương này sẽ chuyển sang <strong>Đã thanh toán (Paid)</strong> và hệ thống tự động sinh các bút toán chi quỹ tương ứng. Hành động này không thể hoàn tác.
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
      </form>
    </Modal>
  );
};

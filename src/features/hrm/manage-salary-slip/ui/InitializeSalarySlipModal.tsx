import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { usePostHrmSalarySlipsInitializeMutation } from '@entities/hrm/api/hrmApi';
import { Modal } from '@shared/ui/Modal/Modal';
import { Button } from '@shared/ui/Button/Button';
import styles from './InitializeSalarySlipModal.module.css';

interface InitializeSalarySlipModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormValues {
  salary_period: string;
}

export const InitializeSalarySlipModal: React.FC<InitializeSalarySlipModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [initializeSalarySlips, { isLoading }] = usePostHrmSalarySlipsInitializeMutation();
  const [apiError, setApiError] = useState<string | null>(null);

  // Get current year and month as default YYYY-MM
  const getDefaultPeriod = () => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${mm}`;
  };

  const {
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormValues>({
    defaultValues: {
      salary_period: getDefaultPeriod(),
    },
  });

  const salaryPeriod = watch('salary_period');
  const [yearStr, monthStr] = (salaryPeriod || getDefaultPeriod()).split('-');

  useEffect(() => {
    if (open) {
      reset({
        salary_period: getDefaultPeriod(),
      });
      setApiError(null);
    }
  }, [open, reset]);

  const onSubmit = async (values: FormValues) => {
    setApiError(null);
    try {
      await initializeSalarySlips({
        body: { salary_period: values.salary_period },
      }).unwrap();
      onSuccess();
    } catch (err: any) {
      console.error('Failed to initialize salary slips', err);
      setApiError(
        err?.data?.detail || 'Có lỗi xảy ra khi khởi tạo phiếu lương. Vui lòng kiểm tra lại.'
      );
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Khởi Tạo Phiếu Lương Hàng Loạt"
      size="sm"
      footer={
        <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isLoading}>
            Khởi tạo
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

        <div className={styles.formGroup}>
          <label className={styles.label}>
            Chọn kỳ lương (Tháng/Năm) <span className={styles.required}>*</span>
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <select
              value={monthStr}
              onChange={(e) => {
                setValue('salary_period', `${yearStr}-${e.target.value}`, { shouldValidate: true });
              }}
              className={styles.input}
              disabled={isLoading}
              style={{ flex: 1 }}
              aria-label="Chọn tháng"
            >
              {Array.from({ length: 12 }, (_, i) => {
                const m = String(i + 1).padStart(2, '0');
                return (
                  <option key={m} value={m}>
                    Tháng {i + 1}
                  </option>
                );
              })}
            </select>
            <select
              value={yearStr}
              onChange={(e) => {
                setValue('salary_period', `${e.target.value}-${monthStr}`, { shouldValidate: true });
              }}
              className={styles.input}
              disabled={isLoading}
              style={{ flex: 1 }}
              aria-label="Chọn năm"
            >
              {Array.from({ length: 10 }, (_, i) => {
                const y = String(2020 + i);
                return (
                  <option key={y} value={y}>
                    Năm {y}
                  </option>
                );
              })}
            </select>
          </div>
          {errors.salary_period && (
            <span className={styles.errorText}>{errors.salary_period.message}</span>
          )}
        </div>

        <div className={styles.helperText}>
          <strong>Lưu ý:</strong> Hệ thống sẽ tự động tạo phiếu lương nháp (Draft) cho toàn bộ
          nhân viên có trạng thái hoạt động (Active) trong kỳ lương này. Các thông tin công, OT,
          thưởng phạt sẽ được tổng hợp tự động khi tính toán chi tiết.
        </div>
      </form>
    </Modal>
  );
};

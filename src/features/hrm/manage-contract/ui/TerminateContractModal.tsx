import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { usePostHrmContractsByIdTerminateMutation } from '@entities/hrm/api/hrmApi';
import type { Employee } from '@entities/hrm/model/types';
import { Modal } from '@shared/ui/Modal/Modal';
import { Button } from '@shared/ui/Button/Button';
import styles from './TerminateContractModal.module.css';

interface TerminateContractModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employee: Employee;
  contractId: string;
}

interface FormValues {
  termination_date: string;
  reason: string;
  file_url?: string;
  is_lawful: boolean;
  unused_leave_days: number;
  standard_working_days: number;
  unnotified_days: number;
}

export const TerminateContractModal: React.FC<TerminateContractModalProps> = ({
  open,
  onClose,
  onSuccess,
  employee,
  contractId,
}) => {
  const [terminateContract, { isLoading }] = usePostHrmContractsByIdTerminateMutation();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<FormValues>({
    defaultValues: {
      termination_date: new Date().toISOString().split('T')[0],
      reason: '',
      file_url: '',
      is_lawful: true,
      unused_leave_days: 0,
      standard_working_days: 26,
      unnotified_days: 0,
    },
  });

  const isLawful = watch('is_lawful');

  useEffect(() => {
    if (open) {
      reset({
        termination_date: new Date().toISOString().split('T')[0],
        reason: '',
        file_url: '',
        is_lawful: true,
        unused_leave_days: 0,
        standard_working_days: 26,
        unnotified_days: 0,
      });
      setApiError(null);
    }
  }, [open, reset]);

  const onSubmit = async (values: FormValues) => {
    setApiError(null);
    if (!contractId) return;

    try {
      await terminateContract({
        id: contractId,
        body: {
          termination_date: values.termination_date,
          reason: values.reason,
          file_url: values.file_url || undefined,
          is_lawful: values.is_lawful,
          unused_leave_days: Number(values.unused_leave_days),
          standard_working_days: Number(values.standard_working_days),
          unnotified_days: values.is_lawful ? 0 : Number(values.unnotified_days),
        },
      }).unwrap();
      onSuccess();
    } catch (err: any) {
      console.error('Failed to terminate contract', err);
      setApiError(
        err?.data?.error ||
          err?.data?.detail ||
          'Có lỗi xảy ra khi chấm dứt hợp đồng. Vui lòng kiểm tra lại.'
      );
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Quyết Toán & Chấm Dứt Hợp Đồng - ${employee.full_name}`}
      size="sm"
      footer={
        <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button variant="danger" onClick={handleSubmit(onSubmit)} loading={isLoading}>
            Xác nhận chấm dứt
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

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="termination_date">
              Ngày chấm dứt <span className={styles.required}>*</span>
            </label>
            <input
              id="termination_date"
              type="date"
              className={styles.input}
              {...register('termination_date', { required: 'Ngày chấm dứt là bắt buộc' })}
              disabled={isLoading}
            />
            {errors.termination_date && (
              <span className={styles.errorText}>{errors.termination_date.message}</span>
            )}
          </div>

          <div className={styles.formGroup} style={{ justifyContent: 'center' }}>
            <div className={styles.checkboxGroup}>
              <input
                id="is_lawful"
                type="checkbox"
                className={styles.checkboxInput}
                {...register('is_lawful')}
                disabled={isLoading}
              />
              <label className={styles.checkboxLabel} htmlFor="is_lawful">
                Nghỉ việc hợp pháp (Đúng luật)
              </label>
            </div>
          </div>
        </div>

        {!isLawful && (
          <div className={styles.alertWarning}>
            <span className={styles.alertWarningStrong}>⚠️ CẢNH BÁO NGHỈ NGANG (TRÁI LUẬT):</span>
            <span>
              NLĐ đơn phương chấm dứt hợp đồng trái luật sẽ bị cấn trừ:
              <br />
              - Bồi thường cho công ty nửa tháng lương cơ bản theo hợp đồng.
              <br />
              - Bồi thường tiền lương tương ứng cho những ngày không báo trước.
              <br />
              - Không được nhận trợ cấp thôi việc.
            </span>
          </div>
        )}

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="reason">
            Lý do chấm dứt <span className={styles.required}>*</span>
          </label>
          <input
            id="reason"
            type="text"
            placeholder="VD: Đơn xin thôi việc được duyệt, Vi phạm kỷ luật..."
            className={styles.input}
            {...register('reason', { required: 'Lý do chấm dứt là bắt buộc' })}
            disabled={isLoading}
          />
          {errors.reason && <span className={styles.errorText}>{errors.reason.message}</span>}
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="unused_leave_days">
              Số ngày phép chưa nghỉ
            </label>
            <input
              id="unused_leave_days"
              type="number"
              step="0.5"
              min="0"
              className={styles.input}
              {...register('unused_leave_days', { required: 'Bắt buộc', valueAsNumber: true, min: { value: 0, message: 'Số ngày phép tối thiểu là 0' }, validate: val => !isNaN(val) || 'Bắt buộc' })}
              disabled={isLoading}
            />
            {errors.unused_leave_days && <span className={styles.errorText}>{errors.unused_leave_days.message}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="standard_working_days">
              Ngày công chuẩn của tháng
            </label>
            <input
              id="standard_working_days"
              type="number"
              min="1"
              className={styles.input}
              {...register('standard_working_days', { required: 'Bắt buộc', valueAsNumber: true, min: { value: 1, message: 'Ngày công chuẩn tối thiểu là 1' }, validate: val => !isNaN(val) || 'Bắt buộc' })}
              disabled={isLoading}
            />
            {errors.standard_working_days && <span className={styles.errorText}>{errors.standard_working_days.message}</span>}
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup} style={{ flex: 1 }}>
            <span className={styles.label} style={{ marginBottom: '8px', display: 'block' }}>
              Cách tính lương ngày công
            </span>
            <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text-secondary)', display: 'block', padding: '8px 0' }}>
              Cách 1: Theo ngày công chuẩn cố định
            </span>
          </div>

          {!isLawful && (
            <div className={styles.formGroup} style={{ flex: 1 }}>
              <label className={styles.label} htmlFor="unnotified_days">
                Số ngày không báo trước
              </label>
              <input
                id="unnotified_days"
                type="number"
                min="0"
                className={styles.input}
                {...register('unnotified_days', { required: 'Bắt buộc', valueAsNumber: true, min: { value: 0, message: 'Số ngày tối thiểu là 0' }, validate: val => !isNaN(val) || 'Bắt buộc' })}
                disabled={isLoading}
              />
              {errors.unnotified_days && <span className={styles.errorText}>{errors.unnotified_days.message}</span>}
            </div>
          )}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="file_url">
            Link quyết định thôi việc/Biên bản (PDF/Image)
          </label>
          <input
            id="file_url"
            type="text"
            placeholder="https://storage.example.com/documents/terminate_hdld.pdf"
            className={styles.input}
            {...register('file_url')}
            disabled={isLoading}
          />
        </div>
      </form>
    </Modal>
  );
};

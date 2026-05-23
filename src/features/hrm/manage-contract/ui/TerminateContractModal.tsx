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
  } = useForm<FormValues>({
    defaultValues: {
      termination_date: new Date().toISOString().split('T')[0],
      reason: '',
      file_url: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        termination_date: new Date().toISOString().split('T')[0],
        reason: '',
        file_url: '',
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
        },
      }).unwrap();
      onSuccess();
    } catch (err: any) {
      console.error('Failed to terminate contract', err);
      setApiError(err?.data?.detail || 'Có lỗi xảy ra khi chấm dứt hợp đồng. Vui lòng kiểm tra lại.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Chấm Dứt Hợp Đồng - ${employee.full_name}`}
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

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="reason">
            Lý do chấm dứt <span className={styles.required}>*</span>
          </label>
          <input
            id="reason"
            type="text"
            placeholder="VD: Vi phạm kỷ luật, Thôi việc tự nguyện..."
            className={styles.input}
            {...register('reason', { required: 'Lý do chấm dứt là bắt buộc' })}
            disabled={isLoading}
          />
          {errors.reason && <span className={styles.errorText}>{errors.reason.message}</span>}
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

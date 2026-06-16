import React from 'react';
import { useForm } from 'react-hook-form';
import type { Employee } from '@entities/hrm/model/types';
import { Modal } from '@shared/ui/Modal/Modal';
import { Button } from '@shared/ui/Button/Button';
import styles from './AdjustSalaryModal.module.css';

interface AdjustSalaryFormModalProps {
  open: boolean;
  onClose: () => void;
  onContinue: (data: { new_salary_base: number; reason: string }) => void;
  employee: Employee;
}

interface FormValues {
  new_salary_base: number;
  reason: string;
}

export const AdjustSalaryFormModal: React.FC<AdjustSalaryFormModalProps> = ({
  open,
  onClose,
  onContinue,
  employee,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      new_salary_base: Number(employee.current_salary_base) || 0,
      reason: '',
    },
  });

  const onSubmit = (values: FormValues) => {
    onContinue({
      new_salary_base: Number(values.new_salary_base),
      reason: values.reason,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Điều Chỉnh Lương - ${employee.employee_id || ''}`}
      size="md"
      footer={
        <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)}>
            Tiếp tục
          </Button>
        </div>
      }
    >
      <form onSubmit={(e) => e.preventDefault()}>
        <div className={styles.formGroup} style={{ marginBottom: '16px' }}>
          <label className={styles.label} htmlFor="new_salary_base">
            Mức lương cơ bản mới (VND) <span className={styles.required}>*</span>
          </label>
          <input
            id="new_salary_base"
            type="number"
            min={0}
            step={100000}
            className={styles.input}
            {...register('new_salary_base', {
              required: 'Lương cơ bản mới là bắt buộc',
              valueAsNumber: true,
              validate: (val) =>
                (val !== undefined && val !== null && !isNaN(val)) || 'Lương cơ bản mới là bắt buộc',
            })}
          />
          {errors.new_salary_base && (
            <span className={styles.errorText}>{errors.new_salary_base.message}</span>
          )}
        </div>
        <div className={styles.formGroup} style={{ marginBottom: '16px' }}>
          <label className={styles.label} htmlFor="reason">
            Lý do điều chỉnh
          </label>
          <input
            id="reason"
            type="text"
            placeholder="VD: Tăng lương định kỳ hoặc chuyển công tác"
            className={styles.input}
            {...register('reason')}
          />
        </div>
        <div className={styles.infoBox}>
          ℹ️ Lương mới sẽ có hiệu lực từ hôm nay ({new Date().toISOString().split('T')[0]}). Hệ thống sẽ tự động tính lại phiếu lương kỳ hiện tại (nếu chưa chốt).
        </div>
      </form>
    </Modal>
  );
};

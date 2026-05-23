import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { usePostHrmDisciplinesMutation } from '@entities/hrm/api/hrmApi';
import type { Employee } from '@entities/hrm/model/types';
import { Modal } from '@shared/ui/Modal/Modal';
import { Button } from '@shared/ui/Button/Button';
import styles from './DisciplineFormModal.module.css';

interface DisciplineFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employee: Employee;
  salarySlipId?: string;
}

interface FormValues {
  incident_date: string;
  discipline_date: string;
  discipline_type: 'reprimand' | 'warning' | 'salary_deduction' | 'termination' | 'other';
  description: string;
  penalty_amount: number;
  file_url?: string;
}

export const DisciplineFormModal: React.FC<DisciplineFormModalProps> = ({
  open,
  onClose,
  onSuccess,
  employee,
  salarySlipId,
}) => {
  const [createDiscipline, { isLoading }] = usePostHrmDisciplinesMutation();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<FormValues>({
    defaultValues: {
      incident_date: new Date().toISOString().split('T')[0],
      discipline_date: new Date().toISOString().split('T')[0],
      discipline_type: 'warning',
      description: '',
      penalty_amount: 0,
      file_url: '',
    },
  });

  const disciplineType = watch('discipline_type');

  useEffect(() => {
    if (open && employee) {
      reset({
        incident_date: new Date().toISOString().split('T')[0],
        discipline_date: new Date().toISOString().split('T')[0],
        discipline_type: 'warning',
        description: '',
        penalty_amount: 0,
        file_url: '',
      });
      setApiError(null);
    }
  }, [open, employee, reset]);

  const onSubmit = async (values: FormValues) => {
    setApiError(null);
    if (!employee.id) return;

    if (values.discipline_type === 'salary_deduction' && Number(values.penalty_amount) <= 0) {
      setApiError('Số tiền phạt khấu trừ phải lớn hơn 0.');
      return;
    }

    try {
      const body = {
        employee_id: employee.id,
        incident_date: values.incident_date,
        discipline_date: values.discipline_date,
        discipline_type: values.discipline_type,
        description: values.description,
        penalty_amount: values.discipline_type === 'salary_deduction' ? Number(values.penalty_amount) : undefined,
        salary_slip_id: salarySlipId || undefined,
        file_url: values.file_url || undefined,
      };

      await createDiscipline({ body }).unwrap();
      onSuccess();
    } catch (err: any) {
      console.error('Failed to create discipline record', err);
      setApiError(err?.data?.detail || 'Có lỗi xảy ra khi ghi nhận kỷ luật. Vui lòng kiểm tra lại.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Ghi Nhận Kỷ Luật - ${employee.full_name}`}
      size="md"
      footer={
        <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isLoading}>
            Ghi nhận kỷ luật
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

        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="incident_date">
              Ngày xảy ra sự việc <span className={styles.required}>*</span>
            </label>
            <input
              id="incident_date"
              type="date"
              className={styles.input}
              {...register('incident_date', { required: 'Ngày sự việc là bắt buộc' })}
              disabled={isLoading}
            />
            {errors.incident_date && <span className={styles.errorText}>{errors.incident_date.message}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="discipline_date">
              Ngày quyết định <span className={styles.required}>*</span>
            </label>
            <input
              id="discipline_date"
              type="date"
              className={styles.input}
              {...register('discipline_date', { required: 'Ngày quyết định là bắt buộc' })}
              disabled={isLoading}
            />
            {errors.discipline_date && <span className={styles.errorText}>{errors.discipline_date.message}</span>}
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="discipline_type">
              Hình thức kỷ luật <span className={styles.required}>*</span>
            </label>
            <select
              id="discipline_type"
              className={styles.select}
              {...register('discipline_type', { required: 'Hình thức kỷ luật là bắt buộc' })}
              disabled={isLoading}
            >
              <option value="reprimand">Phê bình/Nhắc nhở</option>
              <option value="warning">Khiển trách bằng văn bản</option>
              <option value="salary_deduction">Khấu trừ lương/Phạt tiền</option>
              <option value="termination">Sa thải/Chấm dứt hợp đồng</option>
              <option value="other">Khác</option>
            </select>
          </div>

          {disciplineType === 'salary_deduction' && (
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="penalty_amount">
                Số tiền khấu trừ (VND) <span className={styles.required}>*</span>
              </label>
              <input
                id="penalty_amount"
                type="number"
                min={0}
                step={10000}
                className={styles.input}
                {...register('penalty_amount', {
                  required: disciplineType === 'salary_deduction' ? 'Số tiền phạt là bắt buộc' : false,
                  valueAsNumber: true,
                })}
                disabled={isLoading}
              />
              {errors.penalty_amount && <span className={styles.errorText}>{errors.penalty_amount.message}</span>}
            </div>
          )}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="file_url">
            Link biên bản/Quyết định kỷ luật (PDF/Image)
          </label>
          <input
            id="file_url"
            type="text"
            placeholder="https://storage.example.com/documents/discipline_hdld.pdf"
            className={styles.input}
            {...register('file_url')}
            disabled={isLoading}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="description">
            Nội dung vi phạm <span className={styles.required}>*</span>
          </label>
          <textarea
            id="description"
            placeholder="Mô tả chi tiết hành vi vi phạm kỷ luật..."
            className={styles.textarea}
            {...register('description', { required: 'Nội dung vi phạm là bắt buộc' })}
            disabled={isLoading}
          />
          {errors.description && <span className={styles.errorText}>{errors.description.message}</span>}
        </div>
      </form>
    </Modal>
  );
};

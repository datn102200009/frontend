import React, { useEffect, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePatchHrmDisciplinesByIdMutation } from '@entities/hrm/api/hrmApi';
import { DISCIPLINE_TYPE_OPTIONS } from '@shared/constants/hrmRewardDiscipline';
import type { DisciplineRecord } from '@entities/hrm/model/types';
import { Modal } from '@shared/ui/Modal/Modal';
import { Button } from '@shared/ui/Button/Button';
import { DatePickerField } from '@shared/ui/DatePickerField/DatePickerField';
import { disciplineSchema, type DisciplineFormValues } from '../model/reward-discipline.schema';
import styles from './DisciplineFormModal.module.css';

interface DisciplineEditModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  record: DisciplineRecord;
}

export const DisciplineEditModal: React.FC<DisciplineEditModalProps> = ({
  open,
  onClose,
  onSuccess,
  record,
}) => {
  const [updateDiscipline, { isLoading }] = usePatchHrmDisciplinesByIdMutation();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    control,
  } = useForm<DisciplineFormValues>({
    resolver: zodResolver(disciplineSchema) as unknown as Resolver<DisciplineFormValues>,
    defaultValues: {
      employee_id: record.employee_id || '',
      incident_date: record.incident_date || '',
      discipline_date: record.discipline_date || '',
      discipline_type: (record.discipline_type as DisciplineFormValues['discipline_type']) || 'warning',
      description: record.description || '',
      penalty_amount: record.penalty_amount ? Number(record.penalty_amount) : 0,
      file_url: record.file_url || '',
    },
  });

  const disciplineType = watch('discipline_type');

  useEffect(() => {
    if (open) {
      setApiError(null);
      reset({
        employee_id: record.employee_id || '',
        incident_date: record.incident_date || '',
        discipline_date: record.discipline_date || '',
        discipline_type: (record.discipline_type as DisciplineFormValues['discipline_type']) || 'warning',
        description: record.description || '',
        penalty_amount: record.penalty_amount ? Number(record.penalty_amount) : 0,
        file_url: record.file_url || '',
      });
    }
  }, [open, record, reset]);

  const onSubmit = async (values: DisciplineFormValues) => {
    setApiError(null);
    try {
      await updateDiscipline({
        id: record.id!,
        body: {
          incident_date: values.incident_date,
          discipline_date: values.discipline_date,
          discipline_type: values.discipline_type,
          description: values.description,
          penalty_amount: values.discipline_type === 'salary_deduction' ? Number(values.penalty_amount) : 0,
          file_url: values.file_url || undefined,
        },
      }).unwrap();
      onSuccess();
    } catch (err: unknown) {
      console.error('Failed to update discipline record', err);
      const apiErr = err as { data?: { detail?: string; error?: string } };
      setApiError(
        apiErr?.data?.error || 
        apiErr?.data?.detail || 
        'Có lỗi xảy ra khi cập nhật kỷ luật. Vui lòng kiểm tra lại.'
      );
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Sửa Quyết Định Kỷ Luật - ${record.employee_name}`}
      size="md"
      footer={
        <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isLoading}>
            Lưu thay đổi
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
          <label className={styles.label}>Nhân viên</label>
          <input
            type="text"
            className={styles.input}
            value={`${record.employee_code} - ${record.employee_name}`}
            disabled
          />
        </div>

        <div className={styles.row}>
          <DatePickerField
            name="incident_date"
            label="Ngày xảy ra vi phạm"
            control={control}
            error={errors.incident_date?.message}
            required
            disabled={isLoading}
          />

          <DatePickerField
            name="discipline_date"
            label="Ngày quyết định"
            control={control}
            error={errors.discipline_date?.message}
            required
            disabled={isLoading}
          />
        </div>

        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="discipline_type">
              Hình thức kỷ luật <span className={styles.required}>*</span>
            </label>
            <select
              id="discipline_type"
              className={styles.select}
              {...register('discipline_type')}
              disabled={isLoading}
            >
              {DISCIPLINE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="penalty_amount">
              Số tiền phạt (VND)
            </label>
            <input
              id="penalty_amount"
              type="number"
              min={0}
              step={50000}
              className={styles.input}
              {...register('penalty_amount')}
              disabled={isLoading || disciplineType !== 'salary_deduction'}
            />
            {errors.penalty_amount && <span className={styles.errorText}>{errors.penalty_amount.message}</span>}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="file_url">
            Link đính kèm tài liệu
          </label>
          <input
            id="file_url"
            type="text"
            placeholder="https://example.com/file.pdf"
            className={styles.input}
            {...register('file_url')}
            disabled={isLoading}
          />
          {errors.file_url && <span className={styles.errorText}>{errors.file_url.message}</span>}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="description">
            Nội dung vi phạm / Lý do kỷ luật <span className={styles.required}>*</span>
          </label>
          <textarea
            id="description"
            placeholder="Mô tả chi tiết hành vi vi phạm..."
            className={styles.textarea}
            {...register('description')}
            disabled={isLoading}
          />
          {errors.description && <span className={styles.errorText}>{errors.description.message}</span>}
        </div>
      </form>
    </Modal>
  );
};

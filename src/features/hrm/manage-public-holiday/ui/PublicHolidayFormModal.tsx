import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  usePostHrmPublicHolidaysMutation,
  usePutHrmPublicHolidaysByIdMutation,
} from '@entities/hrm/api/hrmApi';
import type { PublicHoliday } from '@entities/hrm/api/hrmApi';

import { Modal } from '@shared/ui/Modal/Modal';
import { Button } from '@shared/ui/Button/Button';
import { useToast } from '@shared/ui/Toast/Toast';
import styles from './PublicHolidayFormModal.module.css';

interface PublicHolidayFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  holiday?: PublicHoliday;
}

interface FormValues {
  name: string;
  date: string;
  description: string;
}

export const PublicHolidayFormModal: React.FC<PublicHolidayFormModalProps> = ({
  open,
  onClose,
  onSuccess,
  holiday,
}) => {
  const [createHoliday, { isLoading: isCreating }] = usePostHrmPublicHolidaysMutation();
  const [updateHoliday, { isLoading: isUpdating }] = usePutHrmPublicHolidaysByIdMutation();
  const isLoading = isCreating || isUpdating;

  const [apiError, setApiError] = useState<string | null>(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    defaultValues: {
      name: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (holiday) {
        reset({
          name: holiday.name || '',
          date: holiday.date || '',
          description: holiday.description || '',
        });
      } else {
        reset({
          name: '',
          date: new Date().toISOString().split('T')[0],
          description: '',
        });
      }
      setApiError(null);
    }
  }, [open, holiday, reset]);

  const onSubmit = async (values: FormValues) => {
    setApiError(null);
    try {
      if (holiday?.id) {
        await updateHoliday({
          id: holiday.id,
          body: {
            name: values.name,
            date: values.date,
            description: values.description || undefined,
          },
        }).unwrap();
        toast('success', `Đã cập nhật ngày nghỉ lễ "${values.name}"`);
      } else {
        await createHoliday({
          body: {
            name: values.name,
            date: values.date,
            description: values.description || undefined,
          },
        }).unwrap();
        toast('success', `Đã khai báo ngày nghỉ lễ "${values.name}"`);
      }
      onSuccess();
    } catch (err: any) {
      console.error('Failed to save public holiday', err);
      setApiError(err?.data?.detail || 'Có lỗi xảy ra khi lưu ngày nghỉ lễ. Vui lòng kiểm tra lại.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={holiday ? 'Cập Nhật Ngày Nghỉ Lễ' : 'Khai Báo Ngày Nghỉ Lễ Mới'}
      size="md"
      footer={
        <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isLoading}>
            Lưu
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
          <label className={styles.label} htmlFor="name">
            Tên ngày nghỉ lễ <span className={styles.required}>*</span>
          </label>
          <input
            id="name"
            type="text"
            placeholder="Ví dụ: Tết Nguyên Đán, Ngày Quốc tế Lao động..."
            className={styles.input}
            {...register('name', { required: 'Tên ngày nghỉ lễ là bắt buộc' })}
            disabled={isLoading}
          />
          {errors.name && <span className={styles.errorText}>{errors.name.message}</span>}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="date">
            Ngày nghỉ lễ <span className={styles.required}>*</span>
          </label>
          <input
            id="date"
            type="date"
            className={styles.input}
            {...register('date', { required: 'Ngày nghỉ lễ là bắt buộc' })}
            disabled={isLoading}
          />
          {errors.date && <span className={styles.errorText}>{errors.date.message}</span>}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="description">
            Mô tả
          </label>
          <textarea
            id="description"
            placeholder="Mô tả chi tiết hoặc ghi chú..."
            className={styles.textarea}
            {...register('description')}
            disabled={isLoading}
          />
        </div>
      </form>
    </Modal>
  );
};

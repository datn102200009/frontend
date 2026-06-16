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
import { DatePickerField } from '@shared/ui/DatePickerField/DatePickerField';
import styles from './PublicHolidayFormModal.module.css';

interface PublicHolidayFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  holiday?: PublicHoliday;
}

interface FormValues {
  name: string;
  start_date: string;
  days: number;
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
    control,
  } = useForm<FormValues>({
    defaultValues: {
      name: '',
      start_date: new Date().toISOString().split('T')[0],
      days: 1,
      description: '',
    },
  });



  useEffect(() => {
    if (open) {
      if (holiday) {
        reset({
          name: holiday.name || '',
          start_date: holiday.start_date || '',
          days: holiday.days || 1,
          description: holiday.description || '',
        });
      } else {
        reset({
          name: '',
          start_date: new Date().toISOString().split('T')[0],
          days: 1,
          description: '',
        });
      }
      setApiError(null);
    }
  }, [open, holiday, reset]);

  const isPastOrOngoing = React.useMemo(() => {
    if (!holiday || !holiday.start_date) return false;
    const cleanDateStr = holiday.start_date.split('T')[0];
    const parts = cleanDateStr.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const parsedHolidayDate = new Date(y, m, d);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return parsedHolidayDate <= today;
    }
    return false;
  }, [holiday]);

  const onSubmit = async (values: FormValues) => {
    setApiError(null);
    try {
      if (holiday?.id) {
        await updateHoliday({
          id: holiday.id,
          body: {
            name: values.name,
            start_date: values.start_date,
            days: values.days,
            description: values.description || undefined,
          },
        }).unwrap();
        toast('success', `Đã cập nhật ngày nghỉ lễ "${values.name}"`);
      } else {
        await createHoliday({
          body: {
            name: values.name,
            start_date: values.start_date,
            days: values.days,
            description: values.description || undefined,
          },
        }).unwrap();
        toast('success', `Đã khai báo ngày nghỉ lễ "${values.name}"`);
      }
      onSuccess();
    } catch (err: unknown) {
      console.error('Failed to save public holiday', err);
      const error = err as { data?: { error?: string; detail?: string } };
      setApiError(error?.data?.error || error?.data?.detail || 'Có lỗi xảy ra khi lưu ngày nghỉ lễ. Vui lòng kiểm tra lại.');
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
          <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isLoading} disabled={isPastOrOngoing}>
            Lưu
          </Button>
        </div>
      }
    >
      <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
        {isPastOrOngoing && (
          <div className={styles.errorSection} data-testid="past-ongoing-holiday-banner">
            <span>Không được phép chỉnh sửa hoặc xóa ngày nghỉ lễ trong quá khứ hoặc đang diễn ra.</span>
          </div>
        )}
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
            disabled={isLoading || isPastOrOngoing}
          />
          {errors.name && <span className={styles.errorText}>{errors.name.message}</span>}
        </div>

        <DatePickerField
          name="start_date"
          label="Ngày bắt đầu"
          control={control}
          error={errors.start_date?.message}
          required={true}
          disabled={isLoading || isPastOrOngoing}
          validate={(value) => {
            if (holiday && holiday.start_date === value) {
              return true;
            }
            const parts = value.split('-');
            if (parts.length === 3) {
              const y = parseInt(parts[0], 10);
              const m = parseInt(parts[1], 10) - 1;
              const d = parseInt(parts[2], 10);
              const parsedSelected = new Date(y, m, d);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              if (parsedSelected < today) {
                return 'Không được chọn ngày nghỉ lễ trong quá khứ';
              }
            }
            return true;
          }}
        />

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="days">
            Số ngày nghỉ <span className={styles.required}>*</span>
          </label>
          <input
            id="days"
            type="number"
            step={1}
            min={1}
            className={styles.input}
            {...register('days', {
              required: 'Số ngày nghỉ là bắt buộc',
              valueAsNumber: true,
              validate: (value) => {
                if (value === undefined || value === null || isNaN(value)) {
                  return 'Số ngày nghỉ là bắt buộc';
                }
                if (!Number.isInteger(value) || value <= 0) {
                  return 'Số ngày nghỉ phải là số nguyên dương lớn hơn 0';
                }
                return true;
              },
            })}
            disabled={isLoading || isPastOrOngoing}
          />
          {errors.days && <span className={styles.errorText}>{errors.days.message}</span>}
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
            disabled={isLoading || isPastOrOngoing}
          />
        </div>
      </form>

    </Modal>
  );
};


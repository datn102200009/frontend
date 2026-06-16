import React, { useEffect, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePatchHrmRewardsByIdMutation } from '@entities/hrm/api/hrmApi';
import { REWARD_TYPE_OPTIONS } from '@shared/constants/hrmRewardDiscipline';
import type { RewardRecord } from '@entities/hrm/model/types';
import { Modal } from '@shared/ui/Modal/Modal';
import { Button } from '@shared/ui/Button/Button';
import { DatePickerField } from '@shared/ui/DatePickerField/DatePickerField';
import { rewardSchema, type RewardFormValues } from '../model/reward-discipline.schema';
import styles from './RewardFormModal.module.css';

interface RewardEditModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  record: RewardRecord;
}

export const RewardEditModal: React.FC<RewardEditModalProps> = ({
  open,
  onClose,
  onSuccess,
  record,
}) => {
  const [updateReward, { isLoading }] = usePatchHrmRewardsByIdMutation();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<RewardFormValues>({
    resolver: zodResolver(rewardSchema) as unknown as Resolver<RewardFormValues>,
    defaultValues: {
      employee_id: record.employee_id || '',
      reward_date: record.reward_date || '',
      reward_type: (record.reward_type as RewardFormValues['reward_type']) || 'performance_bonus',
      amount: record.amount ? Number(record.amount) : 0,
      description: record.description || '',
    },
  });

  useEffect(() => {
    if (open) {
      setApiError(null);
      reset({
        employee_id: record.employee_id || '',
        reward_date: record.reward_date || '',
        reward_type: (record.reward_type as RewardFormValues['reward_type']) || 'performance_bonus',
        amount: record.amount ? Number(record.amount) : 0,
        description: record.description || '',
      });
    }
  }, [open, record, reset]);

  const onSubmit = async (values: RewardFormValues) => {
    setApiError(null);
    try {
      await updateReward({
        id: record.id!,
        body: {
          reward_date: values.reward_date,
          reward_type: values.reward_type,
          amount: Number(values.amount),
          description: values.description,
        },
      }).unwrap();
      onSuccess();
    } catch (err: unknown) {
      console.error('Failed to update reward record', err);
      const apiErr = err as { data?: { detail?: string; error?: string } };
      setApiError(
        apiErr?.data?.error || 
        apiErr?.data?.detail || 
        'Có lỗi xảy ra khi cập nhật khen thưởng. Vui lòng kiểm tra lại.'
      );
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Sửa Quyết Định Khen Thưởng - ${record.employee_name}`}
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
            name="reward_date"
            label="Ngày quyết định"
            control={control}
            error={errors.reward_date?.message}
            required
            disabled={isLoading}
          />

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="reward_type">
              Loại khen thưởng <span className={styles.required}>*</span>
            </label>
            <select
              id="reward_type"
              className={styles.select}
              {...register('reward_type')}
              disabled={isLoading}
            >
              {REWARD_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="amount">
            Số tiền thưởng (VND) <span className={styles.required}>*</span>
          </label>
          <input
            id="amount"
            type="number"
            min={0}
            step={50000}
            className={styles.input}
            {...register('amount')}
            disabled={isLoading}
          />
          {errors.amount && <span className={styles.errorText}>{errors.amount.message}</span>}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="description">
            Lý do/Mô tả thành tích <span className={styles.required}>*</span>
          </label>
          <textarea
            id="description"
            placeholder="Mô tả lý do khen thưởng hoặc thành tích chi tiết..."
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

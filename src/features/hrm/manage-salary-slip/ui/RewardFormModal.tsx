import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePostHrmRewardsMutation, useGetHrmEmployeesQuery } from '@entities/hrm/api/hrmApi';
import type { Employee } from '@entities/hrm/model/types';
import { Modal } from '@shared/ui/Modal/Modal';
import { Button } from '@shared/ui/Button/Button';
import { rewardSchema, type RewardFormValues } from '../model/reward-discipline.schema';
import styles from './RewardFormModal.module.css';

interface RewardFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employee?: Employee;
  salarySlipId?: string;
}

export const RewardFormModal: React.FC<RewardFormModalProps> = ({
  open,
  onClose,
  onSuccess,
  employee,
  salarySlipId,
}) => {
  const [createReward, { isLoading }] = usePostHrmRewardsMutation();
  const [apiError, setApiError] = useState<string | null>(null);

  const [prevOpen, setPrevOpen] = useState(open);
  const [prevEmployee, setPrevEmployee] = useState(employee);

  if (open !== prevOpen || employee !== prevEmployee) {
    setPrevOpen(open);
    setPrevEmployee(employee);
    if (open) {
      setApiError(null);
    }
  }

  const { data: employeesData, isLoading: isEmployeesLoading } = useGetHrmEmployeesQuery(
    { status: 'active', limit: 100 },
    { skip: !!employee }
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RewardFormValues>({
    resolver: zodResolver(rewardSchema) as any,
    defaultValues: {
      employee_id: employee?.id || '',
      reward_date: new Date().toISOString().split('T')[0],
      reward_type: 'performance_bonus',
      amount: 1000000,
      description: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        employee_id: employee?.id || '',
        reward_date: new Date().toISOString().split('T')[0],
        reward_type: 'performance_bonus',
        amount: 1000000,
        description: '',
      });
    }
  }, [open, employee, reset]);

  const onSubmit = async (values: RewardFormValues) => {
    setApiError(null);
    const targetEmployeeId = employee?.id || values.employee_id;
    if (!targetEmployeeId) {
      setApiError('Vui lòng chọn nhân viên.');
      return;
    }

    try {
      const body = {
        employee_id: targetEmployeeId,
        reward_date: values.reward_date,
        reward_type: values.reward_type,
        amount: Number(values.amount),
        description: values.description,
        salary_slip_id: salarySlipId || undefined,
      };

      await createReward({ body }).unwrap();
      onSuccess();
    } catch (err: unknown) {
      console.error('Failed to create reward record', err);
      const apiErr = err as { data?: { detail?: string } };
      setApiError(apiErr?.data?.detail || 'Có lỗi xảy ra khi ghi nhận khen thưởng. Vui lòng kiểm tra lại.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={employee ? `Khen Thưởng Nhân Viên - ${employee.full_name}` : 'Ghi Nhận Khen Thưởng'}
      size="md"
      footer={
        <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isLoading}>
            Ghi nhận thưởng
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

        {!employee && (
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="employee_id">
              Nhân viên <span className={styles.required}>*</span>
            </label>
            <select
              id="employee_id"
              className={styles.select}
              {...register('employee_id')}
              disabled={isLoading || isEmployeesLoading}
            >
              <option value="">-- Chọn nhân viên --</option>
              {employeesData?.results?.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.employee_id} - {emp.full_name}
                </option>
              ))}
            </select>
            {errors.employee_id && <span className={styles.errorText}>{errors.employee_id.message}</span>}
          </div>
        )}

        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="reward_date">
              Ngày quyết định <span className={styles.required}>*</span>
            </label>
            <input
              id="reward_date"
              type="date"
              className={styles.input}
              {...register('reward_date')}
              disabled={isLoading}
            />
            {errors.reward_date && <span className={styles.errorText}>{errors.reward_date.message}</span>}
          </div>

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
              <option value="performance_bonus">Thưởng hiệu quả công việc</option>
              <option value="initiative">Thưởng sáng kiến/cải tiến</option>
              <option value="holiday_bonus">Thưởng lễ tết</option>
              <option value="other">Thưởng khác</option>
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

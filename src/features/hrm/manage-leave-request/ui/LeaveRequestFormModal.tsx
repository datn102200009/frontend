import React, { useEffect, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePostHrmLeaveRequestsCreateMutation, useGetHrmEmployeesQuery } from '@entities/hrm/api/hrmApi';
import type { Employee } from '@entities/hrm/model/types';
import { Modal } from '@shared/ui/Modal/Modal';
import { Button } from '@shared/ui/Button/Button';
import { DatePickerField } from '@shared/ui/DatePickerField/DatePickerField';
import { leaveRequestSchema, type LeaveRequestFormValues } from '../model/leave-request.schema';
import styles from './LeaveRequestFormModal.module.css';
import { Input } from '@shared/ui/Input/Input';
import { shiftDays } from '@shared/lib/dateLimits';

interface LeaveRequestFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employee?: Employee;
}

export const LeaveRequestFormModal: React.FC<LeaveRequestFormModalProps> = ({
  open,
  onClose,
  onSuccess,
  employee,
}) => {
  const [createLeaveRequest, { isLoading }] = usePostHrmLeaveRequestsCreateMutation();
  const { data: employeeResponse, isLoading: isLoadingEmployees } = useGetHrmEmployeesQuery({
    limit: 100,
  }, { skip: !!employee });

  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    control,
  } = useForm<LeaveRequestFormValues>({
    resolver: zodResolver(leaveRequestSchema) as unknown as Resolver<LeaveRequestFormValues>,
    defaultValues: {
      employee_id: employee?.id || '',
      leave_type: 'paid',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      days: 1,
      reason: '',
    },
  });

  const startDate = watch('start_date');

  const minStartDate = shiftDays(-30);
  const maxStartDate = shiftDays(365);
  const minEndDate = startDate || undefined;
  const maxEndDate = startDate ? shiftDays(365, startDate) : undefined;

  const endDate = watch('end_date');

  // Auto calculate days when dates change
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end >= start) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setValue('days', diffDays);
      } else {
        setValue('days', 0);
      }
    }
  }, [startDate, endDate, setValue]);

  useEffect(() => {
    if (open) {
      reset({
        employee_id: employee?.id || '',
        leave_type: 'paid',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        days: 1,
        reason: '',
      });
      setApiError(null);
    }
  }, [open, employee, reset]);

  const onSubmit = async (values: LeaveRequestFormValues) => {
    setApiError(null);
    const targetEmployeeId = employee?.id || values.employee_id;
    if (!targetEmployeeId) {
      setApiError('Vui lòng chọn nhân viên.');
      return;
    }

    try {
      const body = {
        employee_id: targetEmployeeId,
        leave_type: values.leave_type,
        start_date: values.start_date,
        end_date: values.end_date,
        days: Number(values.days),
        reason: values.reason?.trim() || undefined,
      };

      await createLeaveRequest({ body }).unwrap();
      onSuccess();
    } catch (err: unknown) {
      console.error('Failed to create leave request', err);
      const error = err as { data?: { detail?: string } };
      setApiError(error?.data?.detail || 'Có lỗi xảy ra khi tạo đơn nghỉ phép. Vui lòng kiểm tra lại.');
    }
  };

  const activeEmployees = React.useMemo(() => {
    if (!employeeResponse?.results) return [];
    return employeeResponse.results.filter((emp) => emp.employment_status === 'active');
  }, [employeeResponse]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={employee ? `Tạo Đơn Xin Nghỉ Phép - ${employee.full_name}` : 'Tạo Đơn Xin Nghỉ Phép'}
      size="md"
      footer={
        <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isLoading}>
            Gửi đơn phép
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
              Chọn nhân viên <span className={styles.required}>*</span>
            </label>
            <select
              id="employee_id"
              className={styles.select}
              {...register('employee_id')}
              disabled={isLoading || isLoadingEmployees}
            >
              <option value="">-- Chọn nhân viên --</option>
              {activeEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name} ({emp.employee_id})
                </option>
              ))}
            </select>
            {errors.employee_id && <span className={styles.errorText}>{errors.employee_id.message}</span>}
          </div>
        )}

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="leave_type">
            Loại nghỉ phép <span className={styles.required}>*</span>
          </label>
          <select
            id="leave_type"
            className={styles.select}
            {...register('leave_type')}
            disabled={isLoading}
          >
            <option value="paid">Nghỉ có lương</option>
            <option value="unpaid">Nghỉ không lương</option>
          </select>
        </div>

        <div className={styles.row}>
          <DatePickerField
            name="start_date"
            label="Từ ngày"
            control={control}
            error={errors.start_date?.message}
            required
            minDate={minStartDate}
            maxDate={maxStartDate}
            disabled={isLoading}
          />

          <DatePickerField
            name="end_date"
            label="Đến ngày"
            control={control}
            error={errors.end_date?.message}
            required
            minDate={minEndDate}
            maxDate={maxEndDate}
            disabled={isLoading}
          />
        </div>

        <Input
          id="days"
          type="number"
          label="Số ngày nghỉ thực tế"
          required={true}
          min={0.5}
          decimals={1}
          {...register('days')}
          disabled={isLoading}
          error={errors.days?.message}
        />

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="reason">
            Lý do xin nghỉ phép (Không bắt buộc)
          </label>
          <textarea
            id="reason"
            placeholder="Mô tả lý do nghỉ phép..."
            className={styles.textarea}
            {...register('reason')}
            disabled={isLoading}
          />
        </div>
      </form>
    </Modal>
  );
};

import React, { useEffect, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePostHrmDisciplinesMutation, useGetHrmEmployeesQuery } from '@entities/hrm/api/hrmApi';
import { DISCIPLINE_TYPE_OPTIONS } from '@shared/constants/hrmRewardDiscipline';
import type { Employee } from '@entities/hrm/model/types';
import { Modal } from '@shared/ui/Modal/Modal';
import { Button } from '@shared/ui/Button/Button';
import { DatePickerField } from '@shared/ui/DatePickerField/DatePickerField';
import { disciplineSchema, type DisciplineFormValues } from '../model/reward-discipline.schema';
import styles from './DisciplineFormModal.module.css';
import { Input } from '@shared/ui/Input/Input';
import { todayISO, shiftDays } from '@shared/lib/dateLimits';

interface DisciplineFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employee?: Employee;
  salarySlipId?: string;
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

  const { data: employeesData, isLoading: isEmployeesLoading } = useGetHrmEmployeesQuery(
    { status: 'active', limit: 100 },
    { skip: !!employee }
  );

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
      employee_id: employee?.id || '',
      incident_date: new Date().toISOString().split('T')[0],
      discipline_date: new Date().toISOString().split('T')[0],
      discipline_type: 'warning',
      description: '',
      penalty_amount: 0,
      file_url: '',
    },
  });

  const disciplineType = watch('discipline_type');
  const incidentDate = watch('incident_date');

  const minIncidentDate = employee?.join_date || shiftDays(-365);
  const maxIncidentDate = todayISO();
  const minDisciplineDate = incidentDate || undefined;
  const maxDisciplineDate = todayISO();

  useEffect(() => {
    if (open) {
      reset({
        employee_id: employee?.id || '',
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

  const onSubmit = async (values: DisciplineFormValues) => {
    setApiError(null);
    const targetEmployeeId = employee?.id || values.employee_id;
    if (!targetEmployeeId) {
      setApiError('Vui lòng chọn nhân viên.');
      return;
    }

    try {
      const body = {
        employee_id: targetEmployeeId,
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
    } catch (err: unknown) {
      console.error('Failed to create discipline record', err);
      const error = err as { data?: { detail?: string } };
      setApiError(error?.data?.detail || 'Có lỗi xảy ra khi ghi nhận kỷ luật. Vui lòng kiểm tra lại.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={employee ? `Ghi Nhận Kỷ Luật - ${employee.full_name}` : 'Ghi Nhận Kỷ Luật'}
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
          <DatePickerField
            name="incident_date"
            label="Ngày xảy ra sự việc"
            control={control}
            error={errors.incident_date?.message}
            required
            minDate={minIncidentDate}
            maxDate={maxIncidentDate}
            disabled={isLoading}
          />

          <DatePickerField
            name="discipline_date"
            label="Ngày quyết định"
            control={control}
            error={errors.discipline_date?.message}
            required
            minDate={minDisciplineDate}
            maxDate={maxDisciplineDate}
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

          {disciplineType === 'salary_deduction' && (
            <Input
              id="penalty_amount"
              type="number"
              label="Số tiền khấu trừ (VND)"
              required={true}
              min={0}
              decimals={0}
              {...register('penalty_amount')}
              disabled={isLoading}
              error={errors.penalty_amount?.message}
            />
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
            {...register('description')}
            disabled={isLoading}
          />
          {errors.description && <span className={styles.errorText}>{errors.description.message}</span>}
        </div>
      </form>
    </Modal>
  );
};

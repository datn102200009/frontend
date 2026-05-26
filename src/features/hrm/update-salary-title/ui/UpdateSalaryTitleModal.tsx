import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { usePostHrmEmployeesByIdUpdateSalaryTitleMutation } from '@entities/hrm/api/hrmApi';
import type { Employee } from '@entities/hrm/model/types';
import { Modal } from '@shared/ui/Modal/Modal';
import { Button } from '@shared/ui/Button/Button';
import styles from './UpdateSalaryTitleModal.module.css';

interface UpdateSalaryTitleModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employee: Employee;
}

interface FormValues {
  change_type: 'salary_change' | 'title_change' | 'department_transfer' | 'other';
  new_salary_base?: number;
  new_title?: string;
  new_department?: string;
  effective_date: string;
  reason: string;
}

export const UpdateSalaryTitleModal: React.FC<UpdateSalaryTitleModalProps> = ({
  open,
  onClose,
  onSuccess,
  employee,
}) => {
  const [updateSalaryTitle, { isLoading }] = usePostHrmEmployeesByIdUpdateSalaryTitleMutation();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<FormValues>({
    defaultValues: {
      change_type: 'salary_change',
      new_salary_base: Number(employee.salary_base) || 0,
      new_title: employee.position_title || '',
      new_department: employee.department || '',
      effective_date: new Date().toISOString().split('T')[0],
      reason: '',
    },
  });

  const changeType = watch('change_type');

  useEffect(() => {
    if (open && employee) {
      reset({
        change_type: 'salary_change',
        new_salary_base: Number(employee.salary_base) || 0,
        new_title: employee.position_title || '',
        new_department: employee.department || '',
        effective_date: new Date().toISOString().split('T')[0],
        reason: '',
      });
      setApiError(null);
    }
  }, [open, employee, reset]);

  const onSubmit = async (values: FormValues) => {
    setApiError(null);
    if (!employee.id) return;
    try {
      const payload: any = {
        change_type: values.change_type,
        effective_date: values.effective_date,
        reason: values.reason || undefined,
      };

      if (values.change_type === 'salary_change') {
        payload.new_salary_base = Number(values.new_salary_base);
      } else if (values.change_type === 'other') {
        const val = values.new_salary_base;
        if (typeof val === 'number' && !isNaN(val)) {
          payload.new_salary_base = val;
        }
      }


      if (values.change_type === 'title_change') {
        payload.new_title = values.new_title;
      } else if (values.change_type === 'other') {
        if (values.new_title && values.new_title.trim() !== '') {
          payload.new_title = values.new_title;
        }
      }

      if (values.change_type === 'department_transfer') {
        payload.new_department = values.new_department;
      } else if (values.change_type === 'other') {
        if (values.new_department && values.new_department.trim() !== '') {
          payload.new_department = values.new_department;
        }
      }


      await updateSalaryTitle({
        id: employee.id,
        body: payload,
      }).unwrap();
      onSuccess();
    } catch (err: any) {
      console.error('Failed to update salary/title', err);
      setApiError(err?.data?.detail || 'Có lỗi xảy ra khi thực hiện cập nhật. Vui lòng kiểm tra lại.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Điều Chỉnh Lương & Chức Danh - ${employee.employee_id || ''}`}
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
          <label className={styles.label} htmlFor="change_type">
            Loại điều chỉnh <span className={styles.required}>*</span>
          </label>
          <select id="change_type" className={styles.select} {...register('change_type')} disabled={isLoading}>
            <option value="salary_change">Thay đổi lương</option>
            <option value="title_change">Thay đổi chức danh</option>
            <option value="department_transfer">Điều chuyển phòng ban</option>
            <option value="other">Khác (Thay đổi nhiều thông tin)</option>
          </select>
        </div>

        {(changeType === 'salary_change' || changeType === 'other') && (
          <div className={styles.formGroup}>
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
                required: changeType === 'salary_change' ? 'Lương cơ bản mới là bắt buộc' : false,
                valueAsNumber: true,
                validate: (val) => {
                  if (changeType !== 'salary_change') return true;
                  return (val !== undefined && val !== null && !isNaN(val)) || 'Lương cơ bản mới là bắt buộc';
                }
              })}
              disabled={isLoading}
            />
            {errors.new_salary_base && <span className={styles.errorText}>{errors.new_salary_base.message}</span>}
          </div>
        )}

        {(changeType === 'title_change' || changeType === 'other') && (
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="new_title">
              Chức danh mới <span className={styles.required}>*</span>
            </label>
            <input
              id="new_title"
              type="text"
              placeholder="VD: Tech Lead"
              className={styles.input}
              {...register('new_title', {
                required: changeType === 'title_change' ? 'Chức danh mới là bắt buộc' : false,
              })}
              disabled={isLoading}
            />
            {errors.new_title && <span className={styles.errorText}>{errors.new_title.message}</span>}
          </div>
        )}

        {(changeType === 'department_transfer' || changeType === 'other') && (
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="new_department">
              Phòng ban mới <span className={styles.required}>*</span>
            </label>
            <input
              id="new_department"
              type="text"
              placeholder="VD: Phòng R&D"
              className={styles.input}
              {...register('new_department', {
                required: changeType === 'department_transfer' ? 'Phòng ban mới là bắt buộc' : false,
              })}
              disabled={isLoading}
            />
            {errors.new_department && <span className={styles.errorText}>{errors.new_department.message}</span>}
          </div>
        )}

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="effective_date">
            Ngày có hiệu lực <span className={styles.required}>*</span>
          </label>
          <input
            id="effective_date"
            type="date"
            className={styles.input}
            {...register('effective_date', { required: 'Ngày hiệu lực là bắt buộc' })}
            disabled={isLoading}
          />
          {errors.effective_date && <span className={styles.errorText}>{errors.effective_date.message}</span>}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="reason">Lý do điều chỉnh</label>
          <input
            id="reason"
            type="text"
            placeholder="VD: Tăng lương định kỳ hoặc chuyển công tác"
            className={styles.input}
            {...register('reason')}
            disabled={isLoading}
          />
        </div>
      </form>
    </Modal>
  );
};

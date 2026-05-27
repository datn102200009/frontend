import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { usePatchHrmEmployeesByIdUpdateMutation } from '@entities/hrm/api/hrmApi';
import type { Employee } from '@entities/hrm/model/types';
import { Modal } from '@shared/ui/Modal/Modal';
import { Button } from '@shared/ui/Button/Button';
import styles from './EmployeeFormModal.module.css';

interface EmployeeUpdateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employee: Employee;
}

interface EmployeeUpdateValues {
  full_name: string;
  phone: string;
  address: string;
  employment_status: 'active' | 'inactive';
}

export const EmployeeUpdateModal: React.FC<EmployeeUpdateModalProps> = ({
  open,
  onClose,
  onSuccess,
  employee,
}) => {
  const [updateEmployee, { isLoading }] = usePatchHrmEmployeesByIdUpdateMutation();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EmployeeUpdateValues>({
    defaultValues: {
      full_name: '',
      phone: '',
      address: '',
      employment_status: 'active',
    },
  });

  const [prevOpen, setPrevOpen] = useState(open);
  const [prevEmployee, setPrevEmployee] = useState(employee);

  if (open !== prevOpen || employee !== prevEmployee) {
    setPrevOpen(open);
    setPrevEmployee(employee);
    if (open) {
      setApiError(null);
    }
  }

  useEffect(() => {
    if (open && employee) {
      reset({
        full_name: employee.full_name || '',
        phone: employee.phone || '',
        address: employee.address || '',
        employment_status: employee.employment_status || 'active',
      });
    }
  }, [open, employee, reset]);

  const onSubmit = async (values: EmployeeUpdateValues) => {
    setApiError(null);
    if (!employee.id) return;
    try {
      await updateEmployee({
        id: employee.id,
        body: values,
      }).unwrap();
      onSuccess();
    } catch (err: unknown) {
      console.error('Failed to update employee', err);
      const error = err as { data?: { detail?: string } };
      setApiError(error?.data?.detail || 'Có lỗi xảy ra khi cập nhật hồ sơ. Vui lòng thử lại.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Chỉnh Sửa Hồ Sơ - ${employee.employee_id || ''}`}
      size="md"
      footer={
        <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isLoading}>
            Cập Nhật
          </Button>
        </div>
      }
    >
      <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
        {apiError && (
          <div className={styles.userSection} style={{ backgroundColor: 'var(--clr-error-bg)', borderColor: 'var(--clr-error)' }}>
            <span className={styles.errorText} style={{ fontSize: 'var(--fs-sm)' }}>{apiError}</span>
          </div>
        )}

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="update_full_name">
            Họ và tên <span className={styles.required}>*</span>
          </label>
          <input
            id="update_full_name"
            type="text"
            className={styles.input}
            {...register('full_name', { required: 'Họ tên là bắt buộc' })}
            disabled={isLoading}
          />
          {errors.full_name && <span className={styles.errorText}>{errors.full_name.message}</span>}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="update_phone">Số điện thoại</label>
          <input
            id="update_phone"
            type="text"
            className={styles.input}
            {...register('phone')}
            disabled={isLoading}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="update_address">Địa chỉ</label>
          <input
            id="update_address"
            type="text"
            className={styles.input}
            {...register('address')}
            disabled={isLoading}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="update_status">Trạng thái làm việc</label>
          <select
            id="update_status"
            className={styles.select}
            {...register('employment_status')}
            disabled={isLoading}
          >
            <option value="active">Đang làm việc (Active)</option>
            <option value="inactive">Đã nghỉ việc (Inactive)</option>
          </select>
        </div>
      </form>
    </Modal>
  );
};

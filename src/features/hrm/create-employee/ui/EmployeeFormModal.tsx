import React, { useState, useEffect } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePostHrmEmployeesCreateMutation } from '@entities/hrm/api/hrmApi';
import { useGetAccountsRolesQuery } from '@features/accounts/api/accountsApi';
import { Modal } from '@shared/ui/Modal/Modal';
import { Button } from '@shared/ui/Button/Button';
import { UserCheck } from 'lucide-react';
import { employeeSchema, type EmployeeFormValues } from '../model/employee.schema';
import styles from './EmployeeFormModal.module.css';

interface EmployeeFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({ open, onClose, onSuccess }) => {
  const [createEmployee, { isLoading }] = usePostHrmEmployeesCreateMutation();
  const { data: roles = [], isLoading: isLoadingRoles } = useGetAccountsRolesQuery();
  const [showUserFields, setShowUserFields] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema) as unknown as Resolver<EmployeeFormValues>,
    defaultValues: {
      employee_id: '',
      full_name: '',
      department: '',
      position_title: '',
      salary_base: 0,
      is_union_member: false,
      email: '',
      phone: '',
      gender: 'male',
      date_of_birth: '',
      address: '',
      join_date: new Date().toISOString().split('T')[0],
      create_user: false,
      role_id: '',
      username: '',
      password: '',
    },
  });

  // Set default role_id once roles are loaded
  useEffect(() => {
    if (roles.length > 0) {
      const employeeRole = roles.find(r => r.name === 'Employee' || r.name?.toLowerCase().includes('nhân viên'));
      const defaultRoleId = employeeRole?.id || roles[0].id;
      setValue('role_id', defaultRoleId);
    }
  }, [roles, setValue]);

  const watchCreateUser = watch('create_user');

  useEffect(() => {
    setShowUserFields(watchCreateUser);
  }, [watchCreateUser]);

  useEffect(() => {
    if (open) {
      reset();
      setApiError(null);
    }
  }, [open, reset]);

  const onSubmit = async (values: EmployeeFormValues) => {
    setApiError(null);
    try {
      const payload = {
        employee_id: values.employee_id,
        full_name: values.full_name,
        department: values.department || undefined,
        position_title: values.position_title || undefined,
        salary_base: typeof values.salary_base === 'number' && !isNaN(values.salary_base) ? values.salary_base : undefined,
        is_union_member: values.is_union_member,
        email: values.email || undefined,
        phone: values.phone || undefined,
        gender: values.gender || undefined,
        date_of_birth: values.date_of_birth || undefined,
        address: values.address || undefined,
        join_date: values.join_date || undefined,
        create_user: values.create_user,
        username: values.create_user ? values.username : undefined,
        password: values.create_user ? values.password : undefined,
        role_id: values.create_user ? values.role_id : undefined,
      };

      await createEmployee({ body: payload }).unwrap();
      onSuccess();
    } catch (err: unknown) {
      console.error('Failed to create employee', err);
      const error = err as { data?: { detail?: string; errors?: { detail?: string } } };
      setApiError(error?.data?.detail || error?.data?.errors?.detail || 'Có lỗi xảy ra khi tạo nhân viên. Vui lòng thử lại.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Thêm Nhân Viên Mới"
      size="lg"
      footer={
        <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isLoading}>
            Lưu nhân sự
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

        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="employee_id">
              Mã nhân viên <span className={styles.required}>*</span>
            </label>
            <input
              id="employee_id"
              type="text"
              placeholder="VD: NV001"
              className={styles.input}
              {...register('employee_id')}
              disabled={isLoading}
            />
            {errors.employee_id && <span className={styles.errorText}>{errors.employee_id.message}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="full_name">
              Họ và tên <span className={styles.required}>*</span>
            </label>
            <input
              id="full_name"
              type="text"
              placeholder="VD: Nguyễn Văn A"
              className={styles.input}
              {...register('full_name')}
              disabled={isLoading}
            />
            {errors.full_name && <span className={styles.errorText}>{errors.full_name.message}</span>}
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="department">Phòng ban</label>
            <input
              id="department"
              type="text"
              placeholder="VD: Phòng Hành chính Nhân sự"
              className={styles.input}
              {...register('department')}
              disabled={isLoading}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="position_title">Chức vụ</label>
            <input
              id="position_title"
              type="text"
              placeholder="VD: Chuyên viên Tuyển dụng"
              className={styles.input}
              {...register('position_title')}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="salary_base">Lương cơ bản (VND)</label>
            <input
              id="salary_base"
              type="number"
              min={0}
              step={100000}
              placeholder="VD: 10000000"
              className={styles.input}
              {...register('salary_base')}
              disabled={isLoading}
            />
            {errors.salary_base && <span className={styles.errorText}>{errors.salary_base.message}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="gender">Giới tính</label>
            <select id="gender" className={styles.select} {...register('gender')} disabled={isLoading}>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </select>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="email">Email</label>
            <input
              id="email"
              type="text"
              placeholder="VD: name@company.com"
              className={styles.input}
              {...register('email')}
              disabled={isLoading}
            />
            {errors.email && <span className={styles.errorText}>{errors.email.message}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="phone">Số điện thoại</label>
            <input
              id="phone"
              type="text"
              placeholder="VD: 0901234567"
              className={styles.input}
              {...register('phone')}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="date_of_birth">Ngày sinh</label>
            <input
              id="date_of_birth"
              type="date"
              className={styles.input}
              {...register('date_of_birth')}
              disabled={isLoading}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="join_date">Ngày vào làm</label>
            <input
              id="join_date"
              type="date"
              className={styles.input}
              {...register('join_date')}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="address">Địa chỉ thường trú</label>
          <input
            id="address"
            type="text"
            placeholder="VD: Số 12, ngõ 34, đường ABC, Hà Nội"
            className={styles.input}
            {...register('address')}
            disabled={isLoading}
          />
        </div>

        <div className={styles.checkboxGroup}>
          <input
            id="is_union_member"
            type="checkbox"
            className={styles.checkbox}
            {...register('is_union_member')}
            disabled={isLoading}
          />
          <label htmlFor="is_union_member" className={styles.checkboxLabel}>
            Là Đoàn viên Công đoàn (trích nộp phí công đoàn 2%)
          </label>
        </div>

        <hr className={styles.sectionDivider} />

        <div className={styles.checkboxGroup}>
          <input
            id="create_user"
            type="checkbox"
            className={styles.checkbox}
            {...register('create_user')}
            disabled={isLoading}
          />
          <label htmlFor="create_user" className={styles.checkboxLabel}>
            Tạo tài khoản đăng nhập hệ thống đi kèm cho nhân sự
          </label>
        </div>

        {showUserFields && (
          <div className={styles.userSection}>
            <h4 className={styles.sectionTitle}>
              <UserCheck size={16} color="var(--clr-primary)" />
              Thông Tin Tài Khoản Đăng Nhập
            </h4>
            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="username">
                  Tên đăng nhập <span className={styles.required}>*</span>
                </label>
                <input
                  id="username"
                  type="text"
                  placeholder="VD: nguyenvanan"
                  className={styles.input}
                  {...register('username')}
                  disabled={isLoading}
                />
                {errors.username && <span className={styles.errorText}>{errors.username.message}</span>}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="password">
                  Mật khẩu <span className={styles.required}>*</span>
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Nhập mật khẩu tài khoản"
                  className={styles.input}
                  {...register('password')}
                  disabled={isLoading}
                />
                {errors.password && <span className={styles.errorText}>{errors.password.message}</span>}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="role_id">
                Vai trò truy cập hệ thống <span className={styles.required}>*</span>
              </label>
              <select
                id="role_id"
                className={styles.select}
                {...register('role_id')}
                disabled={isLoading || isLoadingRoles}
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name === 'Admin' ? 'Quản trị viên (Admin)' : role.name === 'Employee' ? 'Nhân viên (Employee)' : role.name}
                  </option>
                ))}
              </select>
              {errors.role_id && <span className={styles.errorText}>{errors.role_id.message}</span>}
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};

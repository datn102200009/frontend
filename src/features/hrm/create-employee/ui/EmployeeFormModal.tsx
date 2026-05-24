import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { usePostHrmEmployeesCreateMutation } from '@entities/hrm/api/hrmApi';
import { useGetAccountsRolesQuery } from '@features/accounts/api/accountsApi';
import { Modal } from '@shared/ui/Modal/Modal';
import { Button } from '@shared/ui/Button/Button';
import { UserCheck } from 'lucide-react';
import styles from './EmployeeFormModal.module.css';


interface EmployeeFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Form values type matching the API body definition
interface EmployeeFormValues {
  employee_id: string;
  full_name: string;
  department: string;
  position_title: string;
  salary_base: number;
  is_union_member: boolean;
  email: string;
  phone: string;
  gender: 'male' | 'female' | 'other';
  date_of_birth: string;
  address: string;
  join_date: string;
  create_user: boolean;
  username?: string;
  password?: string;
  role_id?: string;
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
      const payload: any = {
        employee_id: values.employee_id,
        full_name: values.full_name,
        department: values.department || undefined,
        position_title: values.position_title || undefined,
        salary_base: Number(values.salary_base) || undefined,
        is_union_member: values.is_union_member,
        email: values.email || undefined,
        phone: values.phone || undefined,
        gender: values.gender || undefined,
        date_of_birth: values.date_of_birth || undefined,
        address: values.address || undefined,
        join_date: values.join_date || undefined,
        create_user: values.create_user,
      };

      if (values.create_user) {
        payload.username = values.username;
        payload.password = values.password;
        payload.role_id = values.role_id;
      }

      await createEmployee({ body: payload }).unwrap();
      onSuccess();
    } catch (err: any) {
      console.error('Failed to create employee', err);
      setApiError(err?.data?.detail || err?.data?.errors?.detail || 'Có lỗi xảy ra khi tạo nhân viên. Vui lòng thử lại.');
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
              {...register('employee_id', { required: 'Mã nhân viên là bắt buộc' })}
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
              {...register('full_name', { required: 'Họ tên là bắt buộc' })}
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
              {...register('salary_base', { valueAsNumber: true })}
              disabled={isLoading}
            />
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
              type="email"
              placeholder="VD: name@company.com"
              className={styles.input}
              {...register('email', {
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Địa chỉ email không hợp lệ',
                },
              })}
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
                  {...register('username', {
                    required: watchCreateUser ? 'Tên đăng nhập là bắt buộc' : false,
                  })}
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
                  {...register('password', {
                    required: watchCreateUser ? 'Mật khẩu là bắt buộc' : false,
                    minLength: {
                      value: 6,
                      message: 'Mật khẩu phải chứa ít nhất 6 ký tự',
                    },
                  })}
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
                {...register('role_id', {
                  required: watchCreateUser ? 'Vai trò là bắt buộc' : false,
                })}
                disabled={isLoading || isLoadingRoles}
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name === 'Admin' ? 'Quản trị viên (Admin)' : role.name === 'Employee' ? 'Nhân viên (Employee)' : role.name}
                  </option>
                ))}
              </select>

            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};

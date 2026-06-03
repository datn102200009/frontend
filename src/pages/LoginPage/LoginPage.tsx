import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { ClipboardList, Factory } from 'lucide-react';
import { loginSuccess } from '@features/auth/model/authSlice';
import { usePostAccountsAuthLoginMutation } from '@features/accounts/api/accountsApi';
import { useToast } from '@shared/ui/Toast/Toast';
import { Button } from '@shared/ui/Button/Button';
import { Input } from '@shared/ui/Input/Input';
import type { LoginPayload } from '@features/auth/model/types';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [error, setError] = useState('');
  const [login, { isLoading }] = usePostAccountsAuthLoginMutation();
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginPayload>({
    defaultValues: { username: '', password: '' },
  });

  const onSubmit = async (data: LoginPayload) => {
    setError('');
    try {
      const res = await login({ body: data }).unwrap();
      const user = {
        id: res.user_id || '',
        username: res.username || '',
        full_name: res.username || '',
        role: (res.role || 'staff') as 'admin' | 'manager' | 'staff',
        permissions: res.permissions || []
      };
      dispatch(loginSuccess({ user, token: res.access || '', refresh: res.refresh }));
      toast('success', 'Đăng nhập thành công');
      navigate('/dashboard', { replace: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err?.data?.error || err?.data?.detail || 'Sai tài khoản hoặc mật khẩu.');
    }
  };

  return (
    <div className={styles.page}>
      {/* Left — Branding Panel */}
      <div className={styles.brandPanel}>
        <div className={styles.brandContent}>
          <div className={styles.brandIcon}>
            <Factory size={48} strokeWidth={1.4} />
          </div>
          <h2 className={styles.brandTitle}>Xuân Hòa</h2>
          <p className={styles.brandTagline}>Hệ Thống Quản Lý Sản Xuất</p>
          <div className={styles.brandDivider} />
          <p className={styles.brandDesc}>
            Quản lý kho bãi, định mức sản phẩm và lệnh sản xuất tập trung trên một nền tảng duy nhất.
          </p>
        </div>
        {/* Decorative geometric shapes */}
        <div className={styles.deco1} aria-hidden="true" />
        <div className={styles.deco2} aria-hidden="true" />
        <div className={styles.deco3} aria-hidden="true" />
      </div>

      {/* Right — Login Form */}
      <div className={styles.formPanel}>
        <div className={styles.formContainer}>
          <div className={styles.formHeader}>
            <div className={styles.logoMobile}>
              <ClipboardList size={28} />
              <span>Xuân Hòa ERP</span>
            </div>
            <h1 className={styles.formTitle}>Đăng nhập</h1>
            <p className={styles.formSubtitle}>Nhập thông tin tài khoản để truy cập hệ thống</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
            {error && (
              <div className={styles.formError} role="alert">
                {error}
              </div>
            )}

            <Input
              label="Tên đăng nhập"
              placeholder="admin"
              autoComplete="username"
              required
              error={errors.username?.message}
              {...register('username', { required: 'Vui lòng nhập tên đăng nhập' })}
            />

            <Input
              label="Mật khẩu"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              error={errors.password?.message}
              {...register('password', { required: 'Vui lòng nhập mật khẩu' })}
            />

            <Button type="submit" variant="primary" size="lg" loading={isLoading}>
              Đăng nhập
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

import { Navigate, Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import type { RootState } from './store';
import { MainLayout } from '@widgets/Layout/MainLayout';
import { useGetAccountsAuthMeQuery } from '@features/accounts/api/accountsApi';
import { logout } from '@features/auth/model/authSlice';

export function AuthGuard() {
  const isAuth = useSelector((s: RootState) => s.auth.isAuthenticated);
  const dispatch = useDispatch();

  const { error, isLoading } = useGetAccountsAuthMeQuery(undefined, {
    skip: !isAuth,
  });

  useEffect(() => {
    if (error) {
      const err = error as any;
      if (err.status === 401) {
        dispatch(logout());
      }
    }
  }, [error, dispatch]);

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
}

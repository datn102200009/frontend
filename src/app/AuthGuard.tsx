import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from './store';
import { MainLayout } from '@widgets/Layout/MainLayout';

export function AuthGuard() {
  const isAuth = useSelector((s: RootState) => s.auth.isAuthenticated);

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
}

import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthGuard } from './AuthGuard';

/* Lazy load pages for bundle splitting */
const LoginPage = lazy(() => import('../pages/LoginPage/LoginPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage/DashboardPage'));
const BomPage = lazy(() => import('../pages/BomPage/BomPage'));
const InventoryPage = lazy(() => import('../pages/InventoryPage/InventoryPage'));

function PageLoader() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      color: 'var(--clr-text-muted)',
      fontFamily: 'var(--font-heading)',
      fontSize: 'var(--fs-sm)',
    }}>
      Đang tải...
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <Suspense fallback={<PageLoader />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: '/',
    element: <AuthGuard />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        path: 'dashboard',
        element: (
          <Suspense fallback={<PageLoader />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'bom',
        element: (
          <Suspense fallback={<PageLoader />}>
            <BomPage />
          </Suspense>
        ),
      },
      {
        path: 'inventory',
        element: (
          <Suspense fallback={<PageLoader />}>
            <InventoryPage />
          </Suspense>
        ),
      },
    ],
  },
]);

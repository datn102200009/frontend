/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthGuard } from './AuthGuard';
import { PermissionGuard } from '../shared/ui/PermissionGuard/PermissionGuard';

const ForbiddenPage = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: '1rem',
    color: 'var(--clr-text-muted)',
    fontFamily: 'var(--font-heading)',
  }}>
    <h1 style={{ fontSize: '3rem', color: '#ff4d4f', margin: 0 }}>403</h1>
    <p style={{ fontSize: 'var(--fs-md)', margin: 0 }}>Bạn không có quyền truy cập trang này.</p>
  </div>
);

/* Lazy load pages for bundle splitting */
const LoginPage = lazy(() => import('../pages/LoginPage/LoginPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage/DashboardPage'));
const BomPage = lazy(() => import('../pages/BomPage/BomPage'));
const InventoryPage = lazy(() => import('../pages/InventoryPage/InventoryPage'));
const PurchasingPage = lazy(() => import('../pages/purchasing/PurchasingPage'));
const SalesPage = lazy(() => import('../pages/sales/SalesPage'));
const FinancePage = lazy(() => import('../pages/finance/FinancePage'));
const FixedAssetsPage = lazy(() => import('../pages/finance/assets/FixedAssetsPage').then(m => ({ default: m.FixedAssetsPage })));
const CustomersPage = lazy(() => import('../pages/crm/CustomersPage'));
const SuppliersPage = lazy(() => import('../pages/procurement/SuppliersPage'));
const HrmPage = lazy(() => import('../pages/hrm/HrmPage'));

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
            <PermissionGuard requiredPermission="manufacturing.bom_view" fallback={<ForbiddenPage />}>
              <BomPage />
            </PermissionGuard>
          </Suspense>
        ),
      },
      {
        path: 'inventory',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PermissionGuard requiredPermission="inventory.view" fallback={<ForbiddenPage />}>
              <InventoryPage />
            </PermissionGuard>
          </Suspense>
        ),
      },
      {
        path: 'purchasing',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PermissionGuard requiredPermission="purchasing.view_order" fallback={<ForbiddenPage />}>
              <PurchasingPage />
            </PermissionGuard>
          </Suspense>
        ),
      },
      {
        path: 'sales',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PermissionGuard requiredPermission="sales.view_order" fallback={<ForbiddenPage />}>
              <SalesPage />
            </PermissionGuard>
          </Suspense>
        ),
      },
      {
        path: 'finance',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PermissionGuard requiredPermission="finance.view_cash_flow" fallback={<ForbiddenPage />}>
              <FinancePage />
            </PermissionGuard>
          </Suspense>
        ),
      },
      {
        path: 'finance/fixed-assets',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PermissionGuard requiredPermission="finance.view_fixed_asset" fallback={<ForbiddenPage />}>
              <FixedAssetsPage />
            </PermissionGuard>
          </Suspense>
        ),
      },
      {
        path: 'customers',
        element: (
          <Suspense fallback={<PageLoader />}>
            <CustomersPage />
          </Suspense>
        ),
      },
      {
        path: 'suppliers',
        element: (
          <Suspense fallback={<PageLoader />}>
            <SuppliersPage />
          </Suspense>
        ),
      },
      {
        path: 'hrm',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PermissionGuard requiredPermission="hrm.view_employee" fallback={<ForbiddenPage />}>
              <HrmPage />
            </PermissionGuard>
          </Suspense>
        ),
      },
    ],
  },
]);

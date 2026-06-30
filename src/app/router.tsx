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
const WorkOrdersPage = lazy(() => import('../pages/manufacturing/WorkOrdersPage'));
const InventoryPage = lazy(() => import('../pages/InventoryPage/InventoryPage'));
const PurchasingPage = lazy(() => import('../pages/purchasing/PurchasingPage'));
const SalesPage = lazy(() => import('../pages/sales/SalesPage'));
const FinancePage = lazy(() => import('../pages/finance/FinancePage'));
const InvoicesPage = lazy(() => import('../pages/finance/InvoicesPage'));
const FixedAssetsPage = lazy(() => import('../pages/finance/assets/FixedAssetsPage').then(m => ({ default: m.FixedAssetsPage })));
const CustomersPage = lazy(() => import('../pages/crm/CustomersPage'));
const SuppliersPage = lazy(() => import('../pages/procurement/SuppliersPage'));
const HrmPage = lazy(() => import('../pages/hrm/HrmPage'));
const EmployeesPage = lazy(() => import('../pages/hrm/employees/EmployeesPage'));
const AttendanceLeavePage = lazy(() => import('../pages/hrm/attendance-leave/AttendanceLeavePage'));
const RewardsDisciplinesPage = lazy(() => import('../pages/hrm/rewards-disciplines/RewardsDisciplinesPage'));
const HolidaysPage = lazy(() => import('../pages/hrm/holidays/HolidaysPage'));
const PayrollPage = lazy(() => import('../pages/hrm/payroll/PayrollPage'));
const AccountsPage = lazy(() => import('../pages/accounts/AccountsPage'));
const SystemLogsPage = lazy(() => import('../pages/accounts/SystemLogsPage').then(m => ({ default: m.SystemLogsPage })));

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
        path: 'work-orders',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PermissionGuard requiredPermission="manufacturing.work_order_view" fallback={<ForbiddenPage />}>
              <WorkOrdersPage />
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
        path: 'invoices',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PermissionGuard requiredPermissions={['finance.pay_invoice', 'finance.collect_sales_invoice']} operator="OR" fallback={<ForbiddenPage />}>
              <InvoicesPage />
            </PermissionGuard>
          </Suspense>
        ),
      },
      {
        path: 'fixed-assets',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PermissionGuard requiredPermission="finance.view_fixed_asset" fallback={<ForbiddenPage />}>
              <FixedAssetsPage />
            </PermissionGuard>
          </Suspense>
        ),
      },
      {
        path: 'finance/invoices',
        element: <Navigate to="/invoices" replace />,
      },
      {
        path: 'finance/fixed-assets',
        element: <Navigate to="/fixed-assets" replace />,
      },
      {
        path: 'customers',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PermissionGuard requiredPermission="crm.customer_view" fallback={<ForbiddenPage />}>
              <CustomersPage />
            </PermissionGuard>
          </Suspense>
        ),
      },
      {
        path: 'suppliers',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PermissionGuard requiredPermission="procurement.supplier_view" fallback={<ForbiddenPage />}>
              <SuppliersPage />
            </PermissionGuard>
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
      {
        path: 'hrm/employees',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PermissionGuard requiredPermission="hrm.view_employee" fallback={<ForbiddenPage />}>
              <EmployeesPage />
            </PermissionGuard>
          </Suspense>
        ),
      },
      {
        path: 'hrm/attendance-leave',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PermissionGuard requiredPermissions={['hrm.view_attendance', 'hrm.view_leaverequest']} operator="OR" fallback={<ForbiddenPage />}>
              <AttendanceLeavePage />
            </PermissionGuard>
          </Suspense>
        ),
      },
      {
        path: 'hrm/rewards-disciplines',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PermissionGuard requiredPermissions={['hrm.view_rewardrecord', 'hrm.view_disciplinerecord']} operator="OR" fallback={<ForbiddenPage />}>
              <RewardsDisciplinesPage />
            </PermissionGuard>
          </Suspense>
        ),
      },
      {
        path: 'hrm/holidays',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PermissionGuard requiredPermission="hrm.view_publicholiday" fallback={<ForbiddenPage />}>
              <HolidaysPage />
            </PermissionGuard>
          </Suspense>
        ),
      },
      {
        path: 'hrm/payroll',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PermissionGuard requiredPermission="finance.view_salaryslip" fallback={<ForbiddenPage />}>
              <PayrollPage />
            </PermissionGuard>
          </Suspense>
        ),
      },
      {
        path: 'accounts',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PermissionGuard requiredPermission="accounts.view_user" fallback={<ForbiddenPage />}>
              <AccountsPage />
            </PermissionGuard>
          </Suspense>
        ),
      },
      {
        path: 'system-log',
        element: (
          <Suspense fallback={<PageLoader />}>
            <SystemLogsPage />
          </Suspense>
        ),
      },
    ],
  },
]);

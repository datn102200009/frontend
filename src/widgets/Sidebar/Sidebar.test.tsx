import { screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Sidebar } from './Sidebar';
import { renderWithProviders } from '@shared/lib/test/test-utils';

const mockAdminUser = {
  id: 'user-admin',
  username: 'admin',
  full_name: 'Quản Trị Viên',
  role: 'admin' as const,
  permissions: [
    'manufacturing.bom_view',
    'manufacturing.work_order_view',
    'inventory.view',
    'purchasing.view_order',
    'sales.view_order',
    'crm.customer_view',
    'procurement.supplier_view',
    'finance.view_cash_flow',
    'finance.pay_invoice',
    'finance.collect_sales_invoice',
    'finance.view_fixed_asset',
    'hrm.view_employee',
    'hrm.view_attendance',
    'hrm.view_leaverequest',
    'hrm.view_rewarddiscipline',
    'hrm.view_publicholiday',
    'finance.view_salaryslip',
  ],
};

const mockStaffUser = {
  id: 'user-staff',
  username: 'staff',
  full_name: 'Nhân Viên Kho',
  role: 'staff' as const,
  permissions: [
    'inventory.view',
  ],
};

const mockNoPermissionUser = {
  id: 'user-guest',
  username: 'guest',
  full_name: 'Khách',
  role: 'staff' as const,
  permissions: [],
};

describe('Sidebar Component', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
  };

  it('renders all sections and links for admin user', () => {
    renderWithProviders(<Sidebar {...defaultProps} />, {
      preloadedState: {
        auth: {
          user: mockAdminUser,
          token: 'mock-token',
          isAuthenticated: true,
        },
      },
    });

    // Verify sections and links
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('BOM')).toBeInTheDocument();
    expect(screen.getByText('Lệnh Sản Xuất')).toBeInTheDocument();
    expect(screen.getByText('Kho')).toBeInTheDocument();
    expect(screen.getByText('Mua Hàng')).toBeInTheDocument();
    expect(screen.getByText('Bán Hàng')).toBeInTheDocument();
    expect(screen.getByText('Khách Hàng')).toBeInTheDocument();
    expect(screen.getByText('Nhà Cung Cấp')).toBeInTheDocument();
    expect(screen.getByText('Dòng Tiền')).toBeInTheDocument();
    expect(screen.getByText('Hoá Đơn Mua/Bán')).toBeInTheDocument();
    expect(screen.getByText('Tài Sản Cố Định')).toBeInTheDocument();
    expect(screen.getByText('Nhân Viên')).toBeInTheDocument();
    expect(screen.getByText('Chấm Công & Nghỉ Phép')).toBeInTheDocument();
    expect(screen.getByText('Khen Thưởng & Kỷ Luật')).toBeInTheDocument();
    expect(screen.getByText('Ngày Nghỉ Lễ')).toBeInTheDocument();
    expect(screen.getByText('Bảng Lương')).toBeInTheDocument();

    // Verify group headers
    expect(screen.getByText('Tổng Quan')).toBeInTheDocument();
    expect(screen.getByText('Sản Xuất')).toBeInTheDocument();
    expect(screen.getByText('Kho Bãi')).toBeInTheDocument();
    expect(screen.getByText('Thương Mại')).toBeInTheDocument();
    expect(screen.getByText('Đối Tác')).toBeInTheDocument();
    expect(screen.getByText('Tài Chính')).toBeInTheDocument();
    expect(screen.getByText('Nhân Sự')).toBeInTheDocument();
  });

  it('filters out unauthorized links and section headers for staff with limited permissions', () => {
    renderWithProviders(<Sidebar {...defaultProps} />, {
      preloadedState: {
        auth: {
          user: mockStaffUser,
          token: 'mock-token',
          isAuthenticated: true,
        },
      },
    });

    // Allowed
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Kho')).toBeInTheDocument();
    expect(screen.getByText('Kho Bãi')).toBeInTheDocument();

    // Hidden links
    expect(screen.queryByText('BOM')).not.toBeInTheDocument();
    expect(screen.queryByText('Lệnh Sản Xuất')).not.toBeInTheDocument();
    expect(screen.queryByText('Mua Hàng')).not.toBeInTheDocument();
    expect(screen.queryByText('Bán Hàng')).not.toBeInTheDocument();
    expect(screen.queryByText('Khách Hàng')).not.toBeInTheDocument();
    expect(screen.queryByText('Nhà Cung Cấp')).not.toBeInTheDocument();
    expect(screen.queryByText('Dòng Tiền')).not.toBeInTheDocument();
    expect(screen.queryByText('Hoá Đơn Mua/Bán')).not.toBeInTheDocument();
    expect(screen.queryByText('Tài Sản Cố Định')).not.toBeInTheDocument();
    expect(screen.queryByText('Nhân Viên')).not.toBeInTheDocument();

    // Hidden headers
    expect(screen.queryByText('Sản Xuất')).not.toBeInTheDocument();
    expect(screen.queryByText('Thương Mại')).not.toBeInTheDocument();
    expect(screen.queryByText('Đối Tác')).not.toBeInTheDocument();
    expect(screen.queryByText('Tài Chính')).not.toBeInTheDocument();
    expect(screen.queryByText('Nhân Sự')).not.toBeInTheDocument();
  });

  it('renders only Dashboard when user has no permissions', () => {
    renderWithProviders(<Sidebar {...defaultProps} />, {
      preloadedState: {
        auth: {
          user: mockNoPermissionUser,
          token: 'mock-token',
          isAuthenticated: true,
        },
      },
    });

    // Allowed
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Tổng Quan')).toBeInTheDocument();

    // All other tabs and headers should be hidden
    expect(screen.queryByText('Kho Bãi')).not.toBeInTheDocument();
    expect(screen.queryByText('Kho')).not.toBeInTheDocument();
    expect(screen.queryByText('Sản Xuất')).not.toBeInTheDocument();
    expect(screen.queryByText('BOM')).not.toBeInTheDocument();
    expect(screen.queryByText('Lệnh Sản Xuất')).not.toBeInTheDocument();
    expect(screen.queryByText('Thương Mại')).not.toBeInTheDocument();
    expect(screen.queryByText('Mua Hàng')).not.toBeInTheDocument();
    expect(screen.queryByText('Bán Hàng')).not.toBeInTheDocument();
  });
});

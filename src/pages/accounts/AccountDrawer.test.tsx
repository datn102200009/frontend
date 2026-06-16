import { screen } from '@testing-library/react';
import { AccountDrawer } from './AccountDrawer';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import { server } from '@shared/lib/test/server';
import { http, HttpResponse } from 'msw';

const mockUser = {
  id: 'user-uuid-1',
  username: 'user_mfg',
  employee_id: 'TST-MFG',
  employee_name: 'Test Mfg',
  direct_permissions: ['finance.view_cash_flow'],
  all_permissions: ['finance.view_cash_flow', 'crm.customer_view'],
  is_active: true,
  created_at: '2026-06-16T18:00:00Z',
};

describe('AccountDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders AccountDrawer in edit mode with user details and permission groups', async () => {
    server.use(
      http.get('*/api/v1/accounts/permissions/', () => {
        return HttpResponse.json([
          { code: 'accounts.view_user', name: 'Xem tài khoản' },
          { code: 'crm.customer_view', name: 'Xem Khách Hàng' },
          { code: 'finance.view_cash_flow', name: 'Xem Dòng Tiền' },
          { code: 'hrm.view_employee', name: 'Xem Nhân Viên' },
          { code: 'master_data.view_item', name: 'Xem sản phẩm' }
        ]);
      })
    );

    renderWithProviders(
      <AccountDrawer
        open={true}
        onClose={() => {}}
        onSuccess={() => {}}
        userToEdit={mockUser}
      />
    );

    // Verify permission groups are loaded and rendered
    const titleElem = await screen.findByText('Hệ Thống & Tài Khoản (Accounts)');
    expect(titleElem).toBeInTheDocument();

    expect(screen.getByText('Quản lý Khách Hàng (CRM)')).toBeInTheDocument();
    expect(screen.getByText('Quản lý Tài chính (Finance)')).toBeInTheDocument();
    expect(screen.getByText('Quản lý Nhân Sự (HRM)')).toBeInTheDocument();
    expect(screen.getByText('Dữ liệu nền (Master Data)')).toBeInTheDocument();

    // Verify permission child items are loaded and rendered
    expect(screen.getByText('Xem tài khoản')).toBeInTheDocument();
    expect(screen.getByText('Xem Khách Hàng')).toBeInTheDocument();
    expect(screen.getByText('Xem Dòng Tiền')).toBeInTheDocument();
    expect(screen.getByText('Xem Nhân Viên')).toBeInTheDocument();
    expect(screen.getByText('Xem sản phẩm')).toBeInTheDocument();

    // Verify checked status based on all_permissions
    const cashFlowCheckbox = screen.getByLabelText('Xem Dòng Tiền') as HTMLInputElement;
    const customerCheckbox = screen.getByLabelText('Xem Khách Hàng') as HTMLInputElement;
    const userCheckbox = screen.getByLabelText('Xem tài khoản') as HTMLInputElement;

    expect(cashFlowCheckbox.checked).toBe(true);
    expect(customerCheckbox.checked).toBe(true);
    expect(userCheckbox.checked).toBe(false);
  });
});

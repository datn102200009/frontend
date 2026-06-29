import { screen, waitFor, within, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccountModal } from './AccountModal';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import { server } from '@shared/lib/test/server';
import { http, HttpResponse } from 'msw';
import { vi } from 'vitest';

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

const mockPermissions = [
  { code: 'accounts.view_user', name: 'Xem tài khoản' },
  { code: 'accounts.add_user', name: 'Thêm tài khoản' },
  { code: 'crm.customer_view', name: 'Xem Khách Hàng' },
  { code: 'finance.view_cash_flow', name: 'Xem Dòng Tiền' },
  { code: 'hrm.view_employee', name: 'Xem Nhân Viên' },
  { code: 'master_data.view_item', name: 'Xem sản phẩm' },
];

const mockUnlinkedEmployees = [
  { employee_id: 'EMP-001', full_name: 'Nguyen Van A' },
  { employee_id: 'EMP-002', full_name: 'Tran Thi B' },
];

describe('AccountModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock APIs
    server.use(
      http.get('*/api/v1/accounts/permissions/', () => {
        return HttpResponse.json(mockPermissions);
      }),
      http.get('*/api/v1/accounts/users/unlinked-employees/', () => {
        return HttpResponse.json(mockUnlinkedEmployees);
      })
    );
  });

  afterEach(() => {
    cleanup();
  });

  // 1. Render Modal ở edit mode
  it('renders AccountModal in edit mode with user details and correct checked permissions', async () => {
    renderWithProviders(
      <AccountModal
        open={true}
        onClose={() => {}}
        onSuccess={() => {}}
        userToEdit={mockUser}
      />
    );

    // Verify Title
    expect(await screen.findByText('Cập Nhật Tài Khoản')).toBeInTheDocument();

    // Verify info box
    expect(screen.getByText('user_mfg')).toBeInTheDocument();
    expect(screen.getByText('Test Mfg (TST-MFG)')).toBeInTheDocument();

    // Verify checked permissions based on all_permissions
    const cashFlowCheckbox = await screen.findByLabelText('Xem Dòng Tiền') as HTMLInputElement;
    const customerCheckbox = screen.getByLabelText('Xem Khách Hàng') as HTMLInputElement;
    const userCheckbox = screen.getByLabelText('Xem tài khoản') as HTMLInputElement;

    expect(cashFlowCheckbox.checked).toBe(true);
    expect(customerCheckbox.checked).toBe(true);
    expect(userCheckbox.checked).toBe(false);
  });

  // 2. Render Modal ở create mode
  it('renders AccountModal in create mode with employee select and inputs', async () => {
    renderWithProviders(
      <AccountModal
        open={true}
        onClose={() => {}}
        onSuccess={() => {}}
        userToEdit={null}
      />
    );

    expect(await screen.findByText('Tạo Mới Tài Khoản')).toBeInTheDocument();
    expect(screen.queryByText('user_mfg')).not.toBeInTheDocument();

    expect(screen.getByText(/Nhân viên chưa có tài khoản/i)).toBeInTheDocument();
    expect(screen.getByLabelText((content) => content.startsWith('Tên đăng nhập'))).toBeInTheDocument();
    expect(screen.getByLabelText((content) => content.startsWith('Mật khẩu') && !content.includes('mới'))).toBeInTheDocument();
  });

  // 3. Đóng Modal khi nhấn Escape
  it('calls onClose when Escape key is pressed', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <AccountModal
        open={true}
        onClose={handleClose}
        onSuccess={() => {}}
        userToEdit={null}
      />
    );

    await screen.findByText('Tạo Mới Tài Khoản');
    await user.keyboard('{Escape}');

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  // 4. Đóng Modal khi click backdrop
  it('calls onClose when clicking on backdrop', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <AccountModal
        open={true}
        onClose={handleClose}
        onSuccess={() => {}}
        userToEdit={null}
      />
    );

    await screen.findByText('Tạo Mới Tài Khoản');
    
    // Click dialog backdrop (dialog role element)
    const dialog = screen.getByRole('dialog', { name: 'Tạo Mới Tài Khoản' });
    await user.click(dialog);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  // 5. Toggle permission đơn lẻ
  it('toggles individual permission and updates group checkbox indeterminate state', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <AccountModal
        open={true}
        onClose={() => {}}
        onSuccess={() => {}}
        userToEdit={null}
      />
    );

    // Wait for permissions load
    const groupCheckbox = await screen.findByLabelText('Hệ Thống & Tài Khoản (Accounts)') as HTMLInputElement;
    const viewUserCheckbox = screen.getByLabelText('Xem tài khoản') as HTMLInputElement;
    const addUserCheckbox = screen.getByLabelText('Thêm tài khoản') as HTMLInputElement;

    expect(groupCheckbox.checked).toBe(false);
    expect(groupCheckbox.indeterminate).toBe(false);
    expect(viewUserCheckbox.checked).toBe(false);
    expect(addUserCheckbox.checked).toBe(false);

    // Click view user -> group should become indeterminate
    await user.click(viewUserCheckbox);
    expect(viewUserCheckbox.checked).toBe(true);
    expect(groupCheckbox.indeterminate).toBe(true);
    expect(groupCheckbox.checked).toBe(false);
  });

  // 6. Toggle group (select all)
  it('toggles group checkbox to select all children', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <AccountModal
        open={true}
        onClose={() => {}}
        onSuccess={() => {}}
        userToEdit={null}
      />
    );

    const groupCheckbox = await screen.findByLabelText('Hệ Thống & Tài Khoản (Accounts)') as HTMLInputElement;
    const viewUserCheckbox = screen.getByLabelText('Xem tài khoản') as HTMLInputElement;
    const addUserCheckbox = screen.getByLabelText('Thêm tài khoản') as HTMLInputElement;

    // Select group -> all children should become checked
    await user.click(groupCheckbox);
    expect(viewUserCheckbox.checked).toBe(true);
    expect(addUserCheckbox.checked).toBe(true);
    expect(groupCheckbox.checked).toBe(true);
    expect(groupCheckbox.indeterminate).toBe(false);
  });

  // 7. Toggle group (deselect all)
  it('toggles group checkbox to deselect all children when all are checked', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <AccountModal
        open={true}
        onClose={() => {}}
        onSuccess={() => {}}
        userToEdit={null}
      />
    );

    const groupCheckbox = await screen.findByLabelText('Hệ Thống & Tài Khoản (Accounts)') as HTMLInputElement;
    const viewUserCheckbox = screen.getByLabelText('Xem tài khoản') as HTMLInputElement;
    const addUserCheckbox = screen.getByLabelText('Thêm tài khoản') as HTMLInputElement;

    // Check all via group header
    await user.click(groupCheckbox);
    expect(groupCheckbox.checked).toBe(true);

    // Uncheck group header -> all unchecked
    await user.click(groupCheckbox);
    expect(viewUserCheckbox.checked).toBe(false);
    expect(addUserCheckbox.checked).toBe(false);
    expect(groupCheckbox.checked).toBe(false);
  });

  // 8. Submit create thành công
  it('submits create user form successfully and triggers onSuccess', async () => {
    const handleSuccess = vi.fn();
    const user = userEvent.setup();

    server.use(
      http.post('*/api/v1/accounts/users/', async ({ request }) => {
        const body = await request.json() as any;
        expect(body.username).toBe('user123');
        expect(body.employee_id).toBe('EMP-001');
        expect(body.password).toBe('StrongPass123!');
        return HttpResponse.json({ id: 'new-uuid', username: 'user123' }, { status: 201 });
      })
    );

    renderWithProviders(
      <AccountModal
        open={true}
        onClose={() => {}}
        onSuccess={handleSuccess}
        userToEdit={null}
      />
    );

    const parentModal = await screen.findByRole('dialog', { name: 'Tạo Mới Tài Khoản' });

    // Open SearchableSelect
    const selectTrigger = within(parentModal).getByRole('combobox');
    await user.click(selectTrigger);

    // Select option
    const option = await screen.findByText('EMP-001 - Nguyen Van A');
    await user.click(option);

    const usernameInput = within(parentModal).getByLabelText((content) => content.startsWith('Tên đăng nhập'));
    await user.type(usernameInput, 'user123');

    const passwordInput = within(parentModal).getByLabelText((content) => content.startsWith('Mật khẩu') && !content.includes('mới'));
    await user.type(passwordInput, 'StrongPass123!');

    // Click submit button in footer of parent modal
    const submitBtn = within(parentModal).getByRole('button', { name: 'Tạo tài khoản' });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(handleSuccess).toHaveBeenCalledWith('create');
    });
  });

  // 9. Submit create thất bại (username trùng)
  it('displays API error banner when create user fails', async () => {
    const user = userEvent.setup();

    server.use(
      http.post('*/api/v1/accounts/users/', () => {
        return HttpResponse.json({ detail: 'Tên đăng nhập đã tồn tại.' }, { status: 400 });
      })
    );

    renderWithProviders(
      <AccountModal
        open={true}
        onClose={() => {}}
        onSuccess={() => {}}
        userToEdit={null}
      />
    );

    const parentModal = await screen.findByRole('dialog', { name: 'Tạo Mới Tài Khoản' });

    // Open SearchableSelect
    const selectTrigger = within(parentModal).getByRole('combobox');
    await user.click(selectTrigger);

    // Select option
    const option = await screen.findByText('EMP-001 - Nguyen Van A');
    await user.click(option);

    const usernameInput = within(parentModal).getByLabelText((content) => content.startsWith('Tên đăng nhập'));
    await user.type(usernameInput, 'duplicate_user');

    const passwordInput = within(parentModal).getByLabelText((content) => content.startsWith('Mật khẩu') && !content.includes('mới'));
    await user.type(passwordInput, 'StrongPass123!');

    const submitBtn = within(parentModal).getByRole('button', { name: 'Tạo tài khoản' });
    await user.click(submitBtn);

    // Verify error banner
    expect(await screen.findByText('Tên đăng nhập đã tồn tại.')).toBeInTheDocument();
  });

  // 10. Submit update thành công
  it('submits update user permissions successfully and triggers onSuccess', async () => {
    const handleSuccess = vi.fn();
    const user = userEvent.setup();

    server.use(
      http.put('*/api/v1/accounts/users/user-uuid-1/', async ({ request }) => {
        const body = await request.json() as any;
        expect(body.direct_permissions).toContain('accounts.view_user');
        return HttpResponse.json({ ...mockUser, direct_permissions: body.direct_permissions });
      })
    );

    renderWithProviders(
      <AccountModal
        open={true}
        onClose={() => {}}
        onSuccess={handleSuccess}
        userToEdit={mockUser}
      />
    );

    const parentModal = await screen.findByRole('dialog', { name: 'Cập Nhật Tài Khoản' });

    // Wait for permissions load
    const userCheckbox = await screen.findByLabelText('Xem tài khoản') as HTMLInputElement;
    await user.click(userCheckbox);

    const submitBtn = within(parentModal).getByRole('button', { name: 'Cập nhật' });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(handleSuccess).toHaveBeenCalledWith('update');
    });
  });

  // 11. Validation form (password yếu)
  it('displays form validation error when password is weak', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <AccountModal
        open={true}
        onClose={() => {}}
        onSuccess={() => {}}
        userToEdit={null}
      />
    );

    const parentModal = await screen.findByRole('dialog', { name: 'Tạo Mới Tài Khoản' });

    // Open SearchableSelect
    const selectTrigger = within(parentModal).getByRole('combobox');
    await user.click(selectTrigger);

    // Select option
    const option = await screen.findByText('EMP-001 - Nguyen Van A');
    await user.click(option);

    const usernameInput = within(parentModal).getByLabelText((content) => content.startsWith('Tên đăng nhập'));
    await user.type(usernameInput, 'validusername');

    const passwordInput = within(parentModal).getByLabelText((content) => content.startsWith('Mật khẩu') && !content.includes('mới'));
    await user.type(passwordInput, '1234'); // short

    const submitBtn = within(parentModal).getByRole('button', { name: 'Tạo tài khoản' });
    await user.click(submitBtn);

    expect(await screen.findByText('Mật khẩu phải chứa ít nhất 8 ký tự')).toBeInTheDocument();
  });

  // 12. Mở sub-modal đổi mật khẩu
  it('opens change password sub-modal when clicking button in edit mode', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <AccountModal
        open={true}
        onClose={() => {}}
        onSuccess={() => {}}
        userToEdit={mockUser}
      />
    );

    const changePasswordBtn = await screen.findByRole('button', { name: /Thay đổi mật khẩu/i });
    await user.click(changePasswordBtn);

    // Check sub-modal header
    expect(await screen.findByRole('dialog', { name: 'Đổi mật khẩu người dùng' })).toBeInTheDocument();
    expect(screen.getByLabelText((content) => content.startsWith('Mật khẩu mới'))).toBeInTheDocument();
  });

  // 13. Submit đổi mật khẩu thành công
  it('submits change password successfully and closes sub-modal', async () => {
    const user = userEvent.setup();

    server.use(
      http.post('*/api/v1/accounts/users/user-uuid-1/change-password/', async ({ request }) => {
        const body = await request.json() as any;
        expect(body.password).toBe('NewStrongPass123!');
        return HttpResponse.json({ message: 'Success' });
      })
    );

    renderWithProviders(
      <AccountModal
        open={true}
        onClose={() => {}}
        onSuccess={() => {}}
        userToEdit={mockUser}
      />
    );

    const changePasswordBtn = await screen.findByRole('button', { name: /Thay đổi mật khẩu/i });
    await user.click(changePasswordBtn);

    const subModal = await screen.findByRole('dialog', { name: 'Đổi mật khẩu người dùng' });

    const newPasswordInput = within(subModal).getByLabelText((content) => content.startsWith('Mật khẩu mới'));
    await user.type(newPasswordInput, 'NewStrongPass123!');

    const submitBtn = within(subModal).getByRole('button', { name: 'Cập nhật mật khẩu' });
    await user.click(submitBtn);

    // Sub-modal should be closed, input should be gone
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Đổi mật khẩu người dùng' })).not.toBeInTheDocument();
    });
  });

  // 14. Đóng sub-modal reset form
  it('resets change password form when sub-modal is closed and reopened', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <AccountModal
        open={true}
        onClose={() => {}}
        onSuccess={() => {}}
        userToEdit={mockUser}
      />
    );

    // Open sub-modal
    const changePasswordBtn = await screen.findByRole('button', { name: /Thay đổi mật khẩu/i });
    await user.click(changePasswordBtn);

    const subModal = await screen.findByRole('dialog', { name: 'Đổi mật khẩu người dùng' });

    const newPasswordInput = within(subModal).getByLabelText((content) => content.startsWith('Mật khẩu mới')) as HTMLInputElement;
    await user.type(newPasswordInput, 'TypingSomething');

    // Click Cancel in sub-modal
    const cancelBtn = within(subModal).getByRole('button', { name: 'Hủy' });
    await user.click(cancelBtn);

    // Reopen
    await user.click(changePasswordBtn);
    const subModalReopened = await screen.findByRole('dialog', { name: 'Đổi mật khẩu người dùng' });
    const newPasswordInputReopened = within(subModalReopened).getByLabelText((content) => content.startsWith('Mật khẩu mới')) as HTMLInputElement;
    
    expect(newPasswordInputReopened.value).toBe('');
  });

  // 15. Loading state disable buttons
  it('disables buttons when in loading/submitting state', async () => {
    const user = userEvent.setup();

    server.use(
      http.post('*/api/v1/accounts/users/', async () => {
        // Infinite delay to keep it loading
        await new Promise(() => {});
        return HttpResponse.json({});
      })
    );

    renderWithProviders(
      <AccountModal
        open={true}
        onClose={() => {}}
        onSuccess={() => {}}
        userToEdit={null}
      />
    );

    const parentModal = await screen.findByRole('dialog', { name: 'Tạo Mới Tài Khoản' });

    // Open SearchableSelect
    const selectTrigger = within(parentModal).getByRole('combobox');
    await user.click(selectTrigger);

    // Select option
    const option = await screen.findByText('EMP-001 - Nguyen Van A');
    await user.click(option);

    const usernameInput = within(parentModal).getByLabelText((content) => content.startsWith('Tên đăng nhập'));
    await user.type(usernameInput, 'loadinguser');

    const passwordInput = within(parentModal).getByLabelText((content) => content.startsWith('Mật khẩu') && !content.includes('mới'));
    await user.type(passwordInput, 'StrongPass123!');

    const submitBtn = within(parentModal).getByRole('button', { name: 'Tạo tài khoản' });
    const cancelBtn = within(parentModal).getByRole('button', { name: 'Hủy' });

    await user.click(submitBtn);

    // Verify they are disabled
    await waitFor(() => {
      expect(submitBtn).toBeDisabled();
      expect(cancelBtn).toBeDisabled();
    });
  });
});

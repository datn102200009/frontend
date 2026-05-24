import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmployeeFormModal } from './EmployeeFormModal';
import { renderWithProviders } from '@shared/lib/test/test-utils';

describe('EmployeeFormModal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders create employee form correctly', () => {
    renderWithProviders(<EmployeeFormModal {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'Thêm Nhân Viên Mới' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Mã nhân viên/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Họ và tên/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Tên đăng nhập/i)).not.toBeInTheDocument(); // Hidden by default
  });

  it('shows user fields when "create_user" is checked', async () => {
    renderWithProviders(<EmployeeFormModal {...defaultProps} />);
    const user = userEvent.setup();

    const createUserCheckbox = screen.getByLabelText(/Tạo tài khoản đăng nhập hệ thống đi kèm/i);
    await user.click(createUserCheckbox);

    expect(screen.getByLabelText(/Tên đăng nhập/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mật khẩu/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Vai trò truy cập hệ thống/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderWithProviders(<EmployeeFormModal {...defaultProps} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Lưu nhân sự' }));

    expect(await screen.findByText('Mã nhân viên là bắt buộc')).toBeInTheDocument();
    expect(await screen.findByText('Họ tên là bắt buộc')).toBeInTheDocument();
  });

  it('submits valid employee data successfully', async () => {
    renderWithProviders(<EmployeeFormModal {...defaultProps} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Mã nhân viên/i), 'NV003');
    await user.type(screen.getByLabelText(/Họ và tên/i), 'Trần Văn D');
    await user.type(screen.getByLabelText(/Email/i), 'd.tv@company.com');

    await user.click(screen.getByRole('button', { name: 'Lưu nhân sự' }));

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });
});

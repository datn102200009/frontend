import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmployeeUpdateModal } from './EmployeeUpdateModal';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import type { Employee } from '@entities/hrm/model/types';

describe('EmployeeUpdateModal', () => {
  const mockEmployee: Employee = {
    id: 'emp-1',
    employee_id: 'NV001',
    full_name: 'Nguyễn Văn An',
    phone: '0901234567',
    address: 'Hà Nội',
    employment_status: 'active',
  };

  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    employee: mockEmployee,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders update employee form with default values correctly', () => {
    renderWithProviders(<EmployeeUpdateModal {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'Chỉnh Sửa Hồ Sơ - NV001' })).toBeInTheDocument();
    
    const nameInput = screen.getByLabelText(/Họ và tên/i) as HTMLInputElement;
    expect(nameInput.value).toBe('Nguyễn Văn An');

    const phoneInput = screen.getByLabelText(/Số điện thoại/i) as HTMLInputElement;
    expect(phoneInput.value).toBe('0901234567');

    const addressInput = screen.getByLabelText(/Địa chỉ/i) as HTMLInputElement;
    expect(addressInput.value).toBe('Hà Nội');
  });

  it('validates required fields on update', async () => {
    renderWithProviders(<EmployeeUpdateModal {...defaultProps} />);
    const user = userEvent.setup();

    const nameInput = screen.getByLabelText(/Họ và tên/i);
    await user.clear(nameInput);
    
    await user.click(screen.getByRole('button', { name: 'Cập Nhật' }));

    expect(await screen.findByText('Họ tên là bắt buộc')).toBeInTheDocument();
  });

  it('submits updated employee data successfully', async () => {
    renderWithProviders(<EmployeeUpdateModal {...defaultProps} />);
    const user = userEvent.setup();

    const nameInput = screen.getByLabelText(/Họ và tên/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Nguyễn Văn An Cập Nhật');

    await user.click(screen.getByRole('button', { name: 'Cập Nhật' }));

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });
});

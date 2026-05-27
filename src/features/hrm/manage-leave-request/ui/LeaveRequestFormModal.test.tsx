import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeaveRequestFormModal } from './LeaveRequestFormModal';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import type { Employee } from '@entities/hrm/model/types';

describe('LeaveRequestFormModal', () => {
  const mockEmployee: Employee = {
    id: 'emp-123',
    employee_id: 'NV001',
    full_name: 'Nguyễn Văn An',
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

  it('renders leave request form correctly', () => {
    renderWithProviders(<LeaveRequestFormModal {...defaultProps} />);
    expect(screen.getByRole('heading', { name: /Tạo Đơn Xin Nghỉ Phép - Nguyễn Văn An/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Loại nghỉ phép/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Từ ngày/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Đến ngày/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Số ngày nghỉ thực tế/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Lý do xin nghỉ phép/i)).toBeInTheDocument();
  });

  it('auto-calculates days when dates change', async () => {
    renderWithProviders(<LeaveRequestFormModal {...defaultProps} />);
    const user = userEvent.setup();

    const startDateInput = screen.getByLabelText(/Từ ngày/i);
    const endDateInput = screen.getByLabelText(/Đến ngày/i);
    const daysInput = screen.getByLabelText(/Số ngày nghỉ thực tế/i) as HTMLInputElement;

    // Change start date and end date
    await user.clear(startDateInput);
    await user.type(startDateInput, '2026-06-01');
    await user.clear(endDateInput);
    await user.type(endDateInput, '2026-06-05');

    // 2026-06-01 to 2026-06-05 inclusive is 5 days
    await waitFor(() => {
      expect(Number(daysInput.value)).toBe(5);
    });
  });

  it('submits leave request data successfully even without a reason', async () => {
    renderWithProviders(<LeaveRequestFormModal {...defaultProps} />);
    const user = userEvent.setup();

    // Clear reason field (which is optional)
    const reasonInput = screen.getByLabelText(/Lý do xin nghỉ phép/i);
    await user.clear(reasonInput);

    await user.click(screen.getByRole('button', { name: 'Gửi đơn phép' }));

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });

  it('submits leave request data successfully', async () => {
    renderWithProviders(<LeaveRequestFormModal {...defaultProps} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Lý do xin nghỉ phép/i), 'Giải quyết việc riêng');

    await user.click(screen.getByRole('button', { name: 'Gửi đơn phép' }));

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });

  it('renders employee dropdown select when employee prop is not provided', async () => {
    const propsWithoutEmployee = {
      open: true,
      onClose: vi.fn(),
      onSuccess: vi.fn(),
    };
    renderWithProviders(<LeaveRequestFormModal {...propsWithoutEmployee} />);
    expect(screen.getByRole('heading', { name: 'Tạo Đơn Xin Nghỉ Phép' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Chọn nhân viên/i)).toBeInTheDocument();
  });
});


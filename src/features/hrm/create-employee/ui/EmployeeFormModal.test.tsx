import { screen, waitFor, fireEvent } from '@testing-library/react';
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

    // Fill contract details (since it is now mandatory)
    await user.type(screen.getByLabelText(/Số hợp đồng/i), 'HĐ-003');
    await user.type(screen.getByLabelText(/Lương cơ bản theo hợp đồng/i), '12000000');

    const startHiddenInput = document.querySelector('input[name="contract_start_date"]') as HTMLInputElement;
    fireEvent.change(startHiddenInput, { target: { value: '2026-06-16' } });

    const endHiddenInput = document.querySelector('input[name="contract_end_date"]') as HTMLInputElement;
    fireEvent.change(endHiddenInput, { target: { value: '2027-06-16' } });

    await user.click(screen.getByRole('button', { name: 'Lưu nhân sự' }));

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });
});

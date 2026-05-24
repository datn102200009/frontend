import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TerminateContractModal } from './TerminateContractModal';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import type { Employee } from '@entities/hrm/model/types';

describe('TerminateContractModal', () => {
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
    contractId: 'contract-456',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders terminate contract form correctly', () => {
    renderWithProviders(<TerminateContractModal {...defaultProps} />);
    expect(screen.getByRole('heading', { name: /Quyết Toán & Chấm Dứt Hợp Đồng - Nguyễn Văn An/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Ngày chấm dứt/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nghỉ việc hợp pháp/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Lý do chấm dứt/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Số ngày phép chưa nghỉ/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Ngày công chuẩn của tháng/i)).toBeInTheDocument();
    expect(screen.getByText(/Cách tính lương ngày công/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderWithProviders(<TerminateContractModal {...defaultProps} />);
    const user = userEvent.setup();

    // Clear termination_date
    const termDateInput = screen.getByLabelText(/Ngày chấm dứt/i);
    await user.clear(termDateInput);

    await user.click(screen.getByRole('button', { name: 'Xác nhận chấm dứt' }));

    expect(await screen.findByText('Ngày chấm dứt là bắt buộc')).toBeInTheDocument();
    expect(await screen.findByText('Lý do chấm dứt là bắt buộc')).toBeInTheDocument();
  });

  it('shows warning and unnotified days input when unlawful checkbox is active', async () => {
    renderWithProviders(<TerminateContractModal {...defaultProps} />);
    const user = userEvent.setup();

    // Default checked
    const checkbox = screen.getByLabelText(/Nghỉ việc hợp pháp/i);
    expect(checkbox).toBeChecked();
    expect(screen.queryByText(/⚠️ CẢNH BÁO NGHỈ NGANG/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Số ngày không báo trước/i)).not.toBeInTheDocument();

    // Uncheck it
    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
    expect(screen.getByText(/⚠️ CẢNH BÁO NGHỈ NGANG/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Số ngày không báo trước/i)).toBeInTheDocument();
  });

  it('submits contract termination with all fields successfully', async () => {
    renderWithProviders(<TerminateContractModal {...defaultProps} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Lý do chấm dứt/i), 'Vi phạm quy chế công ty');
    
    // Clear standard fields and type
    const unusedLeaveInput = screen.getByLabelText(/Số ngày phép chưa nghỉ/i);
    await user.clear(unusedLeaveInput);
    await user.type(unusedLeaveInput, '2.5');

    const workingDaysInput = screen.getByLabelText(/Ngày công chuẩn của tháng/i);
    await user.clear(workingDaysInput);
    await user.type(workingDaysInput, '24');

    await user.click(screen.getByRole('button', { name: 'Xác nhận chấm dứt' }));

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });
});

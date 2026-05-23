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
    expect(screen.getByRole('heading', { name: /Chấm Dứt Hợp Đồng - Nguyễn Văn An/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Ngày chấm dứt/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Lý do chấm dứt/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Link quyết định thôi việc/i)).toBeInTheDocument();
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

  it('submits contract termination successfully', async () => {
    renderWithProviders(<TerminateContractModal {...defaultProps} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Lý do chấm dứt/i), 'Vi phạm quy chế công ty');

    await user.click(screen.getByRole('button', { name: 'Xác nhận chấm dứt' }));

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });
});

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContractFormModal } from './ContractFormModal';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import type { Employee } from '@entities/hrm/model/types';

describe('ContractFormModal', () => {
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

  it('renders contract form correctly', () => {
    renderWithProviders(<ContractFormModal {...defaultProps} />);
    expect(screen.getByRole('heading', { name: /Tạo Mới \/ Gia Hạn Hợp Đồng - Nguyễn Văn An/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Số hợp đồng/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Loại hợp đồng/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Ngày bắt đầu/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderWithProviders(<ContractFormModal {...defaultProps} />);
    const user = userEvent.setup();

    // Clear contract_no
    const contractNoInput = screen.getByLabelText(/Số hợp đồng/i);
    await user.clear(contractNoInput);

    await user.click(screen.getByRole('button', { name: 'Tạo hợp đồng' }));

    expect(await screen.findByText('Số hợp đồng là bắt buộc')).toBeInTheDocument();
  });

  it('validates that end date is after start date', async () => {
    renderWithProviders(<ContractFormModal {...defaultProps} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Số hợp đồng/i), 'HĐ-999');
    
    // Set start date to 2026-06-10 and end date to 2026-06-01
    const startDateInput = screen.getByLabelText(/Ngày bắt đầu/i);
    await user.clear(startDateInput);
    await user.type(startDateInput, '2026-06-10');

    // For definite_term contract, end date input is visible.
    const endDateInput = screen.getByLabelText(/Ngày kết thúc/i);
    await user.clear(endDateInput);
    await user.type(endDateInput, '2026-06-01');

    await user.click(screen.getByRole('button', { name: 'Tạo hợp đồng' }));

    expect(await screen.findByText('Ngày kết thúc phải sau ngày bắt đầu hợp đồng.')).toBeInTheDocument();
  });

  it('submits contract data successfully', async () => {
    renderWithProviders(<ContractFormModal {...defaultProps} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Số hợp đồng/i), 'HĐ-999');
    
    // Select indefinite contract (end date becomes hidden)
    const typeSelect = screen.getByLabelText(/Loại hợp đồng/i);
    await user.selectOptions(typeSelect, 'indefinite_term');

    await user.click(screen.getByRole('button', { name: 'Tạo hợp đồng' }));

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });
});

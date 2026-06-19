import { screen, waitFor, fireEvent } from '@testing-library/react';
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
    expect(screen.getByRole('heading', { name: /Tạo Mới Hợp Đồng - Nguyễn Văn An/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Số hợp đồng/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Loại hợp đồng/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Ngày bắt đầu/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Lương cơ bản theo hợp đồng/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderWithProviders(<ContractFormModal {...defaultProps} />);
    const user = userEvent.setup();

    // Clear contract_no
    const contractNoInput = screen.getByLabelText(/Số hợp đồng/i);
    await user.clear(contractNoInput);

    await user.click(screen.getByRole('button', { name: 'Tạo hợp đồng' }));

    expect(await screen.findByText('Số hợp đồng là bắt buộc')).toBeInTheDocument();
    expect(await screen.findByText('Lương cơ bản theo hợp đồng là bắt buộc')).toBeInTheDocument();
  });

  it('validates that end date is after start date', async () => {
    renderWithProviders(<ContractFormModal {...defaultProps} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Số hợp đồng/i), 'HĐ-999');
    await user.type(screen.getByLabelText(/Lương cơ bản theo hợp đồng/i), '12000000');
    
    // Set start date to 2026-06-10 and end date to 2026-06-01 via hidden inputs
    const startHiddenInput = document.querySelector('input[name="start_date"]') as HTMLInputElement;
    fireEvent.change(startHiddenInput, { target: { value: '2026-06-10' } });

    const endHiddenInput = document.querySelector('input[name="end_date"]') as HTMLInputElement;
    fireEvent.change(endHiddenInput, { target: { value: '2026-06-01' } });

    await user.click(screen.getByRole('button', { name: 'Tạo hợp đồng' }));

    expect(await screen.findByText('Ngày kết thúc phải sau ngày bắt đầu hợp đồng.')).toBeInTheDocument();
  });

  it('submits contract data successfully', async () => {
    renderWithProviders(<ContractFormModal {...defaultProps} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Số hợp đồng/i), 'HĐ-999');
    await user.type(screen.getByLabelText(/Lương cơ bản theo hợp đồng/i), '10000000');
    
    // Select indefinite contract (end date becomes hidden)
    const typeSelect = screen.getByLabelText(/Loại hợp đồng/i);
    await user.selectOptions(typeSelect, 'indefinite_term');

    await user.click(screen.getByRole('button', { name: 'Tạo hợp đồng' }));

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });
});

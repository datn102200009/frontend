import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdjustSalaryConfirmModal } from './AdjustSalaryConfirmModal';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import type { Employee } from '@entities/hrm/model/types';

describe('AdjustSalaryConfirmModal', () => {
  const mockEmployee: Employee = {
    id: 'emp-1',
    employee_id: 'NV001',
    full_name: 'Nguyễn Văn An',
    current_salary_base: '10000000',
    employment_status: 'active',
  };

  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onBack: vi.fn(),
    onConfirm: vi.fn(),
    employee: mockEmployee,
    formData: { new_salary_base: 12000000, reason: 'Tăng lương định kỳ' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders diff correctly with old vs new salary, delta, and percentage', () => {
    renderWithProviders(<AdjustSalaryConfirmModal {...defaultProps} />);
    
    expect(screen.getByRole('heading', { name: 'Xác nhận điều chỉnh lương' })).toBeInTheDocument();
    
    // Check old salary rendering
    expect(screen.getByText(/10\.000\.000/)).toBeInTheDocument();
    
    // Check new salary rendering
    expect(screen.getByText(/12\.000\.000/)).toBeInTheDocument();
    
    // Check delta and delta percent rendering
    expect(screen.getByText(/\+2\.000\.000/)).toBeInTheDocument();
  });

  it('shows today date and reason in the details section', () => {
    renderWithProviders(<AdjustSalaryConfirmModal {...defaultProps} />);
    
    expect(screen.getByText(/Tăng lương định kỳ/i)).toBeInTheDocument();
    expect(screen.getByText(/Ngày áp dụng:/i)).toBeInTheDocument();
  });

  it('displays API error message when confirm mutation fails', async () => {
    const mockOnConfirm = vi.fn().mockRejectedValue(new Error('Lỗi từ hệ thống'));
    renderWithProviders(<AdjustSalaryConfirmModal {...defaultProps} onConfirm={mockOnConfirm} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Xác nhận' }));
    
    expect(await screen.findByText('Lỗi từ hệ thống')).toBeInTheDocument();
  });

  it('on back button returns to form step', async () => {
    renderWithProviders(<AdjustSalaryConfirmModal {...defaultProps} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /Quay lại/i }));
    expect(defaultProps.onBack).toHaveBeenCalled();
  });
});

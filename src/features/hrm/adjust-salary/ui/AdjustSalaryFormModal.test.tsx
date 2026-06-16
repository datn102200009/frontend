import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdjustSalaryFormModal } from './AdjustSalaryFormModal';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import type { Employee } from '@entities/hrm/model/types';

describe('AdjustSalaryFormModal', () => {
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
    onContinue: vi.fn(),
    employee: mockEmployee,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders only two fields and no date picker', () => {
    renderWithProviders(<AdjustSalaryFormModal {...defaultProps} />);
    
    expect(screen.getByLabelText(/Mức lương cơ bản mới/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Lý do điều chỉnh/i)).toBeInTheDocument();
    
    // There should not be any field for date or effective date
    expect(screen.queryByLabelText(/Ngày có hiệu lực/i)).not.toBeInTheDocument();
  });

  it('shows information box about today effective date', () => {
    renderWithProviders(<AdjustSalaryFormModal {...defaultProps} />);
    
    expect(screen.getByText(/Lương mới sẽ có hiệu lực từ hôm nay/i)).toBeInTheDocument();
  });

  it('validates new salary base is required', async () => {
    renderWithProviders(<AdjustSalaryFormModal {...defaultProps} />);
    const user = userEvent.setup();

    const salaryInput = screen.getByLabelText(/Mức lương cơ bản mới/i);
    await user.clear(salaryInput);

    await user.click(screen.getByRole('button', { name: 'Tiếp tục' }));
    
    expect(await screen.findByText('Lương cơ bản mới là bắt buộc')).toBeInTheDocument();
    expect(defaultProps.onContinue).not.toHaveBeenCalled();
  });
});

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DisciplineFormModal } from './DisciplineFormModal';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import type { Employee } from '@entities/hrm/model/types';

describe('DisciplineFormModal', () => {
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

  it('renders discipline form correctly with employee', () => {
    renderWithProviders(<DisciplineFormModal {...defaultProps} />);
    expect(screen.getByRole('heading', { name: /Ghi Nhận Kỷ Luật - Nguyễn Văn An/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Ngày xảy ra sự việc/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Ngày quyết định/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Hình thức kỷ luật/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Số tiền khấu trừ/i)).not.toBeInTheDocument(); // Hidden by default (warning)
    expect(screen.getByLabelText(/Nội dung vi phạm/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Nhân viên/i)).not.toBeInTheDocument();
  });

  it('renders employee selection dropdown when employee is not provided', () => {
    const propsWithoutEmployee = {
      ...defaultProps,
      employee: undefined,
    };
    renderWithProviders(<DisciplineFormModal {...propsWithoutEmployee} />);
    expect(screen.getByRole('heading', { name: /Ghi Nhận Kỷ Luật/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Nhân viên/i)).toBeInTheDocument();
  });

  it('shows penalty amount field only when discipline type is salary_deduction', async () => {
    renderWithProviders(<DisciplineFormModal {...defaultProps} />);
    const user = userEvent.setup();

    const typeSelect = screen.getByLabelText(/Hình thức kỷ luật/i);
    await user.selectOptions(typeSelect, 'salary_deduction');

    expect(screen.getByLabelText(/Số tiền khấu trừ/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderWithProviders(<DisciplineFormModal {...defaultProps} />);
    const user = userEvent.setup();

    const descInput = screen.getByLabelText(/Nội dung vi phạm/i);
    await user.clear(descInput);

    await user.click(screen.getByRole('button', { name: 'Ghi nhận kỷ luật' }));

    expect(await screen.findByText('Nội dung vi phạm là bắt buộc')).toBeInTheDocument();
  });

  it('submits discipline data successfully', async () => {
    renderWithProviders(<DisciplineFormModal {...defaultProps} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Nội dung vi phạm/i), 'Đi muộn nhiều lần');

    await user.click(screen.getByRole('button', { name: 'Ghi nhận kỷ luật' }));

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });
});

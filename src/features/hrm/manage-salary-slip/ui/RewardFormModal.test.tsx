import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RewardFormModal } from './RewardFormModal';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import type { Employee } from '@entities/hrm/model/types';

describe('RewardFormModal', () => {
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

  it('renders reward form correctly', () => {
    renderWithProviders(<RewardFormModal {...defaultProps} />);
    expect(screen.getByRole('heading', { name: /Khen Thưởng Nhân Viên - Nguyễn Văn An/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Ngày quyết định/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Loại khen thưởng/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Số tiền thưởng/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Lý do\/Mô tả thành tích/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderWithProviders(<RewardFormModal {...defaultProps} />);
    const user = userEvent.setup();

    // Clear description
    const descInput = screen.getByLabelText(/Lý do\/Mô tả thành tích/i);
    await user.clear(descInput);

    await user.click(screen.getByRole('button', { name: 'Ghi nhận thưởng' }));

    expect(await screen.findByText('Mô tả khen thưởng là bắt buộc')).toBeInTheDocument();
  });

  it('submits reward data successfully', async () => {
    renderWithProviders(<RewardFormModal {...defaultProps} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Lý do\/Mô tả thành tích/i), 'Có sáng kiến cải tiến quy trình');

    await user.click(screen.getByRole('button', { name: 'Ghi nhận thưởng' }));

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });
});

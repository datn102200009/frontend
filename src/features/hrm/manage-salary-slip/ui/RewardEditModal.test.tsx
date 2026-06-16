import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RewardEditModal } from './RewardEditModal';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import type { RewardRecord } from '@entities/hrm/model/types';

describe('RewardEditModal', () => {
  const mockRecord: RewardRecord = {
    id: 'rew-123',
    employee_id: 'emp-123',
    employee_code: 'NV001',
    employee_name: 'Nguyễn Văn An',
    reward_date: '2026-06-10',
    reward_type: 'performance_bonus',
    amount: '1500000.00',
    description: 'Thưởng quý 2',
    status: 'pending_approval',
  };

  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    record: mockRecord,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders edit form with pre-populated values', () => {
    renderWithProviders(<RewardEditModal {...defaultProps} />);
    expect(screen.getByRole('heading', { name: /Sửa Quyết Định Khen Thưởng - Nguyễn Văn An/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Ngày quyết định/i)).toHaveValue('2026-06-10');
    expect(screen.getByLabelText(/Loại khen thưởng/i)).toHaveValue('performance_bonus');
    expect(screen.getByLabelText(/Số tiền thưởng/i)).toHaveValue(1500000);
    expect(screen.getByLabelText(/Lý do\/Mô tả thành tích/i)).toHaveValue('Thưởng quý 2');
  });

  it('validates description is required', async () => {
    renderWithProviders(<RewardEditModal {...defaultProps} />);
    const user = userEvent.setup();

    const descInput = screen.getByLabelText(/Lý do\/Mô tả thành tích/i);
    await user.clear(descInput);

    await user.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));

    expect(await screen.findByText('Mô tả khen thưởng là bắt buộc')).toBeInTheDocument();
  });

  it('submits updated reward data successfully', async () => {
    renderWithProviders(<RewardEditModal {...defaultProps} />);
    const user = userEvent.setup();

    const descInput = screen.getByLabelText(/Lý do\/Mô tả thành tích/i);
    await user.clear(descInput);
    await user.type(descInput, 'Thưởng dự án xuất sắc');

    await user.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });
});

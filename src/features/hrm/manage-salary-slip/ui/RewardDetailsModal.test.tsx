import { screen } from '@testing-library/react';
import { RewardDetailsModal } from './RewardDetailsModal';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import type { RewardRecord } from '@entities/hrm/model/types';

describe('RewardDetailsModal', () => {
  const mockRecord: RewardRecord = {
    id: 'rew-123',
    employee_code: 'NV001',
    employee_name: 'Nguyễn Văn An',
    reward_date: '2026-06-10',
    reward_type: 'performance_bonus',
    amount: '1500000.00',
    description: 'Thưởng quý 2',
    status: 'cancelled',
    cancelled_by_username: 'manager1',
    cancelled_at: '2026-06-12T10:00:00Z',
  };

  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    record: mockRecord,
  };

  it('renders reward record details correctly', () => {
    renderWithProviders(<RewardDetailsModal {...defaultProps} />);
    expect(screen.getByRole('heading', { name: /Chi Tiết Quyết Định Khen Thưởng/i })).toBeInTheDocument();
    expect(screen.getByText('NV001')).toBeInTheDocument();
    expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
    expect(screen.getByText('2026-06-10')).toBeInTheDocument();
    expect(screen.getByText('Thưởng hiệu quả công việc')).toBeInTheDocument();
    expect(screen.getByText(/1.500.000/)).toBeInTheDocument();
    expect(screen.getByText('Thưởng quý 2')).toBeInTheDocument();
    expect(screen.getByText('Đã hủy')).toBeInTheDocument();
    expect(screen.getByText('@manager1')).toBeInTheDocument();
  });
});

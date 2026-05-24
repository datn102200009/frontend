import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeaveRequestDetailsModal } from './LeaveRequestDetailsModal';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import type { LeaveRequest } from '@entities/hrm/model/types';

describe('LeaveRequestDetailsModal', () => {
  const mockPendingLeaveRequest: LeaveRequest = {
    id: 'lr-123',
    employee_id: 'emp-123',
    employee_code: 'NV001',
    employee_name: 'Nguyễn Văn An',
    leave_type: 'annual',
    start_date: '2026-06-01',
    end_date: '2026-06-03',
    days: '3.0',
    reason: 'Nghỉ mát hè',
    status: 'pending',
  } as any;

  const mockApprovedLeaveRequest: LeaveRequest = {
    ...mockPendingLeaveRequest,
    status: 'approved',
  } as any;

  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    leaveRequest: mockPendingLeaveRequest,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders leave request details correctly for pending request', () => {
    renderWithProviders(<LeaveRequestDetailsModal {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'Chi Tiết Đơn Xin Nghỉ Phép' })).toBeInTheDocument();
    expect(screen.getByText('Nguyễn Văn An (NV001)')).toBeInTheDocument();
    expect(screen.getByText('Nghỉ phép năm')).toBeInTheDocument();
    expect(screen.getByText('3.0 ngày')).toBeInTheDocument();
    expect(screen.getByText('Nghỉ mát hè')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Duyệt đơn' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Từ chối' })).toBeInTheDocument();
  });

  it('renders correctly for approved request', () => {
    renderWithProviders(
      <LeaveRequestDetailsModal {...defaultProps} leaveRequest={mockApprovedLeaveRequest} />
    );
    expect(screen.getByRole('heading', { name: 'Chi Tiết Đơn Xin Nghỉ Phép' })).toBeInTheDocument();
    expect(screen.getByText('Đã duyệt')).toBeInTheDocument();
    expect(screen.getByText('Đóng')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Duyệt đơn' })).not.toBeInTheDocument();
  });

  it('handles approve action successfully', async () => {
    renderWithProviders(<LeaveRequestDetailsModal {...defaultProps} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Duyệt đơn' }));

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });

  it('handles reject action successfully', async () => {
    renderWithProviders(<LeaveRequestDetailsModal {...defaultProps} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Từ chối' }));

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });
});

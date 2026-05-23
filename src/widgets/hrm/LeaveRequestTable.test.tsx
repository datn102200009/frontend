import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeaveRequestTable } from './LeaveRequestTable';
import { renderWithProviders } from '@shared/lib/test/test-utils';

describe('LeaveRequestTable', () => {
  const defaultProps = {
    onViewDetails: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders leave request table with data', async () => {
    renderWithProviders(<LeaveRequestTable {...defaultProps} />);

    // Wait for the leave request to load
    expect(await screen.findByText('Nguyễn Văn An')).toBeInTheDocument();
    expect(screen.getByText('Nghỉ phép năm')).toBeInTheDocument();
    expect(screen.getByText('2.0 ngày')).toBeInTheDocument();
    expect(screen.getByText('Có việc gia đình')).toBeInTheDocument();
    expect(screen.getByText('Chờ duyệt')).toBeInTheDocument();
  });

  it('invokes onViewDetails action', async () => {
    renderWithProviders(<LeaveRequestTable {...defaultProps} />);
    const user = userEvent.setup();

    // Wait for data to load
    await screen.findByText('Nguyễn Văn An');

    // Click actions button
    await user.click(screen.getByRole('button', { name: 'Xem & Duyệt đơn' }));

    expect(defaultProps.onViewDetails).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'lr-1', employee_name: 'Nguyễn Văn An' })
    );
  });
});

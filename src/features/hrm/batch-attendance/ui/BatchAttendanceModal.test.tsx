import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BatchAttendanceModal } from './BatchAttendanceModal';
import { renderWithProviders } from '@shared/lib/test/test-utils';

describe('BatchAttendanceModal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders batch attendance modal and fetches active employees', async () => {
    renderWithProviders(<BatchAttendanceModal {...defaultProps} />);

    expect(screen.getByRole('heading', { name: 'Chấm Công Hàng Loạt' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Ngày chấm công:/i)).toBeInTheDocument();
    
    // Wait for the active employees list to load from mock
    expect(await screen.findByText('Nguyễn Văn An')).toBeInTheDocument();
    expect(screen.getByText('Trần Thị Bình')).toBeInTheDocument();
  });

  it('allows changing status and hours, then submits successfully', async () => {
    renderWithProviders(<BatchAttendanceModal {...defaultProps} />);
    const user = userEvent.setup();

    // Wait for employees to load
    await screen.findByText('Nguyễn Văn An');

    // Change status for Trần Thị Bình (second row, index 1)
    const select = screen.getByRole('combobox', { name: 'Trạng thái của Trần Thị Bình' });
    await user.selectOptions(select, 'paid_leave');

    // Change OT hours for Nguyễn Văn An (first row)
    const otInput = screen.getByRole('spinbutton', { name: 'Giờ OT của Nguyễn Văn An' });
    await user.clear(otInput);
    await user.type(otInput, '2');

    // Change remarks for Nguyễn Văn An
    const remarkInput = screen.getByRole('textbox', { name: 'Ghi chú của Nguyễn Văn An' });
    await user.type(remarkInput, 'Tăng ca sửa lỗi');

    // Click submit
    const submitButton = screen.getByRole('button', { name: 'Lưu chấm công' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });
});

import { screen, waitFor, fireEvent } from '@testing-library/react';
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

  it('disables and resets hours inputs based on the selected status', async () => {
    renderWithProviders(<BatchAttendanceModal {...defaultProps} />);
    const user = userEvent.setup();

    // Wait for employees to load
    await screen.findByText('Nguyễn Văn An');

    const select = screen.getByRole('combobox', { name: 'Trạng thái của Nguyễn Văn An' });
    const workInput = screen.getByRole('spinbutton', { name: 'Số giờ công của Nguyễn Văn An' });
    const otInput = screen.getByRole('spinbutton', { name: 'Giờ OT của Nguyễn Văn An' });

    // Default status is 'working', both should be enabled
    expect(select).toHaveValue('working');
    expect(workInput).toBeEnabled();
    expect(workInput).toHaveValue(8);
    expect(otInput).toBeEnabled();

    // 1. Change status to 'paid_leave'
    await user.selectOptions(select, 'paid_leave');
    // Both hours inputs should be disabled and reset to 0
    expect(workInput).toBeDisabled();
    expect(workInput).toHaveValue(0);
    expect(otInput).toBeDisabled();
    expect(otInput).toHaveValue(0);

    // 2. Change status to 'holiday'
    await user.selectOptions(select, 'holiday');
    // work_hours should be disabled and reset to 0, overtime_hours should be enabled
    expect(workInput).toBeDisabled();
    expect(workInput).toHaveValue(0);
    expect(otInput).toBeEnabled();
  });

  it('locks status dropdown to holiday when date is a public holiday', async () => {
    // Override the public holiday query mock to return a holiday on 2026-05-01
    const { http, HttpResponse } = await import('msw');
    const { server } = await import('../../../../shared/lib/test/server');
    server.use(
      http.get('*/api/v1/hrm/public-holidays/', () => {
        return HttpResponse.json([
          { id: 'holiday-1', start_date: '2026-05-01', days: 1, name: 'Ngày Chiến thắng' },
        ]);
      })
    );

    renderWithProviders(<BatchAttendanceModal {...defaultProps} />);

    // Change date to the public holiday (2026-05-01)
    const dateInput = screen.getByLabelText(/Ngày chấm công:/i);
    fireEvent.change(dateInput, { target: { value: '2026-05-01' } });

    // Wait for the active employees list to load
    await screen.findByText('Nguyễn Văn An');

    const select = screen.getByRole('combobox', { name: 'Trạng thái của Nguyễn Văn An' });
    const workInput = screen.getByRole('spinbutton', { name: 'Số giờ công của Nguyễn Văn An' });
    const otInput = screen.getByRole('spinbutton', { name: 'Giờ OT của Nguyễn Văn An' });

    // Select dropdown should be locked (disabled) to 'holiday'
    expect(select).toBeDisabled();
    expect(select).toHaveValue('holiday');

    // work_hours should be disabled and 0, overtime_hours should be enabled and 0
    expect(workInput).toBeDisabled();
    expect(workInput).toHaveValue(0);
    expect(otInput).toBeEnabled();
    expect(otInput).toHaveValue(0);
  });
});

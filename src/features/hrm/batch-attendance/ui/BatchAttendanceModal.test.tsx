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

    expect(screen.getByRole('heading', { name: 'Chấm Công' })).toBeInTheDocument();
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

  it('disables and resets hours inputs based on the selected status and restricts options', async () => {
    renderWithProviders(<BatchAttendanceModal {...defaultProps} />);
    const user = userEvent.setup();

    // Wait for employees to load
    await screen.findByText('Nguyễn Văn An');

    const select = screen.getByRole('combobox', { name: 'Trạng thái của Nguyễn Văn An' });
    const workInput = screen.getByRole('spinbutton', { name: 'Số giờ công của Nguyễn Văn An' });
    const otInput = screen.getByRole('spinbutton', { name: 'Giờ OT của Nguyễn Văn An' });

    // Assert options restricted
    const options = Array.from(select.querySelectorAll('option')).map((o) => o.value);
    expect(options).toContain('working');
    expect(options).toContain('paid_leave');
    expect(options).toContain('unpaid_leave');
    expect(options).toContain('holiday');
    expect(options).not.toContain('sick_leave');
    expect(options).not.toContain('other');

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

    // 2. Change status to 'unpaid_leave'
    await user.selectOptions(select, 'unpaid_leave');
    // Both hours inputs should be disabled and reset to 0
    expect(workInput).toBeDisabled();
    expect(workInput).toHaveValue(0);
    expect(otInput).toBeDisabled();
    expect(otInput).toHaveValue(0);

    // 3. Change status to 'holiday'
    await user.selectOptions(select, 'holiday');
    // work_hours should be disabled and reset to 0, overtime_hours should be enabled
    expect(workInput).toBeDisabled();
    expect(workInput).toHaveValue(0);
    expect(otInput).toBeEnabled();
  });

  it('locks status dropdown to holiday when date is a public holiday and displays warning banner', async () => {
    // Override the public holiday query mock to return a holiday on 2026-05-01
    const { http, HttpResponse } = await import('msw');
    const { server } = await import('@shared/lib/test/server');
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

    // Warning banner should display
    expect(screen.getByText(/Hôm nay là ngày nghỉ lễ chính thức:/i)).toBeInTheDocument();
    expect(screen.getByText('Ngày Chiến thắng')).toBeInTheDocument();

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

  it('locks status dropdown to holiday and displays success banner when date is a compensatory holiday', async () => {
    const { http, HttpResponse } = await import('msw');
    const { server } = await import('@shared/lib/test/server');
    server.use(
      http.get('*/api/v1/hrm/public-holidays/', () => {
        return HttpResponse.json([
          { id: 'holiday-1', start_date: '2026-05-03', days: 1, name: 'Ngày Chiến thắng' }, // May 3rd, 2026 is Sunday
        ]);
      })
    );

    renderWithProviders(<BatchAttendanceModal {...defaultProps} />);

    // Change date to Monday (2026-05-04), which is the compensatory holiday
    const dateInput = screen.getByLabelText(/Ngày chấm công:/i);
    fireEvent.change(dateInput, { target: { value: '2026-05-04' } });

    // Wait for the active employees list to load
    await screen.findByText('Nguyễn Văn An');

    // Success banner should display explaining compensatory holiday rules
    expect(screen.getByText(/Hôm nay là ngày nghỉ bù cho:/i)).toBeInTheDocument();
    expect(screen.getByText('Ngày Chiến thắng')).toBeInTheDocument();

    const select = screen.getByRole('combobox', { name: 'Trạng thái của Nguyễn Văn An' });
    const workInput = screen.getByRole('spinbutton', { name: 'Số giờ công của Nguyễn Văn An' });

    // Select dropdown should be locked (disabled) to 'holiday'
    expect(select).toBeDisabled();
    expect(select).toHaveValue('holiday');

    expect(workInput).toBeDisabled();
    expect(workInput).toHaveValue(0);
  });

  it('displays dynamic compensatory day off on warning banner for consecutive holiday block', async () => {
    const { http, HttpResponse } = await import('msw');
    const { server } = await import('@shared/lib/test/server');
    server.use(
      http.get('*/api/v1/hrm/public-holidays/', () => {
        return HttpResponse.json([
          { id: 'holiday-1', start_date: '2026-05-02', days: 4, name: 'Đại lễ' }, // May 2nd (Saturday) to May 5th (Tuesday) - May 3rd is Sunday
        ]);
      })
    );

    renderWithProviders(<BatchAttendanceModal {...defaultProps} />);

    // Change date to Sunday (2026-05-03), which overlaps with rest day
    const dateInput = screen.getByLabelText(/Ngày chấm công:/i);
    fireEvent.change(dateInput, { target: { value: '2026-05-03' } });

    // Wait for the active employees list to load
    await screen.findByText('Nguyễn Văn An');

    // Warning banner should display and show Wednesday (Thứ Tư) as compensatory day!
    expect(screen.getByText(/Hôm nay là ngày nghỉ lễ chính thức:/i)).toBeInTheDocument();
    expect(screen.getByText('Đại lễ')).toBeInTheDocument();
    expect(screen.getByText(/trùng Chủ Nhật \(sẽ được nghỉ bù vào/i)).toBeInTheDocument();
    expect(screen.getByText('Thứ Tư')).toBeInTheDocument();
  });


  it('initializes the date input with the initialDate prop if provided', () => {
    renderWithProviders(<BatchAttendanceModal {...defaultProps} initialDate="2026-05-20" />);

    const dateInput = screen.getByLabelText(/Ngày chấm công:/i);
    expect(dateInput).toHaveValue('2026-05-20');
  });

  it('locks fields and disables submit button when date belongs to a paid period', async () => {
    const { http, HttpResponse } = await import('msw');
    const { server } = await import('@shared/lib/test/server');
    server.use(
      http.get('*/api/v1/hrm/salary-slips/', () => {
        return HttpResponse.json([
          { id: 'slip-1', salary_period: '2026-05', status: 'paid' },
        ]);
      })
    );

    renderWithProviders(<BatchAttendanceModal {...defaultProps} initialDate="2026-05-15" />);

    // Wait for the active employees list to load
    await screen.findByText('Nguyễn Văn An');

    // Warning banner should display
    expect(screen.getByTestId('paid-period-modal-banner')).toBeInTheDocument();
    expect(screen.getByText(/Kỳ lương 2026-05 đã được thanh toán 100%/i)).toBeInTheDocument();

    const select = screen.getByRole('combobox', { name: 'Trạng thái của Nguyễn Văn An' });
    const workInput = screen.getByRole('spinbutton', { name: 'Số giờ công của Nguyễn Văn An' });
    const otInput = screen.getByRole('spinbutton', { name: 'Giờ OT của Nguyễn Văn An' });
    const remarkInput = screen.getByRole('textbox', { name: 'Ghi chú của Nguyễn Văn An' });
    const submitButton = screen.getByRole('button', { name: 'Lưu chấm công' });

    // Verify all editing inputs are disabled
    expect(select).toBeDisabled();
    expect(workInput).toBeDisabled();
    expect(otInput).toBeDisabled();
    expect(remarkInput).toBeDisabled();

    // Verify submit button is disabled
    expect(submitButton).toBeDisabled();
  });

  it('pre-populates existing attendance records when they exist for the selected date', async () => {
    const { http, HttpResponse } = await import('msw');
    const { server } = await import('@shared/lib/test/server');

    // Mock the attendances endpoint to return custom values
    server.use(
      http.get('*/api/v1/hrm/attendances/', () => {
        return HttpResponse.json({
          count: 2,
          results: [
            {
              id: 'att-1',
              employee_id: 'emp-1',
              employee_code: 'NV001',
              employee_name: 'Nguyễn Văn An',
              date: '2026-05-15',
              status: 'paid_leave',
              work_hours: '0.00',
              overtime_hours: '0.00',
              remarks: 'Nghỉ phép năm đã duyệt',
            },
            {
              id: 'att-2',
              employee_id: 'emp-2',
              employee_code: 'NV002',
              employee_name: 'Trần Thị Bình',
              date: '2026-05-15',
              status: 'working',
              work_hours: '8.00',
              overtime_hours: '2.50',
              remarks: 'Đi làm đầy đủ và OT',
            },
          ]
        });
      })
    );

    renderWithProviders(<BatchAttendanceModal {...defaultProps} initialDate="2026-05-15" />);

    // Wait for the active employees list and check pre-population
    await screen.findByText('Nguyễn Văn An');

    const selectAn = screen.getByRole('combobox', { name: 'Trạng thái của Nguyễn Văn An' });
    const workAn = screen.getByRole('spinbutton', { name: 'Số giờ công của Nguyễn Văn An' });
    const otAn = screen.getByRole('spinbutton', { name: 'Giờ OT của Nguyễn Văn An' });
    const remarkAn = screen.getByRole('textbox', { name: 'Ghi chú của Nguyễn Văn An' });

    expect(selectAn).toHaveValue('paid_leave');
    expect(workAn).toHaveValue(0);
    expect(otAn).toHaveValue(0);
    expect(remarkAn).toHaveValue('Nghỉ phép năm đã duyệt');

    const selectBinh = screen.getByRole('combobox', { name: 'Trạng thái của Trần Thị Bình' });
    const workBinh = screen.getByRole('spinbutton', { name: 'Số giờ công của Trần Thị Bình' });
    const otBinh = screen.getByRole('spinbutton', { name: 'Giờ OT của Trần Thị Bình' });
    const remarkBinh = screen.getByRole('textbox', { name: 'Ghi chú của Trần Thị Bình' });

    expect(selectBinh).toHaveValue('working');
    expect(workBinh).toHaveValue(8);
    expect(otBinh).toHaveValue(2.5);
    expect(remarkBinh).toHaveValue('Đi làm đầy đủ và OT');
  });
});


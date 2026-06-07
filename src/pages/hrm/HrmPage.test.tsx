import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HrmPage from './HrmPage';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import { server } from '@shared/lib/test/server';
import { http, HttpResponse } from 'msw';

describe('HrmPage', () => {
  it('renders and switches tabs correctly', async () => {
    renderWithProviders(<HrmPage />);

    // Default tab should be Nhân Viên (Employee)
    expect(screen.getByRole('heading', { name: 'Hồ Sơ Nhân Sự' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Thêm Nhân Viên' })).toBeInTheDocument();

    const user = userEvent.setup();

    // Click on Chấm Công (Attendance) tab
    await user.click(screen.getByRole('tab', { name: 'Chấm Công' }));
    expect(screen.getByRole('heading', { name: 'Quản Lý Chấm Công' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Chấm Công' })).toBeInTheDocument();

    // Click on Nghỉ Phép (Leave Request) tab
    await user.click(screen.getByRole('tab', { name: 'Nghỉ Phép' }));
    expect(screen.getByRole('heading', { name: 'Đơn Xin Nghỉ Phép' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tạo Đơn Phép' })).toBeInTheDocument();

    // Click on Bảng Lương (Salary Slip) tab
    await user.click(screen.getByRole('tab', { name: 'Bảng Lương' }));
    expect(screen.getByRole('heading', { name: 'Thanh Toán Lương' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Khởi Tạo Kỳ Lương' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Thanh Toán Kỳ Lương' })).toBeInTheDocument();
  });

  it('shows info banner and keeps batch attendance button unlocked on public holidays', async () => {
    renderWithProviders(<HrmPage />);
    const user = userEvent.setup();

    // Click on Chấm Công tab
    await user.click(screen.getByRole('tab', { name: 'Chấm Công' }));

    // Find date input and open DatePickerModal
    const dateInput = screen.getByLabelText('Chọn ngày xem chấm công');
    expect(dateInput).toBeInTheDocument();

    // 1. Open DatePickerModal and set to a public holiday date (30/04/2026)
    await user.click(dateInput);
    fireEvent.change(screen.getByLabelText('Chọn tháng'), { target: { value: '3' } }); // April
    fireEvent.change(screen.getByLabelText('Chọn năm'), { target: { value: '2026' } });
    await user.click(screen.getByRole('button', { name: '30 Tháng 4 Năm 2026' }));
    await user.click(screen.getByRole('button', { name: 'Xác nhận' }));

    // Verify banner is shown
    const banner = await screen.findByTestId('public-holiday-banner');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent('Thông báo nghỉ lễ: Ngày 30/04/2026 là ngày nghỉ Lễ/Tết Ngày Chiến thắng');

    // Verify Chấm Công button is not disabled (unlocked)
    const batchButton = screen.getByRole('button', { name: 'Chấm Công' });
    expect(batchButton).not.toBeDisabled();

    // 2. Open DatePickerModal and set to a normal date (01/05/2026)
    await user.click(dateInput);
    fireEvent.change(screen.getByLabelText('Chọn tháng'), { target: { value: '4' } }); // May
    fireEvent.change(screen.getByLabelText('Chọn năm'), { target: { value: '2026' } });
    await user.click(screen.getByRole('button', { name: '1 Tháng 5 Năm 2026' }));
    await user.click(screen.getByRole('button', { name: 'Xác nhận' }));

    // Verify banner disappears and button remains enabled
    await waitFor(() => {
      expect(screen.queryByTestId('public-holiday-banner')).not.toBeInTheDocument();
    });
    expect(batchButton).toBeEnabled();
  });

  it('renders holiday banner safely even if holiday name is missing', async () => {
    // Override public-holidays API query to simulate a holiday without a name
    server.use(
      http.get('*/api/v1/hrm/public-holidays/', () => {
        return HttpResponse.json([
          { id: 'holiday-1', start_date: '2026-02-17', days: 1, description: 'Tết không tên' },
        ]);
      })
    );

    renderWithProviders(<HrmPage />);
    const user = userEvent.setup();

    // Click on Chấm Công tab
    await user.click(screen.getByRole('tab', { name: 'Chấm Công' }));

    // Find date input and open DatePickerModal
    const dateInput = screen.getByLabelText('Chọn ngày xem chấm công');
    await user.click(dateInput);
    
    // Choose February 17, 2026
    fireEvent.change(screen.getByLabelText('Chọn tháng'), { target: { value: '1' } }); // February
    fireEvent.change(screen.getByLabelText('Chọn năm'), { target: { value: '2026' } });
    await user.click(screen.getByRole('button', { name: '17 Tháng 2 Năm 2026' }));
    await user.click(screen.getByRole('button', { name: 'Xác nhận' }));

    // Verify banner is shown without crashing and name is handled safely
    const banner = await screen.findByTestId('public-holiday-banner');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent('Thông báo nghỉ lễ: Ngày 17/02/2026 là ngày nghỉ Lễ/Tết .');
  });

  it('renders official holiday banner with compensatory day off note on Sunday, and compensatory banner on Wednesday', async () => {
    // Setup a 4-day public holiday starting Saturday 2026-05-30
    server.use(
      http.get('*/api/v1/hrm/public-holidays/', () => {
        return HttpResponse.json([
          { id: 'holiday-block', name: 'Nghỉ Lễ Dài Ngày', start_date: '2026-05-30', days: 4, description: 'Nghỉ 4 ngày' },
        ]);
      })
    );

    renderWithProviders(<HrmPage />);
    const user = userEvent.setup();

    // Click Chấm Công tab
    await user.click(screen.getByRole('tab', { name: 'Chấm Công' }));

    const dateInput = screen.getByLabelText('Chọn ngày xem chấm công');

    // 1. Select Sunday 2026-05-31
    await user.click(dateInput);
    fireEvent.change(screen.getByLabelText('Chọn tháng'), { target: { value: '4' } }); // May
    fireEvent.change(screen.getByLabelText('Chọn năm'), { target: { value: '2026' } });
    await user.click(screen.getByRole('button', { name: '31 Tháng 5 Năm 2026' }));
    await user.click(screen.getByRole('button', { name: 'Xác nhận' }));

    // Should show official holiday banner indicating it's compensated on Wednesday (Thứ Tư)
    const officialBanner = await screen.findByTestId('public-holiday-banner');
    expect(officialBanner).toBeInTheDocument();
    expect(officialBanner).toHaveTextContent('trùng Chủ Nhật (sẽ được nghỉ bù vào Thứ Tư)');

    // 2. Select Wednesday 2026-06-03
    await user.click(dateInput);
    fireEvent.change(screen.getByLabelText('Chọn tháng'), { target: { value: '5' } }); // June
    fireEvent.change(screen.getByLabelText('Chọn năm'), { target: { value: '2026' } });
    await user.click(screen.getByRole('button', { name: '3 Tháng 6 Năm 2026' }));
    await user.click(screen.getByRole('button', { name: 'Xác nhận' }));

    // Should show compensatory banner
    const compBanner = await screen.findByTestId('compensatory-holiday-banner');
    expect(compBanner).toBeInTheDocument();
    expect(compBanner).toHaveTextContent('Thông báo nghỉ bù: Ngày 03/06/2026 là ngày nghỉ bù cho ngày lễ Nghỉ Lễ Dài Ngày');
  });

  it('automatically opens employee details modal when employeeId is in URL query params', async () => {
    server.use(
      http.get('*/api/v1/hrm/employees/', () => {
        return HttpResponse.json({
          count: 1,
          results: [
            {
              id: 'emp-1',
              employee_id: 'NV001',
              full_name: 'Nguyễn Văn A',
              department: 'IT',
              position_title: 'Developer',
              salary_base: '10000000',
              employment_status: 'active'
            }
          ]
        });
      }),
      http.get('*/api/v1/hrm/employees/emp-1/', () => {
        return HttpResponse.json({
          id: 'emp-1',
          employee_id: 'NV001',
          full_name: 'Nguyễn Văn A',
          department: 'IT',
          position_title: 'Developer',
          salary_base: '10000000',
          employment_status: 'active',
          contracts: [],
          employment_histories: [],
          documents: [],
          rewards: [],
          disciplines: []
        });
      })
    );

    renderWithProviders(<HrmPage />, {
      initialEntries: ['/hrm?tab=employees&employeeId=emp-1']
    });

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Hồ Sơ Nhân Sự Chi Tiết/i)).toBeInTheDocument();
  });

  it('automatically opens leave request details modal when requestId is in URL query params', async () => {
    server.use(
      http.get('*/api/v1/hrm/leave-requests/', () => {
        return HttpResponse.json([
          {
            id: 'req-1',
            employee_id: 'emp-1',
            employee_code: 'NV001',
            employee_name: 'Nguyễn Văn A',
            leave_type: 'paid',
            start_date: '2026-06-01',
            end_date: '2026-06-03',
            days: '3',
            status: 'pending',
            reason: 'Nghỉ phép năm'
          }
        ]);
      })
    );

    renderWithProviders(<HrmPage />, {
      initialEntries: ['/hrm?tab=leave&requestId=req-1']
    });

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Chi Tiết Đơn Xin Nghỉ Phép/i)).toBeInTheDocument();
  });
});

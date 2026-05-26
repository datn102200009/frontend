import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HrmPage from './HrmPage';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import { server } from '../../shared/lib/test/server';
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
    expect(screen.getByRole('button', { name: 'Chấm Công Hàng Loạt' })).toBeInTheDocument();

    // Click on Nghỉ Phép (Leave Request) tab
    await user.click(screen.getByRole('tab', { name: 'Nghỉ Phép' }));
    expect(screen.getByRole('heading', { name: 'Đơn Xin Nghỉ Phép' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tạo Đơn Phép' })).toBeInTheDocument();

    // Click on Bảng Lương (Salary Slip) tab
    await user.click(screen.getByRole('tab', { name: 'Bảng Lương' }));
    expect(screen.getByRole('heading', { name: 'Tính Toán & Thanh Toán Lương' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Khởi Tạo Kỳ Lương' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Thanh Toán Nhanh' })).toBeInTheDocument();
  });

  it('locks batch attendance button and shows info banner on public holidays', async () => {
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

    // Verify Chấm Công Hàng Loạt button is disabled
    const batchButton = screen.getByRole('button', { name: 'Chấm Công Hàng Loạt' });
    expect(batchButton).toBeDisabled();

    // 2. Open DatePickerModal and set to a normal date (01/05/2026)
    await user.click(dateInput);
    fireEvent.change(screen.getByLabelText('Chọn tháng'), { target: { value: '4' } }); // May
    fireEvent.change(screen.getByLabelText('Chọn năm'), { target: { value: '2026' } });
    await user.click(screen.getByRole('button', { name: '1 Tháng 5 Năm 2026' }));
    await user.click(screen.getByRole('button', { name: 'Xác nhận' }));

    // Verify banner disappears and button is enabled
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
});

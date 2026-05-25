import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HrmPage from './HrmPage';
import { renderWithProviders } from '@shared/lib/test/test-utils';

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

    // Find date input and change its value to a public holiday date
    const dateInput = screen.getByLabelText('Chọn ngày xem chấm công');
    expect(dateInput).toBeInTheDocument();

    // 1. Set to a public holiday date
    fireEvent.change(dateInput, { target: { value: '2026-04-30' } });

    // Verify banner is shown
    const banner = await screen.findByTestId('public-holiday-banner');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent('Thông báo nghỉ lễ: Ngày 30/04/2026 là ngày nghỉ Lễ/Tết Ngày Chiến thắng');

    // Verify Chấm Công Hàng Loạt button is disabled
    const batchButton = screen.getByRole('button', { name: 'Chấm Công Hàng Loạt' });
    expect(batchButton).toBeDisabled();

    // 2. Set to a normal date
    fireEvent.change(dateInput, { target: { value: '2026-05-01' } });

    // Verify banner disappears and button is enabled
    expect(screen.queryByTestId('public-holiday-banner')).not.toBeInTheDocument();
    expect(batchButton).toBeEnabled();
  });
});

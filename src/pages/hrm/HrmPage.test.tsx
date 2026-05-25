import { screen } from '@testing-library/react';
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
});

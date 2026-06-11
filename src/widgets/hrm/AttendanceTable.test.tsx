import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AttendanceTable } from './AttendanceTable';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import { server } from '@shared/lib/test/server';
import { http, HttpResponse } from 'msw';

describe('AttendanceTable', () => {
  it('renders attendance table with data', async () => {
    renderWithProviders(<AttendanceTable />);

    // Wait for the active attendances to load from mock handlers
    expect(await screen.findByText('Nguyễn Văn An')).toBeInTheDocument();
    expect(screen.getByText('Trần Thị Bình')).toBeInTheDocument();
    expect(screen.getByText('Ngày công thường')).toBeInTheDocument();
    expect(screen.getByText('Nghỉ phép (Hưởng lương)')).toBeInTheDocument();
  });

  it('opens date picker modal on Enter or Space key press on the date filter input', async () => {
    renderWithProviders(<AttendanceTable />);
    const user = userEvent.setup();
    const dateInput = screen.getByLabelText('Chọn ngày xem chấm công');
    
    // Focus the input
    dateInput.focus();
    expect(dateInput).toHaveFocus();
    
    // Press Space
    await user.keyboard(' ');
    expect(screen.getByRole('heading', { name: 'Chọn Ngày Tháng Năm' })).toBeInTheDocument();
    
    // Close modal
    await user.click(screen.getByRole('button', { name: 'Hủy' }));
    expect(screen.queryByRole('heading', { name: 'Chọn Ngày Tháng Năm' })).not.toBeInTheDocument();
    
    // Press Enter
    dateInput.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('heading', { name: 'Chọn Ngày Tháng Năm' })).toBeInTheDocument();
  });

  it('renders holiday status with the purple accent badge variant', async () => {
    // Override the attendance API query to return a holiday record
    server.use(
      http.get('*/api/v1/hrm/attendances/', () => {
        return HttpResponse.json({
          count: 1,
          results: [
            {
              id: 'attendance-holiday',
              employee: 'emp-holiday-id',
              employee_name: 'Lê Văn Lễ',
              employee_code: 'EMP999',
              date: '2026-05-01',
              status: 'holiday',
              work_hours: 0,
              overtime_hours: 0,
              remarks: 'Nghỉ lễ Quốc tế Lao động',
            },
          ]
        });
      })
    );

    renderWithProviders(<AttendanceTable selectedDate="2026-05-01" />);

    // Wait for the mock record to load
    expect(await screen.findByText('Lê Văn Lễ')).toBeInTheDocument();
    
    // Check if the Badge has class 'accent' (representing purple color)
    const holidayBadge = screen.getByText('Nghỉ lễ');
    expect(holidayBadge).toBeInTheDocument();
    expect(holidayBadge.className).toContain('accent');
  });
});

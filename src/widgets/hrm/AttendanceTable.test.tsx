import { screen } from '@testing-library/react';
import { AttendanceTable } from './AttendanceTable';
import { renderWithProviders } from '@shared/lib/test/test-utils';

describe('AttendanceTable', () => {
  it('renders attendance table with data', async () => {
    renderWithProviders(<AttendanceTable />);

    // Wait for the active attendances to load from mock handlers
    expect(await screen.findByText('Nguyễn Văn An')).toBeInTheDocument();
    expect(screen.getByText('Trần Thị Bình')).toBeInTheDocument();
    expect(screen.getByText('Đi làm')).toBeInTheDocument();
    expect(screen.getByText('Nghỉ phép (Hưởng lương)')).toBeInTheDocument();
  });
});

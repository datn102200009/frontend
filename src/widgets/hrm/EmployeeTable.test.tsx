import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmployeeTable } from './EmployeeTable';
import { renderWithProviders } from '@shared/lib/test/test-utils';

describe('EmployeeTable', () => {
  const defaultProps = {
    onView: vi.fn(),
    onEdit: vi.fn(),
    onUpdateSalary: vi.fn(),
    onCreateContract: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders employee table with data', async () => {
    renderWithProviders(<EmployeeTable {...defaultProps} />);

    // Wait for the active employees list to load from mock handlers
    expect(await screen.findByText('Nguyễn Văn An')).toBeInTheDocument();
    expect(screen.getByText('Trần Thị Bình')).toBeInTheDocument();
    expect(screen.getByText('Hành chính')).toBeInTheDocument();
    expect(screen.getByText('Kinh doanh')).toBeInTheDocument();
  });

  it('invokes onView action when viewing details', async () => {
    renderWithProviders(<EmployeeTable {...defaultProps} />);
    const user = userEvent.setup();

    // Wait for employees to load
    await screen.findByText('Nguyễn Văn An');

    // Click view details button (the first eye icon button in the table)
    const viewButtons = screen.getAllByRole('button', { name: 'Xem chi tiết & Hợp đồng' });
    await user.click(viewButtons[0]);

    expect(defaultProps.onView).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'emp-1', full_name: 'Nguyễn Văn An' })
    );
  });
});

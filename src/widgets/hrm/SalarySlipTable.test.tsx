import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SalarySlipTable } from './SalarySlipTable';
import { renderWithProviders } from '@shared/lib/test/test-utils';

describe('SalarySlipTable', () => {
  const defaultProps = {
    onViewDetails: vi.fn(),
    selectedPeriod: '2026-05',
    onChangePeriod: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders salary slip table with data', async () => {
    renderWithProviders(<SalarySlipTable {...defaultProps} />);

    // Wait for the salary slip to load
    expect(await screen.findByText('Nguyễn Văn An')).toBeInTheDocument();
    expect(screen.getByText('Cập nhật vào')).toBeInTheDocument();
    expect(screen.getAllByText('Bản nháp')[0]).toBeInTheDocument();
  });

  it('invokes onViewDetails action', async () => {
    renderWithProviders(<SalarySlipTable {...defaultProps} />);
    const user = userEvent.setup();

    // Wait for data to load
    await screen.findByText('Nguyễn Văn An');

    // Click actions button
    await user.click(screen.getByRole('button', { name: 'Xem & Tính lương' }));

    expect(defaultProps.onViewDetails).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'slip-1', employee_name: 'Nguyễn Văn An' })
    );
  });
});

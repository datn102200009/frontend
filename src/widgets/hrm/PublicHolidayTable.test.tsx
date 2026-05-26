import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PublicHolidayTable } from './PublicHolidayTable';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import { useToast } from '@shared/ui/Toast/Toast';

// Mock useToast to inspect call arguments
vi.mock('@shared/ui/Toast/Toast', async () => {
  const actual = await vi.importActual<any>('@shared/ui/Toast/Toast');
  const mockToast = vi.fn();
  return {
    ...actual,
    useToast: () => ({
      toast: mockToast,
    }),
  };
});

describe('PublicHolidayTable', () => {
  const defaultProps = {
    onEdit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders public holiday table with data', async () => {
    renderWithProviders(<PublicHolidayTable {...defaultProps} />);

    // Wait for the data to load and render
    expect(await screen.findByText('Tết Âm Lịch')).toBeInTheDocument();
    expect(screen.getByText('Ngày Chiến thắng')).toBeInTheDocument();
    expect(screen.getByText('17/02/2026')).toBeInTheDocument(); // formatted start date
    expect(screen.getByText('30/04/2026')).toBeInTheDocument(); // formatted start date
    expect(screen.getByText('5')).toBeInTheDocument(); // days for Tết Âm Lịch
  });

  it('invokes onEdit when editing a holiday', async () => {
    renderWithProviders(<PublicHolidayTable {...defaultProps} />);
    const user = userEvent.setup();

    // Wait for data
    await screen.findByText('Tết Âm Lịch');

    // Click edit on the first holiday (Tết Âm Lịch)
    const editButtons = screen.getAllByRole('button', { name: /Sửa ngày nghỉ lễ/i });
    await user.click(editButtons[0]);

    expect(defaultProps.onEdit).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'holiday-1', name: 'Tết Âm Lịch' })
    );
  });

  it('opens confirmation modal and deletes holiday successfully', async () => {
    renderWithProviders(<PublicHolidayTable {...defaultProps} />);
    const user = userEvent.setup();

    // Wait for data
    await screen.findByText('Tết Âm Lịch');

    // Click trash button on the first holiday
    const trashButtons = screen.getAllByRole('button', { name: /Xóa ngày nghỉ lễ/i });
    await user.click(trashButtons[0]);

    // Check modal opens
    expect(screen.getByText('Xác Nhận Xóa')).toBeInTheDocument();
    expect(
      screen.getByText(/Bạn có chắc chắn muốn xóa ngày nghỉ lễ/i)
    ).toBeInTheDocument();

    // Click confirm delete button
    const confirmButton = screen.getByRole('button', { name: 'Xóa ngày lễ' });
    await user.click(confirmButton);

    // Verify toast was called and modal is closed
    const { toast } = useToast();
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith('success', 'Đã xóa ngày nghỉ lễ "Tết Âm Lịch"');
      expect(screen.queryByText('Xác Nhận Xóa')).not.toBeInTheDocument();
    });
  });
});

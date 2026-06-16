import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PublicHolidayTable } from './PublicHolidayTable';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import { useToast } from '@shared/ui/Toast/Toast';
import * as toastModule from '@shared/ui/Toast/Toast';
import { server } from '@shared/lib/test/server';
import { http, HttpResponse } from 'msw';

// Mock useToast to inspect call arguments
vi.mock('@shared/ui/Toast/Toast', async () => {
  const actual = await vi.importActual<typeof toastModule>('@shared/ui/Toast/Toast');
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
    expect(screen.getByText('17-02-2026')).toBeInTheDocument(); // formatted start date
    expect(screen.getByText('30-04-2026')).toBeInTheDocument(); // formatted start date
    expect(screen.getByText('5')).toBeInTheDocument(); // days for Tết Âm Lịch
  });

  it('invokes onEdit when editing a holiday', async () => {
    // Mock a future holiday so the Edit button is enabled
    server.use(
      http.get('*/api/v1/hrm/public-holidays/', () => {
        return HttpResponse.json([
          { id: 'holiday-future', name: 'Tết Tương Lai', start_date: '2028-02-17', days: 5, description: 'Nghỉ Tết Tương Lai' }
        ]);
      })
    );

    renderWithProviders(<PublicHolidayTable {...defaultProps} />);
    const user = userEvent.setup();

    // Wait for data
    await screen.findByText('Tết Tương Lai');

    // Click edit on the holiday
    const editButtons = screen.getAllByRole('button', { name: /Sửa ngày nghỉ lễ/i });
    await user.click(editButtons[0]);

    expect(defaultProps.onEdit).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'holiday-future', name: 'Tết Tương Lai' })
    );
  });

  it('opens confirmation modal and deletes holiday successfully', async () => {
    // Mock a future holiday so the Delete button is enabled
    server.use(
      http.get('*/api/v1/hrm/public-holidays/', () => {
        return HttpResponse.json([
          { id: 'holiday-future', name: 'Tết Tương Lai', start_date: '2028-02-17', days: 5, description: 'Nghỉ Tết Tương Lai' }
        ]);
      })
    );

    renderWithProviders(<PublicHolidayTable {...defaultProps} />);
    const user = userEvent.setup();

    // Wait for data
    await screen.findByText('Tết Tương Lai');

    // Click trash button on the holiday
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
      expect(toast).toHaveBeenCalledWith('success', 'Đã xóa ngày nghỉ lễ "Tết Tương Lai"');
      expect(screen.queryByText('Xác Nhận Xóa')).not.toBeInTheDocument();
    });
  });

  it('hides edit and delete buttons for past or ongoing holidays', async () => {
    renderWithProviders(<PublicHolidayTable {...defaultProps} />);

    // Wait for data (Tết Âm Lịch is at 2026-02-17, which is past)
    await screen.findByText('Tết Âm Lịch');

    // Edit and Delete buttons should not be rendered
    const editButtons = screen.queryAllByRole('button', { name: /Sửa ngày nghỉ lễ/i });
    const deleteButtons = screen.queryAllByRole('button', { name: /Xóa ngày nghỉ lễ/i });

    expect(editButtons).toHaveLength(0);
    expect(deleteButtons).toHaveLength(0);
  });
});

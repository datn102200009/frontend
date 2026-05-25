import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PublicHolidayFormModal } from './PublicHolidayFormModal';
import { renderWithProviders } from '@shared/lib/test/test-utils';

describe('PublicHolidayFormModal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const getYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };

  const getTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders create public holiday form correctly', () => {
    renderWithProviders(<PublicHolidayFormModal {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'Khai Báo Ngày Nghỉ Lễ Mới' })).toBeInTheDocument();
    expect(screen.getByLabelText('Tên ngày nghỉ lễ *')).toBeInTheDocument();
    expect(screen.getByLabelText('Ngày nghỉ lễ *')).toBeInTheDocument();
    expect(screen.getByLabelText('Mô tả')).toBeInTheDocument();
  });

  it('renders edit public holiday form correctly with prepopulated values', () => {
    const holiday = {
      id: 'holiday-1',
      name: 'Tết Âm Lịch',
      date: '2026-02-17',
      description: 'Nghỉ Tết Âm Lịch',
    };
    renderWithProviders(<PublicHolidayFormModal {...defaultProps} holiday={holiday} />);
    expect(screen.getByRole('heading', { name: 'Cập Nhật Ngày Nghỉ Lễ' })).toBeInTheDocument();
    expect(screen.getByLabelText('Tên ngày nghỉ lễ *')).toHaveValue('Tết Âm Lịch');
    expect(screen.getByLabelText('Ngày nghỉ lễ *')).toHaveValue('2026-02-17');
    expect(screen.getByLabelText('Mô tả')).toHaveValue('Nghỉ Tết Âm Lịch');
  });

  it('validates required fields', async () => {
    renderWithProviders(<PublicHolidayFormModal {...defaultProps} />);
    const user = userEvent.setup();

    // Clear name
    const nameInput = screen.getByLabelText('Tên ngày nghỉ lễ *');
    await user.clear(nameInput);

    // Clear date
    const dateInput = screen.getByLabelText('Ngày nghỉ lễ *');
    await user.clear(dateInput);

    await user.click(screen.getByRole('button', { name: 'Lưu' }));

    expect(await screen.findByText('Tên ngày nghỉ lễ là bắt buộc')).toBeInTheDocument();
    expect(await screen.findByText('Ngày nghỉ lễ là bắt buộc')).toBeInTheDocument();
  });

  it('blocks selecting a past date when creating a holiday', async () => {
    renderWithProviders(<PublicHolidayFormModal {...defaultProps} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Tên ngày nghỉ lễ *'), 'Ngày lễ quá khứ');
    
    // Choose a date in the past
    const dateInput = screen.getByLabelText('Ngày nghỉ lễ *');
    await user.clear(dateInput);
    await user.type(dateInput, getYesterdayStr());

    await user.click(screen.getByRole('button', { name: 'Lưu' }));

    expect(await screen.findByText('Không được chọn ngày nghỉ lễ trong quá khứ')).toBeInTheDocument();
    expect(defaultProps.onSuccess).not.toHaveBeenCalled();
  });

  it('allows selecting today or a future date when creating a holiday', async () => {
    renderWithProviders(<PublicHolidayFormModal {...defaultProps} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Tên ngày nghỉ lễ *'), 'Ngày lễ tương lai');
    
    // Choose a date in the future
    const dateInput = screen.getByLabelText('Ngày nghỉ lễ *');
    await user.clear(dateInput);
    await user.type(dateInput, getTomorrowStr());

    await user.click(screen.getByRole('button', { name: 'Lưu' }));

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });

  it('allows editing and saving even if the original date is in the past', async () => {
    const holiday = {
      id: 'holiday-1',
      name: 'Tết Âm Lịch',
      date: getYesterdayStr(), // past date
      description: 'Nghỉ Tết Âm Lịch',
    };
    renderWithProviders(<PublicHolidayFormModal {...defaultProps} holiday={holiday} />);
    const user = userEvent.setup();

    // Change description, keep the date same
    const descInput = screen.getByLabelText('Mô tả');
    await user.clear(descInput);
    await user.type(descInput, 'Nghỉ Tết Âm Lịch cập nhật');

    await user.click(screen.getByRole('button', { name: 'Lưu' }));

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });
});

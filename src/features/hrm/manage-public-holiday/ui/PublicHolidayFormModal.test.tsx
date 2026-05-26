import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PublicHolidayFormModal } from './PublicHolidayFormModal';
import { renderWithProviders } from '@shared/lib/test/test-utils';

const formatDateToDMY = (isoDateStr: string): string => {
  if (!isoDateStr) return '';
  const parts = isoDateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoDateStr;
};

describe('PublicHolidayFormModal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders create public holiday form correctly', () => {
    renderWithProviders(<PublicHolidayFormModal {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'Khai Báo Ngày Nghỉ Lễ Mới' })).toBeInTheDocument();
    expect(screen.getByLabelText('Tên ngày nghỉ lễ *')).toBeInTheDocument();
    expect(screen.getByLabelText('Ngày bắt đầu *')).toBeInTheDocument();
    expect(screen.getByLabelText('Ngày bắt đầu *')).toHaveValue(formatDateToDMY(new Date().toISOString().split('T')[0]));
    expect(screen.getByLabelText('Số ngày nghỉ *')).toBeInTheDocument();
    expect(screen.getByLabelText('Mô tả')).toBeInTheDocument();
  });

  it('renders edit public holiday form correctly with prepopulated values', () => {
    const holiday = {
      id: 'holiday-1',
      name: 'Tết Âm Lịch',
      start_date: '2026-02-17',
      days: 5,
      description: 'Nghỉ Tết Âm Lịch',
    };
    renderWithProviders(<PublicHolidayFormModal {...defaultProps} holiday={holiday} />);
    expect(screen.getByRole('heading', { name: 'Cập Nhật Ngày Nghỉ Lễ' })).toBeInTheDocument();
    expect(screen.getByLabelText('Tên ngày nghỉ lễ *')).toHaveValue('Tết Âm Lịch');
    expect(screen.getByLabelText('Ngày bắt đầu *')).toHaveValue('17/02/2026');
    expect(screen.getByLabelText('Số ngày nghỉ *')).toHaveValue(5);
    expect(screen.getByLabelText('Mô tả')).toHaveValue('Nghỉ Tết Âm Lịch');
  });

  it('validates required fields', async () => {
    renderWithProviders(<PublicHolidayFormModal {...defaultProps} />);
    const user = userEvent.setup();

    // Clear name
    const nameInput = screen.getByLabelText('Tên ngày nghỉ lễ *');
    await user.clear(nameInput);

    // Clear days
    const daysInput = screen.getByLabelText('Số ngày nghỉ *');
    await user.clear(daysInput);

    await user.click(screen.getByRole('button', { name: 'Lưu' }));

    expect(await screen.findByText('Tên ngày nghỉ lễ là bắt buộc')).toBeInTheDocument();
    expect(await screen.findByText('Số ngày nghỉ là bắt buộc')).toBeInTheDocument();
  });

  it('blocks negative or decimal values for days', async () => {
    renderWithProviders(<PublicHolidayFormModal {...defaultProps} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Tên ngày nghỉ lễ *'), 'Ngày lễ test');

    const daysInput = screen.getByLabelText('Số ngày nghỉ *');
    await user.clear(daysInput);
    await user.type(daysInput, '0');

    await user.click(screen.getByRole('button', { name: 'Lưu' }));

    expect(await screen.findByText('Số ngày nghỉ phải là số nguyên dương lớn hơn 0')).toBeInTheDocument();
  });

  it('blocks selecting a past date when creating a holiday', async () => {
    renderWithProviders(<PublicHolidayFormModal {...defaultProps} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Tên ngày nghỉ lễ *'), 'Ngày lễ quá khứ');
    
    // Open DatePickerModal
    await user.click(screen.getByLabelText('Ngày bắt đầu *'));
    expect(screen.getByRole('heading', { name: 'Chọn Ngày Tháng Năm' })).toBeInTheDocument();

    // Select yesterday in calendar grid
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayLabel = `${yesterday.getDate()} Tháng ${yesterday.getMonth() + 1} Năm ${yesterday.getFullYear()}`;
    await user.click(screen.getByRole('button', { name: yesterdayLabel }));

    // Confirm selection
    await user.click(screen.getByRole('button', { name: 'Xác nhận' }));

    // Click Save
    await user.click(screen.getByRole('button', { name: 'Lưu' }));

    expect(await screen.findByText('Không được chọn ngày nghỉ lễ trong quá khứ')).toBeInTheDocument();
    expect(defaultProps.onSuccess).not.toHaveBeenCalled();
  });

  it('allows selecting today or a future date when creating a holiday', async () => {
    renderWithProviders(<PublicHolidayFormModal {...defaultProps} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Tên ngày nghỉ lễ *'), 'Ngày lễ tương lai');
    
    // Open DatePickerModal
    await user.click(screen.getByLabelText('Ngày bắt đầu *'));
    
    // Select tomorrow in calendar grid
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowLabel = `${tomorrow.getDate()} Tháng ${tomorrow.getMonth() + 1} Năm ${tomorrow.getFullYear()}`;
    await user.click(screen.getByRole('button', { name: tomorrowLabel }));

    // Confirm selection
    await user.click(screen.getByRole('button', { name: 'Xác nhận' }));

    // Click Save
    await user.click(screen.getByRole('button', { name: 'Lưu' }));

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });

  it('allows editing and saving even if the original date is in the past', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const holiday = {
      id: 'holiday-1',
      name: 'Tết Âm Lịch',
      start_date: yesterdayStr, // past date
      days: 5,
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

  it('formats ISO datetime with time correctly to DD/MM/YYYY in edit mode', () => {
    const holiday = {
      id: 'holiday-1',
      name: 'Tết Âm Lịch',
      start_date: '2026-02-17T00:00:00Z',
      days: 5,
      description: 'Nghỉ Tết Âm Lịch',
    };
    renderWithProviders(<PublicHolidayFormModal {...defaultProps} holiday={holiday} />);
    expect(screen.getByLabelText('Ngày bắt đầu *')).toHaveValue('17/02/2026');
  });

  it('opens DatePickerModal on Enter or Space key press on the date display input', async () => {
    renderWithProviders(<PublicHolidayFormModal {...defaultProps} />);
    const user = userEvent.setup();
    const dateInput = screen.getByLabelText('Ngày bắt đầu *');
    
    dateInput.focus();
    expect(dateInput).toHaveFocus();
    
    // Press Space
    await user.keyboard(' ');
    expect(screen.getByRole('heading', { name: 'Chọn Ngày Tháng Năm' })).toBeInTheDocument();

    // Cancel modal
    const heading = screen.getByRole('heading', { name: 'Chọn Ngày Tháng Năm' });
    const datePickerDialog = heading.closest('[role="dialog"]') as HTMLElement;
    if (!datePickerDialog) throw new Error('DatePickerModal dialog not found');
    const datePickerCancelBtn = within(datePickerDialog).getByRole('button', { name: 'Hủy' });
    await user.click(datePickerCancelBtn);
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Chọn Ngày Tháng Năm' })).not.toBeInTheDocument();
    });

    // Press Enter
    dateInput.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('heading', { name: 'Chọn Ngày Tháng Năm' })).toBeInTheDocument();
  });
});

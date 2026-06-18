import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DatePickerModal } from './DatePickerModal';
import { renderWithProviders } from '@shared/lib/test/test-utils';

describe('DatePickerModal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onChange: vi.fn(),
    value: '2026-05-26', // Tuesday
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with default value and grid calendar', () => {
    renderWithProviders(<DatePickerModal {...defaultProps} />);

    expect(screen.getByRole('heading', { name: 'Chọn Ngày Tháng Năm' })).toBeInTheDocument();
    
    // Select dropdowns should have correct values
    expect(screen.getByLabelText('Chọn tháng')).toHaveValue('4'); // 0-indexed May is 4
    expect(screen.getByLabelText('Chọn năm')).toHaveValue('2026');

    // Day 26 should be present and marked as selected
    const day26Button = screen.getByRole('button', { name: '26 Tháng 5 Năm 2026' });
    expect(day26Button).toBeInTheDocument();
    expect(day26Button.className).toContain('selected');
  });

  it('navigates to previous and next month using chevron buttons', async () => {
    renderWithProviders(<DatePickerModal {...defaultProps} />);
    const user = userEvent.setup();

    // Click previous month
    const prevBtn = screen.getByRole('button', { name: 'Tháng trước' });
    await user.click(prevBtn);

    expect(screen.getByLabelText('Chọn tháng')).toHaveValue('3'); // April

    // Click next month twice
    const nextBtn = screen.getByRole('button', { name: 'Tháng sau' });
    await user.click(nextBtn);
    await user.click(nextBtn);

    expect(screen.getByLabelText('Chọn tháng')).toHaveValue('5'); // June
  });

  it('updates view when changing dropdown selectors', async () => {
    renderWithProviders(<DatePickerModal {...defaultProps} />);
    
    const monthSelect = screen.getByLabelText('Chọn tháng');
    fireEvent.change(monthSelect, { target: { value: '11' } }); // December

    const yearSelect = screen.getByLabelText('Chọn năm');
    fireEvent.change(yearSelect, { target: { value: '2028' } });

    expect(monthSelect).toHaveValue('11');
    expect(yearSelect).toHaveValue('2028');

    // Verify grid renders December 2028 days
    expect(screen.getByRole('button', { name: '25 Tháng 12 Năm 2028' })).toBeInTheDocument();
  });

  it('calls onChange with selected date and closes on click confirm', async () => {
    renderWithProviders(<DatePickerModal {...defaultProps} />);
    const user = userEvent.setup();

    // Click on another day, e.g. 28th of May 2026
    const day28 = screen.getByRole('button', { name: '28 Tháng 5 Năm 2026' });
    await user.click(day28);

    // Confirm selection
    const confirmBtn = screen.getByRole('button', { name: 'Xác nhận' });
    await user.click(confirmBtn);

    expect(defaultProps.onChange).toHaveBeenCalledWith('2026-05-28');
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('does not call onChange and closes on click cancel', async () => {
    renderWithProviders(<DatePickerModal {...defaultProps} />);
    const user = userEvent.setup();

    // Select 28th
    const day28 = screen.getByRole('button', { name: '28 Tháng 5 Năm 2026' });
    await user.click(day28);

    // Click cancel
    const cancelBtn = screen.getByRole('button', { name: 'Hủy' });
    await user.click(cancelBtn);

    expect(defaultProps.onChange).not.toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('contains NO clear button', () => {
    renderWithProviders(<DatePickerModal {...defaultProps} />);
    
    expect(screen.queryByRole('button', { name: /Xóa/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Clear/i })).not.toBeInTheDocument();
  });

  it('includes the selected year in options even if it is outside currentYear - 5 to currentYear + 10', () => {
    const historicalProps = {
      ...defaultProps,
      value: '2010-05-26',
    };
    renderWithProviders(<DatePickerModal {...historicalProps} />);
    const yearSelect = screen.getByLabelText('Chọn năm');
    expect(yearSelect).toHaveValue('2010');
    
    // It should also have options around 2010
    expect(screen.getByRole('option', { name: 'Năm 2010' })).toBeInTheDocument();
  });

  it('disables days before minDate and after maxDate', async () => {
    const minMaxProps = {
      ...defaultProps,
      minDate: '2026-05-24',
      maxDate: '2026-05-28',
    };
    renderWithProviders(<DatePickerModal {...minMaxProps} />);

    // Day 23 should be disabled
    const day23 = screen.getByRole('button', { name: '23 Tháng 5 Năm 2026' });
    expect(day23).toBeDisabled();
    expect(day23.className).toContain('disabled');

    // Day 25 should be enabled
    const day25 = screen.getByRole('button', { name: '25 Tháng 5 Năm 2026' });
    expect(day25).not.toBeDisabled();
    expect(day25.className).not.toContain('disabled');

    // Day 29 should be disabled
    const day29 = screen.getByRole('button', { name: '29 Tháng 5 Năm 2026' });
    expect(day29).toBeDisabled();
    expect(day29.className).toContain('disabled');
  });
});

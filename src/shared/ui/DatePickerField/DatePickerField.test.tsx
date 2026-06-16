import React from 'react';
import { useForm } from 'react-hook-form';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DatePickerField } from './DatePickerField';
import { renderWithProviders } from '@shared/lib/test/test-utils';

interface WrapperProps {
  defaultValue?: string;
  required?: boolean;
  disabled?: boolean;
}

const TestFormWrapper: React.FC<WrapperProps> = ({ defaultValue = '2026-06-16', required = false, disabled = false }) => {
  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      testDate: defaultValue,
    },
  });

  return (
    <form onSubmit={handleSubmit(() => {})}>
      <DatePickerField
        name="testDate"
        label="Test Date Label"
        control={control}
        error={errors.testDate?.message}
        required={required}
        disabled={disabled}
      />
      <button type="submit">Submit</button>
    </form>
  );
};

describe('DatePickerField', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders input with formatted date when value is YYYY-MM-DD', () => {
    renderWithProviders(<TestFormWrapper defaultValue="2026-06-16" />);
    const input = screen.getByLabelText(/Test Date Label/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('16-06-2026'); // formatted to DD-MM-YYYY
  });

  it('opens DatePickerModal on click', async () => {
    renderWithProviders(<TestFormWrapper />);
    const user = userEvent.setup();
    const input = screen.getByLabelText(/Test Date Label/i);
    
    // modal should not be visible initially
    expect(screen.queryByRole('heading', { name: 'Chọn Ngày Tháng Năm' })).not.toBeInTheDocument();

    await user.click(input);

    // modal should open
    expect(await screen.findByRole('heading', { name: 'Chọn Ngày Tháng Năm' })).toBeInTheDocument();
  });

  it('does not open modal when disabled', async () => {
    renderWithProviders(<TestFormWrapper disabled={true} />);
    const user = userEvent.setup();
    const input = screen.getByLabelText(/Test Date Label/i);
    expect(input).toBeDisabled();

    await user.click(input);
    expect(screen.queryByRole('heading', { name: 'Chọn Ngày Tháng Năm' })).not.toBeInTheDocument();
  });
});

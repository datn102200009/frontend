import { render, screen } from '@testing-library/react';
import { Input } from './Input';
import { describe, it, expect, vi } from 'vitest';

describe('Input', () => {
  it('renders input with label correctly', () => {
    render(<Input label="Test Input" />);
    expect(screen.getByLabelText('Test Input')).toBeInTheDocument();
  });

  it('displays error message when provided', () => {
    render(<Input label="Test" error="Required field" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Required field');
  });

  it('defaults to decimals=0 (step="1") for number input', () => {
    render(<Input label="Num" type="number" />);
    const input = screen.getByLabelText('Num') as HTMLInputElement;
    expect(input.step).toBe('1');
    expect(input.inputMode).toBe('numeric');
  });

  it('sets step and inputMode correctly when decimals is provided', () => {
    const { rerender } = render(<Input label="Num" type="number" decimals={2} />);
    let input = screen.getByLabelText('Num') as HTMLInputElement;
    expect(input.step).toBe('0.01');
    expect(input.inputMode).toBe('decimal');

    rerender(<Input label="Num" type="number" decimals={3} />);
    input = screen.getByLabelText('Num') as HTMLInputElement;
    expect(input.step).toBe('0.001');

    rerender(<Input label="Num" type="number" decimals={0} />);
    input = screen.getByLabelText('Num') as HTMLInputElement;
    expect(input.step).toBe('1');
    expect(input.inputMode).toBe('numeric');
  });

  it('rounds controlled value according to decimals prop', () => {
    let currentValue = '1.50';
    const handleChange = vi.fn((e) => {
      currentValue = e.target.value;
    });

    const { rerender } = render(
      <Input label="Num" type="number" decimals={0} value={currentValue} onChange={handleChange} />
    );

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({ value: '2' })
      })
    );

    rerender(<Input label="Num" type="number" decimals={0} value={currentValue} onChange={handleChange} />);
    const input = screen.getByLabelText('Num') as HTMLInputElement;
    expect(input.value).toBe('2');
  });

  it('rounds uncontrolled defaultValue according to decimals prop', () => {
    render(<Input label="Num" type="number" decimals={2} defaultValue={1.005} />);
    const input = screen.getByLabelText('Num') as HTMLInputElement;
    expect(input.value).toBe('1.01');
  });
});

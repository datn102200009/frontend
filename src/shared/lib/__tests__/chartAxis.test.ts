import { describe, it, expect } from 'vitest';
import { formatYAxis } from '../chartAxis';

describe('formatYAxis', () => {
  it('should format values greater than or equal to 1 billion correctly', () => {
    expect(formatYAxis(2_500_000_000)).toBe('2.5 tỷ');
    expect(formatYAxis(1_000_000_000)).toBe('1.0 tỷ');
    expect(formatYAxis(10_300_000_000)).toBe('10.3 tỷ');
  });

  it('should format values greater than or equal to 1 million correctly', () => {
    expect(formatYAxis(1_500_000)).toBe('2 triệu'); // rounded to 2 million
    expect(formatYAxis(1_000_000)).toBe('1 triệu');
    expect(formatYAxis(999_999_999)).toBe('1000 triệu');
  });

  it('should format values less than 1 million correctly', () => {
    expect(formatYAxis(500_000)).toBe('500000');
    expect(formatYAxis(0)).toBe('0');
    expect(formatYAxis(123.45)).toBe('123');
  });
});

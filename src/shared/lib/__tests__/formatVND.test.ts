import { describe, it, expect } from 'vitest';
import { formatVND } from '../formatVND';

describe('formatVND', () => {
  it('should format numbers correctly to VND', () => {
    // Note: localestring currency format might use non-breaking spaces or different symbols depending on environment,
    // so we check if it contains the formatted digits and the currency symbol '₫'.
    const result = formatVND(123456);
    expect(result).toContain('123.456');
    expect(result).toContain('₫');
  });

  it('should format string numbers correctly to VND', () => {
    const result = formatVND('987654.32');
    expect(result).toContain('987.654');
    expect(result).toContain('₫');
  });

  it('should return 0 ₫ for null, undefined, or empty values', () => {
    expect(formatVND(null)).toBe('0 ₫');
    expect(formatVND(undefined)).toBe('0 ₫');
    expect(formatVND(NaN)).toBe('0 ₫');
  });

  it('should return 0 ₫ for non-numeric strings', () => {
    expect(formatVND('not-a-number')).toBe('0 ₫');
  });
});

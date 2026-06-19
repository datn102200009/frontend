import { describe, it, expect } from 'vitest';
import { formatNumber } from '../formatNumber';

describe('formatNumber', () => {
  it('should format numbers correctly with default decimals', () => {
    // default decimals = 0, vi-VN format uses dot '.' for thousands
    const result = formatNumber(123456.78);
    expect(result).toContain('123.457');
  });

  it('should format numbers with custom decimals', () => {
    expect(formatNumber(123456.789, 1)).toContain('123.456,8'); // rounded to 1 decimal place
    expect(formatNumber(123456, 0)).toContain('123.456');
    expect(formatNumber(123456.789, 3)).toContain('123.456,789');
  });

  it('should format string numbers correctly', () => {
    expect(formatNumber('987654.32', 2)).toContain('987.654,32');
  });

  it('should return "—" for null, undefined, or empty values', () => {
    expect(formatNumber(null)).toBe('—');
    expect(formatNumber(undefined)).toBe('—');
    expect(formatNumber('')).toBe('—');
    expect(formatNumber(NaN)).toBe('—');
  });

  it('should return "—" for non-numeric strings', () => {
    expect(formatNumber('not-a-number')).toBe('—');
  });
});

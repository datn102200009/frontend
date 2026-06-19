import { describe, it, expect } from 'vitest';
import { getCurrentPayrollPeriod, isCurrentPayrollPeriod } from '../lib/payrollPeriod';

describe('payrollPeriod helpers', () => {
  describe('getCurrentPayrollPeriod', () => {
    it('returns the current period as YYYY-MM based on the given reference date', () => {
      const ref = new Date('2026-06-19');
      expect(getCurrentPayrollPeriod(ref)).toBe('2026-06');
    });

    it('handles padding months correctly', () => {
      const ref = new Date('2026-05-01');
      expect(getCurrentPayrollPeriod(ref)).toBe('2026-05');
    });

    it('returns current period without reference date (system time)', () => {
      const result = getCurrentPayrollPeriod();
      expect(result).toMatch(/^\d{4}-\d{2}$/);
    });
  });

  describe('isCurrentPayrollPeriod', () => {
    it('returns true when period matches reference date period', () => {
      const ref = new Date('2026-06-19');
      expect(isCurrentPayrollPeriod('2026-06', ref)).toBe(true);
    });

    it('returns false when period does not match reference date period', () => {
      const ref = new Date('2026-06-19');
      expect(isCurrentPayrollPeriod('2026-05', ref)).toBe(false);
    });
  });
});

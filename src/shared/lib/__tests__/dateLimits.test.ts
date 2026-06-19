import { describe, it, expect } from 'vitest';
import { todayISO, shiftDays, shiftYears } from '../dateLimits';

describe('dateLimits helpers', () => {
  describe('todayISO', () => {
    it('returns today as YYYY-MM-DD', () => {
      const today = todayISO();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('shiftDays', () => {
    it('shifts days forward from string base date correctly', () => {
      expect(shiftDays(5, '2026-06-10')).toBe('2026-06-15');
    });

    it('shifts days backward from string base date correctly', () => {
      expect(shiftDays(-5, '2026-06-10')).toBe('2026-06-05');
    });

    it('handles month overflow correctly', () => {
      expect(shiftDays(5, '2026-05-28')).toBe('2026-06-02');
    });

    it('handles leap years correctly', () => {
      expect(shiftDays(1, '2028-02-28')).toBe('2028-02-29');
    });
  });

  describe('shiftYears', () => {
    it('shifts years forward correctly', () => {
      expect(shiftYears(5, '2026-06-10')).toBe('2031-06-10');
    });

    it('shifts years backward correctly', () => {
      expect(shiftYears(-16, '2026-06-10')).toBe('2010-06-10');
    });

    it('handles leap years shift correctly (Feb 29 to Feb 28)', () => {
      // 2028 is leap year, 2029 is not
      expect(shiftYears(1, '2028-02-29')).toBe('2029-02-28');
    });
  });
});

import { describe, it, expect } from 'vitest';
import { parseLocalDate, calculateHolidayAnalysis, getSelectedHolidayInfo } from '../holiday';
import type { PublicHoliday } from '../../model/types';

describe('holiday helpers', () => {
  describe('parseLocalDate', () => {
    it('parses YYYY-MM-DD format correctly into local date object', () => {
      const date = parseLocalDate('2026-05-01');
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(4); // May is 4
      expect(date.getDate()).toBe(1);
    });

    it('falls back to native parsing for invalid custom formats', () => {
      const date = parseLocalDate('2026/05/01');
      expect(date).toBeInstanceOf(Date);
    });
  });

  describe('calculateHolidayAnalysis and getSelectedHolidayInfo', () => {
    it('analyzes normal weekday holidays correctly', () => {
      // May 1st, 2026 is Friday
      const holidays: PublicHoliday[] = [
        { id: '1', name: 'Ngày Quốc tế Lao động', start_date: '2026-05-01', days: 1 },
      ];

      const analysis = calculateHolidayAnalysis(holidays);
      const info = getSelectedHolidayInfo('2026-05-01', analysis);

      expect(info).not.toBeNull();
      expect(info?.type).toBe('official');
      expect(info?.name).toBe('Ngày Quốc tế Lao động');
      expect(info?.isSunday).toBe(false);

      // Check date before and after
      expect(getSelectedHolidayInfo('2026-04-30', analysis)).toBeNull();
      expect(getSelectedHolidayInfo('2026-05-02', analysis)).toBeNull();
    });

    it('compensates holiday on Sunday to Monday', () => {
      // May 3rd, 2026 is Sunday
      const holidays: PublicHoliday[] = [
        { id: '1', name: 'Ngày Chiến thắng', start_date: '2026-05-03', days: 1 },
      ];

      const analysis = calculateHolidayAnalysis(holidays);

      // 1. Sunday (May 3rd) should be official holiday, and marked as Sunday overlap
      const sunInfo = getSelectedHolidayInfo('2026-05-03', analysis);
      expect(sunInfo).not.toBeNull();
      expect(sunInfo?.type).toBe('official');
      expect(sunInfo?.isSunday).toBe(true);
      expect(sunInfo?.compensatoryDayName).toBe('Thứ Hai');

      // 2. Monday (May 4th) should be compensatory holiday
      const monInfo = getSelectedHolidayInfo('2026-05-04', analysis);
      expect(monInfo).not.toBeNull();
      expect(monInfo?.type).toBe('compensatory');
      expect(monInfo?.name).toBe('Ngày Chiến thắng');
    });

    it('handles consecutive holiday blocks with Sunday overlap correctly', () => {
      // May 2nd (Saturday) to May 5th (Tuesday) - May 3rd is Sunday
      const holidays: PublicHoliday[] = [
        { id: '1', name: 'Đại lễ', start_date: '2026-05-02', days: 4 },
      ];

      const analysis = calculateHolidayAnalysis(holidays);

      // Saturday (May 2nd) - Official
      expect(getSelectedHolidayInfo('2026-05-02', analysis)?.type).toBe('official');

      // Sunday (May 3rd) - Official, Sunday overlap, compensated on Wednesday (since May 4th and 5th are already official)
      const sunInfo = getSelectedHolidayInfo('2026-05-03', analysis);
      expect(sunInfo?.type).toBe('official');
      expect(sunInfo?.isSunday).toBe(true);
      expect(sunInfo?.compensatoryDayName).toBe('Thứ Tư');

      // Monday (May 4th) - Official
      expect(getSelectedHolidayInfo('2026-05-04', analysis)?.type).toBe('official');

      // Tuesday (May 5th) - Official
      expect(getSelectedHolidayInfo('2026-05-05', analysis)?.type).toBe('official');

      // Wednesday (May 6th) - Compensatory
      const wedInfo = getSelectedHolidayInfo('2026-05-06', analysis);
      expect(wedInfo?.type).toBe('compensatory');
      expect(wedInfo?.name).toBe('Đại lễ');
    });
  });
});

import type { PublicHoliday } from '../api/hrmApi';

export const parseLocalDate = (dateStr: string): Date => {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return new Date(y, m, d);
  }
  return new Date(dateStr);
};

export interface HolidayAnalysisResult {
  officialMap: Map<string, PublicHoliday>;
  compensatoryMap: Map<string, PublicHoliday>;
  officialToCompensatoryMap: Map<string, string>;
}

export const calculateHolidayAnalysis = (holidays: PublicHoliday[]): HolidayAnalysisResult => {
  const officialMap = new Map<string, PublicHoliday>();
  holidays.forEach((h) => {
    if (!h.start_date) return;
    const start = parseLocalDate(h.start_date);
    const days = h.days || 1;
    for (let i = 0; i < days; i++) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, '0');
      const d = String(current.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      officialMap.set(dateStr, h);
    }
  });

  const sortedDates = Array.from(officialMap.keys()).sort((a, b) => {
    return new Date(a).getTime() - new Date(b).getTime();
  });

  const compensatoryMap = new Map<string, PublicHoliday>();
  const officialToCompensatoryMap = new Map<string, string>();
  sortedDates.forEach((dateStr) => {
    const d = parseLocalDate(dateStr);
    if (d.getDay() === 0) { // Sunday is rest day
      const compDate = new Date(d);
      compDate.setDate(d.getDate() + 1);

      const getFormatted = (dt: Date) => {
        const y = dt.getFullYear();
        const m = String(dt.getMonth() + 1).padStart(2, '0');
        const day = String(dt.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };

      while (
        compDate.getDay() === 0 ||
        officialMap.has(getFormatted(compDate)) ||
        compensatoryMap.has(getFormatted(compDate))
      ) {
        compDate.setDate(compDate.getDate() + 1);
      }
      const compDateStr = getFormatted(compDate);
      compensatoryMap.set(compDateStr, officialMap.get(dateStr)!);
      officialToCompensatoryMap.set(dateStr, compDateStr);
    }
  });

  return {
    officialMap,
    compensatoryMap,
    officialToCompensatoryMap,
  };
};

export interface SelectedHolidayInfo {
  type: 'official' | 'compensatory';
  name: string;
  isSunday?: boolean;
  compensatoryDayName?: string;
}

export const getSelectedHolidayInfo = (
  date: string,
  analysis: HolidayAnalysisResult
): SelectedHolidayInfo | null => {
  if (!date) return null;
  const official = analysis.officialMap.get(date);
  if (official) {
    const d = parseLocalDate(date);
    const isSunday = d.getDay() === 0;
    let compensatoryDayName = '';
    if (isSunday) {
      const compDateStr = analysis.officialToCompensatoryMap.get(date);
      if (compDateStr) {
        const compDate = parseLocalDate(compDateStr);
        const dayOfWeek = compDate.getDay();
        const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        compensatoryDayName = dayNames[dayOfWeek];
      }
    }
    return {
      type: 'official',
      name: official.name || '',
      isSunday,
      compensatoryDayName,
    };
  }
  const compensatory = analysis.compensatoryMap.get(date);
  if (compensatory) {
    return {
      type: 'compensatory',
      name: compensatory.name || '',
    };
  }
  return null;
};

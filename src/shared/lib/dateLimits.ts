const parseISO = (isoStr: string): Date => {
  const [y, m, d] = isoStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/** Trả về ISO date string (YYYY-MM-DD) cho hôm nay theo local timezone. */
export const todayISO = (): string => {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
};

/** Trả về ISO date string cộng/trừ `days` ngày từ baseDate (mặc định hôm nay). */
export const shiftDays = (days: number, baseDate?: string | Date): string => {
  const base = typeof baseDate === 'string'
    ? parseISO(baseDate)
    : (baseDate ? new Date(baseDate.getTime()) : new Date());
  base.setDate(base.getDate() + days);
  return [
    base.getFullYear(),
    String(base.getMonth() + 1).padStart(2, '0'),
    String(base.getDate()).padStart(2, '0'),
  ].join('-');
};

/** Trả về ISO date cộng/trừ `years` năm (dùng cho date_of_birth). */
export const shiftYears = (years: number, baseDate?: string | Date): string => {
  const base = typeof baseDate === 'string'
    ? parseISO(baseDate)
    : (baseDate ? new Date(baseDate.getTime()) : new Date());
  
  const originalMonth = base.getMonth();
  const originalDate = base.getDate();
  
  base.setFullYear(base.getFullYear() + years);
  
  // Handle leap year Feb 29 rolling over to March 1
  if (originalMonth === 1 && originalDate === 29 && base.getMonth() === 2) {
    base.setDate(28);
    base.setMonth(1);
  }

  return [
    base.getFullYear(),
    String(base.getMonth() + 1).padStart(2, '0'),
    String(base.getDate()).padStart(2, '0'),
  ].join('-');
};

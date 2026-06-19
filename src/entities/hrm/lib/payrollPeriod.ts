/**
 * Trả về kỳ lương hiện tại theo local timezone, định dạng YYYY-MM.
 */
export function getCurrentPayrollPeriod(referenceDate?: Date): string {
  const d = referenceDate ?? new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Kiểm tra kỳ lương có thuộc tháng hiện tại hay không.
 */
export function isCurrentPayrollPeriod(period: string, referenceDate?: Date): boolean {
  return period === getCurrentPayrollPeriod(referenceDate);
}

export function formatVND(value: number | string | null | undefined): string {
  if (value === undefined || value === null) return '0 ₫';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0 ₫';
  return num.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
}

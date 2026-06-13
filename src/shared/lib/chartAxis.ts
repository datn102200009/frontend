/**
 * Định dạng giá trị số cho trục Y biểu đồ theo đơn vị Việt Nam.
 * - value >= 1 tỷ -> "x.x tỷ" (1 chữ số thập phân)
 * - value >= 1 triệu -> "x triệu" (số nguyên)
 * - còn lại -> trả về số nguyên dạng string
 */
export function formatYAxis(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)} tỷ`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(0)} triệu`;
  }
  return String(Math.round(value));
}

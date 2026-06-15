/**
 * Làm tròn maxVal lên bội số đẹp (1, 2, 5 × 10^n) để các mốc Y-axis
 * (25%, 50%, 75%, 100%) ra số chẵn, dễ đọc.
 */
export function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const exponent = Math.floor(Math.log10(value));
  const fraction = value / Math.pow(10, exponent);
  let niceFraction: number;
  if (fraction <= 1) niceFraction = 1;
  else if (fraction <= 2) niceFraction = 2;
  else if (fraction <= 5) niceFraction = 5;
  else niceFraction = 10;
  return niceFraction * Math.pow(10, exponent);
}

const NICE_FRACTIONS = Array.from({ length: 36 }, (_, i) => 1 + i * 0.25);

/**
 * Tính toán mốc cao nhất cho trục Y của biểu đồ sao cho mốc cao nhất
 * chỉ nhỉnh hơn giá trị thực tế lớn nhất một khoảng nhỏ (headroomRatio, mặc định 12%)
 * và vẫn thuộc tập các bội số đẹp để chia lưới trục Y dễ nhìn.
 */
export function computeChartMax(maxVal: number, headroomRatio = 0.12): number {
  if (maxVal <= 0) return 1_000_000; // fallback an toàn
  const exponent = Math.floor(Math.log10(maxVal));
  const base = Math.pow(10, exponent);
  const target = maxVal * (1 + headroomRatio);
  
  // 1. Tìm ứng viên lý tưởng nằm trong khoảng mong muốn [maxVal, target]
  for (const fraction of NICE_FRACTIONS) {
    const candidate = fraction * base;
    if (candidate >= maxVal && candidate <= target) {
      return candidate;
    }
  }
  
  // 2. Nếu không có ứng viên lý tưởng, chọn số đẹp nhỏ nhất lớn hơn hoặc bằng maxVal
  for (const fraction of NICE_FRACTIONS) {
    const candidate = fraction * base;
    if (candidate >= maxVal) {
      return candidate;
    }
  }
  
  // Fallback cuối cùng
  return 1 * Math.pow(10, exponent + 1);
}


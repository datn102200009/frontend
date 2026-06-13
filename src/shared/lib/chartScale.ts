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

import { describe, it, expect } from 'vitest';
import { computeChartMax } from '../chartScale';

describe('computeChartMax', () => {
  it('should compute chart max with default headroom of 12%', () => {
    // 70M * 1.12 = 78.4M -> candidate 70M (fraction 7.0) is in range [70M, 78.4M]
    expect(computeChartMax(70_000_000)).toBe(70_000_000);

    // 120M * 1.12 = 134.4M -> candidate 125M is in range [120M, 134.4M]
    expect(computeChartMax(120_000_000)).toBe(125_000_000);

    // 800M * 1.12 = 896M -> candidate 800M (fraction 8.0) is in range [800M, 896M]
    expect(computeChartMax(800_000_000)).toBe(800_000_000);

    // 50M * 1.12 = 56M -> candidate 50M (fraction 5.0) is in range [50M, 56M]
    expect(computeChartMax(50_000_000)).toBe(50_000_000);
  });

  it('should handle custom headroom ratios', () => {
    // maxVal = 100, headroom = 0.20 -> target = 120. Candidate 100 is in [100, 120]
    expect(computeChartMax(100, 0.20)).toBe(100);

    // maxVal = 95, headroom = 0.05 -> target = 99.75. Candidate 95 is in [95, 99.75]
    expect(computeChartMax(95, 0.05)).toBe(95);
  });

  it('should handle boundary cases correctly', () => {
    expect(computeChartMax(0)).toBe(1_000_000);
    expect(computeChartMax(-100)).toBe(1_000_000);
    expect(computeChartMax(1)).toBe(1);
    expect(computeChartMax(2.5)).toBe(2.5);
    expect(computeChartMax(0.5)).toBe(0.5);
  });
});

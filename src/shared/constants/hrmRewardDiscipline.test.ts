import { describe, it, expect } from 'vitest';
import {
  getRewardTypeLabel,
  getDisciplineTypeLabel,
  REWARD_TYPE_OPTIONS,
  DISCIPLINE_TYPE_OPTIONS,
} from './hrmRewardDiscipline';

describe('hrmRewardDiscipline Constants & Helpers', () => {
  describe('getRewardTypeLabel', () => {
    it('returns the correct label for a valid reward type', () => {
      expect(getRewardTypeLabel('performance_bonus')).toBe('Thưởng hiệu quả công việc');
      expect(getRewardTypeLabel('initiative')).toBe('Thưởng sáng kiến');
      expect(getRewardTypeLabel('holiday_bonus')).toBe('Thưởng lễ tết');
      expect(getRewardTypeLabel('other')).toBe('Thưởng khác');
    });

    it('returns the input type as fallback for an invalid type', () => {
      expect(getRewardTypeLabel('invalid_type')).toBe('invalid_type');
    });

    it('returns - as fallback for null or undefined', () => {
      expect(getRewardTypeLabel(null)).toBe('-');
      expect(getRewardTypeLabel(undefined)).toBe('-');
    });
  });

  describe('getDisciplineTypeLabel', () => {
    it('returns the correct label for a valid discipline type', () => {
      expect(getDisciplineTypeLabel('reprimand')).toBe('Khiển trách');
      expect(getDisciplineTypeLabel('warning')).toBe('Cảnh cáo');
      expect(getDisciplineTypeLabel('salary_deduction')).toBe('Khấu trừ lương');
      expect(getDisciplineTypeLabel('termination')).toBe('Sa thải');
      expect(getDisciplineTypeLabel('other')).toBe('Kỉ luật khác');
    });

    it('returns the input type as fallback for an invalid type', () => {
      expect(getDisciplineTypeLabel('invalid_type')).toBe('invalid_type');
    });

    it('returns - as fallback for null or undefined', () => {
      expect(getDisciplineTypeLabel(null)).toBe('-');
      expect(getDisciplineTypeLabel(undefined)).toBe('-');
    });
  });

  describe('REWARD_TYPE_OPTIONS', () => {
    it('has exactly 4 options with valid keys and labels', () => {
      expect(REWARD_TYPE_OPTIONS).toHaveLength(4);
      expect(REWARD_TYPE_OPTIONS[0]).toEqual({ value: 'performance_bonus', label: 'Thưởng hiệu quả công việc' });
    });
  });

  describe('DISCIPLINE_TYPE_OPTIONS', () => {
    it('has exactly 5 options with valid keys and labels', () => {
      expect(DISCIPLINE_TYPE_OPTIONS).toHaveLength(5);
      expect(DISCIPLINE_TYPE_OPTIONS[1]).toEqual({ value: 'warning', label: 'Cảnh cáo' });
      expect(DISCIPLINE_TYPE_OPTIONS[3]).toEqual({ value: 'termination', label: 'Sa thải' });
    });
  });
});

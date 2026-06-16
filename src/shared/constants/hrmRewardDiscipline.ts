/**
 * Bộ nhãn chuẩn cho reward_type & discipline_type.
 * PHẢI đồng bộ với apps/hrm/models.py (REWARD_TYPES, DISCIPLINE_TYPES).
 * Tuyệt đối KHÔNG hard-code nhãn tiếng Việt ở component nào khác.
 */

export const REWARD_TYPE_LABELS: Record<string, string> = {
  performance_bonus: 'Thưởng hiệu quả công việc',
  initiative: 'Thưởng sáng kiến',
  holiday_bonus: 'Thưởng lễ tết',
  other: 'Thưởng khác',
};

export const DISCIPLINE_TYPE_LABELS: Record<string, string> = {
  reprimand: 'Khiển trách',
  warning: 'Cảnh cáo',
  salary_deduction: 'Khấu trừ lương',
  termination: 'Sa thải',
  other: 'Kỉ luật khác',
};

export const getRewardTypeLabel = (type?: string | null): string =>
  REWARD_TYPE_LABELS[type ?? ''] ?? type ?? '-';

export const getDisciplineTypeLabel = (type?: string | null): string =>
  DISCIPLINE_TYPE_LABELS[type ?? ''] ?? type ?? '-';

// Thứ tự ưu tiên xuất hiện trong dropdown
export const REWARD_TYPE_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'performance_bonus', label: REWARD_TYPE_LABELS.performance_bonus },
  { value: 'initiative', label: REWARD_TYPE_LABELS.initiative },
  { value: 'holiday_bonus', label: REWARD_TYPE_LABELS.holiday_bonus },
  { value: 'other', label: REWARD_TYPE_LABELS.other },
];

export const DISCIPLINE_TYPE_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'reprimand', label: DISCIPLINE_TYPE_LABELS.reprimand },
  { value: 'warning', label: DISCIPLINE_TYPE_LABELS.warning },
  { value: 'salary_deduction', label: DISCIPLINE_TYPE_LABELS.salary_deduction },
  { value: 'termination', label: DISCIPLINE_TYPE_LABELS.termination },
  { value: 'other', label: DISCIPLINE_TYPE_LABELS.other },
];

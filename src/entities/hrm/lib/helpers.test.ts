import { getLeaveTypeLabel } from './helpers';

describe('getLeaveTypeLabel', () => {
  it('correctly maps "paid" to "Nghỉ có lương"', () => {
    expect(getLeaveTypeLabel('paid')).toBe('Nghỉ có lương');
  });

  it('correctly maps "unpaid" to "Nghỉ không lương"', () => {
    expect(getLeaveTypeLabel('unpaid')).toBe('Nghỉ không lương');
  });

  it('returns raw value for other types (legacy/unknown)', () => {
    expect(getLeaveTypeLabel('annual')).toBe('annual');
    expect(getLeaveTypeLabel('sick')).toBe('sick');
    expect(getLeaveTypeLabel('custom-type')).toBe('custom-type');
  });

  it('returns fallback dash for undefined or null or empty value', () => {
    expect(getLeaveTypeLabel(undefined)).toBe('—');
    expect(getLeaveTypeLabel('')).toBe('—');
  });
});

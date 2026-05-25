export const getLeaveTypeLabel = (type?: string): string => {
  if (!type) return '—';
  switch (type) {
    case 'paid':
      return 'Nghỉ có lương';
    case 'unpaid':
      return 'Nghỉ không lương';
    default:
      return type; // Trả về chính giá trị type nếu là giá trị lạ/legacy/không xác định để tránh gán nhãn sai
  }
};

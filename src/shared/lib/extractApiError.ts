export const extractApiError = (err: unknown, fallback = 'Đã có lỗi xảy ra'): string => {
  if (typeof err === 'object' && err !== null) {
    if ('data' in err) {
      const data = (err as { data?: { error?: string; detail?: string } }).data;
      return data?.error ?? data?.detail ?? fallback;
    }
  }
  return fallback;
};

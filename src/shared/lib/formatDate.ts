export function formatDateVN(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  // Handle ISO strings with timezone or time
  const iso = dateStr.split('T')[0];
  const d = new Date(iso);
  if (isNaN(d.getTime())) return dateStr;
  
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  
  return `${dd}-${mm}-${yyyy}`;
}

export function formatDateTimeVN(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  
  return `${dd}-${mm}-${yyyy} ${hh}:${min}`;
}

export function formatDateShort(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  const iso = dateStr.split('T')[0];
  const d = new Date(iso);
  if (isNaN(d.getTime())) return dateStr;
  
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  
  return `${dd}-${mm}-${yy}`;
}

export const formatDate = formatDateVN;
export const formatDateTime = formatDateTimeVN;


import { Badge } from '@shared/ui/Badge/Badge';
import { formatDate } from './kpiListRowHelpers';

interface DeadlineBadgeProps {
  daysLeft: number | null | undefined;
  plannedEndDate?: string | null;
}

export function DeadlineBadge({ daysLeft, plannedEndDate }: DeadlineBadgeProps) {
  let variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' = 'info';
  let label = '';

  if (daysLeft === null || daysLeft === undefined) {
    variant = 'neutral';
    label = 'Chưa có hạn';
  } else if (daysLeft < 0) {
    variant = 'error';
    label = `Trễ ${Math.abs(daysLeft)} ngày`;
  } else if (daysLeft === 0) {
    variant = 'warning';
    label = 'Hạn hôm nay';
  } else if (daysLeft <= 3) {
    variant = 'warning';
    label = `Còn ${daysLeft} ngày`;
  } else if (daysLeft <= 7) {
    variant = 'info';
    label = `Còn ${daysLeft} ngày`;
  } else {
    variant = 'success';
    label = `Còn ${daysLeft} ngày`;
  }

  return (
    <Badge variant={variant}>
      <span>{label}</span>
      {plannedEndDate && <span style={{ marginLeft: 4 }}>({formatDate(plannedEndDate)})</span>}
    </Badge>
  );
}

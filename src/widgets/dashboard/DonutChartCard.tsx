import type { ReactNode } from 'react';
import { CardHeader } from './CardHeader';
import { Badge } from '@shared/ui/Badge/Badge';
import styles from './DashboardWidgets.module.css';

export interface DonutSegment {
  label: string;
  value: number;
  color_key: string;
}

export interface DonutChartCardProps {
  title: string;
  code: string;
  icon?: ReactNode;
  quickLinks?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

const COLOR_BY_KEY: Record<string, string> = {
  critical: 'var(--clr-error)',
  warning: 'var(--clr-warning)',
  normal: 'var(--clr-success)',
};

export function DonutChartCard({ title, icon, data, quickLinks }: DonutChartCardProps) {
  if (!data || !Array.isArray(data.segments)) {
  return (
  <div className={styles.card}>
  <CardHeader title={title} icon={icon} quickLinks={quickLinks} />
  <div className={styles.cardBody}>
  <div className={styles.emptyState}>
  <span>Chưa có dữ liệu</span>
  </div>
  </div>
  </div>
  );
  }

  const segments: DonutSegment[] = data.segments;
  const total = segments.reduce((acc, s) => acc + s.value, 0);
  const totalAlerts = data.total_alerts ?? 0;
  const topAlerts = Array.isArray(data.top_alerts) ? data.top_alerts : [];

  // Donut chart geometry
  const size = 120;
  const radius = 50;
  const cx = size / 2;
  const cy = size / 2;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * radius;

  let offsetAcc = 0;
  const segmentArcs = segments.map((seg) => {
  if (total === 0) {
  return { ...seg, dashArray: `0 ${circumference}`, dashOffset: 0 };
  }
  const portion = seg.value / total;
  const arcLength = circumference * portion;
  const dashArray = `${arcLength} ${circumference - arcLength}`;
  const dashOffset = -offsetAcc;
  offsetAcc += arcLength;
  return { ...seg, dashArray, dashOffset };
  });

  const alertsBadge =
  totalAlerts > 0 ? <Badge variant="error">{totalAlerts} cảnh báo</Badge> : null;

  return (
  <div className={styles.card}>
  <CardHeader title={title} icon={icon} quickLinks={quickLinks} meta={alertsBadge} />

  <div className={styles.cardBody}>
  <div className={styles.donutWrapper} data-testid="donut-svg">
  <svg
  width={size}
  height={size}
  viewBox={`0 0 ${size} ${size}`}
  className={styles.donutSvg}
  >
  <circle
  className={styles.donutBg}
  cx={cx}
  cy={cy}
  r={radius}
  fill="none"
  stroke="var(--clr-bg)"
  strokeWidth={strokeWidth}
  />
  {total > 0 &&
  segmentArcs.map((seg, idx) => (
  <circle
  key={idx}
  cx={cx}
  cy={cy}
  r={radius}
  fill="none"
  stroke={COLOR_BY_KEY[seg.color_key] || 'var(--clr-primary-500)'}
  strokeWidth={strokeWidth}
  strokeDasharray={seg.dashArray}
  strokeDashoffset={seg.dashOffset}
  transform={`rotate(-90 ${cx} ${cy})`}
  style={{ transition: 'stroke-dasharray 0.5s ease' }}
  />
  ))}
  </svg>
  <div className={styles.donutCenter}>
  <span className={styles.donutTotal}>{total}</span>
  <span className={styles.donutLabel}>mặt hàng</span>
  </div>
  </div>

  <div className={styles.donutLegend}>
  {segments.map((seg) => (
  <div key={seg.color_key} className={styles.donutLegendItem}>
  <span
  className={styles.donutLegendDot}
  style={{ background: COLOR_BY_KEY[seg.color_key] || 'var(--clr-primary-500)' }}
  />
  <span className={styles.donutLegendLabel}>{seg.label}</span>
  <span className={styles.donutLegendValue}>{seg.value}</span>
  </div>
  ))}
  </div>

  {topAlerts.length > 0 && (
  <div className={styles.donutTopList}>
  {topAlerts.slice(0, 5).map(
  (
  alert: {
  item_code: string;
  item_name: string;
  status: string;
  balance: string;
  uom: string;
  },
  idx: number,
  ) => (
  <div
  key={`${alert.item_code}-${idx}`}
  className={styles.donutTopRow}
  style={{
  borderLeftColor: COLOR_BY_KEY[alert.status] || 'var(--clr-warning)',
  }}
  >
  <span className={styles.donutTopName}>
  {alert.item_name || alert.item_code}
  </span>
  <span
  className={styles.donutTopMeta}
  style={{
  color:
  alert.status === 'critical'
  ? 'var(--clr-error)'
  : 'var(--clr-warning)',
   }}
  >
  {alert.balance} {alert.uom}
  </span>
  </div>
  ),
  )}
  </div>
  )}
  </div>
  </div>
  );
}

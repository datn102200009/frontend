import type { ReactNode } from 'react';
import { CardHeader } from './CardHeader';
import styles from './DashboardWidgets.module.css';

export interface GaugeCardProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
  title: string;
  code: string;
  icon?: ReactNode;
  quickLinks?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

export function GaugeCard({ title, icon, data, quickLinks, onRefresh, isRefreshing}: GaugeCardProps) {
  if (!data) {
    return (
      <div className={styles.card}>
        <CardHeader  title={title}  icon={icon}  quickLinks={quickLinks}  onRefresh={onRefresh} isRefreshing={isRefreshing} />
        <div className={styles.cardBody}>
          <div className={styles.emptyState}>
            <span>Chưa có dữ liệu</span>
          </div>
        </div>
      </div>
    );
  }

  const rate = Math.max(0, Math.min(100, Number(data.attendance_rate) || 0));
  const radius = 56;
  const cx = 70;
  const cy = 70;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - rate / 100);

  // Color based on rate
  let strokeColor = 'var(--clr-success)';
  if (rate < 60) strokeColor = 'var(--clr-error)';
  else if (rate < 80) strokeColor = 'var(--clr-warning)';

  return (
    <div className={styles.card}>
      <CardHeader  title={title}  icon={icon}  quickLinks={quickLinks}  onRefresh={onRefresh} isRefreshing={isRefreshing} />

      <div className={styles.cardBody}>
        <div className={styles.gaugeWrapper} data-testid="gauge-svg">
          <svg width="140" height="140" viewBox="0 0 140 140" className={styles.gaugeSvg}>
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke="var(--clr-border)"
              strokeWidth={strokeWidth}
            />
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${cx} ${cy})`}
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          <div className={styles.gaugeText}>
            <span className={styles.gaugeValue}>{rate.toFixed(1)}%</span>
          </div>
        </div>
        <div className={styles.metricFooter} style={{ justifyContent: 'center', marginTop: 'var(--sp-2)' }}>
          <span className={styles.metricSubtext} style={{ textAlign: 'center' }}>
            {data.absent_count ?? 0} người vắng
          </span>
        </div>
      </div>
    </div>
  );
}

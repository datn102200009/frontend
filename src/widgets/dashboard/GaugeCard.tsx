import type { ReactNode } from 'react';
import { CardHeader } from './CardHeader';
import styles from './DashboardWidgets.module.css';

export interface GaugeCardProps {
  title: string;
  code: string;
  icon?: ReactNode;
  quickLinks?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

export function GaugeCard({ title, icon, data, quickLinks }: GaugeCardProps) {
  if (!data) {
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

  const rate = Math.max(0, Math.min(100, Number(data.attendance_rate) || 0));
  const radius = 50;
  const cx = 60;
  const cy = 60;
  // Half-circle gauge: from 180deg (left) to 360deg (right)
  const circumference = Math.PI * radius; // half-circle
  const offset = circumference * (1 - rate / 100);

  // Color based on rate
  let strokeColor = 'var(--clr-success)';
  if (rate < 60) strokeColor = 'var(--clr-error)';
  else if (rate < 80) strokeColor = 'var(--clr-warning)';

  return (
    <div className={styles.card}>
      <CardHeader title={title} icon={icon} quickLinks={quickLinks} />

      <div className={styles.cardBody}>
        <div className={styles.gaugeWrapper} data-testid="gauge-svg">
          <svg width="120" height="80" viewBox="0 0 120 80">
            <path
              d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
              fill="none"
              stroke="var(--clr-bg)"
              strokeWidth="10"
              strokeLinecap="round"
            />
            <path
              d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
              fill="none"
              stroke={strokeColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          <div className={styles.gaugeText}>
            <span className={styles.gaugeValue}>{rate.toFixed(1)}%</span>
          </div>
        </div>
        <div className={styles.metricFooter} style={{ justifyContent: 'center', marginTop: 'var(--sp-2)' }}>
          <span className={styles.metricSubtext} style={{ textAlign: 'center' }}>
            Đi làm: {data.present_count ?? 0}/{data.total_active_employees ?? 0} (Vắng: {data.absent_count ?? 0})
          </span>
        </div>
      </div>
    </div>
  );
}

import styles from './DashboardWidgets.module.css';

export type SkeletonType =
  | 'kpi'
  | 'kpi_list'
  | 'donut_chart'
  | 'aging_bar'
  | 'gauge'
  | 'stacked_progress'
  | 'mini_chart'
  | 'list_mini'
  | 'list_summary'
  | 'metric'
  | 'line_chart'
  | 'cashflow_overview';

export interface SkeletonShimmerCardProps {
  type?: SkeletonType;
}

export function SkeletonShimmerCard({ type = 'kpi' }: SkeletonShimmerCardProps) {
  const isList = type === 'list_mini' || type === 'list_summary' || type === 'stacked_progress' || type === 'kpi_list';
  const isChart = type === 'mini_chart' || type === 'donut_chart' || type === 'aging_bar' || type === 'line_chart' || type === 'cashflow_overview';
  const isGauge = type === 'gauge';

  return (
    <div className={styles.shimmerCard}>
      <div className={styles.shimmerHeader}>
        <div className={styles.shimmerTitle} />
        <div className={styles.shimmerCircle} />
      </div>

      <div className={styles.shimmerBody}>
        {(type === 'kpi' || type === 'metric' || type === 'kpi_list') && (
          <>
            <div className={styles.shimmerValue} />
            <div className={styles.shimmerSubtext} />
          </>
        )}

        {isGauge && (
          <div
            style={{
              width: '120px',
              height: '80px',
              borderRadius: '50%',
              background: 'var(--clr-bg)',
              margin: '0 auto',
            }}
          />
        )}

        {isChart && (
          <div
            style={{
              width: '100%',
              height: '120px',
              borderRadius: '4px',
              background: 'var(--clr-bg)',
            }}
          />
        )}

        {isList && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={styles.shimmerRow}>
                <div className={styles.shimmerRowHeader}>
                  <div className={styles.shimmerLineLong} />
                  <div className={styles.shimmerLineShort} />
                </div>
                <div className={styles.shimmerRowHeader} style={{ marginTop: '4px' }}>
                  <div className={styles.shimmerLineShort} style={{ width: '40%' }} />
                  <div className={styles.shimmerLineShort} style={{ width: '15%' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

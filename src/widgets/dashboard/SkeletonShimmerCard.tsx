import styles from './DashboardWidgets.module.css';

export interface SkeletonShimmerCardProps {
  type?: 'metric' | 'list_summary' | 'mini_chart';
}

export function SkeletonShimmerCard({ type = 'metric' }: SkeletonShimmerCardProps) {
  return (
    <div className={styles.shimmerCard}>
      <div className={styles.shimmerHeader}>
        <div className={styles.shimmerTitle} />
        <div className={styles.shimmerCircle} />
      </div>

      <div className={styles.shimmerBody}>
        {type === 'metric' && (
          <>
            <div className={styles.shimmerValue} />
            <div className={styles.shimmerSubtext} />
          </>
        )}

        {type === 'list_summary' && (
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

        {type === 'mini_chart' && (
          <div style={{ width: '100%', height: '120px', borderRadius: '4px', background: 'var(--clr-bg)' }} />
        )}
      </div>
    </div>
  );
}

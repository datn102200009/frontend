import type { ReactNode } from 'react';
import { formatVND } from '@shared/lib/formatVND';
import { CardHeader } from './CardHeader';
import styles from './DashboardWidgets.module.css';

export interface AgingBucket {
  label: string;
  value: string;
  count: number;
  color_key: string;
}

export interface AgingBarChartCardProps {
  title: string;
  code: string;
  icon?: ReactNode;
  quickLinks?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

const COLOR_BY_KEY: Record<string, string> = {
  fresh: '#FDE68A',     // vàng nhạt
  aging: '#FCA5A5',     // hồng nhạt
  overdue: '#EF4444',   // đỏ
  critical: '#7F1D1D',  // đỏ đậm/maroon
};

export function AgingBarChartCard({ title, code, icon, data, quickLinks }: AgingBarChartCardProps) {
  if (!data || !Array.isArray(data.buckets)) {
    return (
      <div className={styles.card}>
        <CardHeader title={title} icon={icon} quickLinks={quickLinks} />
        <div className={styles.cardBody}>
          <div className={styles.emptyState}>
            <span>Chưa có dữ liệu phân tích nợ</span>
          </div>
        </div>
      </div>
    );
  }

  const buckets: AgingBucket[] = data.buckets;
  const totalOutstanding = formatVND(data.total_outstanding);
  const totalCount = data.total_count ?? 0;
  const topOverdue = Array.isArray(data.top_overdue) ? data.top_overdue : [];

  const totalNumeric = buckets.reduce((sum, b) => sum + (parseFloat(b.value) || 0), 0);

  // Donut chart geometry
  const size = 160;
  const radius = 56;
  const cx = size / 2;
  const cy = size / 2;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * radius;

  let offsetAcc = 0;
  const segmentArcs = buckets.map((bucket) => {
    const val = parseFloat(bucket.value) || 0;
    if (totalNumeric === 0) {
      return { ...bucket, val, dashArray: `0 ${circumference}`, dashOffset: 0 };
    }
    const portion = val / totalNumeric;
    const arcLength = circumference * portion;
    const dashArray = `${arcLength} ${circumference - arcLength}`;
    const dashOffset = -offsetAcc;
    offsetAcc += arcLength;
    return { ...bucket, val, dashArray, dashOffset };
  });

  return (
    <div className={styles.card}>
      <CardHeader title={title} icon={icon} quickLinks={quickLinks} />

      <div className={styles.cardBody}>
        {/* Total Outstanding Header */}
        <div className={styles.agingHeader}>
          <span className={styles.agingTotal}>{totalOutstanding}</span>
          <span className={styles.agingSubtext}>Tổng dư nợ</span>
        </div>

        {/* Visual Donut Chart & Legend Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <div className={styles.donutWrapper} data-testid="donut-svg" style={{ flexShrink: 0 }}>
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
              {totalNumeric > 0 &&
                segmentArcs.map((seg, idx) => {
                  if (seg.val === 0) return null;
                  return (
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
                  );
                })}
            </svg>
            <div className={styles.donutCenter}>
              <span className={styles.donutTotal}>{totalCount}</span>
              <span className={styles.donutLabel}>hoá đơn</span>
            </div>
          </div>

          {/* Legend */}
          <div className={styles.donutLegend} style={{ flex: 1, gap: '4px' }}>
            {buckets.map((bucket) => (
              <div key={bucket.color_key} className={styles.donutLegendItem}>
                <span
                  className={styles.donutLegendDot}
                  style={{ background: COLOR_BY_KEY[bucket.color_key] || 'var(--clr-primary-500)' }}
                />
                <span className={styles.donutLegendLabel}>
                  {bucket.label} ({bucket.count})
                </span>
                <span className={styles.donutLegendValue} style={{ fontWeight: 'semibold' }}>
                  {formatVND(bucket.value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Overdue List */}
        {topOverdue.length > 0 && (
          <div className={styles.donutTopList} style={{ marginTop: '8px' }}>
            <div className={styles.agingTopHeader} style={{ fontSize: 'var(--fs-xs)', fontWeight: 'bold', color: 'var(--clr-text-secondary)', marginBottom: '6px' }}>
              {code === 'finance_unpaid_purchase_invoices' ? 'Hóa đơn trễ hạn lâu nhất' : 'Khách nợ lâu nhất'}
            </div>
            {topOverdue.slice(0, 3).map((item: { id?: string; supplier_name?: string; customer_name?: string; overdue_days?: number; remaining_amount?: string | number }, idx: number) => {
              const name =
                (item.supplier_name as string | undefined) ||
                (item.customer_name as string | undefined) ||
                'N/A';
              const overdueDays = item.overdue_days ?? 0;
              return (
                <div
                  key={`${item.id}-${idx}`}
                  className={styles.donutTopRow}
                  style={{
                    borderLeft: `3px solid ${overdueDays > 30 ? 'var(--clr-error)' : 'var(--clr-warning)'}`,
                    padding: '6px 8px',
                    marginBottom: '4px',
                    background: 'var(--clr-bg)',
                    borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                  }}
                >
                  <span className={styles.donutTopName} style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text)' }}>
                    {name}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', flexShrink: 0 }}>
                    <span className={styles.donutTopAmount} style={{ fontSize: 'var(--fs-sm)', fontWeight: '600', color: 'var(--clr-text-secondary)' }}>
                      {formatVND(item.remaining_amount ?? 0)}
                    </span>
                    <span
                      className={styles.donutTopMeta}
                      style={{
                        fontSize: 'var(--fs-sm)',
                        fontWeight: 'bold',
                        color: overdueDays > 30 ? 'var(--clr-error)' : 'var(--clr-warning)',
                      }}
                    >
                      {overdueDays > 0 ? `Trễ ${overdueDays} ngày` : 'Mới'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

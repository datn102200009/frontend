import type { ReactNode } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { formatVND } from '@shared/lib/formatVND';
import { CardHeader } from './CardHeader';
import { Badge } from '@shared/ui/Badge/Badge';
import styles from './DashboardWidgets.module.css';

export interface KpiCardProps {
  title: string;
  code: string;
  icon?: ReactNode;
  quickLinks?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

function EmptyCard({ title, icon, quickLinks }: { title: string; icon?: ReactNode; quickLinks?: string[] }) {
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

export function KpiCard({ title, code, icon, data, quickLinks }: KpiCardProps) {
  if (!data) {
    return <EmptyCard title={title} icon={icon} quickLinks={quickLinks} />;
  }

  // ───────────────────────────────────────────────────────────────────────
  // sales_today_revenue: Hero metric + comparison row + breakdown
  // ───────────────────────────────────────────────────────────────────────

  // ───────────────────────────────────────────────────────────────────────
  // purchasing_active_po_count: Hero metric + breakdown
  // ───────────────────────────────────────────────────────────────────────
  if (code === 'purchasing_active_po_count') {
    const count = data.active_po_count ?? 0;
    return (
      <div className={styles.card}>
        <CardHeader title={title} icon={icon} quickLinks={quickLinks} />
        <div className={styles.cardBody}>
          <div className={styles.kpiEnhanced}>
            <div className={styles.kpiHero}>
              <span className={styles.kpiHeroValue}>{count}</span>
            </div>
            <div className={styles.kpiComparison}>
              <span className={styles.kpiComparisonLabel}>Tổng giá trị</span>
              <span className={styles.kpiComparisonValue}>
                {formatVND(data.total_pending_amount)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────
  // inventory_pending_entry_count: Hero metric + warning pill
  // ───────────────────────────────────────────────────────────────────────
  if (code === 'inventory_pending_entry_count') {
    const count = data.pending_entry_count ?? 0;
    const isHigh = count > 5;
    return (
      <div className={styles.card}>
        <CardHeader title={title} icon={icon} quickLinks={quickLinks} />
        <div className={styles.cardBody}>
          <div className={styles.kpiEnhanced}>
            <div className={styles.kpiHero}>
              <span
                className={styles.kpiHeroValue}
                style={{ color: isHigh ? 'var(--clr-warning)' : 'var(--clr-text)' }}
              >
                {count}
              </span>
            </div>
            {isHigh && (
              <div className={styles.kpiComparison}>
                <span className={styles.kpiComparisonLabel}>Trạng thái</span>
                <Badge variant="warning">Tồn đọng ({count} phiếu)</Badge>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────
  // finance_cashflow_summary: Net cashflow hero + breakdown
  // ───────────────────────────────────────────────────────────────────────

  // ───────────────────────────────────────────────────────────────────────
  // finance_depreciation_status: Status hero
  // ───────────────────────────────────────────────────────────────────────
  if (code === 'finance_depreciation_status') {
    const isDone = data.is_done === true;
    return (
      <div className={styles.card}>
        <CardHeader title={title} icon={icon} quickLinks={quickLinks} />
        <div className={styles.cardBody}>
          <div className={styles.metricContent}>
            <div className={styles.depreciationHero}>
              {isDone ? (
                <CheckCircle2 size={32} className={styles.depreciationIconDone} />
              ) : (
                <AlertCircle size={32} className={styles.depreciationIconPending} />
              )}
              <div className={styles.depreciationStatusRow}>
                <Badge variant={isDone ? `success` : `warning`}>
                  {isDone ? `Đã hoàn tất` : `Chưa thực hiện`}
                </Badge>
                <span className={styles.metricValue} style={{ fontSize: 'var(--fs-xl)' }}>
                  {formatVND(data.total_depreciation_amount)}
                </span>
              </div>
            </div>
            <div className={styles.metricFooter}>
              <span className={styles.metricSubtext}>
                {isDone
                  ? `${data.depreciated_assets_count ?? 0} tài sản đã trích khấu hao`
                  : `${data.pending_assets_count ?? 0} tài sản chờ trích khấu hao`}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────
  // hrm_payroll_lifecycle_status: Status hero
  // ───────────────────────────────────────────────────────────────────────
  if (code === 'hrm_payroll_lifecycle_status') {
    const statusVal: string = data.status || 'draft';
    let statusDisplay = 'Chưa khởi tạo';
    let statusClass = styles.colRedText;

    if (statusVal === 'draft') {
      statusDisplay = `Cần khởi tạo kỳ lương ${data.salary_period || ''}`;
      statusClass = styles.colRedText;
    } else if (statusVal === 'calculated') {
      statusDisplay = 'Chờ tính toán lương';
      statusClass = styles.colOrangeText;
    } else if (statusVal === 'submitted') {
      statusDisplay = `Chờ duyệt: ${data.calculated_slips_count || 0} phiếu lương`;
      statusClass = styles.colOrangeText;
    } else if (statusVal === 'approved') {
      statusDisplay = `Chờ chi: ${formatVND(data.net_pay_total)}`;
      statusClass = styles.colBoldLink;
    } else if (statusVal === 'paid') {
      statusDisplay = `Kỳ lương ${data.salary_period || ''} hoàn tất`;
      statusClass = styles.normalText;
    }

    return (
      <div className={styles.card}>
        <CardHeader title={title} icon={icon} quickLinks={quickLinks} />
        <div className={styles.cardBody}>
          <div className={styles.metricContent}>
            <div className={`${styles.metricValue} ${statusClass}`} style={{ fontSize: 'var(--fs-lg)' }}>
              {statusDisplay}
            </div>
            <div className={styles.metricFooter}>
              <span className={styles.metricSubtext}>
                Tổng thực chi: {formatVND(data.net_pay_total || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────
  // hrm_expiring_contracts: Hero metric + top 3 list
  // ───────────────────────────────────────────────────────────────────────
  if (code === 'hrm_expiring_contracts') {
    const expiring = data.expiring_count ?? 0;
    const critical = data.critical_count ?? 0;
    const topExpiring = Array.isArray(data.top_expiring) ? data.top_expiring : [];
    return (
      <div className={styles.card}>
        <CardHeader title={title} icon={icon} quickLinks={quickLinks} />
        <div className={styles.cardBody}>
          <div className={styles.kpiEnhanced}>
            <div className={styles.kpiHero}>
              <span
                className={styles.kpiHeroValue}
                style={{ color: critical > 0 ? 'var(--clr-error)' : 'var(--clr-warning)' }}
              >
                {expiring}
              </span>
            </div>

            {topExpiring.length > 0 && (
              <div className={styles.kpiTopList}>
                {topExpiring.slice(0, 3).map((c: { id: string; employee_name: string; days_left: number }) => (
                  <div key={c.id} className={styles.kpiTopRow}>
                    <span className={styles.kpiTopName}>{c.employee_name}</span>
                    <span
                      className={`${styles.kpiPill} ${styles.kpiPillSm} ${
                        c.days_left <= 7 ? styles.kpiPillDown : styles.kpiPillWarning
                      }`}
                    >
                      {c.days_left <= 0 ? 'Hết hạn' : `Còn ${c.days_left} ngày`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }



  // ───────────────────────────────────────────────────────────────────────
  // manufacturing_pending_completion: Hero metric + qty
  // ───────────────────────────────────────────────────────────────────────
  if (code === 'manufacturing_pending_completion') {
    return (
      <div className={styles.card}>
        <CardHeader title={title} icon={icon} quickLinks={quickLinks} />
        <div className={styles.cardBody}>
          <div className={styles.kpiEnhanced}>
            <div className={styles.kpiHero}>
              <span className={styles.kpiHeroValue}>{data.pending_completion_count ?? 0}</span>
            </div>
            {data.total_produced_qty && Number(data.total_produced_qty) > 0 && (
              <div className={styles.kpiComparison}>
                <span className={styles.kpiComparisonLabel}>Tổng SL</span>
                <span className={styles.kpiComparisonValue}>
                  {data.total_produced_qty}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────
  // Generic KPI fallback
  // ───────────────────────────────────────────────────────────────────────
  return (
    <div className={styles.card}>
      <CardHeader title={title} icon={icon} quickLinks={quickLinks} />
      <div className={styles.cardBody}>
        <div className={styles.metricContent}>
          <div className={styles.metricValue}>
            {data.value !== undefined ? String(data.value) : '—'}
          </div>
          {data.subtext && (
            <div className={styles.metricFooter}>
              <span className={styles.metricSubtext}>{String(data.subtext)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

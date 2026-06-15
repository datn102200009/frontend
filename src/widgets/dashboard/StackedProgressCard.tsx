import { useMemo, useState, type ReactNode } from 'react';
import { CardHeader } from './CardHeader';
import styles from './DashboardWidgets.module.css';
import { DeadlineBadge } from './DeadlineBadge';

export interface StackedProgressLine {
  id: string;
  name: string;
  production_item_name?: string;
  quantity: string;
  produced_qty: string;
  progress_pct: number;
  planned_start_date?: string;
  planned_end_date?: string | null;
  days_left?: number | null;
  target_warehouse_name?: string | null;
  created_at?: string;
}

export type StackedProgressSortKey = 'deadline' | 'progress';

export interface StackedProgressCardProps {
  title: string;
  code: string;
  icon?: ReactNode;
  quickLinks?: string[];
  data: StackedProgressLine[] | null | undefined;
  totalCount?: number;
  enableSort?: boolean;
}



export function StackedProgressCard({
  title,
  icon,
  data,
  quickLinks,
  enableSort = false,
}: StackedProgressCardProps) {
  const items = Array.isArray(data) ? data : [];
  const [sortKey, setSortKey] = useState<StackedProgressSortKey>('deadline');

  const sortedItems = useMemo(() => {
    if (!enableSort) return items;
    const arr = [...items];
    if (sortKey === 'deadline') {
      arr.sort((a, b) => {
        const da = a.days_left;
        const db = b.days_left;
        if (da === null || da === undefined) return 1;
        if (db === null || db === undefined) return -1;
        return da - db;
      });
    } else if (sortKey === 'progress') {
      arr.sort((a, b) => {
        const pa = a.progress_pct || 0;
        const pb = b.progress_pct || 0;
        return pb - pa;
      });
    }
    return arr;
  }, [items, sortKey, enableSort]);

  if (sortedItems.length === 0) {
    return (
      <div className={styles.card}>
        <CardHeader title={title} icon={icon} quickLinks={quickLinks} />
        <div className={styles.cardBody}>
          <div className={styles.emptyState}>
            <span>Không có lệnh sản xuất đang chạy</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <CardHeader title={title} icon={icon} quickLinks={quickLinks} />

      <div className={styles.cardBody}>
        {enableSort && (
          <div className={styles.kpiListTabFilter} role="radiogroup" aria-label="Sắp xếp lệnh sản xuất">
            <button
              type="button"
              role="radio"
              aria-checked={sortKey === 'deadline'}
              className={`${styles.tabBtn} ${sortKey === 'deadline' ? styles.tabBtnActive : ''}`}
              onClick={() => setSortKey('deadline')}
            >
              Theo deadline
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={sortKey === 'progress'}
              className={`${styles.tabBtn} ${sortKey === 'progress' ? styles.tabBtnActive : ''}`}
              onClick={() => setSortKey('progress')}
            >
              Theo % hoàn thành
            </button>
          </div>
        )}

        <div className={styles.stackedList}>
          {sortedItems.map((item) => {
            const qty = parseFloat(item.quantity) || 0;
            const produced = parseFloat(item.produced_qty) || 0;
            const computedPct = qty > 0 ? (produced / qty) * 100 : 0;
            const pct = Math.max(0, Math.min(100, typeof item.progress_pct === 'number' ? item.progress_pct : computedPct));
            return (
              <div key={item.id} className={styles.stackedRow}>
                <div className={styles.stackedRowHeader}>
                  <div className={styles.stackedRowInfo}>
                    <span className={styles.stackedRowName}>{item.name}</span>
                    <div className={styles.stackedRowSubtext}>{item.production_item_name}</div>
                  </div>
                  <div className={styles.stackedRowPctGroup}>
                    <span className={styles.stackedRowPct}>{pct.toFixed(0)}%</span>
                    <DeadlineBadge daysLeft={item.days_left} plannedEndDate={item.planned_end_date} />
                  </div>
                </div>
                <div className={styles.stackedTrack}>
                  <div className={styles.stackedFill} style={{ width: `${pct}%` }} />
                </div>
                <div className={styles.stackedRowFooter}>
                  <span className={styles.stackedRowQty}>
                    {item.produced_qty}/{item.quantity}
                  </span>
                  {item.target_warehouse_name && (
                    <span className={styles.stackedRowWarehouse}>{item.target_warehouse_name}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

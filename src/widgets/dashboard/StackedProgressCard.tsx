import type { ReactNode } from 'react';
import { CardHeader } from './CardHeader';
import styles from './DashboardWidgets.module.css';

export interface StackedProgressLine {
  id: string;
  name: string;
  production_item_name?: string;
  quantity: string;
  produced_qty: string;
  progress_pct: number;
  planned_start_date?: string;
  target_warehouse_name?: string | null;
  created_at?: string;
}

export interface StackedProgressCardProps {
  title: string;
  code: string;
  icon?: ReactNode;
  quickLinks?: string[];
  data: StackedProgressLine[] | null | undefined;
  totalCount?: number;
}

export function StackedProgressCard({
  title,
  icon,
  data,
  quickLinks,
}: StackedProgressCardProps) {
  const items = Array.isArray(data) ? data : [];

  if (items.length === 0) {
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
        <div className={styles.stackedList}>
          {items.map((item) => {
            const qty = parseFloat(item.quantity) || 0;
            const produced = parseFloat(item.produced_qty) || 0;
            const computedPct = qty > 0 ? (produced / qty) * 100 : 0;
            const pct = Math.max(0, Math.min(100, typeof item.progress_pct === 'number' ? item.progress_pct : computedPct));
            return (
              <div key={item.id} className={styles.stackedRow}>
                <div className={styles.stackedRowHeader}>
                  <span className={styles.stackedRowName}>{item.name}</span>
                  <span className={styles.stackedRowPct}>{pct.toFixed(0)}%</span>
                </div>
                <div className={styles.stackedRowSubtext}>{item.production_item_name}</div>
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

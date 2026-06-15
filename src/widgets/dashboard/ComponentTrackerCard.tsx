import type { ReactNode } from 'react';
import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { CardHeader } from './CardHeader';
import { SearchableSelect } from '@shared/ui/Select/SearchableSelect';
import styles from './DashboardWidgets.module.css';

export interface ComponentTrackerCardProps {
  title: string;
  code: string; // 'inventory_low_stock'
  icon?: ReactNode;
  quickLinks?: string[];
  data: {
    items: Array<{
      id: string;
      item_code: string;
      item_name: string;
      uom: string;
      status: string; // 'critical' | 'warning' | 'normal'
      reason: string;
      alerts: Array<{
        category: 'dos' | 'below_threshold' | 'projected_shortage';
        level: 'critical' | 'warning' | 'normal';
        reason: string;
      }>;
    }>;
    product_distribution: Record<string, Record<string, string>>; // product_id -> warehouse_id -> balance
    warehouses: Array<{ id: string; name: string }>;
    total_count: number;
  };
}

const COLORS = [
  'var(--clr-primary-500)',
  'var(--clr-warning)',
  'var(--clr-success)',
  'var(--clr-info)',
  'var(--clr-error)',
  'var(--clr-secondary)',
  'var(--clr-accent)',
];

export function ComponentTrackerCard({ title, icon, data, quickLinks }: ComponentTrackerCardProps) {
  const items = Array.isArray(data?.items) ? data.items : [];
  
  const [selectedProductId, setSelectedProductId] = useState<string>(
    items[0]?.id ?? ''
  );

  if (items.length === 0) {
    return (
      <div className={styles.card}>
        <CardHeader title={title} icon={icon} quickLinks={quickLinks} />
        <div className={styles.cardBody}>
          <div className={styles.emptyState}>
            <span>Chưa có dữ liệu theo dõi linh kiện</span>
          </div>
        </div>
      </div>
    );
  }

  const selectedItem = items.find((i) => i.id === selectedProductId) || items[0];
  const currentDistribution = data.product_distribution?.[selectedItem.id] ?? {};

  // Build segments from distribution (always return 4 warehouses)
  const segments = data.warehouses.map((wh, idx) => {
    const valStr = currentDistribution[wh.id] ?? '0';
    const value = parseFloat(valStr);
    return {
      label: wh.name,
      value,
      valStr,
      color: COLORS[idx % COLORS.length],
    };
  });

  const total = segments.reduce((acc, s) => acc + s.value, 0);

  // SVG Donut Math
  const size = 120;
  const radius = 50;
  const cx = size / 2;
  const cy = size / 2;
  const strokeWidth = 16;
  const circumference = 2 * Math.PI * radius;

  let offsetAcc = 0;
  // Filter for arcs only where value > 0
  const segmentArcs = segments
    .filter((s) => s.value > 0)
    .map((seg) => {
      const portion = total === 0 ? 0 : seg.value / total;
      const arcLength = circumference * portion;
      const dashArray = `${arcLength} ${circumference - arcLength}`;
      const dashOffset = -offsetAcc;
      offsetAcc += arcLength;
      return { ...seg, dashArray, dashOffset };
    });

  const alertCount = items.filter(
    (i) => i.status === 'critical' || i.status === 'warning'
  ).length;

  const alertBadge =
    alertCount > 0 ? (
      <span
        className="shared-badge"
        style={{
          background: 'var(--clr-error-bg)',
          color: 'var(--clr-error)',
          fontSize: 'var(--fs-xs)',
          fontWeight: 'bold',
          padding: '1px 6px',
          borderRadius: '10px',
        }}
      >
        {alertCount} cảnh báo
      </span>
    ) : null;

  return (
    <div className={styles.card}>
      <CardHeader title={title} icon={icon} quickLinks={quickLinks} meta={alertBadge} />

      <div className={styles.cardBody}>
        <div className={styles.componentTrackerSelect}>
          <SearchableSelect
            options={items.map((i) => {
              const belowAlert = i.alerts.find((a) => a.category === 'below_threshold');
              const shortageAlert = i.alerts.find((a) => a.category === 'projected_shortage');
              return {
                value: i.id,
                label: i.item_name,
                meta: {
                  status: i.status,
                  belowActive: !!belowAlert,
                  belowLevel: belowAlert?.level,
                  shortageActive: !!shortageAlert,
                  shortageLevel: shortageAlert?.level,
                },
              };
            })}
            value={selectedProductId}
            onChange={(val) => setSelectedProductId(val)}
            ariaLabel="Chọn sản phẩm theo dõi"
            placeholder="Tìm và chọn sản phẩm..."
            renderOption={(opt) => {
              const meta = opt.meta || {};
              const belowActive = meta.belowActive as boolean;
              const belowLevel = meta.belowLevel as string;
              const shortageActive = meta.shortageActive as boolean;
              const hasAlerts = 'belowActive' in meta;

              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {hasAlerts ? (
                    <>
                      {belowActive && (
                        <AlertTriangle
                          size={14}
                          style={{
                            color: belowLevel === 'critical' ? 'var(--clr-error)' : 'var(--clr-warning)',
                            flexShrink: 0,
                          }}
                        />
                      )}
                      {shortageActive && (
                        <AlertTriangle
                          size={14}
                          style={{
                            color: 'var(--clr-warning)',
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </>
                  ) : (
                    (meta.status === 'critical' || meta.status === 'warning') && (
                      <AlertTriangle
                        size={14}
                        style={{
                          color: meta.status === 'critical' ? 'var(--clr-error)' : 'var(--clr-warning)',
                          flexShrink: 0,
                        }}
                      />
                    )
                  )}
                  <span>{opt.label}</span>
                </div>
              );
            }}
          />
        </div>

        <div className={styles.componentTrackerContent}>
          <div className={styles.componentTrackerMain}>
            <div className={styles.componentTrackerDonut} data-testid="donut-svg">
              <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle
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
                      stroke={seg.color}
                      strokeWidth={strokeWidth}
                      strokeDasharray={seg.dashArray}
                      strokeDashoffset={seg.dashOffset}
                      transform={`rotate(-90 ${cx} ${cy})`}
                      style={{ transition: 'stroke-dasharray 0.5s ease' }}
                    />
                  ))}
              </svg>
              <div className={styles.donutCenter}>
                <span className={styles.donutTotal} style={{ fontSize: total === 0 ? 'var(--fs-xl)' : 'var(--fs-2xl)' }}>
                  {total === 0 ? '0' : total.toLocaleString('vi-VN')}
                </span>
                <span className={styles.donutLabel}>{total === 0 ? 'Hết hàng' : selectedItem.uom}</span>
              </div>
            </div>

            <div className={styles.componentTrackerLegend}>
              {segments.length === 0 ? (
                <div className={styles.rowSubText} style={{ textAlign: 'center', width: '100%' }}>
                  Hết hàng trên mọi kho
                </div>
              ) : (
                segments.map((seg) => (
                  <div key={seg.label} className={styles.donutLegendItem}>
                    <span className={styles.donutLegendDot} style={{ background: seg.color }} />
                    <span className={styles.donutLegendLabel}>{seg.label}</span>
                    <span className={styles.donutLegendValue}>
                      {seg.value.toLocaleString('vi-VN')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {selectedItem && (
            <div className={styles.componentTrackerAlerts}>
              {selectedItem.alerts.map((alert, idx) => {
                const isCritical = alert.level === 'critical';
                const isProjected = alert.category === 'projected_shortage';
                const variantClass = isCritical
                  ? styles.componentTrackerAlertCritical
                  : isProjected
                    ? styles.componentTrackerAlertProjected
                    : styles.componentTrackerAlertBelow;
                return (
                  <div key={`${alert.category}-${idx}`} className={variantClass}>
                    <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                    <span>{alert.reason}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

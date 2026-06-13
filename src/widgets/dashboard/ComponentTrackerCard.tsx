import type { ReactNode } from 'react';
import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { CardHeader } from './CardHeader';
import { FormSelect } from '@shared/ui/Select/FormSelect';
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
      status: string; // 'critical' | 'warning'
      reason: string;
    }>;
    product_distribution: Record<string, Record<string, string>>; // product_id -> warehouse_id -> balance
    warehouses: Array<{ id: string; name: string }>;
    total_count: number;
  };
}

const COLORS = [
  'var(--clr-primary-500)',
  'var(--clr-warning-500)',
  'var(--clr-success-500)',
  'var(--clr-info-500)',
  'var(--clr-error-500)',
  'var(--clr-primary-300)',
  'var(--clr-warning-300)',
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

  // Build segments from distribution
  const segments = data.warehouses
    .map((wh, idx) => {
      const valStr = currentDistribution[wh.id] ?? '0';
      const value = parseFloat(valStr);
      return {
        label: wh.name,
        value,
        valStr,
        color: COLORS[idx % COLORS.length],
      };
    })
    .filter((s) => s.value > 0);

  const total = segments.reduce((acc, s) => acc + s.value, 0);

  // SVG Donut Math
  const size = 120;
  const radius = 50;
  const cx = size / 2;
  const cy = size / 2;
  const strokeWidth = 16;
  const circumference = 2 * Math.PI * radius;

  let offsetAcc = 0;
  const segmentArcs = segments.map((seg) => {
    const portion = total === 0 ? 0 : seg.value / total;
    const arcLength = circumference * portion;
    const dashArray = `${arcLength} ${circumference - arcLength}`;
    const dashOffset = -offsetAcc;
    offsetAcc += arcLength;
    return { ...seg, dashArray, dashOffset };
  });

  const alertBadge =
    data.total_count > 0 ? (
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
        {data.total_count} cảnh báo
      </span>
    ) : null;

  return (
    <div className={styles.card}>
      <CardHeader title={title} icon={icon} quickLinks={quickLinks} meta={alertBadge} />

      <div className={styles.cardBody}>
        <div className={styles.componentTrackerSelect}>
          <FormSelect
            label="Chọn sản phẩm theo dõi"
            options={items.map((i) => ({
              value: i.id,
              label: `${i.item_code} - ${i.item_name}`,
            }))}
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            size="sm"
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
                <span className={styles.donutTotal} style={{ fontSize: 'var(--fs-2xl)' }}>
                  {total.toLocaleString('vi-VN')}
                </span>
                <span className={styles.donutLabel}>{selectedItem.uom}</span>
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

          {selectedItem && (selectedItem.status === 'critical' || selectedItem.status === 'warning') && (
            <div
              className={styles.componentTrackerWarning}
              style={{
                borderLeftColor:
                  selectedItem.status === 'critical' ? 'var(--clr-error-500)' : 'var(--clr-warning-500)',
                backgroundColor:
                  selectedItem.status === 'critical' ? 'var(--clr-error-50)' : 'var(--clr-warning-50)',
                color:
                  selectedItem.status === 'critical' ? 'var(--clr-error-700)' : 'var(--clr-warning-700)',
              }}
            >
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              <span>{selectedItem.reason}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

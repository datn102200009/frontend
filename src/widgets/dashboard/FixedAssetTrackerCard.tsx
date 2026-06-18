import type { ReactNode } from 'react';
import { useState } from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { CardHeader } from './CardHeader';
import { SearchableSelect } from '@shared/ui/Select/SearchableSelect';
import { formatVND } from '@shared/lib/formatVND';
import styles from './DashboardWidgets.module.css';

export interface FixedAssetTrackerCardProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
  title: string;
  code: string;
  icon?: ReactNode;
  quickLinks?: string[];
  data: {
    items: Array<{
      id: string;
      asset_code: string;
      asset_name: string;
      depreciation_method: 'straight_line' | 'unit_of_production';
      original_value: string;
      salvage_value: string;
      accumulated_depreciation: string;
      remaining_value: string;
      status: 'active' | 'disposed';
      alerts: Array<{
        category: 'disposed' | 'fully_depreciated' | 'near_end' | 'uop_unassigned';
        level: 'critical' | 'warning' | 'normal';
        reason: string;
      }>;
    }>;
    total_count: number;
    current_period: string;
    is_done: boolean;
    depreciated_assets_count: number;
    pending_assets_count: number;
  };
}

const COLORS = {
  accumulated: 'var(--clr-gray-500, #9ca3af)', // Xám
  remaining: 'var(--clr-success)',              // Green
  salvage: 'var(--clr-info)',                  // Cyan
};

export function FixedAssetTrackerCard({ title, icon, data, quickLinks, onRefresh, isRefreshing}: FixedAssetTrackerCardProps) {
  const items = Array.isArray(data?.items) ? data.items : [];
  
  const [selectedAssetId, setSelectedAssetId] = useState<string>(
    items[0]?.id ?? ''
  );

  if (items.length === 0) {
    return (
      <div className={styles.card}>
        <CardHeader  title={title}  icon={icon}  quickLinks={quickLinks}  onRefresh={onRefresh} isRefreshing={isRefreshing} />
        <div className={styles.cardBody}>
          <div className={styles.emptyState}>
            <span>Chưa có dữ liệu theo dõi khấu hao tài sản cố định</span>
          </div>
        </div>
      </div>
    );
  }

  const selectedItem = items.find((i) => i.id === selectedAssetId) || items[0];

  const originalVal = parseFloat(selectedItem.original_value || '0');
  const accumulatedVal = parseFloat(selectedItem.accumulated_depreciation || '0');
  const remainingVal = parseFloat(selectedItem.remaining_value || '0');

  const segments = [
    {
      label: 'Lũy kế khấu hao',
      value: accumulatedVal,
      color: COLORS.accumulated,
    },
    {
      label: 'Giá trị còn lại',
      value: remainingVal,
      color: COLORS.remaining,
    },
  ];

  const total = originalVal;

  // SVG Donut Math
  const size = 120;
  const radius = 50;
  const cx = size / 2;
  const cy = size / 2;
  const strokeWidth = 16;
  const circumference = 2 * Math.PI * radius;

  let offsetAcc = 0;
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




  return (
    <div className={styles.card}>
      <CardHeader  title={title}  icon={icon}  quickLinks={quickLinks}  onRefresh={onRefresh} isRefreshing={isRefreshing} />

      <div className={styles.cardBody}>
        <div className={styles.componentTrackerSelect}>
          <SearchableSelect
            options={items.map((i) => {
              const criticalAlert = i.alerts.find((a) => a.level === 'critical');
              const warningAlert = i.alerts.find((a) => a.level === 'warning');
              const status = criticalAlert ? 'critical' : warningAlert ? 'warning' : 'normal';
              return {
                value: i.id,
                label: i.asset_name,
                meta: { status },
              };
            })}
            value={selectedAssetId}
            onChange={(val) => setSelectedAssetId(val)}
            ariaLabel="Chọn tài sản theo dõi"
            placeholder="Tìm và chọn tài sản..."
            renderOption={(opt) => {
              const meta = opt.meta || {};
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {(meta.status === 'critical' || meta.status === 'warning') && (
                    <AlertTriangle
                      size={14}
                      style={{
                        color: meta.status === 'critical' ? 'var(--clr-error)' : 'var(--clr-warning)',
                        flexShrink: 0,
                      }}
                    />
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
              <div className={styles.donutCenter} aria-hidden="true" />
            </div>

            <div className={styles.componentTrackerLegend}>
              {segments.map((seg) => (
                <div key={seg.label} className={styles.donutLegendItem}>
                  <span className={styles.donutLegendDot} style={{ background: seg.color }} />
                  <span className={styles.donutLegendLabel}>{seg.label}</span>
                  <span className={styles.donutLegendValue}>
                    {formatVND(seg.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {selectedItem && (
            <div className={styles.componentTrackerAlerts}>
              {selectedItem.alerts
                .filter((alert) => alert.category !== 'uop_unassigned')
                .map((alert, idx) => {
                const isCritical = alert.level === 'critical';
                const isNormal = alert.level === 'normal';
                const variantClass = isCritical
                  ? styles.componentTrackerAlertCritical
                  : isNormal
                    ? styles.componentTrackerAlertProjected
                    : styles.componentTrackerAlertBelow;
                return (
                  <div key={`${alert.category}-${idx}`} className={variantClass}>
                    {isNormal ? (
                      <Info size={18} style={{ flexShrink: 0 }} />
                    ) : (
                      <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                    )}
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

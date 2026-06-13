import { type ReactNode, type MouseEvent, useState } from 'react';
import { CardHeader } from './CardHeader';
import styles from './DashboardWidgets.module.css';

export interface LineChartCardProps {
  title: string;
  code: string;
  icon?: ReactNode;
  quickLinks?: string[];
  data: {
    points?: {
      date: string;
      revenue: string;
    }[];
  } | null | undefined;
}

const formatYAxis = (value: number) => {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)} tỷ`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(0)} tr`;
  }
  return String(value);
};

const formatVND = (valueStr: string | number) => {
  const num = typeof valueStr === 'string' ? parseFloat(valueStr) || 0 : valueStr;
  return num.toLocaleString('vi-VN') + ' ₫';
};

const formatDate = (dateStr: string) => {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

const formatShortDate = (dateStr: string) => {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`;
  }
  return dateStr;
};

export function LineChartCard({ title, code, icon, data, quickLinks }: LineChartCardProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  if (code !== 'sales_today_revenue' || !data || !Array.isArray(data.points) || data.points.length === 0) {
    return (
      <div className={styles.card}>
        <CardHeader title={title} icon={icon} quickLinks={quickLinks} />
        <div className={styles.cardBody}>
          <div className={styles.emptyState}>
            <span>Chưa có dữ liệu biểu đồ doanh thu</span>
          </div>
        </div>
      </div>
    );
  }

  const points = data.points;

  // Chart layout dimensions
  const svgWidth = 500;
  const svgHeight = 220;
  const plotLeft = 60;
  const plotRight = 20;
  const plotTop = 20;
  const plotBottom = 30;

  const plotWidth = svgWidth - plotLeft - plotRight; // 420
  const plotHeight = svgHeight - plotTop - plotBottom; // 170
  const zeroY = svgHeight - plotBottom; // 190

  // Calculate scales
  const revenues = points.map((p) => parseFloat(p.revenue) || 0);
  const maxVal = Math.max(...revenues, 1_000_000);
  const chartMax = maxVal * 1.15; // 15% head room

  // Calculate 5 Y-axis grid lines
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((pct) => {
    const value = chartMax * pct;
    const y = zeroY - pct * plotHeight;
    return { y, value };
  });

  const colWidth = plotWidth / (points.length - 1 || 1);

  // Compute exact coordinates for each data point
  const chartPoints = points.map((p, idx) => {
    const x = plotLeft + idx * colWidth;
    const val = parseFloat(p.revenue) || 0;
    const y = zeroY - (val / chartMax) * plotHeight;
    return { x, y, ...p };
  });

  // Polyline coordinates string
  const polylinePointsStr = chartPoints.map((pt) => `${pt.x},${pt.y}`).join(' ');

  // Gradient area path string: starts at bottom-left, goes along line, then bottom-right
  const areaPathStr = `M ${plotLeft} ${zeroY} ` + 
    chartPoints.map((pt) => `L ${pt.x} ${pt.y}`).join(' ') + 
    ` L ${plotLeft + (points.length - 1) * colWidth} ${zeroY} Z`;

  const handleMouseMove = (index: number, e: MouseEvent<SVGRectElement>) => {
    const cardRect = e.currentTarget.closest(`.${styles.card}`)?.getBoundingClientRect();
    if (cardRect) {
      setTooltipPos({
        x: e.clientX - cardRect.left + 15,
        y: e.clientY - cardRect.top - 65,
      });
      setHoveredIndex(index);
    }
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
    setTooltipPos(null);
  };

  const activePoint = hoveredIndex !== null ? chartPoints[hoveredIndex] : null;

  const todayPoint = points[points.length - 1];
  const todayRevenue = todayPoint ? parseFloat(todayPoint.revenue) || 0 : 0;

  return (
    <div className={styles.card} style={{ position: 'relative' }}>
      <CardHeader title={title} icon={icon} quickLinks={quickLinks} />

      <div className={styles.cardBody}>
        <div className={styles.kpiHero} style={{ marginBottom: 'var(--sp-4)' }}>
          <span className={styles.kpiHeroValue}>{formatVND(todayRevenue)}</span>
          <span className={styles.kpiHeroSub}>Hôm nay</span>
        </div>

        <div className={styles.chartContainer}>
          <div className={styles.chartWrapper} style={{ height: '100%', minHeight: '180px' }}>
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              width="100%"
              height="100%"
              style={{ overflow: 'visible' }}
            >
              <defs>
                <linearGradient id="lineChartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--clr-primary)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--clr-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>

              {/* Y Grid Lines & Labels */}
              {gridLines.map((line, idx) => (
                <g key={idx}>
                  <line
                    x1={plotLeft}
                    y1={line.y}
                    x2={svgWidth - plotRight}
                    y2={line.y}
                    stroke="var(--clr-border)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={plotLeft - 10}
                    y={line.y + 4}
                    textAnchor="end"
                    className={styles.lineChartAxisLabel}
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {formatYAxis(line.value)}
                  </text>
                </g>
              ))}

              {/* Area path with gradient */}
              <path d={areaPathStr} className={styles.lineChartArea} />

              {/* Line path */}
              <polyline points={polylinePointsStr} className={styles.lineChartPath} />

              {/* Markers & Interaction Zones */}
              {chartPoints.map((pt, idx) => {
                const isHovered = hoveredIndex === idx;
                const isToday = idx === points.length - 1;
                
                // Highlight marker on hover or for "Today" (last item)
                const markerRadius = isHovered ? 6 : (isToday ? 5 : 4);

                return (
                  <g key={idx}>
                    {/* Vertical guideline on hover */}
                    {isHovered && (
                      <line
                        x1={pt.x}
                        y1={plotTop}
                        x2={pt.x}
                        y2={zeroY}
                        stroke="var(--clr-primary)"
                        strokeWidth="1.5"
                        strokeDasharray="2 2"
                        opacity={0.6}
                      />
                    )}

                    {/* Outer glow for today's point */}
                    {isToday && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={8}
                        fill="var(--clr-primary)"
                        opacity={0.2}
                      />
                    )}

                    {/* Point Marker */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={markerRadius}
                      className={`${styles.lineChartMarker} ${isToday ? styles.lineChartMarkerToday : ''}`}
                    />

                    {/* X-axis label */}
                    <text
                      x={pt.x}
                      y={zeroY + 18}
                      textAnchor="middle"
                      fill={isHovered ? 'var(--clr-text)' : 'var(--clr-text-secondary)'}
                      fontWeight={isHovered ? 'semibold' : 'normal'}
                      fontSize="11"
                    >
                      {formatShortDate(pt.date)}
                    </text>

                    {/* Invisible hover zone rect */}
                    <rect
                      x={pt.x - colWidth / 2}
                      y={plotTop}
                      width={colWidth}
                      height={plotHeight + plotBottom}
                      fill="transparent"
                      cursor="pointer"
                      onMouseMove={(e) => handleMouseMove(idx, e)}
                      onMouseLeave={handleMouseLeave}
                    />
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Hover Tooltip */}
      {activePoint && tooltipPos && (
        <div
          style={{
            position: 'absolute',
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            background: 'var(--clr-surface)',
            border: '1.5px solid var(--clr-border)',
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
            fontSize: 'var(--fs-xs)',
            zIndex: 10,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            transition: 'left 0.1s ease, top 0.1s ease',
          }}
        >
          <span style={{ fontWeight: 'bold', color: 'var(--clr-text)' }}>
            {formatDate(activePoint.date)}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--clr-primary)' }} />
            <span style={{ color: 'var(--clr-text-secondary)' }}>Doanh thu:</span>
            <span style={{ fontWeight: 'bold', color: 'var(--clr-text)', fontFamily: 'var(--font-heading)', fontVariantNumeric: 'tabular-nums' }}>
              {formatVND(activePoint.revenue)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

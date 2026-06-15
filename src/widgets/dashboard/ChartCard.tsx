import { type ReactNode, type MouseEvent, useState } from 'react';
import { CardHeader } from './CardHeader';
import { computeChartMax } from '../../shared/lib/chartScale';
import { formatVND } from '../../shared/lib/formatVND';
import { formatYAxis } from '../../shared/lib/chartAxis';
import {
  CHART_SVG_WIDTH,
  CHART_SVG_HEIGHT,
  CHART_PLOT_LEFT,
  CHART_PLOT_RIGHT,
  CHART_PLOT_TOP,
  CHART_PLOT_BOTTOM,
  TOOLTIP_ESTIMATED_WIDTH,
  TOOLTIP_OFFSET,
} from '../../shared/lib/chartLayout';
import styles from './DashboardWidgets.module.css';

export interface ChartCardProps {
  title: string;
  code: string;
  icon?: ReactNode;
  quickLinks?: string[];
  data: {
    weeks?: {
      week_label: string;
      receive: number;
      pay: number;
    }[];
  } | null | undefined;
}

interface WeekData {
  week_label: string;
  receive: number;
  pay: number;
}



export function ChartCard({ title, code, icon, data, quickLinks }: ChartCardProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  if (code !== 'finance_cashflow_chart' || !data || !Array.isArray(data.weeks)) {
    return (
      <div className={styles.card}>
        <CardHeader title={title} icon={icon} quickLinks={quickLinks} />
        <div className={styles.cardBody}>
          <div className={styles.emptyState}>
            <span>Chưa có dữ liệu biểu đồ</span>
          </div>
        </div>
      </div>
    );
  }

  const weeks: WeekData[] = data.weeks;

  // Chart coordinate calculation parameters
  const svgWidth = CHART_SVG_WIDTH;
  const svgHeight = CHART_SVG_HEIGHT;
  const plotLeft = CHART_PLOT_LEFT;
  const plotRight = CHART_PLOT_RIGHT;
  const plotTop = CHART_PLOT_TOP;
  const plotBottom = CHART_PLOT_BOTTOM;

  const plotWidth = svgWidth - plotLeft - plotRight; // 420
  const plotHeight = svgHeight - plotTop - plotBottom; // 170
  const zeroY = svgHeight - plotBottom; // 190

  // Calculate max value in data to scale Y axis
  const maxVal = Math.max(
    ...weeks.map((w) => Math.max(w.receive, w.pay)),
    1_000_000 // Fallback minimum scale
  );
  const chartMax = computeChartMax(maxVal, 0.12);

  // Calculate grid lines (5 lines: 0%, 25%, 50%, 75%, 100%)
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((pct) => {
    const value = chartMax * pct;
    const y = zeroY - pct * plotHeight;
    return { y, value };
  });

  // Calculate bars dimensions
  const groupWidth = plotWidth / weeks.length; // 105
  const barWidth = 22;
  const barGap = 6;
  const totalBarWidth = barWidth * 2 + barGap; // 50
  const groupOffset = (groupWidth - totalBarWidth) / 2; // 27.5

  const handleMouseMove = (index: number, e: MouseEvent<SVGRectElement>) => {
    const cardRect = e.currentTarget.closest(`.${styles.card}`)?.getBoundingClientRect();
    if (!cardRect) return;

    const cardWidth = cardRect.width;
    const pointerXInCard = e.clientX - cardRect.left;
    const spaceRight = cardWidth - pointerXInCard;

    const x = spaceRight < TOOLTIP_ESTIMATED_WIDTH + TOOLTIP_OFFSET
      ? pointerXInCard - TOOLTIP_ESTIMATED_WIDTH - TOOLTIP_OFFSET
      : pointerXInCard + TOOLTIP_OFFSET;

    const y = Math.max(8, e.clientY - cardRect.top - 70);

    setTooltipPos({ x: Math.max(8, x), y });
    setHoveredIndex(index);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
    setTooltipPos(null);
  };

  const activeWeek = hoveredIndex !== null ? weeks[hoveredIndex] : null;

  const chartLegend = (
    <div className={styles.cardActions} style={{ display: 'flex', gap: '12px', fontSize: 'var(--fs-xs)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--clr-primary)', display: 'inline-block' }} />
        <span style={{ color: 'var(--clr-text-secondary)' }}>Dòng thu</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--clr-warning)', display: 'inline-block' }} />
        <span style={{ color: 'var(--clr-text-secondary)' }}>Dòng chi</span>
      </div>
    </div>
  );

  return (
    <div className={styles.card} style={{ position: 'relative' }}>
      <CardHeader title={title} icon={icon} quickLinks={quickLinks} meta={chartLegend} />

      <div className={styles.cardBody}>
        <div className={styles.chartContainer}>
          <div className={styles.chartWrapper} style={{ height: '100%', minHeight: '180px' }}>
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              width="100%"
              height="100%"
              style={{ overflow: 'visible' }}
            >
              <defs>
                <linearGradient id="receiveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--clr-primary)" stopOpacity={1} />
                  <stop offset="100%" stopColor="var(--clr-primary-600)" stopOpacity={0.8} />
                </linearGradient>
                <linearGradient id="payGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--clr-warning)" stopOpacity={1} />
                  <stop offset="100%" stopColor="var(--clr-warning)" stopOpacity={0.7} />
                </linearGradient>
              </defs>

              {/* Grid Lines & Y-Axis Labels */}
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
                    fill="var(--clr-text-secondary)"
                    fontSize="11"
                    fontFamily="var(--font-heading)"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {formatYAxis(line.value)}
                  </text>
                </g>
              ))}

              {/* Draw Chart Bars */}
              {weeks.map((w, idx) => {
                const groupX = plotLeft + idx * groupWidth;
                const bar1X = groupX + groupOffset;
                const bar2X = bar1X + barWidth + barGap;

                // Scale bar heights
                const bar1Height = (w.receive / chartMax) * plotHeight;
                const bar2Height = (w.pay / chartMax) * plotHeight;

                const bar1Y = zeroY - bar1Height;
                const bar2Y = zeroY - bar2Height;

                const isHovered = hoveredIndex === idx;

                return (
                  <g key={idx}>
                    {/* Background hover highlights */}
                    {isHovered && (
                      <rect
                        x={groupX}
                        y={plotTop}
                        width={groupWidth}
                        height={plotHeight}
                        fill="rgba(5, 85, 104, 0.03)"
                        rx="4"
                      />
                    )}

                    {/* Bar 1: Receive */}
                    <rect
                      x={bar1X}
                      y={bar1Y}
                      width={barWidth}
                      height={bar1Height}
                      fill="url(#receiveGrad)"
                      rx="4"
                      style={{
                        transition: 'all 0.2s ease',
                        transformOrigin: `${bar1X + barWidth / 2}px ${zeroY}px`,
                        transform: isHovered ? 'scaleX(1.05)' : 'none',
                      }}
                    />

                    {/* Bar 2: Pay */}
                    <rect
                      x={bar2X}
                      y={bar2Y}
                      width={barWidth}
                      height={bar2Height}
                      fill="url(#payGrad)"
                      rx="4"
                      style={{
                        transition: 'all 0.2s ease',
                        transformOrigin: `${bar2X + barWidth / 2}px ${zeroY}px`,
                        transform: isHovered ? 'scaleX(1.05)' : 'none',
                      }}
                    />

                    {/* X Axis Label */}
                    <text
                      x={groupX + groupWidth / 2}
                      y={zeroY + 18}
                      textAnchor="middle"
                      fill={isHovered ? 'var(--clr-text)' : 'var(--clr-text-secondary)'}
                      fontWeight={isHovered ? 'semibold' : 'normal'}
                      fontSize="11"
                    >
                      {w.week_label}
                    </text>

                    {/* Invisible hover zone */}
                    <rect
                      x={groupX}
                      y={plotTop}
                      width={groupWidth}
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

      {/* Premium Interactive Hover Tooltip */}
      {activeWeek && tooltipPos && (
        <div
          style={{
            position: 'absolute',
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            background: 'var(--clr-surface)',
            border: '1.5px solid var(--clr-border)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
            fontSize: 'var(--fs-xs)',
            zIndex: 10,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            transition: 'left 0.1s ease, top 0.1s ease',
          }}
        >
          <span style={{ fontWeight: 'bold', color: 'var(--clr-text)', marginBottom: '2px' }}>
            {activeWeek.week_label}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--clr-primary)' }} />
            <span style={{ color: 'var(--clr-text-secondary)' }}>Dòng thu:</span>
            <span style={{ fontWeight: 'bold', color: 'var(--clr-text)', fontFamily: 'var(--font-heading)', fontVariantNumeric: 'tabular-nums' }}>
              {formatVND(activeWeek.receive)}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--clr-warning)' }} />
            <span style={{ color: 'var(--clr-text-secondary)' }}>Dòng chi:</span>
            <span style={{ fontWeight: 'bold', color: 'var(--clr-text)', fontFamily: 'var(--font-heading)', fontVariantNumeric: 'tabular-nums' }}>
              {formatVND(activeWeek.pay)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

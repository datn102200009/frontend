import { type ReactNode, type MouseEvent, useState } from 'react';
import { CardHeader } from './CardHeader';
import { computeChartMax } from '../../shared/lib/chartScale';
import { formatVND } from '../../shared/lib/formatVND';
import { formatYAxis } from '../../shared/lib/chartAxis';
import {
  CHART_SVG_WIDTH,
  CASHFLOW_SVG_HEIGHT,
  CHART_PLOT_LEFT,
  CHART_PLOT_RIGHT,
  CASHFLOW_PLOT_TOP,
  CASHFLOW_PLOT_BOTTOM,
  TOOLTIP_ESTIMATED_WIDTH,
  TOOLTIP_OFFSET,
} from '../../shared/lib/chartLayout';
import styles from './DashboardWidgets.module.css';

export interface CashflowOverviewCardProps {
  title: string;
  code: string;
  icon?: ReactNode;
  quickLinks?: string[];
  data: {
    summary?: {
      receive_total: string;
      pay_total: string;
      net_cashflow: string;
      tx_count: number;
      period_label?: string;
    };
    weeks?: {
      week_label: string;
      receive: number;
      pay: number;
    }[];
  } | null | undefined;
}



export function CashflowOverviewCard({ title, code, icon, data, quickLinks }: CashflowOverviewCardProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  if (code !== 'finance_cashflow_overview' || !data || !data.summary || !Array.isArray(data.weeks)) {
    return (
      <div className={styles.card}>
        <CardHeader title={title} icon={icon} quickLinks={quickLinks} />
        <div className={styles.cardBody}>
          <div className={styles.emptyState}>
            <span>Chưa có dữ liệu dòng tiền</span>
          </div>
        </div>
      </div>
    );
  }

  const { summary, weeks } = data;
  const netVal = parseFloat(summary.net_cashflow) || 0;
  const isNetPositive = netVal >= 0;

  // Chart layout dimensions
  const svgWidth = CHART_SVG_WIDTH;
  const svgHeight = CASHFLOW_SVG_HEIGHT;
  const plotLeft = CHART_PLOT_LEFT;
  const plotRight = CHART_PLOT_RIGHT;
  const plotTop = CASHFLOW_PLOT_TOP;
  const plotBottom = CASHFLOW_PLOT_BOTTOM;

  const plotWidth = svgWidth - plotLeft - plotRight; // 420
  const plotHeight = svgHeight - plotTop - plotBottom; // 110
  const zeroY = svgHeight - plotBottom; // 120

  // Calculate max value in weeks data to scale Y axis
  const maxVal = Math.max(
    ...weeks.map((w) => Math.max(w.receive, w.pay)),
    1_000_000 // Fallback minimum scale
  );
  const chartMax = computeChartMax(maxVal, 0.12);

  // Calculate 4 Y-axis grid lines (0%, 33%, 66%, 100%)
  const gridLines = [0, 0.33, 0.66, 1].map((pct) => {
    const value = chartMax * pct;
    const y = zeroY - pct * plotHeight;
    return { y, value };
  });

  // Calculate bars dimensions
  const groupWidth = plotWidth / (weeks.length || 1);
  const barWidth = 18;
  const barGap = 4;
  const totalBarWidth = barWidth * 2 + barGap;
  const groupOffset = (groupWidth - totalBarWidth) / 2;

  const handleMouseMove = (index: number, e: MouseEvent<SVGRectElement>) => {
    const cardRect = e.currentTarget.closest(`.${styles.card}`)?.getBoundingClientRect();
    if (!cardRect) return;

    const cardWidth = cardRect.width;
    const pointerXInCard = e.clientX - cardRect.left;
    const spaceRight = cardWidth - pointerXInCard;

    const x = spaceRight < TOOLTIP_ESTIMATED_WIDTH + TOOLTIP_OFFSET
      ? pointerXInCard - TOOLTIP_ESTIMATED_WIDTH - TOOLTIP_OFFSET
      : pointerXInCard + TOOLTIP_OFFSET;

    const y = Math.max(8, e.clientY - cardRect.top - 65);

    setTooltipPos({ x: Math.max(8, x), y });
    setHoveredIndex(index);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
    setTooltipPos(null);
  };

  const activeWeek = hoveredIndex !== null ? weeks[hoveredIndex] : null;

  return (
    <div className={styles.card} style={{ position: 'relative' }}>
      <CardHeader title={title} icon={icon} quickLinks={quickLinks} />

      <div className={styles.cardBody}>
        <div className={styles.cashflowOverviewBody}>
          {/* Top Summary Section */}
          <div className={styles.cashflowSummary}>
            <div className={styles.cashflowSummaryHero}>
              <span className={styles.cashflowSummaryHeroLabel}>
                Dòng tiền ròng {summary.period_label || 'tháng này'}
              </span>
              <span
                className={styles.cashflowSummaryValue}
                style={{ color: isNetPositive ? 'var(--clr-success)' : 'var(--clr-error)' }}
              >
                {isNetPositive ? '+' : ''}
                {formatVND(netVal)}
              </span>
            </div>
            
            <div className={styles.cashflowSummaryBreakdown}>
              <div className={styles.cashflowSummaryRow}>
                <span className={styles.cashflowSummaryLabel}>
                  <span className={styles.dotReceive} />
                  Tổng thu
                </span>
                <span className={styles.cashflowRowValue}>
                  {formatVND(summary.receive_total)}
                </span>
              </div>
              <div className={styles.verticalDivider} />
              <div className={styles.cashflowSummaryRow}>
                <span className={styles.cashflowSummaryLabel}>
                  <span className={styles.dotPay} />
                  Tổng chi
                </span>
                <span className={styles.cashflowRowValue}>
                  {formatVND(summary.pay_total)}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Chart Section */}
          <div className={styles.cashflowChartWrapper}>
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              width="100%"
              height="100%"
              style={{ overflow: 'visible' }}
            >
              <defs>
                <linearGradient id="cfReceiveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--clr-primary)" stopOpacity={1} />
                  <stop offset="100%" stopColor="var(--clr-primary)" stopOpacity={0.7} />
                </linearGradient>
                <linearGradient id="cfPayGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--clr-warning)" stopOpacity={1} />
                  <stop offset="100%" stopColor="var(--clr-warning)" stopOpacity={0.7} />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
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

              {/* Draw Weekly Bars */}
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
                      fill="url(#cfReceiveGrad)"
                      rx="3"
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
                      fill="url(#cfPayGrad)"
                      rx="3"
                      style={{
                        transition: 'all 0.2s ease',
                        transformOrigin: `${bar2X + barWidth / 2}px ${zeroY}px`,
                        transform: isHovered ? 'scaleX(1.05)' : 'none',
                      }}
                    />

                    {/* X Axis Label */}
                    <text
                      x={groupX + groupWidth / 2}
                      y={zeroY + 16}
                      textAnchor="middle"
                      fill={isHovered ? 'var(--clr-text)' : 'var(--clr-text-secondary)'}
                      fontWeight={isHovered ? 'semibold' : 'normal'}
                      fontSize="10"
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

      {/* Tooltip */}
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

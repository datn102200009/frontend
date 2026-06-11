import type { ReactNode } from 'react';
import styles from './DashboardWidgets.module.css';

export interface MetricCardProps {
  title: string;
  code: string;
  icon?: ReactNode;
  data: any;
}

export function formatVND(value: number | string) {
  if (value === undefined || value === null) return '0 ₫';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0 ₫';
  return num.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
}

export function MetricCard({ title, code, icon, data }: MetricCardProps) {
  let displayValue: string | number = '—';
  let displaySubtext: string = '';
  let trend: { type: 'up' | 'down'; text: string } | null = null;

  if (data) {
    switch (code) {
      case 'sales_today_revenue':
        displayValue = formatVND(data.revenue);
        displaySubtext = `${data.order_count} đơn hàng hôm nay`;
        if (data.revenue > 0) {
          trend = { type: 'up', text: 'Hoạt động' };
        }
        break;

      case 'purchasing_active_po_count':
        displayValue = data.active_po_count;
        displaySubtext = 'Đơn mua hàng đang chạy';
        break;

      case 'inventory_pending_entry_count':
        displayValue = data.pending_entry_count;
        displaySubtext = 'Phiếu kho nháp chờ duyệt';
        if (data.pending_entry_count > 5) {
          trend = { type: 'down', text: 'Tồn đọng' }; // Down is warning here
        }
        break;

      case 'finance_cashflow_summary':
        displayValue = formatVND(data.net_cashflow);
        displaySubtext = `Thu: ${formatVND(data.receive_total)} | Chi: ${formatVND(data.pay_total)}`;
        if (data.net_cashflow >= 0) {
          trend = { type: 'up', text: 'Dương' };
        } else {
          trend = { type: 'down', text: 'Âm' };
        }
        break;

      case 'finance_depreciation_status': {
        const isDone = data.depreciated_assets_count > 0;
        return (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.titleArea}>
                <span className={styles.cardTitle}>{title}</span>
              </div>
              {icon && <span className={styles.cardIcon}>{icon}</span>}
            </div>

            <div className={styles.cardBody}>
              <div className={styles.metricContent}>
                <div className={isDone ? styles.statusDone : styles.statusPending}>
                  <span className={styles.statusIcon}>{isDone ? '✓' : '!'}</span>
                  <span className={styles.statusLabel}>
                    {isDone ? 'ĐÃ HOÀN TẤT' : 'CHƯA THỰC HIỆN'}
                  </span>
                </div>
                <div className={styles.metricFooter}>
                  <span className={styles.metricSubtext}>
                    {isDone
                      ? `${data.depreciated_assets_count} tài sản đã xử lý / Tổng: ${formatVND(data.total_depreciation_amount)}`
                      : `${data.depreciated_assets_count} tài sản đang chờ trích khấu hao`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case 'hrm_payroll_lifecycle_status': {
        // status can be Draft, Calculated, Submitted, Approved, Paid
        const statusVal = data.status || 'Draft';
        let statusDisplay = 'Chưa khởi tạo';
        let statusClass = styles.colRedText;

        if (statusVal === 'Draft') {
          statusDisplay = `Cần khởi tạo kỳ lương ${data.salary_period || ''}`;
          statusClass = styles.colRedText;
        } else if (statusVal === 'Calculated') {
          statusDisplay = 'Chờ tính toán lương';
          statusClass = styles.colOrangeText;
        } else if (statusVal === 'Submitted') {
          statusDisplay = `Chờ duyệt: ${data.calculated_slips_count || 0} phiếu lương`;
          statusClass = styles.colOrangeText;
        } else if (statusVal === 'Approved') {
          statusDisplay = `Chờ chi: ${formatVND(data.net_pay_total)}`;
          statusClass = styles.colBoldLink;
        } else if (statusVal === 'Paid') {
          statusDisplay = `Kỳ lương ${data.salary_period || ''} hoàn tất`;
          statusClass = styles.normalText;
        }

        return (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.titleArea}>
                <span className={styles.cardTitle}>{title}</span>
              </div>
              {icon && <span className={styles.cardIcon}>{icon}</span>}
            </div>

            <div className={styles.cardBody}>
              <div className={styles.metricContent}>
                <div className={`${styles.metricValue} ${statusClass}`} style={{ fontSize: 'var(--fs-md)' }}>
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

      case 'hrm_today_attendance_rate': {
        const attendanceRate = data.attendance_rate || 0;
        const radius = 40;
        const circumference = 2 * Math.PI * radius;
        const strokeDashoffset = circumference - (attendanceRate / 100) * circumference;

        return (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.titleArea}>
                <span className={styles.cardTitle}>{title}</span>
              </div>
              {icon && <span className={styles.cardIcon}>{icon}</span>}
            </div>

            <div className={styles.cardBody}>
              <div className={styles.radialGaugeWrapper}>
                <svg className={styles.gaugeSvg}>
                  <circle className={styles.gaugeBg} cx="50" cy="50" r="40" />
                  <circle
                    className={styles.gaugeProgress}
                    cx="50"
                    cy="50"
                    r="40"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                  />
                </svg>
                <div className={styles.radialGaugeText}>
                  <span className={styles.radialGaugeValue}>{attendanceRate}%</span>
                </div>
              </div>
              <div className={styles.metricFooter} style={{ justifyContent: 'center', marginTop: 'var(--sp-2)' }}>
                <span className={styles.metricSubtext} style={{ textAlign: 'center' }}>
                  Đi làm: {data.present_count}/{data.total_active_employees} (Vắng: {data.absent_count})
                </span>
              </div>
            </div>
          </div>
        );
      }

      default:
        if (typeof data === 'object') {
          const firstKey = Object.keys(data)[0];
          displayValue = firstKey ? String(data[firstKey]) : '—';
        } else {
          displayValue = String(data);
        }
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.titleArea}>
          <span className={styles.cardTitle}>{title}</span>
        </div>
        {icon && <span className={styles.cardIcon}>{icon}</span>}
      </div>

      <div className={styles.cardBody}>
        <div className={styles.metricContent}>
          <div className={styles.metricValue}>
            {displayValue}
          </div>
          <div className={styles.metricFooter}>
            <span className={styles.metricSubtext}>{displaySubtext}</span>
            {trend && (
              <span className={`${styles.trendIndicator} ${trend.type === 'up' ? styles.trendUp : styles.trendDown}`}>
                {trend.text}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

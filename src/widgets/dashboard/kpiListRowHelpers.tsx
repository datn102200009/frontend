import type { ReactNode } from 'react';
import { formatVND } from '@shared/lib/formatVND';
import { shortId } from '@shared/lib/shortId';
import styles from './DashboardWidgets.module.css';

function ProgressBar({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
      <span style={{ fontSize: 10, color: 'var(--clr-text-muted)', minWidth: 70 }}>{label}</span>
      <div style={{ flex: 1, height: 4, background: 'var(--clr-bg-accent, #f1f5f9)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(Math.max(0, value), 100)}%`, height: '100%', background: color }} />
      </div>
      <span style={{ fontSize: 10, color: 'var(--clr-text-secondary)', minWidth: 28, textAlign: 'right' }}>{Math.round(value)}%</span>
    </div>
  );
}

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN');
  } catch {
    return dateStr;
  }
}

export function daysAgo(dateStr?: string | null): number {
  if (!dateStr) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)));
}

// Build link from item + code
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildItemLink(item: any, code: string): { to: string; display: string } {
  const id = item.id;
  const sid = shortId(id);

  if (code === 'sales_pending_fulfillment') {
    return { to: `/sales?tab=orders&status=pending&id=${id}`, display: sid };
  }
  if (code.startsWith('sales_')) {
    let status = '';
    if (code === 'sales_draft_orders') status = 'draft';
    else if (code === 'sales_pending_credit_bypass') status = 'pending_credit_approval';
    const q = status ? `&status=${status}` : '';
    return { to: `/sales?tab=orders${q}&id=${id}`, display: sid };
  }
  if (code === 'purchasing_draft_orders' || code === 'purchasing_active_po_count') {
    let status = '';
    if (code === 'purchasing_draft_orders') status = 'draft';
    const q = status ? `&status=${status}` : '';
    return { to: `/purchasing?tab=orders${q}&id=${id}`, display: sid };
  }
  if (code === 'purchasing_pending_logistic_fees') {
    return { to: `/purchasing?tab=shipment&id=${id}`, display: item.shipment_num || 'QC' };
  }
  if (code === 'purchasing_blocked_invoices') {
    return { to: `/purchasing?status=blocked&tab=invoices&id=${id}`, display: sid };
  }
  if (code === 'inventory_low_stock') {
    return { to: `/inventory?tab=ledger&search=${item.item_code}`, display: item.item_code };
  }
  if (code === 'inventory_pending_entries') {
    const iconMap: Record<string, string> = { receipt: '📥', issue: '📤', transfer: '🔄' };
    return {
      to: `/inventory?tab=entries&status=draft&id=${id}`,
      display: `${iconMap[item.purpose] || '📦'} ${item.name}`,
    };
  }
  if (code === 'finance_cashflow_summary') {
    return { to: `/finance?tab=cashflow&search=${sid}`, display: sid };
  }
  if (code === 'finance_unpaid_purchase_invoices') {
    return { to: `/invoices?tab=purchase_invoices&id=${id}`, display: sid };
  }
  if (code === 'finance_unpaid_sales_invoices') {
    return { to: `/invoices?tab=sales_invoices&id=${id}`, display: sid };
  }
  if (code === 'hrm_payroll_lifecycle_status') {
    return {
      to: `/hrm/payroll?period=${item.salary_period}&status=${item.status}`,
      display: `Kỳ ${item.salary_period}`,
    };
  }
  if (code === 'hrm_pending_leave_requests') {
    return { to: `/hrm/attendance-leave?tab=leave&id=${id}`, display: item.employee_name };
  }
  if (code === 'hrm_expiring_contracts') {
    return { to: `/hrm/employees?id=${item.employee_id || id}`, display: item.contract_no || sid };
  }
  if (code === 'hrm_today_attendance_rate') {
    return { to: `/hrm/attendance-leave?tab=attendance&id=${id}`, display: item.employee_id };
  }
  if (code.startsWith('manufacturing_')) {
    let mStatus = 'in_progress';
    if (code === 'manufacturing_pending_wo_approval') mStatus = 'pending_approval';
    else if (code === 'manufacturing_pending_completion') mStatus = 'pending_production_complete';
    return { to: `/work-orders?status=${mStatus}&id=${id}`, display: item.name || sid };
  }
  return { to: '#', display: sid };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildItemTitle(item: any, code: string): ReactNode {
  if (code.startsWith('sales_') || code === 'finance_unpaid_sales_invoices') {
    return <span className={styles.rowMainText}>{item.customer_name || 'Khách hàng'}</span>;
  }
  if (code === 'purchasing_pending_logistic_fees') {
    return <span className={styles.rowMainText}>{item.name || 'Lô hàng'}</span>;
  }
  if (code.startsWith('purchasing_') || code === 'finance_unpaid_purchase_invoices') {
    return <span className={styles.rowMainText}>{item.supplier_name || 'Nhà cung cấp'}</span>;
  }
  if (code === 'inventory_low_stock') {
    return <span className={styles.rowMainText}>{item.item_name}</span>;
  }
  if (code === 'inventory_pending_entry_count' || code === 'inventory_pending_entries') {
    return <span className={styles.rowMainText}>{item.route_desc}</span>;
  }
  if (code === 'finance_cashflow_summary') {
    return <span className={styles.rowMainText}>{item.name}</span>;
  }
  if (code === 'hrm_payroll_lifecycle_status') {
    return null;
  }
  if (code === 'hrm_pending_leave_requests') {
    return <span className={styles.rowMainText}>{item.leave_type || 'Nghỉ phép'}</span>;
  }
  if (code === 'hrm_expiring_contracts') {
    return <span className={styles.rowMainText}>{item.employee_name}</span>;
  }
  if (code === 'hrm_today_attendance_rate') {
    return <span className={styles.rowMainText}>{item.full_name}</span>;
  }
  if (code.startsWith('manufacturing_')) {
    return <span className={styles.rowMainText}>{item.production_item_name}</span>;
  }
  return <span className={styles.rowMainText}>{item.name || item.title || 'Chi tiết'}</span>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildItemSubtext(item: any, code: string): ReactNode | null {
  if (code === 'sales_pending_credit_bypass' && item.reason) {
    return <div className={styles.colOrangeText}>{item.reason}</div>;
  }
  if (code === 'sales_today_revenue') {
    return <div className={styles.rowSubText}>SO ngày: {formatDate(item.created_at)}</div>;
  }
  if (code === 'sales_pending_fulfillment') {
    const receiptRate = parseFloat(item.receipt_fulfillment_rate || '0');
    const paymentRate = parseFloat(item.payment_fulfillment_rate || '0');
    return (
      <div className={styles.rowSubText} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        <div style={{ marginBottom: 4 }}>{item.items_summary || ''}</div>
        <ProgressBar value={receiptRate} label="Giao hàng" color="var(--clr-success, #22c55e)" />
        <ProgressBar value={paymentRate} label="Thanh toán" color="var(--clr-primary, #3b82f6)" />
      </div>
    );
  }
  if (code === 'sales_draft_orders') {
    return <div className={styles.rowSubText}>{item.items_summary || ''}</div>;
  }
  if (code === 'purchasing_draft_orders') {
    return <div className={styles.rowSubText}>{item.items_summary || ''}</div>;
  }
  if (code === 'purchasing_active_po_count') {
    const deliveryStr = item.expected_delivery_date ? `Dự kiến giao: ${formatDate(item.expected_delivery_date)}` : 'Dự kiến giao: —';
    const receiptRate = parseFloat(item.receipt_fulfillment_rate || '0');
    const paymentRate = parseFloat(item.payment_fulfillment_rate || '0');
    return (
      <div className={styles.rowSubText} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        <div style={{ marginBottom: 4 }}>{deliveryStr}</div>
        <ProgressBar value={receiptRate} label="Nhập kho" color="var(--clr-emerald-600, #059669)" />
        <ProgressBar value={paymentRate} label="Thanh toán" color="var(--clr-indigo-600, #4f46e5)" />
      </div>
    );
  }
  if (code === 'purchasing_pending_logistic_fees') {
    const statusMap: Record<string, string> = {
      draft: 'Chờ Hàng Về',
      inspecting: 'Đang Tiếp Nhận',
      completed: 'Hoàn Tất',
    };
    const statusText = statusMap[item.status] || item.status;
    const colorMap: Record<string, string> = {
      draft: '',
      inspecting: styles.colOrangeText,
      completed: styles.colGreenText,
    };
    const statusColorClass = colorMap[item.status] || '';
    const remarksText = item.remarks ? ` • ${item.remarks}` : '';
    return (
      <div className={styles.rowSubText}>
        <span className={statusColorClass}>{statusText}</span>{remarksText}
      </div>
    );
  }
  if (code === 'purchasing_blocked_invoices' && item.block_reason) {
    return <div className={styles.colRedText}>{item.block_reason}</div>;
  }

  if (code === 'inventory_low_stock') {
    return (
      <div className={styles.rowSubText}>
        {item.warehouse_name} • <span className={item.status === 'critical' ? styles.colRedText : styles.colOrangeText}>{item.reason}</span>
      </div>
    );
  }
  if (code === 'inventory_pending_entry_count' || code === 'inventory_pending_entries') {
    return <div className={styles.rowSubText}>{item.remarks || 'Phiếu nháp'}</div>;
  }
  if (code === 'finance_cashflow_summary') {
    return <div className={styles.rowSubText}>{item.category || 'Khác'}</div>;
  }
  if (code === 'hrm_payroll_lifecycle_status') {
    const isApproved = item.status === 'approved';
    return (
      <div className={styles.rowSubText}>
        <span className={isApproved ? styles.colGreenText : styles.colOrangeText}>
          {item.status_label}
        </span>
      </div>
    );
  }
  if (code === 'hrm_pending_leave_requests') {
    return (
      <div className={styles.rowSubText}>
        {formatDate(item.start_date)} - {formatDate(item.end_date)}
      </div>
    );
  }
  if (code === 'hrm_today_attendance_rate') {
    return <div className={styles.rowSubText}>{item.department}</div>;
  }

  if (code === 'manufacturing_pending_wo_approval') {
    return (
      <div className={styles.rowSubText}>
        SL: {parseFloat(item.quantity || '0').toLocaleString('vi-VN')}
      </div>
    );
  }
  if (code === 'manufacturing_pending_completion') {
    return <div className={styles.rowSubText}>Đích: {item.target_warehouse_name || 'Kho thành phẩm'}</div>;
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildItemMeta(item: any, code: string): ReactNode | null {
  if (
    code === 'sales_today_revenue' ||
    code === 'sales_draft_orders' ||
    code === 'purchasing_draft_orders' ||
    code === 'purchasing_active_po_count'
  ) {
    return <div className={styles.colRightAlign}>{formatVND(item.total_amount)}</div>;
  }
  if (code === 'sales_pending_credit_bypass' || code === 'purchasing_blocked_invoices') {
    return (
      <div className={styles.colRightAlign} style={{ color: 'var(--clr-error-600)' }}>
        {formatVND(item.total_amount)}
      </div>
    );
  }

  if (code === 'purchasing_pending_logistic_fees') {
    const d = daysAgo(item.created_at);
    return (
      <div className={`${styles.colRightAlign} ${d > 3 ? styles.textRed : ''}`}>{d} ngày trước</div>
    );
  }
  if (code === 'inventory_low_stock') {
    return (
      <div className={`${styles.colRightAlign} ${item.status === 'critical' ? styles.textRed : styles.textOrange}`}>
        {item.balance} {item.uom}
      </div>
    );
  }
  if (code === 'inventory_pending_entries') {
    return (
      <div className={styles.colRightAlign}>
        <div>{item.item_count} mặt hàng</div>
        <div className={styles.rowSubText}>Tạo: {formatDate(item.created_at)}</div>
      </div>
    );
  }
  if (code === 'finance_cashflow_summary') {
    const isReceive = item.payment_type === 'receive';
    return (
      <div
        className={`${styles.colRightAlign} ${isReceive ? styles.textGreen : styles.textRed}`}
        style={{ fontWeight: 'var(--fw-bold)' }}
      >
        {isReceive ? '+' : '-'} {formatVND(item.amount)}
      </div>
    );
  }
  if (code === 'hrm_payroll_lifecycle_status') {
    return (
      <div className={styles.colRightAlign}>
        <div style={{ fontWeight: 'var(--fw-bold)' }}>{formatVND(item.net_pay_total)}</div>
        <div className={styles.rowSubText}>{item.slip_count} phiếu lương</div>
      </div>
    );
  }
  if (code === 'hrm_pending_leave_requests') {
    return (
      <div className={styles.colRightAlign} style={{ fontWeight: 'var(--fw-bold)' }}>
        {item.days} ngày
      </div>
    );
  }
  if (code === 'hrm_expiring_contracts') {
    const d = item.end_date
      ? Math.max(0, Math.floor((new Date(item.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 0;
    return (
      <div className={styles.colRightAlign}>
        <span
          style={{
            fontSize: 'var(--fs-xs)',
            padding: '1px 6px',
            borderRadius: '4px',
            background: 'var(--clr-warning-bg)',
            color: 'var(--clr-warning)',
          }}
        >
          Còn {d} ngày
        </span>
      </div>
    );
  }
  if (code === 'hrm_today_attendance_rate') {
    return (
      <div className={styles.colRightAlign}>
        <span
          style={{
            fontSize: 'var(--fs-xs)',
            padding: '1px 6px',
            borderRadius: '4px',
            background: 'var(--clr-error-bg)',
            color: 'var(--clr-error)',
          }}
        >
          {item.status}
        </span>
      </div>
    );
  }
  if (code === 'manufacturing_pending_wo_approval') {
    return null;
  }

  if (code === 'manufacturing_pending_completion') {
    return (
      <div className={styles.colRightAlign}>
        <span
          style={{
            fontSize: 'var(--fs-xs)',
            padding: '1px 6px',
            borderRadius: '4px',
            background: 'var(--clr-success-bg)',
            color: 'var(--clr-success)',
          }}
        >
          Chờ nghiệm thu
        </span>
      </div>
    );
  }
  return null;
}

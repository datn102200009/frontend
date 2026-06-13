import type { ReactNode } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Inbox } from 'lucide-react';
import { formatVND } from '@shared/lib/formatVND';
import { CardHeader } from './CardHeader';
import styles from './DashboardWidgets.module.css';

export interface ListMiniProps {
  title: string;
  code: string;
  icon?: ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  quickLinks?: string[];
  totalCount?: number;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN');
  } catch {
    return dateStr;
  }
}

function daysAgo(dateStr?: string | null): number {
  if (!dateStr) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)));
}

function shortId(id?: string | null): string {
  return id ? id.substring(0, 8).toUpperCase() : '—';
}

// Build link from item + code
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildItemLink(item: any, code: string): { to: string; display: string } {
  const id = item.id;
  const sid = shortId(id);

  if (code === 'sales_pending_fulfillment') {
    return { to: `/inventory?tab=entries&status=draft&search=SO-${sid}`, display: `SO-${sid}` };
  }
  if (code.startsWith('sales_')) {
    let status = '';
    if (code === 'sales_draft_orders') status = 'draft';
    else if (code === 'sales_pending_credit_bypass') status = 'pending_credit_approval';
    const q = status ? `&status=${status}` : '';
    return { to: `/sales?tab=orders${q}&id=${id}`, display: `SO-${sid}` };
  }
  if (code === 'purchasing_pending_delivery') {
    return { to: `/inventory?tab=entries&status=draft&search=PO-${sid}`, display: `PO-${sid}` };
  }
  if (code === 'purchasing_draft_orders' || code === 'purchasing_active_po_count') {
    let status = '';
    if (code === 'purchasing_draft_orders') status = 'draft';
    const q = status ? `&status=${status}` : '';
    return { to: `/purchasing?tab=orders${q}&id=${id}`, display: `PO-${sid}` };
  }
  if (code === 'purchasing_pending_qc' || code === 'purchasing_pending_logistic_fees') {
    return { to: `/purchasing?tab=shipment&id=${id}`, display: item.shipment_num || 'QC' };
  }
  if (code === 'purchasing_blocked_invoices') {
    return { to: `/purchasing?status=blocked&tab=invoices&id=${id}`, display: `INV-${sid}` };
  }
  if (code === 'inventory_low_stock') {
    return { to: `/inventory?tab=ledger&search=${item.item_code}`, display: item.item_code };
  }
  if (code === 'inventory_pending_entry_count') {
    return { to: `/inventory?tab=entries&status=draft&id=${id}`, display: item.name };
  }
  if (code === 'inventory_pending_entries') {
    const iconMap: Record<string, string> = { receipt: '📥', issue: '📤', transfer: '🔄' };
    return {
      to: `/inventory?tab=entries&status=draft&id=${id}`,
      display: `${iconMap[item.purpose] || '📦'} ${item.name}`,
    };
  }
  if (code === 'finance_cashflow_summary') {
    return { to: `/finance?tab=cashflow&search=${sid}`, display: `TX-${sid}` };
  }
  if (code === 'finance_unpaid_purchase_invoices') {
    return { to: `/purchasing?status=unpaid&tab=invoices&id=${id}`, display: `INV-${sid}` };
  }
  if (code === 'finance_unpaid_sales_invoices') {
    return { to: `/sales?status=unpaid&tab=invoices&id=${id}`, display: `INV-${sid}` };
  }
  if (code === 'finance_depreciation_status') {
    return { to: `/finance/fixed-assets?assetCode=${item.asset_code}`, display: item.asset_code };
  }
  if (code === 'hrm_payroll_lifecycle_status') {
    return { to: `/hrm?tab=salary&id=${id}`, display: `SLIP-${sid}` };
  }
  if (code === 'hrm_pending_leave_requests') {
    return { to: `/hrm?tab=leave&id=${id}`, display: item.employee_name };
  }
  if (code === 'hrm_expiring_contracts') {
    return { to: `/hrm?tab=employees&id=${id}`, display: item.contract_no || `CON-${sid}` };
  }
  if (code === 'hrm_today_attendance_rate') {
    return { to: `/hrm?tab=attendance&id=${id}`, display: item.employee_id };
  }
  if (code.startsWith('manufacturing_')) {
    const mStatus = code === 'manufacturing_pending_wo_approval' ? 'pending_approval' : 'in_progress';
    return { to: `/bom?status=${mStatus}&tab=wo&id=${id}`, display: item.name || `WO-${sid}` };
  }
  return { to: '#', display: sid };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildItemTitle(item: any, code: string): ReactNode {
  if (code.startsWith('sales_') || code === 'finance_unpaid_sales_invoices') {
    return <span className={styles.rowMainText}>{item.customer_name || 'Khách hàng'}</span>;
  }
  if (code === 'purchasing_pending_qc' || code === 'purchasing_pending_logistic_fees') {
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
  if (code === 'finance_depreciation_status') {
    return <span className={styles.rowMainText}>{item.asset_name}</span>;
  }
  if (code === 'hrm_payroll_lifecycle_status') {
    return <span className={styles.rowMainText}>{item.employee_name}</span>;
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
function buildItemSubtext(item: any, code: string): ReactNode | null {
  if (code === 'sales_pending_credit_bypass' && item.reason) {
    return <div className={styles.colOrangeText}>{item.reason}</div>;
  }
  if (code === 'sales_today_revenue' || code === 'sales_pending_fulfillment') {
    return <div className={styles.rowSubText}>SO ngày: {formatDate(item.created_at)}</div>;
  }
  if (code === 'sales_draft_orders') {
    return <div className={styles.rowSubText}>{daysAgo(item.created_at)} ngày trước</div>;
  }
  if (code === 'purchasing_blocked_invoices' && item.block_reason) {
    return <div className={styles.colRedText}>{item.block_reason}</div>;
  }
  if (code === 'purchasing_active_po_count') {
    return <div className={styles.rowSubText}>PO ngày: {formatDate(item.created_at)}</div>;
  }
  if (code === 'purchasing_pending_qc') {
    return <div className={styles.rowSubText}>Cập bến {daysAgo(item.created_at)} ngày trước</div>;
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
  if (code === 'finance_depreciation_status') {
    return <div className={styles.rowSubText}>{item.status}</div>;
  }
  if (code === 'hrm_payroll_lifecycle_status') {
    return <div className={styles.rowSubText}>Kỳ lương: {item.salary_period}</div>;
  }
  if (code === 'hrm_pending_leave_requests') {
    return (
      <div className={styles.rowSubText}>
        {formatDate(item.start_date)} - {formatDate(item.end_date)}
      </div>
    );
  }
  if (code === 'hrm_expiring_contracts') {
    return <div className={styles.rowSubText}>{item.contract_type}</div>;
  }
  if (code === 'hrm_today_attendance_rate') {
    return <div className={styles.rowSubText}>{item.department}</div>;
  }
  if (code === 'manufacturing_pending_declarations') {
    return (
      <div className={styles.rowSubText}>
        Đã làm: {item.produced_qty}/{item.quantity}
      </div>
    );
  }
  if (code === 'manufacturing_pending_completion') {
    return <div className={styles.rowSubText}>Đích: {item.target_warehouse_name || 'Kho thành phẩm'}</div>;
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildItemMeta(item: any, code: string): ReactNode | null {
  if (
    code === 'sales_today_revenue' ||
    code === 'sales_draft_orders' ||
    code === 'sales_pending_fulfillment' ||
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
  if (code === 'purchasing_pending_qc') {
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
          Chờ QC
        </span>
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
  if (code === 'inventory_pending_entry_count' || code === 'inventory_pending_entries') {
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
        <div style={{ fontWeight: 'var(--fw-medium)' }}>{formatVND(item.net_pay)}</div>
        <div className={styles.rowSubText}>{item.status}</div>
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
    return <div className={styles.colRightAlign}>Bắt đầu: {formatDate(item.planned_start_date)}</div>;
  }
  if (code === 'manufacturing_pending_declarations') {
    const dl = item.days_left;
    let txt = 'Không rõ hạn';
    let color = 'var(--clr-text-secondary)';
    if (dl !== undefined && dl !== null) {
      if (dl < 0) {
        txt = `Trễ ${Math.abs(dl)} ngày`;
        color = 'var(--clr-error)';
      } else if (dl === 0) {
        txt = 'Hạn hôm nay';
        color = 'var(--clr-warning)';
      } else {
        txt = `Còn ${dl} ngày`;
        color = 'var(--clr-text-secondary)';
      }
    }
    return (
      <div className={styles.colRightAlign}>
        <span
          style={{
            fontSize: 'var(--fs-xs)',
            padding: '1px 6px',
            borderRadius: '4px',
            background: 'var(--clr-bg)',
            color,
          }}
        >
          {txt}
        </span>
      </div>
    );
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

export function ListMini({ title, code, icon, data, quickLinks, totalCount }: ListMiniProps) {
  const items = Array.isArray(data) ? data : [];
  const [activeTab, setActiveTab] = useState<'all' | 'receipt' | 'issue' | 'transfer'>('all');

  const filteredItems = items.filter((item) => {
    if (code !== 'inventory_pending_entries') return true;
    if (activeTab === 'all') return true;
    return item.purpose === activeTab;
  });

  const totalToShow =
    typeof totalCount === 'number'
      ? code === 'inventory_pending_entries' && activeTab !== 'all'
        ? filteredItems.length
        : totalCount
      : filteredItems.length;


  const countBadge =
    totalToShow > 0 ? (
      <span
        className="shared-badge"
        style={{
          background: 'var(--clr-bg)',
          color: 'var(--clr-text-secondary)',
          fontSize: 'var(--fs-xs)',
          fontWeight: 'bold',
          padding: '1px 6px',
          borderRadius: '10px',
        }}
      >
        {totalToShow}
      </span>
    ) : null;

  return (
    <div className={styles.card}>
      <CardHeader title={title} icon={icon} quickLinks={quickLinks} meta={countBadge} />

      <div className={styles.cardBody}>
        {code === 'inventory_pending_entries' && (
          <div className={styles.tabHeader}>
            <button
              onClick={() => setActiveTab('all')}
              className={`${styles.tabBtn} ${activeTab === 'all' ? styles.tabBtnActive : ''}`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setActiveTab('receipt')}
              className={`${styles.tabBtn} ${activeTab === 'receipt' ? styles.tabBtnActive : ''}`}
            >
              Nhập 📥
            </button>
            <button
              onClick={() => setActiveTab('issue')}
              className={`${styles.tabBtn} ${activeTab === 'issue' ? styles.tabBtnActive : ''}`}
            >
              Xuất 📤
            </button>
            <button
              onClick={() => setActiveTab('transfer')}
              className={`${styles.tabBtn} ${activeTab === 'transfer' ? styles.tabBtnActive : ''}`}
            >
              Chuyển 🔄
            </button>
          </div>
        )}

        {filteredItems.length === 0 ? (
          <div className={styles.emptyState}>
            <Inbox className={styles.emptyStateIcon} size={28} />
            <span>Không có hoạt động cần xử lý</span>
          </div>
        ) : (
          <div className={styles.listMiniTable}>
            {filteredItems.map((item, idx) => {
              const { to, display } = buildItemLink(item, code);
              return (
                <div key={(item.id as string) || String(idx)} className={styles.listMiniRow}>
                  <Link to={to} className={styles.colBoldLink}>
                    {display}
                  </Link>
                  <div className={styles.colTextEllipsis}>
                    {buildItemTitle(item, code)}
                    {buildItemSubtext(item, code)}
                  </div>
                  <div className={styles.colRightAlign}>{buildItemMeta(item, code)}</div>
                </div>
              );
            })}
          </div>
        )}


      </div>
    </div>
  );
}

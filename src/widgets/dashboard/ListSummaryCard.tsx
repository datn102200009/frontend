import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Inbox } from 'lucide-react';
import styles from './DashboardWidgets.module.css';
import { formatVND } from './MetricCard';

function mapRoute(url: string, _code: string): string {
  return url;
}

import { useState } from 'react';

export interface ListSummaryCardProps {
  title: string;
  code: string;
  icon?: ReactNode;
  data: any[];
  quickLinks?: string[];
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN');
  } catch {
    return dateStr;
  }
}

function cleanPercent(val: string | null | undefined): string {
  if (!val) return '';
  return val.replace(/%%/g, '%');
}

export function ListSummaryCard({ title, code, icon, data, quickLinks }: ListSummaryCardProps) {
  const items = Array.isArray(data) ? data : [];
  const [activeTab, setActiveTab] = useState<'all' | 'receipt' | 'issue' | 'transfer'>('all');

  // Filter items if it's the inventory pending entries card
  const filteredItems = items.filter((item) => {
    if (code !== 'inventory_pending_entries') return true;
    if (activeTab === 'all') return true;
    return item.purpose === activeTab;
  });

  const redirectUrl = quickLinks && quickLinks.length > 0 ? quickLinks[0] : null;
  const mappedUrl = redirectUrl ? mapRoute(redirectUrl, code) : null;

  // Determine grid template columns based on card code
  let gridCols = '110px 1.5fr 1.2fr';
  if (code === 'purchasing_pending_delivery') {
    gridCols = '110px 1.2fr 1fr 1.2fr';
  } else if (code === 'finance_unpaid_purchase_invoices' || code === 'finance_unpaid_sales_invoices') {
    gridCols = '110px 1.5fr 1.2fr 1.2fr';
  }

  // Active Task Highlights and Dot Indicators logic
  const taskCards = [
    'sales_pending_credit_bypass',
    'purchasing_pending_qc',
    'purchasing_pending_logistic_fees',
    'purchasing_blocked_invoices',
    'inventory_pending_entry_count',
    'inventory_low_stock',
    'inventory_pending_entries',
    'finance_unpaid_purchase_invoices',
    'finance_unpaid_sales_invoices',
    'finance_depreciation_status',
    'hrm_payroll_lifecycle_status',
    'hrm_pending_leave_requests',
    'hrm_expiring_contracts',
    'manufacturing_pending_wo_approval',
    'manufacturing_pending_declarations',
    'manufacturing_pending_completion'
  ];

  const isTaskCard = taskCards.includes(code);
  const hasActiveTask = isTaskCard && items.length > 0;

  let isDangerTask = false;
  if (hasActiveTask) {
    if (code === 'purchasing_blocked_invoices') {
      isDangerTask = true;
    } else if (code === 'inventory_low_stock') {
      isDangerTask = items.some(item => item.status === 'critical');
    } else if (code === 'manufacturing_pending_declarations') {
      isDangerTask = items.some(item => item.days_left < 0);
    } else if (code === 'finance_unpaid_purchase_invoices' || code === 'finance_unpaid_sales_invoices') {
      isDangerTask = items.some(item => {
        const overdueDays = item.due_date ? Math.floor((new Date().getTime() - new Date(item.due_date).getTime()) / (1000 * 60 * 60 * 24)) : 0;
        return overdueDays > 0;
      });
    }
  }

  // Handle custom border styling based on task status
  let cardClass = styles.card;
  if (hasActiveTask) {
    if (isDangerTask) {
      cardClass = `${styles.card} ${styles.dangerBorder}`;
    } else {
      cardClass = `${styles.card} ${styles.warningBorder}`;
    }
  }

  return (
    <div className={cardClass}>
      <div className={styles.cardHeader}>
        <div className={styles.titleArea}>
          {hasActiveTask && (
            <span 
              className={`${styles.taskIndicator} ${isDangerTask ? styles.dangerDot : styles.warningDot}`}
              title="Có nhiệm vụ cần xử lý"
            />
          )}
          <span className={styles.cardTitle}>{title}</span>
          {filteredItems.length > 0 && (
            <span className="shared-badge" style={{
              background: 'var(--clr-bg)',
              color: 'var(--clr-text-secondary)',
              fontSize: 'var(--fs-xs)',
              fontWeight: 'bold',
              padding: '1px 6px',
              borderRadius: '10px'
            }}>
              {filteredItems.length}
            </span>
          )}
        </div>
        {icon && <span className={styles.cardIcon}>{icon}</span>}
      </div>

      <div className={styles.cardBody}>
        {/* Render Tab filter if it is the inventory stock entry card */}
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
          <div className={styles.gridTable}>
            {filteredItems.map((item, idx) => {
              const rowId = item.id || String(idx);
              const shortId = item.id ? item.id.substring(0, 8).toUpperCase() : '—';

              return (
                <div
                  key={rowId}
                  className={styles.gridRow}
                  style={{ gridTemplateColumns: gridCols }}
                >
                  {/* Column 1: Link & Code */}
                  {(() => {
                    if (code === 'sales_pending_fulfillment') {
                      return (
                        <Link to={`/inventory?tab=entries&status=draft&search=SO-${shortId}`} className={styles.colBoldLink}>
                          SO-{shortId}
                        </Link>
                      );
                    }
                    if (code.startsWith('sales_')) {
                      let salesStatus = '';
                      if (code === 'sales_draft_orders') salesStatus = 'draft';
                      else if (code === 'sales_pending_credit_bypass') salesStatus = 'pending_credit_approval';
                      const statusQuery = salesStatus ? `&status=${salesStatus}` : '';
                      return (
                        <Link to={`/sales?tab=orders${statusQuery}&orderId=${item.id}`} className={styles.colBoldLink}>
                          SO-{shortId}
                        </Link>
                      );
                    }
                    if (code === 'purchasing_pending_delivery') {
                      return (
                        <Link to={`/inventory?tab=entries&status=draft&search=PO-${shortId}`} className={styles.colBoldLink}>
                          PO-{shortId}
                        </Link>
                      );
                    }
                    if (code === 'purchasing_draft_orders' || code === 'purchasing_active_po_count') {
                      let purStatus = '';
                      if (code === 'purchasing_draft_orders') purStatus = 'draft';
                      const statusQuery = purStatus ? `&status=${purStatus}` : '';
                      return (
                        <Link to={`/purchasing?tab=orders${statusQuery}&orderId=${item.id}`} className={styles.colBoldLink}>
                          PO-{shortId}
                        </Link>
                      );
                    }
                    if (code === 'purchasing_pending_qc') {
                      return (
                        <Link to={`/purchasing?tab=shipment&shipmentId=${item.shipment_num}`} className={styles.colBoldLink}>
                          {item.shipment_num || 'QC'}
                        </Link>
                      );
                    }
                    if (code === 'purchasing_pending_logistic_fees') {
                      return (
                        <Link to={`/purchasing?tab=shipment&shipmentId=${item.shipment_num}`} className={styles.colBoldLink}>
                          {item.shipment_num || 'FEE'}
                        </Link>
                      );
                    }
                    if (code === 'purchasing_blocked_invoices') {
                      return (
                        <Link to={`/purchasing?status=blocked&tab=invoices&invoiceId=${item.id}`} className={styles.colBoldLink}>
                          INV-{shortId}
                        </Link>
                      );
                    }
                    if (code === 'inventory_low_stock') {
                      return (
                        <Link to={`/inventory?tab=ledger&search=${item.item_code}`} className={styles.colBoldLink}>
                          {item.item_code}
                        </Link>
                      );
                    }
                    if (code === 'inventory_pending_entry_count') {
                      return (
                        <Link to={`/inventory?tab=entries&status=draft&entryId=${item.id}`} className={styles.colBoldLink}>
                          {item.name}
                        </Link>
                      );
                    }
                    if (code === 'inventory_pending_entries') {
                      const iconMap: Record<string, string> = { receipt: '📥', issue: '📤', transfer: '🔄' };
                      return (
                        <Link to={`/inventory?tab=entries&status=draft&entryId=${item.id}`} className={styles.colBoldLink} style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                          <span>{iconMap[item.purpose] || '📦'}</span>
                          <span className={styles.colTextEllipsis} style={{ maxWidth: '65px' }}>{item.name}</span>
                        </Link>
                      );
                    }
                    if (code === 'finance_cashflow_summary') {
                      return (
                        <Link to={`/finance?tab=cashflow&search=${shortId}`} className={styles.colBoldLink}>
                          TX-{shortId}
                        </Link>
                      );
                    }
                    if (code === 'finance_unpaid_purchase_invoices') {
                      return (
                        <Link to={`/purchasing?status=unpaid&tab=invoices&invoiceId=${item.id}`} className={styles.colBoldLink}>
                          INV-{shortId}
                        </Link>
                      );
                    }
                    if (code === 'finance_unpaid_sales_invoices') {
                      return (
                        <Link to={`/sales?status=unpaid&tab=invoices&invoiceId=${item.id}`} className={styles.colBoldLink}>
                          INV-{shortId}
                        </Link>
                      );
                    }
                    if (code === 'finance_depreciation_status') {
                      return (
                        <Link to={`/finance/fixed-assets?assetCode=${item.asset_code}`} className={styles.colBoldLink}>
                          {item.asset_code}
                        </Link>
                      );
                    }
                    if (code === 'hrm_payroll_lifecycle_status') {
                      return (
                        <Link to={`/hrm?tab=salary&slipId=${item.id}`} className={styles.colBoldLink}>
                          SLIP-{shortId}
                        </Link>
                      );
                    }
                    if (code === 'hrm_pending_leave_requests') {
                      return (
                        <Link to={`/hrm?tab=leave&requestId=${item.id}`} className={styles.colBoldLink}>
                          {item.employee_name}
                        </Link>
                      );
                    }
                    if (code === 'hrm_expiring_contracts') {
                      return (
                        <Link to={`/hrm?tab=employees&employeeId=${item.id}`} className={styles.colBoldLink}>
                          {item.contract_no || `CON-${shortId}`}
                        </Link>
                      );
                    }
                    if (code === 'hrm_today_attendance_rate') {
                      return (
                        <Link to={`/hrm?tab=attendance&employeeId=${item.id}`} className={styles.colBoldLink}>
                          {item.employee_id}
                        </Link>
                      );
                    }
                    if (code.startsWith('manufacturing_')) {
                      const mStatus = code === 'manufacturing_pending_wo_approval' ? 'pending_approval' : 'in_progress';
                      return (
                        <Link to={`/bom?status=${mStatus}&tab=wo&workOrderId=${item.id}`} className={styles.colBoldLink}>
                          {item.name || `WO-${shortId}`}
                        </Link>
                      );
                    }
                    return <span className={styles.colBoldLink}>{shortId}</span>;
                  })()}

                  {/* Column 2: Information Details */}
                  {(() => {
                    if (code.startsWith('sales_') || code === 'finance_unpaid_sales_invoices') {
                      const daysAgoText = item.created_at ? `${Math.max(0, Math.floor((new Date().getTime() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24)))} ngày trước` : 'Hôm nay';
                      return (
                        <div className={styles.colTextEllipsis}>
                          <div className={styles.rowMainText}>
                            {item.customer_name || 'Khách hàng'}
                          </div>
                          {code === 'sales_pending_credit_bypass' && (
                            <div className={styles.colOrangeText}>{cleanPercent(item.reason || 'Vượt hạn mức nợ')}</div>
                          )}
                          {(code === 'sales_pending_fulfillment' || code === 'sales_today_revenue') && (
                            <div className={styles.rowSubText}>SO ngày: {formatDate(item.created_at)}</div>
                          )}
                          {code === 'sales_draft_orders' && (
                            <div className={styles.rowSubText}>Tạo: {daysAgoText}</div>
                          )}
                        </div>
                      );
                    }
                    if (code === 'purchasing_pending_qc' || code === 'purchasing_pending_logistic_fees') {
                      const daysArrived = item.created_at ? Math.max(0, Math.floor((new Date().getTime() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24))) : 0;
                      return (
                        <div className={styles.colTextEllipsis}>
                          <div className={styles.rowMainText}>
                            {item.name || 'Lô hàng'}
                          </div>
                          {code === 'purchasing_pending_qc' && (
                            <div className={styles.rowSubText}>Cập bến {daysArrived} ngày trước</div>
                          )}
                        </div>
                      );
                    }
                    if ((code.startsWith('purchasing_') && code !== 'purchasing_pending_qc' && code !== 'purchasing_pending_logistic_fees') || code === 'finance_unpaid_purchase_invoices') {
                      return (
                        <div className={styles.colTextEllipsis}>
                          <div className={styles.rowMainText}>
                            {item.supplier_name || 'Nhà cung cấp'}
                          </div>
                          {code === 'purchasing_blocked_invoices' && (
                            <div className={styles.colRedText}>{cleanPercent(item.block_reason || 'Bị chặn thanh toán')}</div>
                          )}
                          {code === 'purchasing_active_po_count' && (
                            <div className={styles.rowSubText}>PO ngày: {formatDate(item.created_at)}</div>
                          )}
                        </div>
                      );
                    }
                    if (code === 'inventory_low_stock') {
                      const textClass = item.status === 'critical' ? styles.colRedText : styles.colOrangeText;
                      return (
                        <div className={styles.colTextEllipsis}>
                          <div className={styles.rowMainText}>{item.item_name}</div>
                          <div className={styles.rowSubText} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <span>{item.warehouse_name}</span>
                            <span style={{ color: 'var(--clr-border-focus)' }}>•</span>
                            <span className={textClass} style={{ fontWeight: 'var(--fw-medium)' }}>
                              {cleanPercent(item.reason)}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    if (code === 'inventory_pending_entry_count') {
                      return (
                        <div className={styles.colTextEllipsis}>
                          <div className={styles.rowMainText}>{item.route_desc}</div>
                          <div className={styles.rowSubText}>{cleanPercent(item.remarks) || 'Nhập kho nháp'}</div>
                        </div>
                      );
                    }
                    if (code === 'inventory_pending_entries') {
                      return (
                        <div className={styles.colTextEllipsis}>
                          <div className={styles.rowMainText}>{item.route_desc}</div>
                          <div className={styles.rowSubText}>{cleanPercent(item.remarks) || 'Yêu cầu chuyển kho nháp'}</div>
                        </div>
                      );
                    }
                    if (code === 'finance_cashflow_summary') {
                      return (
                        <div className={styles.colTextEllipsis}>
                          <div className={styles.rowMainText}>{item.name}</div>
                          <div className={styles.rowSubText}>{item.category}</div>
                        </div>
                      );
                    }
                    if (code === 'finance_depreciation_status') {
                      return (
                        <div className={styles.colTextEllipsis}>
                          <div className={styles.rowMainText}>{item.asset_name}</div>
                          <div className={styles.rowSubText}>Trạng thái: {item.status}</div>
                        </div>
                      );
                    }
                    if (code === 'hrm_payroll_lifecycle_status') {
                      return (
                        <div className={styles.colTextEllipsis}>
                          <div className={styles.rowMainText}>{item.employee_name}</div>
                          <div className={styles.rowSubText}>Kỳ lương: {item.salary_period}</div>
                        </div>
                      );
                    }
                    if (code === 'hrm_pending_leave_requests') {
                      return (
                        <div className={styles.colTextEllipsis}>
                          <div className={styles.rowMainText}>{item.leave_type || 'Nghỉ phép'}</div>
                          <div className={styles.rowSubText}>{formatDate(item.start_date)} - {formatDate(item.end_date)}</div>
                        </div>
                      );
                    }
                    if (code === 'hrm_expiring_contracts') {
                      return (
                        <div className={styles.colTextEllipsis}>
                          <div className={styles.rowMainText}>{item.employee_name}</div>
                          <div className={styles.rowSubText}>{item.contract_type}</div>
                        </div>
                      );
                    }
                    if (code === 'hrm_today_attendance_rate') {
                      return (
                        <div className={styles.colTextEllipsis}>
                          <div className={styles.rowMainText}>{item.full_name}</div>
                          <div className={styles.rowSubText}>{item.department}</div>
                        </div>
                      );
                    }
                    if (code.startsWith('manufacturing_')) {
                      return (
                        <div className={styles.colTextEllipsis}>
                          <div className={styles.rowMainText}>{item.production_item_name}</div>
                          {code === 'manufacturing_pending_declarations' && (
                            <div className={styles.rowSubText}>Đã làm: {item.produced_qty}/{item.quantity} cái</div>
                          )}
                          {code === 'manufacturing_pending_completion' && (
                            <div className={styles.rowSubText}>Đích: {item.target_warehouse_name || 'Kho thành phẩm'}</div>
                          )}
                        </div>
                      );
                    }
                    return <span className={styles.colTextEllipsis}>{item.name || item.title || 'Chi tiết'}</span>;
                  })()}

                  {/* Column 3 & 4: Contextual Metadata (Values, Progress, Status) */}
                  {(() => {
                    if (
                      code === 'sales_today_revenue' ||
                      code === 'sales_draft_orders' ||
                      code === 'sales_pending_fulfillment' ||
                      code === 'purchasing_draft_orders' ||
                      code === 'purchasing_active_po_count'
                    ) {
                      return (
                        <div className={styles.colRightAlign}>
                          {formatVND(item.total_amount)}
                        </div>
                      );
                    }
                    if (code === 'sales_pending_credit_bypass' || code === 'purchasing_blocked_invoices') {
                      return (
                        <div className={styles.colRightAlign} style={{ color: 'var(--clr-error-600)' }}>
                          {formatVND(item.total_amount)}
                        </div>
                      );
                    }
                    if (code === 'purchasing_pending_delivery') {
                      const isOverdue = item.expected_delivery_date ? new Date().getTime() > new Date(item.expected_delivery_date).getTime() : false;
                      const dateClass = isOverdue ? styles.colRedText : '';
                      return (
                        <>
                          <div className={`${styles.colRightAlign} ${dateClass}`} style={{ fontSize: 'var(--fs-xs)' }}>
                            <div>{item.expected_delivery_date ? formatDate(item.expected_delivery_date) : 'Chưa có hạn'}</div>
                            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text)', marginTop: '2px', display: 'flex', gap: '8px', justifyContent: 'flex-end', fontWeight: 'var(--fw-bold)' }}>
                              <span>📥 {item.receipt_fulfillment_rate || 0}%</span>
                              <span>💳 {item.payment_fulfillment_rate || 0}%</span>
                            </div>
                          </div>
                          <div className={styles.progressStack}>
                            <div className={styles.progressTrack} title={`Nhận hàng: ${item.receipt_fulfillment_rate}%`}>
                              <div className={styles.barBlue} style={{ width: `${item.receipt_fulfillment_rate || 0}%` }} />
                            </div>
                            <div className={styles.progressTrack} title={`Thanh toán: ${item.payment_fulfillment_rate}%`}>
                              <div className={styles.barOrange} style={{ width: `${item.payment_fulfillment_rate || 0}%` }} />
                            </div>
                          </div>
                        </>
                      );
                    }
                    if (code === 'purchasing_pending_qc') {
                      return (
                        <div className={styles.colRightAlign}>
                          <span className="badge warning" style={{ fontSize: 'var(--fs-xs)', padding: '1px 6px', borderRadius: '4px', background: 'var(--clr-warning-bg)', color: 'var(--clr-warning)' }}>
                            Chờ QC
                          </span>
                        </div>
                      );
                    }
                    if (code === 'purchasing_pending_logistic_fees') {
                      const daysArrived = item.created_at ? Math.max(0, Math.floor((new Date().getTime() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24))) : 0;
                      const dayClass = daysArrived > 3 ? styles.textRed : '';
                      return (
                        <div className={`${styles.colRightAlign} ${dayClass}`}>
                          {daysArrived} ngày trước
                        </div>
                      );
                    }
                    if (code === 'inventory_low_stock') {
                      const textClass = item.status === 'critical' ? styles.textRed : styles.textOrange;
                      return (
                        <div className={`${styles.colRightAlign} ${textClass}`}>
                          {item.balance} {item.uom}
                        </div>
                      );
                    }
                    if (code === 'inventory_pending_entry_count') {
                      return (
                        <div className={styles.colRightAlign}>
                          <div>{item.item_count} mặt hàng</div>
                          <div className={styles.rowSubText}>Tạo: {formatDate(item.created_at)}</div>
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
                      const colorClass = isReceive ? styles.textGreen : styles.textRed;
                      const prefix = isReceive ? '+' : '-';
                      return (
                        <div className={`${styles.colRightAlign} ${colorClass}`} style={{ fontWeight: 'var(--fw-bold)' }}>
                          {prefix} {formatVND(item.amount)}
                        </div>
                      );
                    }
                    if (code === 'finance_unpaid_purchase_invoices' || code === 'finance_unpaid_sales_invoices') {
                      const overdueDays = item.due_date ? Math.floor((new Date().getTime() - new Date(item.due_date).getTime()) / (1000 * 60 * 60 * 24)) : 0;
                      return (
                        <>
                          <div className={styles.colRightAlign}>
                            {overdueDays > 0 ? (
                              <span className="badge error" style={{ fontSize: 'var(--fs-xs)', padding: '1px 4px', borderRadius: '4px', background: 'var(--clr-error-bg)', color: 'var(--clr-error)' }}>
                                Quá hạn {overdueDays} ngày
                              </span>
                            ) : (
                              <span className="badge neutral" style={{ fontSize: 'var(--fs-xs)', padding: '1px 4px', borderRadius: '4px', background: 'var(--clr-bg)', color: 'var(--clr-text-secondary)' }}>
                                Còn {Math.abs(overdueDays)} ngày
                              </span>
                            )}
                          </div>
                          <div className={styles.colRightAlign}>
                            {formatVND(item.remaining_amount)}
                          </div>
                        </>
                      );
                    }
                    if (code === 'finance_depreciation_status') {
                      return (
                        <div className={styles.colRightAlign}>
                          {formatVND(item.depreciation_amount)}
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
                      const daysLeft = item.end_date ? Math.max(0, Math.floor((new Date(item.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0;
                      return (
                        <div className={styles.colRightAlign}>
                          <span className="badge warning" style={{ fontSize: 'var(--fs-xs)', padding: '1px 6px', borderRadius: '4px', background: 'var(--clr-warning-bg)', color: 'var(--clr-warning)' }}>
                            Còn {daysLeft} ngày
                          </span>
                        </div>
                      );
                    }
                    if (code === 'hrm_today_attendance_rate') {
                      return (
                        <div className={styles.colRightAlign}>
                          <span className="badge error" style={{ fontSize: 'var(--fs-xs)', padding: '1px 6px', borderRadius: '4px', background: 'var(--clr-error-bg)', color: 'var(--clr-error)' }}>
                            {item.status}
                          </span>
                        </div>
                      );
                    }
                    if (code === 'manufacturing_pending_wo_approval') {
                      return (
                        <div className={styles.colRightAlign}>
                          Bắt đầu: {formatDate(item.planned_start_date)}
                        </div>
                      );
                    }
                    if (code === 'manufacturing_active_wos') {
                      const pct = item.quantity > 0 ? ((item.produced_qty / item.quantity) * 100).toFixed(0) : '0';
                      return (
                        <div className={styles.colRightAlign} style={{ width: '100%' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-xs)', marginBottom: '2px', color: 'var(--clr-text-secondary)' }}>
                            <span>{item.produced_qty}/{item.quantity}</span>
                            <span>{pct}%</span>
                          </div>
                          <div className={styles.progressTrack}>
                            <div className={styles.barBlue} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    }
                    if (code === 'manufacturing_pending_declarations') {
                      const daysLeft = item.days_left;
                      let badgeText = '';
                      let badgeClass = '';
                      if (daysLeft < 0) {
                        badgeText = `Trễ ${Math.abs(daysLeft)} ngày`;
                        badgeClass = 'error';
                      } else if (daysLeft === 0) {
                        badgeText = 'Hạn hôm nay';
                        badgeClass = 'warning';
                      } else {
                        badgeText = `Còn ${daysLeft} ngày`;
                        badgeClass = 'neutral';
                      }
                      const bgMap: Record<string, string> = {
                        error: 'var(--clr-error-bg)',
                        warning: 'var(--clr-warning-bg)',
                        neutral: 'var(--clr-bg)'
                      };
                      const clrMap: Record<string, string> = {
                        error: 'var(--clr-error)',
                        warning: 'var(--clr-warning)',
                        neutral: 'var(--clr-text-secondary)'
                      };
                      return (
                        <div className={styles.colRightAlign}>
                          <span className={`badge ${badgeClass}`} style={{ fontSize: 'var(--fs-xs)', padding: '1px 6px', borderRadius: '4px', background: bgMap[badgeClass], color: clrMap[badgeClass] }}>
                            {badgeText}
                          </span>
                        </div>
                      );
                    }
                    if (code === 'manufacturing_pending_completion') {
                      return (
                        <div className={styles.colRightAlign}>
                          <span className="badge success" style={{ fontSize: 'var(--fs-xs)', padding: '1px 6px', borderRadius: '4px', background: 'var(--clr-success-bg)', color: 'var(--clr-success)' }}>
                            Chờ nghiệm thu
                          </span>
                        </div>
                      );
                    }
                    return <span className={styles.colRightAlign}>{item.value || formatDate(item.posting_date || item.created_at)}</span>;
                  })()}
                </div>
              );
            })}
          </div>
        )}

        {mappedUrl && (
          <Link to={mappedUrl} className={styles.viewAllLink}>
            <span>Xem tất cả</span>
            <ArrowRight size={12} />
          </Link>
        )}
      </div>
    </div>
  );
}

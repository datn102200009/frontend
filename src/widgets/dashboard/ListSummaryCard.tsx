import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Inbox } from 'lucide-react';
import styles from './DashboardWidgets.module.css';
import { formatVND } from './MetricCard';

function mapRoute(url: string, code: string): string {
  if (!url) return '';
  const [path, search] = url.split('?');
  const params = new URLSearchParams(search || '');

  let newPath = path;

  if (code.startsWith('sales_')) {
    newPath = '/sales';
    if (code === 'sales_draft_orders') {
      params.set('tab', 'orders');
      params.set('status', 'draft');
    } else if (code === 'sales_pending_credit_bypass') {
      params.set('tab', 'orders');
      params.set('status', 'pending_credit_approval');
    } else if (code === 'sales_pending_fulfillment') {
      params.set('tab', 'orders');
      params.set('status', 'pending');
    } else if (code === 'finance_unpaid_sales_invoices') {
      params.set('tab', 'invoices');
      params.set('status', 'unpaid');
    } else if (path.includes('/invoices')) {
      params.set('tab', 'invoices');
    } else {
      params.set('tab', 'orders');
    }
  } else if (code.startsWith('purchasing_') || code === 'finance_unpaid_purchase_invoices') {
    newPath = '/purchasing';
    if (code === 'purchasing_draft_orders') {
      params.set('tab', 'orders');
      params.set('status', 'draft');
    } else if (code === 'purchasing_pending_delivery') {
      params.set('tab', 'orders');
      params.set('status', 'pending');
    } else if (code === 'purchasing_pending_qc') {
      params.set('tab', 'qc');
    } else if (code === 'purchasing_pending_logistic_fees') {
      params.set('tab', 'shipment');
    } else if (code === 'purchasing_blocked_invoices') {
      params.set('tab', 'invoices');
      params.set('status', 'blocked');
    } else if (code === 'finance_unpaid_purchase_invoices') {
      params.set('tab', 'invoices');
      params.set('status', 'unpaid');
    } else if (path.includes('/invoices')) {
      params.set('tab', 'invoices');
    } else {
      params.set('tab', 'orders');
    }
  } else if (code.startsWith('inventory_')) {
    newPath = '/inventory';
    if (code === 'inventory_pending_entries') {
      params.set('tab', 'entries');
    } else if (code === 'inventory_low_stock' || code === 'inventory_pending_entry_count') {
      params.set('tab', 'ledger');
    }
  } else if (code.startsWith('finance_')) {
    if (path.includes('/fixed-assets')) {
      newPath = '/finance/fixed-assets';
    } else {
      newPath = '/finance';
    }
  } else if (code.startsWith('hrm_')) {
    newPath = '/hrm';
    if (code === 'hrm_payroll_lifecycle_status') {
      params.set('tab', 'salary');
    } else if (code === 'hrm_pending_leave_requests') {
      params.set('tab', 'leave');
      params.set('status', 'pending');
    } else if (code === 'hrm_expiring_contracts' || code === 'hrm_employees_without_contract') {
      params.set('tab', 'employees');
    } else if (code === 'hrm_today_attendance_rate') {
      params.set('tab', 'attendance');
    }
  } else if (code.startsWith('manufacturing_')) {
    newPath = '/bom';
    params.set('tab', 'wo');
    if (code === 'manufacturing_pending_wo_approval') {
      params.set('status', 'pending_approval');
    } else if (code === 'manufacturing_active_wos' || code === 'manufacturing_pending_declarations') {
      params.set('status', 'in_progress');
    } else if (code === 'manufacturing_pending_completion') {
      params.set('status', 'in_progress');
    }
  }

  const queryStr = params.toString();
  return queryStr ? `${newPath}?${queryStr}` : newPath;
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
  let gridCols = '1.2fr 1fr 1fr';
  if (code === 'purchasing_pending_delivery') {
    gridCols = '80px 1.2fr 1fr 1.2fr';
  } else if (code === 'hrm_pending_leave_requests') {
    gridCols = '1.5fr 1.2fr';
  } else if (code.startsWith('sales_') || code === 'purchasing_draft_orders') {
    gridCols = '90px 1.2fr 1fr';
  } else if (code === 'purchasing_blocked_invoices' || code === 'finance_unpaid_purchase_invoices' || code === 'finance_unpaid_sales_invoices') {
    gridCols = '110px 1.2fr 1.2fr';
  } else if (code === 'inventory_pending_entries') {
    gridCols = '110px 1.2fr 1.2fr';
  } else if (code.startsWith('manufacturing_')) {
    gridCols = '95px 1.2fr 1.2fr';
  }

  // Handle custom border styling for credit controls and match blocks
  let cardClass = styles.card;
  if (code === 'sales_pending_credit_bypass') {
    cardClass = `${styles.card} ${styles.warningBorder}`;
  } else if (code === 'purchasing_blocked_invoices') {
    cardClass = `${styles.card} ${styles.dangerBorder}`;
  }

  return (
    <div className={cardClass}>
      <div className={styles.cardHeader}>
        <div className={styles.titleArea}>
          <span className={styles.cardTitle}>{title}</span>
          {filteredItems.length > 0 && (
            <span className="shared-badge" style={{
              background: 'var(--clr-bg)',
              color: 'var(--clr-text-secondary)',
              fontSize: '11px',
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
                    if (code.startsWith('sales_')) {
                      const salesStatus = code === 'sales_draft_orders' ? 'draft' : code === 'sales_pending_credit_bypass' ? 'pending_credit_approval' : 'pending';
                      return (
                        <Link to={`/sales?status=${salesStatus}&tab=orders`} className={styles.colBoldLink}>
                          SO-{shortId}
                        </Link>
                      );
                    }
                    if (code === 'purchasing_draft_orders' || code === 'purchasing_pending_delivery') {
                      const purStatus = code === 'purchasing_draft_orders' ? 'draft' : 'pending';
                      return (
                        <Link to={`/purchasing?status=${purStatus}&tab=orders`} className={styles.colBoldLink}>
                          PO-{shortId}
                        </Link>
                      );
                    }
                    if (code === 'purchasing_pending_qc') {
                      return (
                        <Link to={`/purchasing?tab=qc`} className={styles.colBoldLink}>
                          {item.shipment_num || 'QC'}
                        </Link>
                      );
                    }
                    if (code === 'purchasing_pending_logistic_fees') {
                      return (
                        <Link to={`/purchasing?tab=shipment`} className={styles.colBoldLink}>
                          {item.shipment_num || 'FEE'}
                        </Link>
                      );
                    }
                    if (code === 'purchasing_blocked_invoices') {
                      return (
                        <Link to={`/purchasing?status=blocked&tab=invoices`} className={styles.colBoldLink}>
                          INV-{shortId}
                        </Link>
                      );
                    }
                    if (code === 'inventory_low_stock') {
                      return (
                        <Link to={`/inventory?tab=ledger`} className={styles.colBoldLink}>
                          {item.item_code}
                        </Link>
                      );
                    }
                    if (code === 'inventory_pending_entries') {
                      const iconMap: Record<string, string> = { receipt: '📥', issue: '📤', transfer: '🔄' };
                      return (
                        <Link to={`/inventory?tab=entries`} className={styles.colBoldLink} style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                          <span>{iconMap[item.purpose] || '📦'}</span>
                          <span className={styles.colTextEllipsis} style={{ maxWidth: '65px' }}>{item.name}</span>
                        </Link>
                      );
                    }
                    if (code === 'finance_unpaid_purchase_invoices') {
                      return (
                        <Link to={`/purchasing?status=unpaid&tab=invoices`} className={styles.colBoldLink}>
                          INV-{shortId}
                        </Link>
                      );
                    }
                    if (code === 'finance_unpaid_sales_invoices') {
                      return (
                        <Link to={`/sales?status=unpaid&tab=invoices`} className={styles.colBoldLink}>
                          INV-{shortId}
                        </Link>
                      );
                    }
                    if (code === 'hrm_pending_leave_requests') {
                      return (
                        <Link to={`/hrm?tab=leave`} className={styles.colBoldLink}>
                          {item.employee_name}
                        </Link>
                      );
                    }
                    if (code === 'hrm_expiring_contracts') {
                      return (
                        <Link to={`/hrm?tab=employees`} className={styles.colBoldLink}>
                          {item.contract_no || `CON-${shortId}`}
                        </Link>
                      );
                    }
                    if (code === 'hrm_employees_without_contract') {
                      return (
                        <Link to={`/hrm?tab=employees`} className={styles.colBoldLink}>
                          {item.employee_id}
                        </Link>
                      );
                    }
                    if (code.startsWith('manufacturing_')) {
                      const mStatus = code === 'manufacturing_pending_wo_approval' ? 'pending_approval' : 'in_progress';
                      return (
                        <Link to={`/bom?status=${mStatus}&tab=wo`} className={styles.colBoldLink}>
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
                          <div className={styles.colTextEllipsis} style={{ fontWeight: 'var(--fw-medium)' }}>
                            {item.customer_name || 'Khách hàng'}
                          </div>
                          {code === 'sales_pending_credit_bypass' && (
                            <div className={styles.colOrangeText}>{item.reason || 'Vượt hạn mức nợ'}</div>
                          )}
                          {code === 'sales_pending_fulfillment' && (
                            <div style={{ fontSize: '10px', color: 'var(--clr-text-muted)' }}>SO ngày: {formatDate(item.created_at)}</div>
                          )}
                          {code === 'sales_draft_orders' && (
                            <div style={{ fontSize: '10px', color: 'var(--clr-text-muted)' }}>Tạo: {daysAgoText}</div>
                          )}
                        </div>
                      );
                    }
                    if (code === 'purchasing_pending_qc' || code === 'purchasing_pending_logistic_fees') {
                      const daysArrived = item.created_at ? Math.max(0, Math.floor((new Date().getTime() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24))) : 0;
                      return (
                        <div className={styles.colTextEllipsis}>
                          <div className={styles.colTextEllipsis} style={{ fontWeight: 'var(--fw-medium)' }}>
                            {item.name || 'Lô hàng'}
                          </div>
                          {code === 'purchasing_pending_qc' && (
                            <div style={{ fontSize: '10px', color: 'var(--clr-text-muted)' }}>Cập bến {daysArrived} ngày trước</div>
                          )}
                        </div>
                      );
                    }
                    if ((code.startsWith('purchasing_') && code !== 'purchasing_pending_qc' && code !== 'purchasing_pending_logistic_fees') || code === 'finance_unpaid_purchase_invoices') {
                      return (
                        <div className={styles.colTextEllipsis}>
                          <div className={styles.colTextEllipsis} style={{ fontWeight: 'var(--fw-medium)' }}>
                            {item.supplier_name || 'Nhà cung cấp'}
                          </div>
                          {code === 'purchasing_blocked_invoices' && (
                            <div className={styles.colRedText}>{item.block_reason || 'Bị chặn thanh toán'}</div>
                          )}
                        </div>
                      );
                    }
                    if (code === 'inventory_low_stock') {
                      return (
                        <div className={styles.colTextEllipsis}>
                          <div className={styles.colTextEllipsis} style={{ fontWeight: 'var(--fw-medium)' }}>{item.item_name}</div>
                          <div style={{ fontSize: '10px', color: 'var(--clr-text-muted)' }}>{item.warehouse_name}</div>
                        </div>
                      );
                    }
                    if (code === 'inventory_pending_entries') {
                      return (
                        <div className={styles.colTextEllipsis}>
                          <div className={styles.colTextEllipsis} style={{ fontWeight: 'var(--fw-medium)' }}>{item.route_desc}</div>
                          <div style={{ fontSize: '10px', color: 'var(--clr-text-muted)' }}>{item.remarks || 'Yêu cầu kho nháp'}</div>
                        </div>
                      );
                    }
                    if (code === 'hrm_pending_leave_requests') {
                      return (
                        <div className={styles.colTextEllipsis}>
                          <div className={styles.colTextEllipsis} style={{ fontWeight: 'var(--fw-medium)' }}>{item.leave_type || 'Nghỉ phép'}</div>
                          <div style={{ fontSize: '10px', color: 'var(--clr-text-muted)' }}>{formatDate(item.start_date)} - {formatDate(item.end_date)}</div>
                        </div>
                      );
                    }
                    if (code === 'hrm_expiring_contracts' || code === 'hrm_employees_without_contract') {
                      return (
                        <div className={styles.colTextEllipsis}>
                          <div className={styles.colTextEllipsis} style={{ fontWeight: 'var(--fw-medium)' }}>{item.employee_name || item.full_name}</div>
                          <div style={{ fontSize: '10px', color: 'var(--clr-text-muted)' }}>{item.contract_type || item.department}</div>
                        </div>
                      );
                    }
                    if (code.startsWith('manufacturing_')) {
                      return (
                        <div className={styles.colTextEllipsis}>
                          <div className={styles.colTextEllipsis} style={{ fontWeight: 'var(--fw-medium)' }}>{item.production_item_name}</div>
                          {code === 'manufacturing_pending_completion' && (
                            <div style={{ fontSize: '10px', color: 'var(--clr-text-muted)' }}>Đích: {item.target_warehouse_name || 'Kho thành phẩm'}</div>
                          )}
                        </div>
                      );
                    }
                    return <span className={styles.colTextEllipsis}>{item.name || item.title || 'Chi tiết'}</span>;
                  })()}

                  {/* Column 3 & 4: Contextual Metadata (Values, Progress, Status) */}
                  {(() => {
                    if (code === 'sales_draft_orders' || code === 'purchasing_draft_orders') {
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
                    if (code === 'sales_pending_fulfillment') {
                      return (
                        <div className={styles.colRightAlign} style={{ display: 'flex', gap: '4px', fontSize: '14px' }}>
                          <span>💰🟡</span>
                          <span>📦⏳</span>
                        </div>
                      );
                    }
                    if (code === 'purchasing_pending_delivery') {
                      const isOverdue = item.expected_delivery_date ? new Date().getTime() > new Date(item.expected_delivery_date).getTime() : false;
                      const dateClass = isOverdue ? styles.colRedText : '';
                      return (
                        <>
                          <div className={`${styles.colRightAlign} ${dateClass}`} style={{ fontSize: 'var(--fs-xs)' }}>
                            {item.expected_delivery_date ? formatDate(item.expected_delivery_date) : 'Chưa có hạn'}
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
                          <span className="badge warning" style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: 'var(--clr-warning-bg)', color: 'var(--clr-warning)' }}>
                            Chờ QC
                          </span>
                        </div>
                      );
                    }
                    if (code === 'purchasing_pending_logistic_fees') {
                      const daysArrived = item.created_at ? Math.max(0, Math.floor((new Date().getTime() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24))) : 0;
                      const dayClass = daysArrived > 3 ? styles.colRedText : '';
                      return (
                        <div className={`${styles.colRightAlign} ${dayClass}`}>
                          {daysArrived} ngày trước
                        </div>
                      );
                    }
                    if (code === 'inventory_low_stock') {
                      const textClass = item.status === 'critical' ? styles.colRedText : styles.colOrangeText;
                      return (
                        <>
                          <div className={`${styles.colRightAlign} ${textClass}`}>
                            {item.balance} {item.uom}
                          </div>
                          <div className={styles.colRightAlign} style={{ fontSize: '10px', color: 'var(--clr-text-muted)' }}>
                            &lt; 50 cái
                          </div>
                        </>
                      );
                    }
                    if (code === 'inventory_pending_entries') {
                      return (
                        <div className={styles.colRightAlign}>
                          <div>{item.item_count} mặt hàng</div>
                          <div style={{ fontSize: '10px', color: 'var(--clr-text-muted)' }}>Tạo: {formatDate(item.created_at)}</div>
                        </div>
                      );
                    }
                    if (code === 'finance_unpaid_purchase_invoices' || code === 'finance_unpaid_sales_invoices') {
                      const overdueDays = item.due_date ? Math.floor((new Date().getTime() - new Date(item.due_date).getTime()) / (1000 * 60 * 60 * 24)) : 0;
                      return (
                        <>
                          <div className={styles.colRightAlign}>
                            {overdueDays > 0 ? (
                              <span className="badge error" style={{ fontSize: '10px', padding: '1px 4px', borderRadius: '4px', background: 'var(--clr-error-bg)', color: 'var(--clr-error)' }}>
                                Quá hạn {overdueDays} ngày
                              </span>
                            ) : (
                              <span className="badge neutral" style={{ fontSize: '10px', padding: '1px 4px', borderRadius: '4px', background: 'var(--clr-bg)', color: 'var(--clr-text-muted)' }}>
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
                          <span className="badge warning" style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: 'var(--clr-warning-bg)', color: 'var(--clr-warning)' }}>
                            Còn {daysLeft} ngày
                          </span>
                        </div>
                      );
                    }
                    if (code === 'hrm_employees_without_contract') {
                      const joinDays = item.join_date ? Math.floor((new Date().getTime() - new Date(item.join_date).getTime()) / (1000 * 60 * 60 * 24)) : 0;
                      const textClass = joinDays > 30 ? styles.colRedText : styles.colOrangeText;
                      return (
                        <div className={`${styles.colRightAlign} ${textClass}`}>
                          {joinDays} ngày chưa ký HĐ
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
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '2px', color: 'var(--clr-text-secondary)' }}>
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
                      return (
                        <div className={styles.colRightAlign}>
                          Còn {item.quantity - item.produced_qty} cái
                        </div>
                      );
                    }
                    if (code === 'manufacturing_pending_completion') {
                      return (
                        <div className={styles.colRightAlign}>
                          <span className="badge success" style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: 'var(--clr-success-bg)', color: 'var(--clr-success)' }}>
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

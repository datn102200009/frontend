import React, { useState } from 'react';
import { CashFlowTable } from '@widgets/finance/CashFlowTable';
import { CashFlowFormModal } from '@features/finance/create-transaction/ui/CashFlowFormModal';
import { Button } from '@shared/ui/Button/Button';
import { Badge } from '@shared/ui/Badge/Badge';
import { Modal } from '@shared/ui/Modal/Modal';
import { Input } from '@shared/ui/Input/Input';
import { useToast } from '@shared/ui/Toast/Toast';
import { CreditCard, ChevronLeft, ChevronRight, DollarSign, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useGetPurchasingInvoicesQuery } from '@entities/purchasing/api/purchasingApi';
import { useGetSalesInvoicesQuery } from '@entities/sales/api/salesApi';
import { usePostFinanceInvoicesPurchaseByPkPayMutation } from '@entities/finance/api/financeApi';
import styles from './FinancePage.module.css';

const FinancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cashflow' | 'ap' | 'ar'>('cashflow');
  const [createType, setCreateType] = useState<'income' | 'expense' | null>(null);
  
  // Pagination & query state for AP
  const [pageAP, setPageAP] = useState(1);
  const { data: apData, isLoading: isLoadingAP, refetch: refetchAP } = useGetPurchasingInvoicesQuery(
    { status: 'unpaid,partial', page: pageAP, limit: 10 },
    { skip: activeTab !== 'ap' }
  );

  // Pagination & query state for AR
  const [pageAR, setPageAR] = useState(1);
  const { data: arData, isLoading: isLoadingAR, refetch: refetchAR } = useGetSalesInvoicesQuery(
    { status: 'unpaid,partial', page: pageAR, limit: 10 },
    { skip: activeTab !== 'ar' }
  );

  // AR collection modal state
  const [selectedARInvoice, setSelectedARInvoice] = useState<{ id: string; amount: number; name?: string } | null>(null);

  // AP payment modal state
  const [selectedAPInvoice, setSelectedAPInvoice] = useState<{ id: string; amount: number } | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer'>('bank_transfer');
  const [payError, setPayError] = useState('');
  
  const [payPurchaseInvoice, { isLoading: isPayingAP }] = usePostFinanceInvoicesPurchaseByPkPayMutation();
  const { toast } = useToast();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const handleOpenAPPayment = (invoiceId: string, remainingAmount: number) => {
    setSelectedAPInvoice({ id: invoiceId, amount: remainingAmount });
    setPayAmount(remainingAmount);
    setPaymentMethod('bank_transfer');
    setPayError('');
  };

  const handleAPPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayError('');

    if (!selectedAPInvoice) return;

    if (payAmount <= 0) {
      setPayError('Số tiền thanh toán phải lớn hơn 0.');
      return;
    }
    if (payAmount > selectedAPInvoice.amount) {
      setPayError(`Số tiền thanh toán vượt quá số tiền còn nợ (${formatCurrency(selectedAPInvoice.amount)}).`);
      return;
    }

    try {
      await payPurchaseInvoice({
        pk: selectedAPInvoice.id,
        payInvoiceInput: {
          amount: payAmount,
          payment_method: paymentMethod,
        }
      }).unwrap();
      
      toast('success', 'Thanh toán hóa đơn mua hàng thành công');
      setSelectedAPInvoice(null);
      refetchAP();
    } catch (err: unknown) {
      const error = err as { data?: { detail?: string } };
      setPayError(error?.data?.detail || 'Giao dịch thất bại. Vui lòng kiểm tra lại.');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Quản Lý Tài Chính & Dòng Tiền</h2>
          <p className={styles.subtitle}>Ghi nhận các khoản thu chi, quản lý nợ phải trả (AP) và nợ phải thu (AR)</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button 
            variant="outline"
            icon={<ArrowDownRight size={16} style={{ color: 'var(--clr-success)' }} />} 
            onClick={() => setCreateType('income')}
          >
            Ghi Nhận Thu Tiền
          </Button>
          <Button 
            variant="outline"
            icon={<ArrowUpRight size={16} style={{ color: 'var(--clr-danger)' }} />} 
            onClick={() => setCreateType('expense')}
          >
            Ghi Nhận Chi Tiền
          </Button>
        </div>
      </div>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'cashflow' ? styles.active : ''}`}
          onClick={() => setActiveTab('cashflow')}
        >
          Dòng Tiền
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'ap' ? styles.active : ''}`}
          onClick={() => setActiveTab('ap')}
        >
          Phải Trả (AP)
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'ar' ? styles.active : ''}`}
          onClick={() => setActiveTab('ar')}
        >
          Phải Thu (AR)
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'cashflow' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <CashFlowTable />
          </div>
        )}

        {activeTab === 'ap' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--fs-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--clr-border)', backgroundColor: '#f8fafc', color: 'var(--clr-text-secondary)', fontWeight: 600 }}>
                    <th style={{ padding: 'var(--sp-4)' }}>Mã Hóa Đơn</th>
                    <th style={{ padding: 'var(--sp-4)' }}>Đơn Hàng Gốc</th>
                    <th style={{ padding: 'var(--sp-4)' }}>Nhà Cung Cấp</th>
                    <th style={{ padding: 'var(--sp-4)', textAlign: 'right' }}>Tổng Tiền</th>
                    <th style={{ padding: 'var(--sp-4)', textAlign: 'right' }}>Đã Trả</th>
                    <th style={{ padding: 'var(--sp-4)', textAlign: 'right' }}>Còn Nợ</th>
                    <th style={{ padding: 'var(--sp-4)' }}>Hạn Thanh Toán</th>
                    <th style={{ padding: 'var(--sp-4)' }}>Trạng Thái</th>
                    <th style={{ padding: 'var(--sp-4)', textAlign: 'center' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingAP ? (
                    <tr>
                      <td colSpan={9} style={{ padding: 'var(--sp-8)', textAlign: 'center', color: 'var(--clr-text-muted)' }}>Đang tải dữ liệu...</td>
                    </tr>
                  ) : !apData?.results || apData.results.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ padding: 'var(--sp-8)', textAlign: 'center', color: 'var(--clr-text-muted)' }}>Không có hóa đơn mua hàng nào chưa thanh toán.</td>
                    </tr>
                  ) : (
                    apData.results.map((inv) => {
                      const remaining = (inv.total_amount || 0) - (inv.paid_amount || 0);
                      return (
                        <tr key={inv.id} style={{ borderBottom: '1px solid var(--clr-border)' }}>
                          <td style={{ padding: 'var(--sp-4)', fontWeight: 500 }}>{(inv.id || '').slice(0, 8).toUpperCase()}</td>
                          <td style={{ padding: 'var(--sp-4)', color: 'var(--clr-text-secondary)' }}>
                            {inv.order ? (inv.order || '').slice(0, 8).toUpperCase() : 'N/A'}
                          </td>
                          <td style={{ padding: 'var(--sp-4)' }}>{inv.vendor_name || 'N/A'}</td>
                          <td style={{ padding: 'var(--sp-4)', textAlign: 'right', fontWeight: 500 }}>{formatCurrency(inv.total_amount || 0)}</td>
                          <td style={{ padding: 'var(--sp-4)', textAlign: 'right', color: 'var(--clr-success)' }}>{formatCurrency(inv.paid_amount || 0)}</td>
                          <td style={{ padding: 'var(--sp-4)', textAlign: 'right', color: 'var(--clr-danger)', fontWeight: 500 }}>{formatCurrency(remaining)}</td>
                          <td style={{ padding: 'var(--sp-4)' }}>
                            {inv.due_date ? new Date(inv.due_date).toLocaleDateString('vi-VN') : 'Không có'}
                          </td>
                          <td style={{ padding: 'var(--sp-4)' }}>
                            <Badge variant={inv.status === 'partial' ? 'warning' : 'error'}>
                              {inv.status === 'partial' ? 'Trả một phần' : 'Chưa thanh toán'}
                            </Badge>
                          </td>
                          <td style={{ padding: 'var(--sp-4)', textAlign: 'center' }}>
                            <Button 
                              size="sm"
                              icon={<CreditCard size={14} />}
                              onClick={() => handleOpenAPPayment(inv.id!, remaining)}
                            >
                              Thanh Toán
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination for AP */}
            {apData && apData.total_pages && apData.total_pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', padding: 'var(--sp-4)', borderTop: '1px solid var(--clr-border)' }}>
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>
                  Trang {pageAP} / {apData.total_pages} (Tổng {apData.count} hóa đơn)
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    icon={<ChevronLeft size={16} />} 
                    disabled={pageAP <= 1}
                    onClick={() => setPageAP(p => p - 1)}
                  >
                    {""}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    icon={<ChevronRight size={16} />} 
                    disabled={pageAP >= (apData.total_pages || 1)}
                    onClick={() => setPageAP(p => p + 1)}
                  >
                    {""}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ar' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--fs-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--clr-border)', backgroundColor: '#f8fafc', color: 'var(--clr-text-secondary)', fontWeight: 600 }}>
                    <th style={{ padding: 'var(--sp-4)' }}>Mã Hóa Đơn</th>
                    <th style={{ padding: 'var(--sp-4)' }}>Đơn Hàng Gốc</th>
                    <th style={{ padding: 'var(--sp-4)' }}>Khách Hàng</th>
                    <th style={{ padding: 'var(--sp-4)', textAlign: 'right' }}>Tổng Tiền</th>
                    <th style={{ padding: 'var(--sp-4)', textAlign: 'right' }}>Đã Thu</th>
                    <th style={{ padding: 'var(--sp-4)', textAlign: 'right' }}>Còn Nợ</th>
                    <th style={{ padding: 'var(--sp-4)' }}>Ngày Tạo</th>
                    <th style={{ padding: 'var(--sp-4)' }}>Trạng Thái</th>
                    <th style={{ padding: 'var(--sp-4)', textAlign: 'center' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingAR ? (
                    <tr>
                      <td colSpan={9} style={{ padding: 'var(--sp-8)', textAlign: 'center', color: 'var(--clr-text-muted)' }}>Đang tải dữ liệu...</td>
                    </tr>
                  ) : !arData?.results || arData.results.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ padding: 'var(--sp-8)', textAlign: 'center', color: 'var(--clr-text-muted)' }}>Không có hóa đơn bán hàng nào chưa thu tiền.</td>
                    </tr>
                  ) : (
                    arData.results.map((inv) => {
                      const remaining = (inv.total_amount || 0) - (inv.paid_amount || 0);
                      return (
                        <tr key={inv.id} style={{ borderBottom: '1px solid var(--clr-border)' }}>
                          <td style={{ padding: 'var(--sp-4)', fontWeight: 500 }}>{(inv.id || '').slice(0, 8).toUpperCase()}</td>
                          <td style={{ padding: 'var(--sp-4)', color: 'var(--clr-text-secondary)' }}>
                            {inv.order ? (inv.order || '').slice(0, 8).toUpperCase() : 'N/A'}
                          </td>
                          <td style={{ padding: 'var(--sp-4)' }}>{inv.customer_name || 'N/A'}</td>
                          <td style={{ padding: 'var(--sp-4)', textAlign: 'right', fontWeight: 500 }}>{formatCurrency(inv.total_amount || 0)}</td>
                          <td style={{ padding: 'var(--sp-4)', textAlign: 'right', color: 'var(--clr-success)' }}>{formatCurrency(inv.paid_amount || 0)}</td>
                          <td style={{ padding: 'var(--sp-4)', textAlign: 'right', color: 'var(--clr-danger)', fontWeight: 500 }}>{formatCurrency(remaining)}</td>
                          <td style={{ padding: 'var(--sp-4)' }}>
                            {inv.created_at ? new Date(inv.created_at).toLocaleDateString('vi-VN') : 'Không có'}
                          </td>
                          <td style={{ padding: 'var(--sp-4)' }}>
                            <Badge variant={inv.status === 'partial' ? 'warning' : 'error'}>
                              {inv.status === 'partial' ? 'Thu một phần' : 'Chưa thu tiền'}
                            </Badge>
                          </td>
                          <td style={{ padding: 'var(--sp-4)', textAlign: 'center' }}>
                            <Button 
                              size="sm"
                              icon={<DollarSign size={14} />}
                              onClick={() => setSelectedARInvoice({ id: inv.id!, amount: remaining, name: inv.customer_name })}
                            >
                              Thu Tiền
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination for AR */}
            {arData && arData.total_pages && arData.total_pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', padding: 'var(--sp-4)', borderTop: '1px solid var(--clr-border)' }}>
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>
                  Trang {pageAR} / {arData.total_pages} (Tổng {arData.count} hóa đơn)
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    icon={<ChevronLeft size={16} />} 
                    disabled={pageAR <= 1}
                    onClick={() => setPageAR(p => p - 1)}
                  >
                    {""}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    icon={<ChevronRight size={16} />} 
                    disabled={pageAR >= (arData.total_pages || 1)}
                    onClick={() => setPageAR(p => p + 1)}
                  >
                    {""}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cash Flow Form Modal (Universal) */}
      {createType && (
        <CashFlowFormModal 
          open={!!createType} 
          onClose={() => setCreateType(null)} 
          onSuccess={() => setCreateType(null)} 
          defaultValues={{ payment_type: createType === 'income' ? 'receive' : 'pay' }} 
        />
      )}

      {/* AR invoice collection modal overlay using CashFlowFormModal */}
      {selectedARInvoice && (
        <CashFlowFormModal 
          open={!!selectedARInvoice}
          onClose={() => setSelectedARInvoice(null)}
          onSuccess={() => {
            setSelectedARInvoice(null);
            refetchAR();
          }}
          defaultValues={{
            payment_type: 'receive',
            sales_invoice_id: selectedARInvoice.id,
            amount: selectedARInvoice.amount,
            category: 'Thanh toán hóa đơn',
            remarks: `Thu tiền thanh toán hóa đơn bán ${selectedARInvoice.id.slice(0, 8).toUpperCase()} (Khách hàng: ${selectedARInvoice.name || 'N/A'}, Số tiền: ${formatCurrency(selectedARInvoice.amount)}).`
          }}
        />
      )}

      {/* AP payment modal overlay */}
      {selectedAPInvoice && (
        <Modal 
          open={!!selectedAPInvoice} 
          onClose={() => setSelectedAPInvoice(null)} 
          title="Thanh Toán Hóa Đơn Mua (AP)"
          size="md"
        >
          <form onSubmit={handleAPPaymentSubmit} className={styles.payForm} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
            {payError && <div style={{ padding: 'var(--sp-3)', backgroundColor: '#fef2f2', color: 'var(--clr-danger)', borderRadius: 'var(--br-md)', fontSize: 'var(--fs-sm)' }}>{payError}</div>}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', borderBottom: '1px solid var(--clr-border)', paddingBottom: 'var(--sp-2)' }}>
              <span>Số tiền còn nợ:</span>
              <strong style={{ color: 'var(--clr-danger)' }}>{formatCurrency(selectedAPInvoice.amount)}</strong>
            </div>

            <Input 
              label="Số tiền thanh toán (VND)" 
              type="number"
              value={payAmount}
              onChange={(e) => setPayAmount(Number(e.target.value))}
              required
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
              <label style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--clr-text-secondary)' }}>Phương thức thanh toán</label>
              <select 
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'bank_transfer')}
                style={{
                  width: '100%',
                  padding: 'var(--sp-2) var(--sp-3)',
                  borderRadius: 'var(--br-md)',
                  border: '1px solid var(--clr-border)',
                  backgroundColor: 'white',
                  fontSize: 'var(--fs-sm)'
                }}
              >
                <option value="bank_transfer">Chuyển khoản ngân hàng</option>
                <option value="cash">Tiền mặt</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'var(--sp-2)' }}>
              <Button type="button" variant="secondary" onClick={() => setSelectedAPInvoice(null)} disabled={isPayingAP}>Hủy</Button>
              <Button type="submit" loading={isPayingAP}>Xác nhận thanh toán</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default FinancePage;

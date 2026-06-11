import React, { useState, useMemo } from 'react';
import { CashFlowTable } from '@widgets/finance/CashFlowTable';
import { CashFlowFormModal } from '@features/finance/create-transaction/ui/CashFlowFormModal';
import { Button } from '@shared/ui/Button/Button';
import { Badge } from '@shared/ui/Badge/Badge';
import { Modal } from '@shared/ui/Modal/Modal';
import { Input } from '@shared/ui/Input/Input';
import { useToast } from '@shared/ui/Toast/Toast';
import { CreditCard, ChevronLeft, ChevronRight, DollarSign, Check } from 'lucide-react';
import { useGetPurchasingInvoicesQuery } from '@entities/purchasing/api/purchasingApi';
import { useGetSalesInvoicesQuery } from '@entities/sales/api/salesApi';
import {
  usePostFinanceInvoicesPurchaseByPkPayMutation,
  useGetFinanceCashFlowsQuery,
  usePostFinanceCashFlowsByPkApproveMutation
} from '@entities/finance/api/financeApi';
import { usePermission } from '@shared/hooks/usePermission';
import { DataTable } from '@shared/ui/DataTable/DataTable';
import { createColumnHelper } from '@tanstack/react-table';
import type { CashFlowTransaction } from '@entities/finance/api/financeApi';
import styles from './FinancePage.module.css';

const FinancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cashflow' | 'ap' | 'ar' | 'approvals'>('cashflow');
  
  // Permissions
  const hasApprovePermission = usePermission('finance.approve_cash_flow');

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

  // Pagination & query state for Approvals
  const [pageApprovals, setPageApprovals] = useState(1);
  const { data: approvalsData, isLoading: isLoadingApprovals, refetch: refetchApprovals } = useGetFinanceCashFlowsQuery(
    { status: 'pending_approval', page: pageApprovals, limit: 10 },
    { skip: activeTab !== 'approvals' || !hasApprovePermission }
  );

  // AR collection modal state
  const [selectedARInvoice, setSelectedARInvoice] = useState<{ id: string; amount: number; name?: string } | null>(null);

  // AP payment modal state
  const [selectedAPInvoice, setSelectedAPInvoice] = useState<{ id: string; amount: number } | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer'>('bank_transfer');
  const [payError, setPayError] = useState('');
  
  const [payPurchaseInvoice, { isLoading: isPayingAP }] = usePostFinanceInvoicesPurchaseByPkPayMutation();
  const [approveCashFlow, { isLoading: isApproving }] = usePostFinanceCashFlowsByPkApproveMutation();
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

  const handleApproveCashFlow = async (id: string) => {
    try {
      await approveCashFlow({ pk: id }).unwrap();
      toast('success', 'Phê duyệt giao dịch dòng tiền thành công');
      refetchApprovals();
      refetchAP();
      refetchAR();
    } catch (err: unknown) {
      const error = err as { data?: { detail?: string } };
      toast('error', error?.data?.detail || 'Phê duyệt thất bại. Vui lòng kiểm tra lại.');
    }
  };

  // Columns definitions using createColumnHelper
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apColumnHelper = createColumnHelper<any>();
  const apColumns = useMemo(() => [
    apColumnHelper.accessor('id', {
      header: 'Mã Hóa Đơn',
      cell: (info) => <span style={{ fontWeight: 500 }}>{(info.getValue() || '').slice(0, 8).toUpperCase()}</span>,
    }),
    apColumnHelper.accessor('order', {
      header: 'Đơn Hàng Gốc',
      cell: (info) => (
        <span style={{ color: 'var(--clr-text-secondary)' }}>
          {info.getValue() ? (info.getValue() || '').slice(0, 8).toUpperCase() : 'N/A'}
        </span>
      ),
    }),
    apColumnHelper.accessor('vendor_name', {
      header: 'Nhà Cung Cấp',
      cell: (info) => info.getValue() || 'N/A',
    }),
    apColumnHelper.accessor('total_amount', {
      header: 'Tổng Tiền',
      cell: (info) => <span style={{ fontWeight: 500 }}>{formatCurrency(info.getValue() || 0)}</span>,
    }),
    apColumnHelper.accessor('paid_amount', {
      header: 'Đã Trả',
      cell: (info) => <span style={{ color: 'var(--clr-success)' }}>{formatCurrency(info.getValue() || 0)}</span>,
    }),
    apColumnHelper.display({
      id: 'remaining',
      header: 'Còn Nợ',
      cell: (info) => {
        const inv = info.row.original;
        const remaining = (inv.total_amount || 0) - (inv.paid_amount || 0);
        return <span style={{ color: 'var(--clr-danger)', fontWeight: 500 }}>{formatCurrency(remaining)}</span>;
      },
    }),
    apColumnHelper.accessor('due_date', {
      header: 'Hạn Thanh Toán',
      cell: (info) => info.getValue() ? new Date(info.getValue()).toLocaleDateString('vi-VN') : 'Không có',
    }),
    apColumnHelper.accessor('status', {
      header: 'Trạng Thái',
      cell: (info) => (
        <Badge variant={info.getValue() === 'partial' ? 'warning' : 'error'}>
          {info.getValue() === 'partial' ? 'Trả một phần' : 'Chưa thanh toán'}
        </Badge>
      ),
    }),
    apColumnHelper.display({
      id: 'actions',
      header: 'Thao Tác',
      cell: (info) => {
        const inv = info.row.original;
        const remaining = (inv.total_amount || 0) - (inv.paid_amount || 0);
        return (
          <Button 
            size="sm"
            icon={<CreditCard size={14} />}
            onClick={() => handleOpenAPPayment(inv.id!, remaining)}
          >
            Thanh Toán
          </Button>
        );
      },
    }),
  ], []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const arColumnHelper = createColumnHelper<any>();
  const arColumns = useMemo(() => [
    arColumnHelper.accessor('id', {
      header: 'Mã Hóa Đơn',
      cell: (info) => <span style={{ fontWeight: 500 }}>{(info.getValue() || '').slice(0, 8).toUpperCase()}</span>,
    }),
    arColumnHelper.accessor('order', {
      header: 'Đơn Hàng Gốc',
      cell: (info) => (
        <span style={{ color: 'var(--clr-text-secondary)' }}>
          {info.getValue() ? (info.getValue() || '').slice(0, 8).toUpperCase() : 'N/A'}
        </span>
      ),
    }),
    arColumnHelper.accessor('customer_name', {
      header: 'Khách Hàng',
      cell: (info) => info.getValue() || 'N/A',
    }),
    arColumnHelper.accessor('total_amount', {
      header: 'Tổng Tiền',
      cell: (info) => <span style={{ fontWeight: 500 }}>{formatCurrency(info.getValue() || 0)}</span>,
    }),
    arColumnHelper.accessor('paid_amount', {
      header: 'Đã Thu',
      cell: (info) => <span style={{ color: 'var(--clr-success)' }}>{formatCurrency(info.getValue() || 0)}</span>,
    }),
    arColumnHelper.display({
      id: 'remaining',
      header: 'Còn Nợ',
      cell: (info) => {
        const inv = info.row.original;
        const remaining = (inv.total_amount || 0) - (inv.paid_amount || 0);
        return <span style={{ color: 'var(--clr-danger)', fontWeight: 500 }}>{formatCurrency(remaining)}</span>;
      },
    }),
    arColumnHelper.accessor('created_at', {
      header: 'Ngày Tạo',
      cell: (info) => info.getValue() ? new Date(info.getValue()).toLocaleDateString('vi-VN') : 'Không có',
    }),
    arColumnHelper.accessor('status', {
      header: 'Trạng Thái',
      cell: (info) => (
        <Badge variant={info.getValue() === 'partial' ? 'warning' : 'error'}>
          {info.getValue() === 'partial' ? 'Thu một phần' : 'Chưa thu tiền'}
        </Badge>
      ),
    }),
    arColumnHelper.display({
      id: 'actions',
      header: 'Thao Tác',
      cell: (info) => {
        const inv = info.row.original;
        const remaining = (inv.total_amount || 0) - (inv.paid_amount || 0);
        return (
          <Button 
            size="sm"
            icon={<DollarSign size={14} />}
            onClick={() => setSelectedARInvoice({ id: inv.id!, amount: remaining, name: inv.customer_name })}
          >
            Thu Tiền
          </Button>
        );
      },
    }),
  ], []);

  const approvalColumnHelper = createColumnHelper<CashFlowTransaction>();
  const approvalColumns = useMemo(() => [
    approvalColumnHelper.accessor('id', {
      header: 'Mã Giao Dịch',
      cell: (info) => <span style={{ color: 'var(--clr-text-secondary)' }}>{(info.getValue() || '').slice(0, 8).toUpperCase()}</span>,
    }),
    approvalColumnHelper.accessor('payment_type', {
      header: 'Loại',
      cell: (info) => {
        const type = info.getValue();
        return type === 'receive' ? (
          <Badge variant="success">Thu Tiền</Badge>
        ) : (
          <Badge variant="error">Chi Tiền</Badge>
        );
      },
    }),
    approvalColumnHelper.accessor('amount', {
      header: 'Số Tiền',
      cell: (info) => {
        const amt = Number(info.getValue() || 0);
        const type = info.row.original.payment_type;
        return <span style={{ fontWeight: 500, color: type === 'receive' ? 'var(--clr-success)' : 'var(--clr-danger)' }}>{formatCurrency(amt)}</span>;
      },
    }),
    approvalColumnHelper.accessor('category', {
      header: 'Phân Loại',
      cell: (info) => <Badge variant="neutral">{info.getValue() || 'Chưa phân loại'}</Badge>,
    }),
    approvalColumnHelper.accessor('remarks', {
      header: 'Ghi Chú',
      cell: (info) => <span style={{ color: 'var(--clr-text-secondary)' }}>{info.getValue() || '-'}</span>,
    }),
    approvalColumnHelper.accessor('payment_date', {
      header: 'Ngày',
      cell: (info) => {
        const val = info.getValue();
        return val ? new Date(val).toLocaleDateString('vi-VN') : '-';
      },
    }),
    approvalColumnHelper.display({
      id: 'actions',
      header: 'Thao Tác',
      cell: (info) => (
        <Button 
          size="sm"
          icon={<Check size={14} />}
          onClick={() => handleApproveCashFlow(info.row.original.id!)}
          disabled={isApproving}
        >
          Duyệt
        </Button>
      ),
    }),
  ], [isApproving]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Quản Lý Tài Chính & Dòng Tiền</h2>
          <p className={styles.subtitle}>Quản lý phê duyệt dòng tiền, nợ phải trả (AP) và nợ phải thu (AR)</p>
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
        {hasApprovePermission && (
          <button 
            className={`${styles.tab} ${activeTab === 'approvals' ? styles.active : ''}`}
            onClick={() => setActiveTab('approvals')}
          >
            Duyệt Giao Dịch
          </button>
        )}
      </div>

      <div className={styles.content}>
        {activeTab === 'cashflow' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <CashFlowTable />
          </div>
        )}

        {activeTab === 'ap' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" style={{ display: 'flex', flexDirection: 'column' }}>
            <DataTable 
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              columns={apColumns as any} 
              data={apData?.results || []} 
              loading={isLoadingAP}
              searchPlaceholder="Tìm kiếm hóa đơn mua..."
              emptyMessage="Không có hóa đơn mua hàng nào chưa thanh toán."
            />

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
            <DataTable 
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              columns={arColumns as any} 
              data={arData?.results || []} 
              loading={isLoadingAR}
              searchPlaceholder="Tìm kiếm hóa đơn bán..."
              emptyMessage="Không có hóa đơn bán hàng nào chưa thu tiền."
            />

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

        {activeTab === 'approvals' && hasApprovePermission && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" style={{ display: 'flex', flexDirection: 'column' }}>
            <DataTable 
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              columns={approvalColumns as any} 
              data={approvalsData?.results || []} 
              loading={isLoadingApprovals}
              searchPlaceholder="Tìm kiếm giao dịch chờ duyệt..."
              emptyMessage="Không có giao dịch nào chờ phê duyệt."
            />

            {/* Pagination for approvals */}
            {approvalsData && approvalsData.total_pages && approvalsData.total_pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', padding: 'var(--sp-4)', borderTop: '1px solid var(--clr-border)' }}>
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>
                  Trang {pageApprovals} / {approvalsData.total_pages} (Tổng {approvalsData.count} giao dịch)
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    icon={<ChevronLeft size={16} />} 
                    disabled={pageApprovals <= 1}
                    onClick={() => setPageApprovals(p => p - 1)}
                  >
                    {""}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    icon={<ChevronRight size={16} />} 
                    disabled={pageApprovals >= (approvalsData.total_pages || 1)}
                    onClick={() => setPageApprovals(p => p + 1)}
                  >
                    {""}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

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
            amount: selectedARInvoice.amount.toString(),
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

import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CashFlowTable } from '@widgets/finance/CashFlowTable';
import { Button } from '@shared/ui/Button/Button';
import { Badge } from '@shared/ui/Badge/Badge';
import { useToast } from '@shared/ui/Toast/Toast';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import {
  useGetFinanceCashFlowsQuery,
  usePostFinanceCashFlowsByPkApproveMutation,
  useGetFinanceInvoicesPurchaseQuery,
  useGetFinanceInvoicesSalesQuery,
} from '@entities/finance/api/financeApi';
import { usePermission } from '@shared/hooks/usePermission';
import { DataTable } from '@shared/ui/DataTable/DataTable';
import { createColumnHelper } from '@tanstack/react-table';
import type { CashFlowTransaction } from '@entities/finance/api/financeApi';
import styles from './FinancePage.module.css';

import { PurchaseInvoiceTable } from '@features/finance/purchase-invoice/ui/PurchaseInvoiceTable';
import { PurchaseInvoiceDetailsModal } from '@features/finance/purchase-invoice/ui/PurchaseInvoiceDetailsModal';
import { PurchaseInvoicePaymentModal } from '@features/finance/purchase-invoice/ui/PurchaseInvoicePaymentModal';

import { SalesInvoiceTable } from '@features/finance/sales-invoice/ui/SalesInvoiceTable';
import { SalesInvoiceDetailsModal } from '@features/finance/sales-invoice/ui/SalesInvoiceDetailsModal';
import { SalesInvoiceCollectionModal } from '@features/finance/sales-invoice/ui/SalesInvoiceCollectionModal';

const FinancePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab') || 'cashflow';
  
  const activeTab = useMemo(() => {
    if (rawTab === 'ap') return 'purchase_invoices';
    if (rawTab === 'ar') return 'sales_invoices';
    if (['cashflow', 'purchase_invoices', 'sales_invoices', 'approvals'].includes(rawTab)) {
      return rawTab as 'cashflow' | 'purchase_invoices' | 'sales_invoices' | 'approvals';
    }
    return 'cashflow';
  }, [rawTab]);

  const setActiveTab = (newTab: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('tab', newTab);
      next.delete('id');
      return next;
    }, { replace: true });
  };

  // Permissions
  const hasApprovePermission = usePermission('finance.approve_cash_flow');

  // Pagination & query state for AP
  const [pageAP, setPageAP] = useState(1);
  const { data: apData, isLoading: isLoadingAP, refetch: refetchAP } = useGetFinanceInvoicesPurchaseQuery(
    { status: 'unpaid,partial', page: pageAP, limit: 10 },
    { skip: activeTab !== 'purchase_invoices' }
  );

  // Pagination & query state for AR
  const [pageAR, setPageAR] = useState(1);
  const { data: arData, isLoading: isLoadingAR, refetch: refetchAR } = useGetFinanceInvoicesSalesQuery(
    { status: 'unpaid,partial', page: pageAR, limit: 10 },
    { skip: activeTab !== 'sales_invoices' }
  );

  // Pagination & query state for Approvals
  const [pageApprovals, setPageApprovals] = useState(1);
  const { data: approvalsData, isLoading: isLoadingApprovals, refetch: refetchApprovals } = useGetFinanceCashFlowsQuery(
    { status: 'pending_approval', page: pageApprovals, limit: 10 },
    { skip: activeTab !== 'approvals' || !hasApprovePermission }
  );

  // Details modal states
  const [selectedAPDetailsId, setSelectedAPDetailsId] = useState<string | null>(null);
  const [selectedARDetailsId, setSelectedARDetailsId] = useState<string | null>(null);

  // AR collection modal state
  const [selectedARInvoice, setSelectedARInvoice] = useState<{ id: string; amount: number; name?: string } | null>(null);

  // AP payment modal state
  const [selectedAPInvoice, setSelectedAPInvoice] = useState<{ id: string; amount: number } | null>(null);
  
  const [approveCashFlow, { isLoading: isApproving }] = usePostFinanceCashFlowsByPkApproveMutation();
  const { toast } = useToast();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
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

      <div className={styles.tabs} role="tablist">
        <button 
          type="button"
          role="tab"
          aria-selected={activeTab === 'cashflow'}
          className={`${styles.tab} ${activeTab === 'cashflow' ? styles.active : ''}`}
          onClick={() => setActiveTab('cashflow')}
        >
          Dòng Tiền
        </button>
        <button 
          type="button"
          role="tab"
          aria-selected={activeTab === 'purchase_invoices'}
          className={`${styles.tab} ${activeTab === 'purchase_invoices' ? styles.active : ''}`}
          onClick={() => setActiveTab('purchase_invoices')}
        >
          Phải Trả (AP)
        </button>
        <button 
          type="button"
          role="tab"
          aria-selected={activeTab === 'sales_invoices'}
          className={`${styles.tab} ${activeTab === 'sales_invoices' ? styles.active : ''}`}
          onClick={() => setActiveTab('sales_invoices')}
        >
          Phải Thu (AR)
        </button>
        {hasApprovePermission && (
          <button 
            type="button"
            role="tab"
            aria-selected={activeTab === 'approvals'}
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

        {activeTab === 'purchase_invoices' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" style={{ display: 'flex', flexDirection: 'column' }}>
            <PurchaseInvoiceTable 
              data={apData?.results || []}
              loading={isLoadingAP}
              onView={(id) => setSelectedAPDetailsId(id)}
              onPay={(inv) => setSelectedAPInvoice(inv)}
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

        {activeTab === 'sales_invoices' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" style={{ display: 'flex', flexDirection: 'column' }}>
            <SalesInvoiceTable 
              data={arData?.results || []}
              loading={isLoadingAR}
              onView={(id) => setSelectedARDetailsId(id)}
              onCollect={(inv) => setSelectedARInvoice(inv)}
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

      {/* Details Modals */}
      {selectedAPDetailsId && (
        <PurchaseInvoiceDetailsModal 
          invoiceId={selectedAPDetailsId}
          onClose={() => setSelectedAPDetailsId(null)}
        />
      )}

      {selectedARDetailsId && (
        <SalesInvoiceDetailsModal 
          invoiceId={selectedARDetailsId}
          onClose={() => setSelectedARDetailsId(null)}
        />
      )}

      {/* AR invoice collection modal overlay */}
      {selectedARInvoice && (
        <SalesInvoiceCollectionModal 
          open={!!selectedARInvoice}
          onClose={() => setSelectedARInvoice(null)}
          onSuccess={() => {
            setSelectedARInvoice(null);
            refetchAR();
          }}
          invoiceId={selectedARInvoice.id}
          remainingAmount={selectedARInvoice.amount}
          customerName={selectedARInvoice.name}
        />
      )}

      {/* AP payment modal overlay */}
      {selectedAPInvoice && (
        <PurchaseInvoicePaymentModal 
          open={!!selectedAPInvoice}
          onClose={() => setSelectedAPInvoice(null)}
          onSuccess={() => {
            setSelectedAPInvoice(null);
            refetchAP();
          }}
          invoiceId={selectedAPInvoice.id}
          remainingAmount={selectedAPInvoice.amount}
        />
      )}
    </div>
  );
};

export default FinancePage;

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@shared/ui/Button/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  useGetFinanceInvoicesPurchaseQuery,
  useGetFinanceInvoicesSalesQuery,
} from '@entities/finance/api/financeApi';
import styles from './FinancePage.module.css';

import { PurchaseInvoiceTable } from '@features/finance/purchase-invoice/ui/PurchaseInvoiceTable';
import { PurchaseInvoiceDetailsModal } from '@features/finance/purchase-invoice/ui/PurchaseInvoiceDetailsModal';
import { PurchaseInvoicePaymentModal } from '@features/finance/purchase-invoice/ui/PurchaseInvoicePaymentModal';

import { SalesInvoiceTable } from '@features/finance/sales-invoice/ui/SalesInvoiceTable';
import { SalesInvoiceDetailsModal } from '@features/finance/sales-invoice/ui/SalesInvoiceDetailsModal';
import { SalesInvoiceCollectionModal } from '@features/finance/sales-invoice/ui/SalesInvoiceCollectionModal';

const InvoicesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab') || 'purchase_invoices';
  const queryId = searchParams.get('id');
  
  const activeTab = useMemo(() => {
    if (rawTab === 'ap') return 'purchase_invoices';
    if (rawTab === 'ar') return 'sales_invoices';
    if (['purchase_invoices', 'sales_invoices'].includes(rawTab)) {
      return rawTab as 'purchase_invoices' | 'sales_invoices';
    }
    return 'purchase_invoices';
  }, [rawTab]);

  const setActiveTab = (newTab: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('tab', newTab);
      next.delete('id');
      return next;
    }, { replace: true });
  };

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

  // Details modal states
  const [selectedAPDetailsId, setSelectedAPDetailsId] = useState<string | null>(null);
  const [selectedARDetailsId, setSelectedARDetailsId] = useState<string | null>(null);

  // AR collection modal state
  const [selectedARInvoice, setSelectedARInvoice] = useState<{ id: string; amount: number; name?: string } | null>(null);

  // AP payment modal state
  const [selectedAPInvoice, setSelectedAPInvoice] = useState<{ id: string; amount: number } | null>(null);

  // Sync queryId from URL
  useEffect(() => {
    if (queryId) {
      if (activeTab === 'purchase_invoices') {
        setSelectedAPDetailsId(queryId);
      } else if (activeTab === 'sales_invoices') {
        setSelectedARDetailsId(queryId);
      }
    }
  }, [queryId, activeTab]);

  const handleCloseAPDetails = () => {
    setSelectedAPDetailsId(null);
    if (queryId) {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.delete('id');
        return next;
      }, { replace: true });
    }
  };

  const handleCloseARDetails = () => {
    setSelectedARDetailsId(null);
    if (queryId) {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.delete('id');
        return next;
      }, { replace: true });
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Quản Lý Hoá Đơn Mua/Bán</h2>
          <p className={styles.subtitle}>Quản lý công nợ, hoá đơn mua hàng (AP) và hoá đơn bán hàng (AR)</p>
        </div>
      </div>

      <div className={styles.tabs} role="tablist">
        <button 
          type="button"
          role="tab"
          aria-selected={activeTab === 'purchase_invoices'}
          className={`${styles.tab} ${activeTab === 'purchase_invoices' ? styles.active : ''}`}
          onClick={() => setActiveTab('purchase_invoices')}
        >
          Hoá Đơn Mua
        </button>
        <button 
          type="button"
          role="tab"
          aria-selected={activeTab === 'sales_invoices'}
          className={`${styles.tab} ${activeTab === 'sales_invoices' ? styles.active : ''}`}
          onClick={() => setActiveTab('sales_invoices')}
        >
          Hoá Đơn Bán
        </button>
      </div>

      <div className={styles.content}>
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
      </div>

      {/* Details Modals */}
      {selectedAPDetailsId && (
        <PurchaseInvoiceDetailsModal 
          invoiceId={selectedAPDetailsId}
          onClose={handleCloseAPDetails}
        />
      )}

      {selectedARDetailsId && (
        <SalesInvoiceDetailsModal 
          invoiceId={selectedARDetailsId}
          onClose={handleCloseARDetails}
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

export default InvoicesPage;

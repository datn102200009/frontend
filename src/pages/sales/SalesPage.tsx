import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SalesOrderTable } from '@widgets/sales/SalesOrderTable';
import { SalesInvoiceTable } from '@widgets/sales/SalesInvoiceTable';
import { SalesOrderFormModal } from '@features/sales/create-order/ui/SalesOrderFormModal';
import { SalesInvoiceDetailsModal } from '@features/sales/manage-invoice/ui/SalesInvoiceDetailsModal';
import { Button } from '@shared/ui/Button/Button';
import { Plus } from 'lucide-react';
import styles from './SalesPage.module.css';
import clsx from 'clsx';

export const SalesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') || 'orders') as 'orders' | 'invoices';
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const queryId = searchParams.get('id');
  const editOrderId = activeTab === 'orders' ? queryId : null;
  const viewInvoiceId = activeTab === 'invoices' ? queryId : null;

  return (
    <div className={styles.page}>
      <div className={styles.tabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'orders'}
          className={clsx(styles.tab, activeTab === 'orders' && styles.active)}
          onClick={() => setSearchParams({ tab: 'orders' })}
        >
          Đơn Bán Hàng
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'invoices'}
          className={clsx(styles.tab, activeTab === 'invoices' && styles.active)}
          onClick={() => setSearchParams({ tab: 'invoices' })}
        >
          Hóa Đơn Bán
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div>
              <h2 className={styles.title}>Quản Lý Bán Hàng</h2>
              <p className={styles.subtitle}>Quản lý đơn bán hàng và hóa đơn thu tiền</p>
            </div>
            {activeTab === 'orders' && (
              <Button icon={<Plus size={16} />} onClick={() => setIsCreateOpen(true)}>
                Thêm Đơn Bán
              </Button>
            )}
          </div>
          
          <div style={{ marginTop: '8px' }}>
            {activeTab === 'orders' ? (
              <SalesOrderTable 
                onView={(id) => {
                  const params = new URLSearchParams(searchParams);
                  params.set('id', id);
                  setSearchParams(params);
                }}
              />
            ) : (
              <SalesInvoiceTable 
                onView={(id) => {
                  const params = new URLSearchParams(searchParams);
                  params.set('id', id);
                  setSearchParams(params);
                }}
              />
            )}
          </div>
        </div>
      </div>

      {(isCreateOpen || editOrderId) && (
        <SalesOrderFormModal 
          open={isCreateOpen || !!editOrderId} 
          orderId={editOrderId}
          onClose={() => {
            setIsCreateOpen(false);
            const params = new URLSearchParams(searchParams);
            params.delete('id');
            setSearchParams(params);
          }} 
          onSuccess={() => {
            setIsCreateOpen(false);
            const params = new URLSearchParams(searchParams);
            params.delete('id');
            setSearchParams(params);
          }} 
        />
      )}

      {viewInvoiceId && (
        <SalesInvoiceDetailsModal 
          invoiceId={viewInvoiceId} 
          onClose={() => {
            const params = new URLSearchParams(searchParams);
            params.delete('id');
            setSearchParams(params);
          }} 
        />
      )}
    </div>
  );
};

export default SalesPage;

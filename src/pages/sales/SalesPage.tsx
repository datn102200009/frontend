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
  const [editOrderId, setEditOrderId] = useState<string | null>(null);
  const [viewInvoiceId, setViewInvoiceId] = useState<string | null>(null);

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
                onView={(id) => setEditOrderId(id)}
              />
            ) : (
              <SalesInvoiceTable 
                onView={(id) => setViewInvoiceId(id)}
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
            setEditOrderId(null);
          }} 
          onSuccess={() => {
            setIsCreateOpen(false);
            setEditOrderId(null);
          }} 
        />
      )}

      {viewInvoiceId && (
        <SalesInvoiceDetailsModal invoiceId={viewInvoiceId} onClose={() => setViewInvoiceId(null)} />
      )}
    </div>
  );
};

export default SalesPage;

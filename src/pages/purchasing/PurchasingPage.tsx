import { useState } from 'react';
import { PurchaseOrderTable } from '@widgets/purchasing/PurchaseOrderTable';
import { PurchaseInvoiceTable } from '@widgets/purchasing/PurchaseInvoiceTable';
import { LandedCostPage } from './LandedCost/LandedCostPage';
import { ApAgingPage } from './ApAging/ApAgingPage';
import { QcReportPage } from './QcReport/QcReportPage';
import { PurchaseOrderFormModal } from '@features/purchasing/create-order/ui/PurchaseOrderFormModal';
import { PurchaseInvoiceDetailsModal } from '@features/purchasing/manage-invoice/ui/PurchaseInvoiceDetailsModal';
import { Button } from '@shared/ui/Button/Button';
import { Plus } from 'lucide-react';
import styles from './PurchasingPage.module.css';
import clsx from 'clsx';

export const PurchasingPage = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'invoices' | 'shipment' | 'qc' | 'ap-aging'>('orders');
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
          onClick={() => setActiveTab('orders')}
        >
          Đơn Mua Hàng
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'invoices'}
          className={clsx(styles.tab, activeTab === 'invoices' && styles.active)}
          onClick={() => setActiveTab('invoices')}
        >
          Hóa Đơn Mua
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'shipment'}
          className={clsx(styles.tab, activeTab === 'shipment' && styles.active)}
          onClick={() => setActiveTab('shipment')}
        >
          Quản Lý Lô Hàng
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'qc'}
          className={clsx(styles.tab, activeTab === 'qc' && styles.active)}
          onClick={() => setActiveTab('qc')}
        >
          Kiểm Định QA/QC
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'ap-aging'}
          className={clsx(styles.tab, activeTab === 'ap-aging' && styles.active)}
          onClick={() => setActiveTab('ap-aging')}
        >
          Báo Cáo Công Nợ
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'shipment' ? (
          <LandedCostPage />
        ) : activeTab === 'qc' ? (
          <div className={styles.container}>
            <div className={styles.header}>
              <div>
                <h2 className={styles.title}>Lịch Sử Kiểm Định QA/QC</h2>
                <p className={styles.subtitle}>Danh sách chứng nhận chất lượng kỹ thuật các lô hàng nhập</p>
              </div>
            </div>
            <div style={{ marginTop: '8px' }}>
              <QcReportPage />
            </div>
          </div>
        ) : activeTab === 'ap-aging' ? (
          <ApAgingPage />
        ) : (
          <div className={styles.container}>
            <div className={styles.header}>
              <div>
                <h2 className={styles.title}>Quản Lý Mua Hàng</h2>
                <p className={styles.subtitle}>Quản lý đơn mua hàng và hóa đơn thanh toán</p>
              </div>
              {activeTab === 'orders' && (
                <Button icon={<Plus size={16} />} onClick={() => setIsCreateOpen(true)}>
                  Thêm Đơn Mua
                </Button>
              )}
            </div>
            
            <div style={{ marginTop: '8px' }}>
              {activeTab === 'orders' ? (
                <PurchaseOrderTable 
                  onEdit={(order) => setEditOrderId(order.id)}
                  onView={(id) => setEditOrderId(id)}
                />
              ) : (
                <PurchaseInvoiceTable 
                  onView={(id) => setViewInvoiceId(id)}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {(isCreateOpen || editOrderId) && (
        <PurchaseOrderFormModal 
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
        <PurchaseInvoiceDetailsModal invoiceId={viewInvoiceId} onClose={() => setViewInvoiceId(null)} />
      )}
    </div>
  );
};

export default PurchasingPage;

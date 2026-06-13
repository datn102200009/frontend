import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PurchaseOrderTable } from '@widgets/purchasing/PurchaseOrderTable';
import { LandedCostPage } from './LandedCost/LandedCostPage';
import { ApAgingPage } from './ApAging/ApAgingPage';
import { PurchaseOrderFormModal } from '@features/purchasing/create-order/ui/PurchaseOrderFormModal';
import { Button } from '@shared/ui/Button/Button';
import { Plus } from 'lucide-react';
import styles from './PurchasingPage.module.css';
import clsx from 'clsx';

export const PurchasingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') || 'orders') as 'orders' | 'shipment' | 'ap-aging';
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const queryId = searchParams.get('id');
  const editOrderId = activeTab === 'orders' ? queryId : null;

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
          Đơn Mua Hàng
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'shipment'}
          className={clsx(styles.tab, activeTab === 'shipment' && styles.active)}
          onClick={() => setSearchParams({ tab: 'shipment' })}
        >
          Quản Lý Lô Hàng
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'ap-aging'}
          className={clsx(styles.tab, activeTab === 'ap-aging' && styles.active)}
          onClick={() => setSearchParams({ tab: 'ap-aging' })}
        >
          Báo Cáo Công Nợ
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'shipment' ? (
          <LandedCostPage />
        ) : activeTab === 'ap-aging' ? (
          <ApAgingPage />
        ) : (
          <div className={styles.container}>
            <div className={styles.header}>
              <div>
                <h2 className={styles.title}>Quản Lý Mua Hàng</h2>
                <p className={styles.subtitle}>Quản lý đơn mua hàng và theo dõi tiến độ</p>
              </div>
              <Button icon={<Plus size={16} />} onClick={() => setIsCreateOpen(true)}>
                Thêm Đơn Mua
              </Button>
            </div>
            
            <div style={{ marginTop: '8px' }}>
              <PurchaseOrderTable 
                onEdit={(order) => {
                  const params = new URLSearchParams(searchParams);
                  params.set('id', order.id);
                  setSearchParams(params);
                }}
                onView={(id) => {
                  const params = new URLSearchParams(searchParams);
                  params.set('id', id);
                  setSearchParams(params);
                }}
              />
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
    </div>
  );
};

export default PurchasingPage;

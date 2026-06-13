import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SalesOrderTable } from '@widgets/sales/SalesOrderTable';
import { SalesOrderFormModal } from '@features/sales/create-order/ui/SalesOrderFormModal';
import { Button } from '@shared/ui/Button/Button';
import { Plus } from 'lucide-react';
import styles from './SalesPage.module.css';

export const SalesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const editOrderId = searchParams.get('id');

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div>
              <h2 className={styles.title}>Quản Lý Bán Hàng</h2>
              <p className={styles.subtitle}>Quản lý đơn bán hàng và theo dõi tiến độ</p>
            </div>
            <Button icon={<Plus size={16} />} onClick={() => setIsCreateOpen(true)}>
              Thêm Đơn Bán
            </Button>
          </div>
          
          <div style={{ marginTop: '8px' }}>
            <SalesOrderTable 
              onView={(id) => {
                const params = new URLSearchParams(searchParams);
                params.set('id', id);
                setSearchParams(params);
              }}
            />
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
    </div>
  );
};

export default SalesPage;

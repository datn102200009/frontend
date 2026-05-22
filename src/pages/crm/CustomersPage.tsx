import { useState } from 'react';
import { CustomerTable } from '@widgets/crm/CustomerTable';
import { CustomerFormModal } from '@features/crm/manage-customers/ui/CustomerFormModal';
import { Button } from '@shared/ui/Button/Button';
import { Plus } from 'lucide-react';
import styles from './CustomersPage.module.css';

export const CustomersPage = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const handleSuccess = () => {
    setIsCreateOpen(false);
    setSelectedCustomerId(null);
  };

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div>
              <h2 className={styles.title}>Quản Lý Khách Hàng (CRM)</h2>
              <p className={styles.subtitle}>Quản lý thông tin khách hàng doanh nghiệp và cá nhân</p>
            </div>
            <Button icon={<Plus size={16} />} onClick={() => setIsCreateOpen(true)}>
              Thêm Khách Hàng
            </Button>
          </div>

          <div style={{ marginTop: '8px' }}>
            <CustomerTable
              onView={(id) => setSelectedCustomerId(id)}
              onEdit={(customer) => setSelectedCustomerId(customer.id)}
            />
          </div>
        </div>
      </div>

      {(isCreateOpen || selectedCustomerId) && (
        <CustomerFormModal
          open={isCreateOpen || !!selectedCustomerId}
          customerId={selectedCustomerId}
          onClose={() => {
            setIsCreateOpen(false);
            setSelectedCustomerId(null);
          }}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

export default CustomersPage;

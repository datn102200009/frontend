import { useState } from 'react';
import { SupplierTable } from '@widgets/procurement/SupplierTable';
import { SupplierFormModal } from '@features/procurement/manage-suppliers/ui/SupplierFormModal';
import { Button } from '@shared/ui/Button/Button';
import { Plus } from 'lucide-react';
import styles from './SuppliersPage.module.css';

export const SuppliersPage = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

  const handleSuccess = () => {
    setIsCreateOpen(false);
    setSelectedSupplierId(null);
  };

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div>
              <h2 className={styles.title}>Quản Lý Nhà Cung Cấp (Procurement)</h2>
              <p className={styles.subtitle}>Quản lý thông tin nhà cung cấp linh kiện và dịch vụ</p>
            </div>
            <Button icon={<Plus size={16} />} onClick={() => setIsCreateOpen(true)}>
              Thêm Nhà Cung Cấp
            </Button>
          </div>

          <div style={{ marginTop: '8px' }}>
            <SupplierTable
              onView={(id) => setSelectedSupplierId(id)}
              onEdit={(supplier) => setSelectedSupplierId(supplier.id)}
            />
          </div>
        </div>
      </div>

      {(isCreateOpen || selectedSupplierId) && (
        <SupplierFormModal
          open={isCreateOpen || !!selectedSupplierId}
          supplierId={selectedSupplierId}
          onClose={() => {
            setIsCreateOpen(false);
            setSelectedSupplierId(null);
          }}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

export default SuppliersPage;

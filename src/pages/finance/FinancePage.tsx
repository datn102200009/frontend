import React, { useState } from 'react';
import { CashFlowTable } from '@widgets/finance/CashFlowTable';
import { CashFlowFormModal } from '@features/finance/create-transaction/ui/CashFlowFormModal';
import { Button } from '@shared/ui/Button/Button';
import { Plus } from 'lucide-react';
import styles from './FinancePage.module.css';
import clsx from 'clsx';

const FinancePage: React.FC = () => {
  const [createType, setCreateType] = useState<string | null>(null);

  return (
    <div className={styles.page}>
      <div className={styles.tabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={true}
          className={clsx(styles.tab, styles.active)}
        >
          Giao Dịch Dòng Tiền
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div>
              <h2 className={styles.title}>Quản Lý Dòng Tiền</h2>
              <p className={styles.subtitle}>Ghi nhận và theo dõi các khoản thu chi</p>
            </div>
            <Button icon={<Plus size={16} />} onClick={() => setCreateType('income')}>
              Ghi Nhận Giao Dịch
            </Button>
          </div>
          
          <div style={{ marginTop: '8px' }}>
            <CashFlowTable />
          </div>
        </div>
      </div>

      {createType && (
        <CashFlowFormModal 
          open={!!createType} 
          onClose={() => setCreateType(null)} 
          onSuccess={() => setCreateType(null)} 
          defaultValues={{ payment_type: createType === 'income' ? 'receive' : 'pay' }} 
        />
      )}
    </div>
  );
};

export default FinancePage;

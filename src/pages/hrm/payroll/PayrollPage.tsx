import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@shared/ui/Button/Button';

// Tables
import { SalarySlipTable } from '@widgets/hrm/SalarySlipTable';

// Modals
import { InitializeSalarySlipModal } from '@features/hrm/manage-salary-slip/ui/InitializeSalarySlipModal';
import { BulkConfirmSalarySlipModal } from '@features/hrm/manage-salary-slip/ui/BulkConfirmSalarySlipModal';

import styles from '../HrmPage.module.css';

const PayrollPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Modals States
  const [isInitializeSalarySlipOpen, setIsInitializeSalarySlipOpen] = useState(false);
  const [isBulkPayOpen, setIsBulkPayOpen] = useState(false);

  const [selectedPeriod, setSelectedPeriod] = useState<string>(() => {
    const periodParam = searchParams.get('period');
    if (periodParam && /^\d{4}-\d{2}$/.test(periodParam)) return periodParam;
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${mm}`;
  });

  const urlPeriod = searchParams.get('period');
  useEffect(() => {
    if (urlPeriod && /^\d{4}-\d{2}$/.test(urlPeriod)) {
      setSelectedPeriod(urlPeriod);
    }
  }, [urlPeriod]);

  useEffect(() => {
    const currentParam = searchParams.get('period');
    if (currentParam !== selectedPeriod) {
      const params = new URLSearchParams(searchParams);
      params.set('period', selectedPeriod);
      setSearchParams(params, { replace: true });
    }
  }, [selectedPeriod, searchParams, setSearchParams]);

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div>
              <h2 className={styles.title}>Thanh Toán Lương</h2>
              <p className={styles.subtitle}>Quản lý bảng lương nhân sự, tính toán công nợ và chi lương</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="secondary" onClick={() => setIsBulkPayOpen(true)}>
                Thanh Toán Kỳ Lương
              </Button>
              <Button icon={<Plus size={16} />} onClick={() => setIsInitializeSalarySlipOpen(true)}>
                Khởi Tạo Kỳ Lương
              </Button>
            </div>
          </div>
          <SalarySlipTable
            selectedPeriod={selectedPeriod}
            onChangePeriod={setSelectedPeriod}
          />
        </div>
      </div>

      {/* Salary Slip Modals */}
      {isInitializeSalarySlipOpen && (
        <InitializeSalarySlipModal
          open={isInitializeSalarySlipOpen}
          onClose={() => setIsInitializeSalarySlipOpen(false)}
          onSuccess={() => setIsInitializeSalarySlipOpen(false)}
        />
      )}

      {isBulkPayOpen && (
        <BulkConfirmSalarySlipModal
          open={isBulkPayOpen}
          onClose={() => setIsBulkPayOpen(false)}
          onSuccess={() => setIsBulkPayOpen(false)}
          salaryPeriod={selectedPeriod}
        />
      )}
    </div>
  );
};

export default PayrollPage;

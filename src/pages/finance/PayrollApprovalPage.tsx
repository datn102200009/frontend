import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SalarySlipTable } from '@widgets/hrm/SalarySlipTable';
import styles from '../hrm/HrmPage.module.css';

const PayrollApprovalPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

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
              <h2 className={styles.title}>Phê Duyệt & Chi Trả Lương</h2>
              <p className={styles.subtitle}>
                Xem xét, phê duyệt và thanh toán các bảng lương đã tính toán từ bộ phận nhân sự.
              </p>
            </div>
          </div>
          <SalarySlipTable
            selectedPeriod={selectedPeriod}
            onChangePeriod={setSelectedPeriod}
          />
        </div>
      </div>
    </div>
  );
};

export default PayrollApprovalPage;

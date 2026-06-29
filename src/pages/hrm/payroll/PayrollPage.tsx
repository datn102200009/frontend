import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, RefreshCw, Send, AlertTriangle } from 'lucide-react';
import { Button } from '@shared/ui/Button/Button';
import { useToast } from '@shared/ui/Toast/Toast';
import { usePermission } from '@shared/hooks/usePermission';
import {
  usePostHrmSalarySlipsBulkCalculateMutation,
  useGetHrmSalarySlipsQuery,
} from '@entities/hrm/api/hrmApi';
import { isCurrentPayrollPeriod } from '@entities/hrm/lib/payrollPeriod';

// Tables
import { SalarySlipTable } from '@widgets/hrm/SalarySlipTable';

// Modals
import { InitializeSalarySlipModal } from '@features/hrm/manage-salary-slip/ui/InitializeSalarySlipModal';
import { BulkSubmitSalarySlipModal } from '@features/hrm/manage-salary-slip/ui/BulkSubmitSalarySlipModal';

import styles from '../HrmPage.module.css';

const PayrollPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  // Permissions
  const canBulkCalculate = usePermission('finance.change_salaryslip');
  const canBulkSubmit = usePermission('hrm.payroll_submit');

  // Modals States
  const [isInitializeSalarySlipOpen, setIsInitializeSalarySlipOpen] = useState(false);
  const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);
  const [justCalculatedAt, setJustCalculatedAt] = useState<number | null>(null);

  const [selectedPeriod, setSelectedPeriod] = useState<string>(() => {
    const periodParam = searchParams.get('period');
    if (periodParam && /^\d{4}-\d{2}$/.test(periodParam)) return periodParam;
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${mm}`;
  });

  // Reset justCalculatedAt when changing period
  useEffect(() => {
    setJustCalculatedAt(null);
  }, [selectedPeriod]);

  // Queries & Mutations
  const { data: salarySlips = [], refetch } = useGetHrmSalarySlipsQuery({
    salaryPeriod: selectedPeriod || undefined,
  });

  const [bulkCalculate, { isLoading: isBulkCalculating }] = usePostHrmSalarySlipsBulkCalculateMutation();

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

  const handleBulkCalculate = async () => {
    try {
      const result = await bulkCalculate({ body: { salary_period: selectedPeriod } }).unwrap();
      toast('success', `Tính toán thành công ${result.count} phiếu lương.`);
      setJustCalculatedAt(Date.now());
      refetch();
    } catch (err: any) {
      toast('error', err?.data?.error || 'Tính toán hàng loạt thất bại.');
    }
  };

  const handleBulkSubmitSuccess = () => {
    toast('success', 'Gửi duyệt bảng lương hàng loạt thành công.');
    setIsBulkConfirmOpen(false);
    setJustCalculatedAt(null);
    refetch();
  };

  // Determine if we can bulk submit
  const isCurrentPeriod = isCurrentPayrollPeriod(selectedPeriod);
  const canSubmitBulk = justCalculatedAt !== null && !isCurrentPeriod;
  const isFullyPaid = salarySlips.length > 0 && salarySlips.every((slip) => slip.status === 'paid');

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div>
              <h2 className={styles.title}>Bảng Lương & Tính Lương</h2>
              <p className={styles.subtitle}>Tính toán, tổng kết lương nhân sự. Finance sẽ phê duyệt và chi trả.</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {canBulkCalculate && (
                <Button
                  icon={<RefreshCw size={16} />}
                  onClick={handleBulkCalculate}
                  loading={isBulkCalculating}
                  disabled={isFullyPaid}
                  title={isFullyPaid ? "Kỳ lương đã được thanh toán đầy đủ, không thể cập nhật" : undefined}
                >
                  Cập Nhật Bảng Lương
                </Button>
              )}
              {canBulkSubmit && (
                <Button
                  icon={<Send size={16} />}
                  onClick={() => setIsBulkConfirmOpen(true)}
                  disabled={!canSubmitBulk}
                  title={isCurrentPeriod ? `Không thể gửi duyệt kỳ ${selectedPeriod} (tháng hiện tại)` : undefined}
                >
                  Phê Duyệt Nhanh
                </Button>
              )}
              <Button icon={<Plus size={16} />} onClick={() => setIsInitializeSalarySlipOpen(true)}>
                Khởi Tạo Kỳ Lương
              </Button>
            </div>
          </div>
          {isCurrentPeriod && (
            <div className={styles.warningBanner} role="alert" data-testid="current-period-banner" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: 'var(--clr-warning-bg)',
              color: 'var(--clr-warning)',
              border: '1.5px solid var(--clr-warning)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              marginBottom: '16px',
              fontSize: 'var(--fs-sm)',
              fontWeight: 500
            }}>
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              <span>
                Kỳ lương <strong>{selectedPeriod}</strong> đang là tháng hiện tại. Hệ thống không cho phép gửi duyệt các phiếu lương của tháng hiện tại. Vui lòng chờ đến tháng sau để gửi duyệt.
              </span>
            </div>
          )}
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

      {isBulkConfirmOpen && (
        <BulkSubmitSalarySlipModal
          open={isBulkConfirmOpen}
          onClose={() => setIsBulkConfirmOpen(false)}
          onSuccess={handleBulkSubmitSuccess}
          salaryPeriod={selectedPeriod}
        />
      )}
    </div>
  );
};

export default PayrollPage;

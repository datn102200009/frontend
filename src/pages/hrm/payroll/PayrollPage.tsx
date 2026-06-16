import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Calculator, Send } from 'lucide-react';
import { Button } from '@shared/ui/Button/Button';
import { useToast } from '@shared/ui/Toast/Toast';
import { usePermission } from '@shared/hooks/usePermission';
import { ConfirmDialog } from '@shared/ui/ConfirmDialog/ConfirmDialog';
import {
  usePostHrmSalarySlipsBulkCalculateMutation,
  usePostHrmSalarySlipsBulkSubmitForReviewMutation,
  useGetHrmSalarySlipsQuery,
} from '@entities/hrm/api/hrmApi';

// Tables
import { SalarySlipTable } from '@widgets/hrm/SalarySlipTable';

// Modals
import { InitializeSalarySlipModal } from '@features/hrm/manage-salary-slip/ui/InitializeSalarySlipModal';

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
  const { refetch } = useGetHrmSalarySlipsQuery({
    salaryPeriod: selectedPeriod || undefined,
  });

  const [bulkCalculate, { isLoading: isBulkCalculating }] = usePostHrmSalarySlipsBulkCalculateMutation();
  const [bulkSubmit, { isLoading: isBulkSubmitting }] = usePostHrmSalarySlipsBulkSubmitForReviewMutation();

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

  const handleBulkSubmit = async () => {
    try {
      const result = await bulkSubmit({ body: { salary_period: selectedPeriod } }).unwrap();
      toast('success', `Gửi duyệt thành công ${result.count} phiếu lương.`);
      setIsBulkConfirmOpen(false);
      setJustCalculatedAt(null);
      refetch();
    } catch (err: any) {
      toast('error', err?.data?.error || 'Gửi duyệt hàng loạt thất bại.');
    }
  };

  // Determine if we can bulk submit
  const canSubmitBulk = justCalculatedAt !== null;

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
                  icon={<Calculator size={16} />}
                  onClick={handleBulkCalculate}
                  loading={isBulkCalculating}
                >
                  Tính Toán Nhanh
                </Button>
              )}
              {canBulkSubmit && (
                <Button
                  icon={<Send size={16} />}
                  onClick={() => setIsBulkConfirmOpen(true)}
                  disabled={!canSubmitBulk}
                >
                  Phê Duyệt Nhanh
                </Button>
              )}
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

      <ConfirmDialog
        open={isBulkConfirmOpen}
        onClose={() => setIsBulkConfirmOpen(false)}
        onConfirm={handleBulkSubmit}
        loading={isBulkSubmitting}
        title="Phê duyệt nhanh bảng lương"
        message={`Gửi TOÀN BỘ phiếu lương ở trạng thái 'calculated' trong kỳ ${selectedPeriod} sang Finance duyệt? Hành động không thể hoàn tác.`}
      />
    </div>
  );
};

export default PayrollPage;

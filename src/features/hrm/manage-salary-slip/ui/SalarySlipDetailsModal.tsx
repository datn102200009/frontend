import React, { useState, useEffect } from 'react';
import {
  usePostHrmSalarySlipsByIdCalculateMutation,
  usePostHrmSalarySlipsByIdSubmitForReviewMutation,
} from '@entities/hrm/api/hrmApi';
import type { SalarySlip } from '@entities/hrm/model/types';
import { Modal } from '@shared/ui/Modal/Modal';
import { Button } from '@shared/ui/Button/Button';
import { ConfirmDialog } from '@shared/ui/ConfirmDialog/ConfirmDialog';
import { usePermission } from '@shared/hooks/usePermission';
import styles from './SalarySlipDetailsModal.module.css';

interface SalarySlipDetailsModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onCalculateSuccess?: () => void;
  salarySlip: SalarySlip;
}

export const SalarySlipDetailsModal: React.FC<SalarySlipDetailsModalProps> = (props) => {
  const { open, onClose, onSuccess, onCalculateSuccess, salarySlip } = props;
  const [calculateSalary, { isLoading: isCalculating }] = usePostHrmSalarySlipsByIdCalculateMutation();
  const [submitSalary, { isLoading: isSubmitting }] = usePostHrmSalarySlipsByIdSubmitForReviewMutation();
  const canSubmit = usePermission('hrm.payroll_submit');

  const [apiError, setApiError] = useState<string | null>(null);
  const [isSegmentsOpen, setIsSegmentsOpen] = useState(false);

  const [prevOpen, setPrevOpen] = useState(open);
  const [prevSalarySlipId, setPrevSalarySlipId] = useState(salarySlip.id);

  if (open !== prevOpen || salarySlip.id !== prevSalarySlipId) {
    setPrevOpen(open);
    setPrevSalarySlipId(salarySlip.id);
    if (open) {
      setApiError(null);
      setIsSegmentsOpen(false);
    }
  }

  // Auto calculate when modal opens
  useEffect(() => {
    if (!open || !salarySlip.id || salarySlip.status !== 'draft') return;

    const promise = calculateSalary({
      id: salarySlip.id,
    });

    promise.unwrap()
      .then(() => {
        onCalculateSuccess?.();
      })
      .catch((err: unknown) => {
        if (err && typeof err === 'object' && 'name' in err && err.name === 'AbortError') {
          return;
        }
        console.error('Failed to auto calculate salary slip', err);
        const apiErr = err as { data?: { detail?: string } };
        setApiError(apiErr?.data?.detail || 'Có lỗi xảy ra khi tính toán lương. Vui lòng kiểm tra lại.');
      });

    return () => {
      promise.abort();
    };
  }, [open, salarySlip.id, salarySlip.status, calculateSalary, onCalculateSuccess]);

  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);

  const handleSubmitForReview = () => {
    setIsSubmitConfirmOpen(true);
  };

  const handleConfirmSubmit = () => {
    if (!salarySlip.id) return;
    setIsSubmitConfirmOpen(false);
    submitSalary({
      id: salarySlip.id,
    })
      .unwrap()
      .then(() => {
        onSuccess();
      })
      .catch((err: unknown) => {
        console.error('Failed to submit salary slip', err);
        const apiErr = err as { data?: { detail?: string } };
        setApiError(apiErr?.data?.detail || 'Có lỗi xảy ra khi gửi duyệt bảng lương. Vui lòng kiểm tra lại.');
      });
  };

  const formatVND = (value?: string | number | null) => {
    if (value === undefined || value === null) return '0 đ';
    const amount = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Đã thanh toán';
      case 'approved':
        return 'Đã phê duyệt';
      case 'calculated':
        return 'Đã tính toán';
      case 'pending_finance_review':
        return 'Chờ phê duyệt';
      case 'draft':
      default:
        return 'Bản nháp';
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'paid':
        return `${styles.badge} ${styles.paid}`;
      case 'approved':
        return `${styles.badge} ${styles.approved}`;
      case 'calculated':
        return `${styles.badge} ${styles.calculated}`;
      case 'pending_finance_review':
        return `${styles.badge} ${styles.calculated}`;
      case 'draft':
      default:
        return `${styles.badge} ${styles.draft}`;
    }
  };

  const breakdownIncomes = salarySlip.breakdown?.incomes || [
    { name: 'Lương theo ngày công', amount: parseFloat(salarySlip.base_salary || '0') },
    { name: 'Lương tăng ca (OT)', amount: parseFloat(salarySlip.overtime_amount || '0') },
    { name: 'Phụ cấp cố định', amount: parseFloat(salarySlip.allowance_amount || '0') },
    { name: 'Khen thưởng/Thưởng thêm', amount: parseFloat(salarySlip.reward_amount_total || '0') },
  ];

  const breakdownDeductions = salarySlip.breakdown?.deductions || [
    { name: 'Phạt kỷ luật/Khấu trừ', amount: parseFloat(salarySlip.discipline_deduction_total || '0') },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Chi Tiết Phiếu Lương"
      size="md"
      footer={
        <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-end', gap: '8px' }}>
          {salarySlip.status === 'calculated' && canSubmit && (
            <Button variant="primary" onClick={handleSubmitForReview} loading={isSubmitting}>
              Gửi Finance Duyệt
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </div>
      }
    >
      <div className={styles.container}>
        {apiError && (
          <div className={styles.errorSection}>
            <span>{apiError}</span>
          </div>
        )}

        <div className={styles.slipHeader}>
          <div>
            <div className={styles.employeeName}>{salarySlip.employee_name || 'N/A'}</div>
            <div className={styles.employeeMeta}>
              Mã nhân viên: {salarySlip.employee_code || 'N/A'} | Kỳ lương: {salarySlip.salary_period}
            </div>
          </div>
          <span className={getStatusClass(salarySlip.status)}>{getStatusLabel(salarySlip.status)}</span>
        </div>

        <div className={styles.grid} style={{ opacity: isCalculating ? 0.6 : 1, transition: 'opacity var(--duration-fast) ease' }}>
          {/* Lương & Thu nhập */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Các Khoản Thu Nhập</h4>
            {breakdownIncomes.map((item, idx) => (
              <div className={styles.row} key={idx}>
                <span>{item.name}:</span>
                <strong style={item.name?.includes('Khen thưởng') || item.name?.includes('Thưởng') ? { color: 'var(--clr-success)' } : undefined}>
                  {formatVND(item.amount)}
                </strong>
              </div>
            ))}
            <div className={styles.row} style={{ borderTop: '1px dashed var(--clr-border)', paddingTop: '8px', marginTop: '8px' }}>
              <span>Tổng thu nhập (Gross):</span>
              <strong>{formatVND(salarySlip.gross_pay)}</strong>
            </div>
          </div>

          {/* Các khoản khấu trừ & Thực nhận */}
          <div className={styles.section} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h4 className={styles.sectionTitle}>Khấu Trừ & Nghĩa Vụ</h4>
              {breakdownDeductions.map((item, idx) => (
                <div className={styles.row} key={idx}>
                  <span>{item.name}:</span>
                  <strong style={{ color: 'var(--clr-error)' }}>
                    {formatVND(item.amount)}
                  </strong>
                </div>
              ))}
              <div className={styles.row} style={{ borderTop: '1px dashed var(--clr-border)', paddingTop: '8px', marginTop: '8px' }}>
                <span>Tổng khấu trừ:</span>
                <strong style={{ color: 'var(--clr-error)' }}>{formatVND(salarySlip.deductions)}</strong>
              </div>
            </div>

            <div className={styles.totalRow}>
              <span>Thực Nhận (Net):</span>
              <span>{formatVND(salarySlip.net_pay)}</span>
            </div>
          </div>
        </div>

        {salarySlip.breakdown?.salary_segments && salarySlip.breakdown.salary_segments.length > 1 && (
          <div className={styles.segmentsSection}>
            <button
              type="button"
              className={styles.segmentsToggle}
              onClick={() => setIsSegmentsOpen(!isSegmentsOpen)}
            >
              <span>{isSegmentsOpen ? '▼ Ẩn chi tiết chặng lương (Prorated)' : '▶ Xem chi tiết chặng lương (Prorated)'}</span>
            </button>
            {isSegmentsOpen && (
              <div className={styles.segmentsList}>
                {salarySlip.breakdown.salary_segments.map((seg: any, idx: number) => (
                  <div key={idx} className={styles.segmentItem}>
                    <div className={styles.segmentHeader}>
                      <span>Chặng {idx + 1}: {seg.start_date} ~ {seg.end_date}</span>
                      <strong>{formatVND(seg.earned)}</strong>
                    </div>
                    <div className={styles.segmentMeta}>
                      Mức lương chặng: {formatVND(seg.salary_base)} | Số ngày công: {seg.work_days} ngày
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

  {salarySlip.remarks && salarySlip.status !== 'approved' && salarySlip.status !== 'paid' && (
          <div className={styles.remarksSection}>
            <h4 className={styles.sectionTitle}>Ghi chú / Giải trình chi tiết</h4>
            <div className={styles.remarksContent}>
              {salarySlip.remarks}
            </div>
          </div>
        )}

        {salarySlip.status === 'draft' && (
          <div className={styles.actionRow}>
            {/* Form tính toán */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', width: '100%' }}>
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label className={styles.label} htmlFor="standard_days">
                  Số ngày công tiêu chuẩn tháng: {isCalculating && <span style={{ color: 'var(--clr-primary)', fontSize: 'var(--fs-xs)', marginLeft: '8px', fontWeight: 'normal' }}>(Đang tính toán lại...)</span>}
                </label>
                <input
                  id="standard_days"
                  type="number"
                  value={salarySlip.breakdown?.standard_working_days ?? 26}
                  readOnly
                  className={styles.input}
                />
              </div>
            </div>
          </div>
        )}
      </div>
      <ConfirmDialog
        open={isSubmitConfirmOpen}
        onClose={() => setIsSubmitConfirmOpen(false)}
        onConfirm={handleConfirmSubmit}
        title="Xác nhận gửi duyệt"
        message="Gửi phiếu lương này sang Finance duyệt? Hành động không thể hoàn tác."
        confirmText="Xác nhận"
        cancelText="Hủy"
        loading={isSubmitting}
      />
    </Modal>
  );
};

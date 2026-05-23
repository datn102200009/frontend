import React, { useState, useEffect } from 'react';
import {
  usePostHrmSalarySlipsByIdCalculateMutation,
  usePostHrmSalarySlipsByIdConfirmMutation,
} from '@entities/hrm/api/hrmApi';
import type { SalarySlip } from '@entities/hrm/model/types';
import { Modal } from '@shared/ui/Modal/Modal';
import { Button } from '@shared/ui/Button/Button';
import styles from './SalarySlipDetailsModal.module.css';

interface SalarySlipDetailsModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onCalculateSuccess?: () => void;
  salarySlip: SalarySlip;
}

export const SalarySlipDetailsModal: React.FC<SalarySlipDetailsModalProps> = ({
  open,
  onClose,
  onSuccess,
  onCalculateSuccess,
  salarySlip,
}) => {
  const [calculateSalary, { isLoading: isCalculating }] = usePostHrmSalarySlipsByIdCalculateMutation();
  const [confirmSalary, { isLoading: isConfirming }] = usePostHrmSalarySlipsByIdConfirmMutation();

  const [standardDays, setStandardDays] = useState<number>(26);
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'cash'>('bank_transfer');
  const [apiError, setApiError] = useState<string | null>(null);

  // Auto calculate when modal opens or standard days change
  useEffect(() => {
    if (open && salarySlip.id && salarySlip.status === 'draft' && standardDays >= 1 && standardDays <= 31) {
      setApiError(null);
      calculateSalary({
        id: salarySlip.id,
        body: { standard_days: standardDays },
      })
        .unwrap()
        .then(() => {
          onCalculateSuccess?.();
        })
        .catch((err: any) => {
          console.error('Failed to auto calculate salary slip', err);
          setApiError(err?.data?.detail || 'Có lỗi xảy ra khi tính toán lương. Vui lòng kiểm tra lại.');
        });
    }
  }, [open, salarySlip.id, salarySlip.status, standardDays, calculateSalary, onCalculateSuccess]);

  const handleConfirmPayment = async () => {
    setApiError(null);
    if (!salarySlip.id) return;
    try {
      await confirmSalary({
        id: salarySlip.id,
        body: { payment_method: paymentMethod },
      }).unwrap();
      onSuccess();
    } catch (err: any) {
      console.error('Failed to pay salary slip', err);
      setApiError(err?.data?.detail || 'Có lỗi xảy ra khi thanh toán lương. Vui lòng kiểm tra lại.');
    }
  };

  const formatVND = (value: any) => {
    if (value === undefined || value === null) return '0 đ';
    const amount = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getStatusLabel = (status: string) => {
    return status === 'paid' ? 'Đã thanh toán' : 'Bản nháp';
  };

  const getStatusClass = (status: string) => {
    return status === 'paid' ? `${styles.badge} ${styles.paid}` : `${styles.badge} ${styles.draft}`;
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Chi Tiết Phiếu Lương"
      size="md"
      footer={
        <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-end' }}>
          <Button variant="primary" onClick={onClose}>
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
            <div className={styles.employeeName}>{(salarySlip as any).employee_name || 'N/A'}</div>
            <div className={styles.employeeMeta}>
              Mã NV: {(salarySlip as any).employee_code || 'N/A'} | Kỳ lương: {salarySlip.salary_period}
            </div>
          </div>
          <span className={getStatusClass(salarySlip.status)}>{getStatusLabel(salarySlip.status)}</span>
        </div>

        <div className={styles.grid} style={{ opacity: isCalculating ? 0.6 : 1, transition: 'opacity var(--duration-fast) ease' }}>
          {/* Lương & Thu nhập */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Các Khoản Thu Nhập</h4>
            <div className={styles.row}>
              <span>Lương theo ngày công:</span>
              <strong>{formatVND(salarySlip.base_salary)}</strong>
            </div>
            <div className={styles.row}>
              <span>Lương tăng ca (OT):</span>
              <strong>{formatVND(salarySlip.overtime_amount)}</strong>
            </div>
            <div className={styles.row}>
              <span>Phụ cấp cố định:</span>
              <strong>{formatVND(salarySlip.allowance_amount)}</strong>
            </div>
            <div className={styles.row}>
              <span>Khen thưởng/Thưởng thêm:</span>
              <strong style={{ color: 'var(--clr-success)' }}>
                {formatVND(salarySlip.reward_amount_total)}
              </strong>
            </div>
            <div className={styles.row} style={{ borderTop: '1px dashed var(--clr-border)', paddingTop: '8px', marginTop: '8px' }}>
              <span>Tổng thu nhập (Gross):</span>
              <strong>{formatVND(salarySlip.gross_pay)}</strong>
            </div>
          </div>

          {/* Các khoản khấu trừ & Thực nhận */}
          <div className={styles.section} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h4 className={styles.sectionTitle}>Khấu Trừ & Nghĩa Vụ</h4>
              <div className={styles.row}>
                <span>Phạt kỷ luật/Khấu trừ:</span>
                <strong style={{ color: 'var(--clr-error)' }}>
                  {formatVND(salarySlip.discipline_deduction_total)}
                </strong>
              </div>
              <div className={styles.row}>
                <span>Phí công đoàn (2%):</span>
                <strong style={{ color: 'var(--clr-error)' }}>
                  {formatVND(salarySlip.union_fee_2pct)}
                </strong>
              </div>
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

        {salarySlip.status === 'draft' && (
          <div className={styles.actionRow}>
            {/* Form tính toán */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', borderBottom: '1px solid var(--clr-border)', paddingBottom: '16px', width: '100%' }}>
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label className={styles.label} htmlFor="standard_days">
                  Số ngày công tiêu chuẩn tháng: {isCalculating && <span style={{ color: 'var(--clr-primary)', fontSize: 'var(--fs-xs)', marginLeft: '8px', fontWeight: 'normal' }}>(Đang tính toán lại...)</span>}
                </label>
                <input
                  id="standard_days"
                  type="number"
                  min={1}
                  max={31}
                  value={standardDays}
                  onChange={(e) => setStandardDays(Number(e.target.value))}
                  className={styles.input}
                  disabled={isCalculating || isConfirming}
                />
              </div>
            </div>

            {/* Form thanh toán */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label className={styles.label} htmlFor="payment_method">
                  Hình thức chi trả:
                </label>
                <select
                  id="payment_method"
                  value={paymentMethod}
                  onChange={(e: any) => setPaymentMethod(e.target.value)}
                  className={styles.select}
                  disabled={isCalculating || isConfirming}
                >
                  <option value="bank_transfer">Chuyển khoản ngân hàng</option>
                  <option value="cash">Tiền mặt</option>
                </select>
              </div>
              <Button
                variant="primary"
                onClick={handleConfirmPayment}
                loading={isConfirming}
                disabled={isCalculating}
                style={{ backgroundColor: 'var(--clr-success)', borderColor: 'var(--clr-success)' }}
              >
                Thanh Toán Lương
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

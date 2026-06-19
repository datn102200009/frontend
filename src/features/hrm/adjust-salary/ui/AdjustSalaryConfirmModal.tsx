import React, { useState } from 'react';
import type { Employee } from '@entities/hrm/model/types';
import { Modal } from '@shared/ui/Modal/Modal';
import { Button } from '@shared/ui/Button/Button';
import styles from './AdjustSalaryModal.module.css';

interface AdjustSalaryConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  onConfirm: () => Promise<void>;
  employee: Employee;
  formData: { new_salary_base: number; reason: string };
}

export const AdjustSalaryConfirmModal: React.FC<AdjustSalaryConfirmModalProps> = ({
  open,
  onClose,
  onBack,
  onConfirm,
  employee,
  formData,
}) => {
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const oldSalary = Number(employee.current_salary_base) || 0;
  const newSalary = formData.new_salary_base;
  const delta = newSalary - oldSalary;
  const deltaPercent = oldSalary > 0 ? ((delta / oldSalary) * 100).toFixed(2) : '0';

  const handleConfirm = async () => {
    setApiError(null);
    setIsLoading(true);
    try {
      await onConfirm();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setApiError(apiErr?.message || 'Có lỗi xảy ra khi thực hiện cập nhật. Vui lòng kiểm tra lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatVND = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Xác nhận điều chỉnh lương"
      size="md"
      footer={
        <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="ghost" onClick={onBack} disabled={isLoading}>
            ← Quay lại
          </Button>
          <Button variant="primary" onClick={handleConfirm} loading={isLoading}>
            Xác nhận
          </Button>
        </div>
      }
    >
      {apiError && <div className={styles.errorSection}>{apiError}</div>}
      
      <div className={styles.diffTable}>
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Mức lương cũ</th>
              <th>Mức lương mới</th>
              <th>Thay đổi</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ fontWeight: 500 }}>Lương cơ bản</td>
              <td>{formatVND(oldSalary)}</td>
              <td>{formatVND(newSalary)}</td>
              <td className={delta >= 0 ? styles.positive : styles.negative}>
                {delta >= 0 ? '+' : ''}
                {formatVND(delta)} ({deltaPercent}%)
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: 'var(--fs-sm)' }}>
        <p>
          <strong>Ngày áp dụng:</strong> Hôm nay ({new Date().toISOString().split('T')[0]})
        </p>
        <p>
          <strong>Lý do điều chỉnh:</strong> {formData.reason || '(không có lý do)'}
        </p>
      </div>

      <div className={styles.infoBox}>
        ℹ️ Hệ thống sẽ tự động cập nhật hợp đồng hiện tại (hoặc gia hạn/tái ký nếu hợp đồng cũ hết hạn) và tính lại phiếu lương kỳ hiện tại (nếu chưa chốt).
      </div>
    </Modal>
  );
};

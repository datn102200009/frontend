import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePostHrmContractsByIdHandleExpirationMutation } from '@entities/hrm/api/hrmApi';
import { Modal } from '@shared/ui/Modal/Modal';
import { Button } from '@shared/ui/Button/Button';
import { handleContractSchema, type HandleContractFormValues } from '../model/handleContract.schema';
import styles from './HandleContractExpirationModal.module.css';

interface HandleContractExpirationModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  contract: {
    id: string;
    contract_no: string;
    start_date: string;
    end_date?: string | null;
  };
  employee: {
    id: string;
    full_name: string;
    employee_id: string;
    salary_base?: string | number | null;
    position_title?: string | null;
  };
}

export const HandleContractExpirationModal: React.FC<HandleContractExpirationModalProps> = ({
  open,
  onClose,
  onSuccess,
  contract,
  employee,
}) => {
  const [handleExpiration, { isLoading }] = usePostHrmContractsByIdHandleExpirationMutation();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<HandleContractFormValues>({
    resolver: zodResolver(handleContractSchema) as any,
    defaultValues: {
      action: 'renew',
      new_salary_base: undefined,
      new_title: '',
      start_date: '',
      reason: '',
    },
  });

  const selectedAction = watch('action');

  useEffect(() => {
    if (open) {
      reset({
        action: 'renew',
        new_salary_base: undefined,
        new_title: employee.position_title || '',
        start_date: '',
        reason: '',
      });
      setApiError(null);
    }
  }, [open, reset, employee]);

  const onSubmit = async (values: HandleContractFormValues) => {
    setApiError(null);
    try {
      const payload: any = {
        action: values.action,
      };

      if (values.action === 'renew_with_salary_change') {
        payload.new_salary_base = Number(values.new_salary_base);
        if (values.new_title) payload.new_title = values.new_title;
        if (values.start_date) payload.start_date = values.start_date;
      }

      if (values.reason) {
        payload.reason = values.reason;
      }

      await handleExpiration({
        id: contract.id,
        body: payload,
      }).unwrap();

      onSuccess();
    } catch (err: unknown) {
      console.error('Failed to handle contract expiration', err);
      const error = err as { data?: { error?: string; detail?: string } };
      setApiError(
        error?.data?.error || error?.data?.detail || 'Có lỗi xảy ra khi xử lý hợp đồng. Vui lòng kiểm tra lại.'
      );
    }
  };

  const formatVND = (value?: string | number | null) => {
    if (value === undefined || value === null) return '0 đ';
    const amount = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Xử Lý Hợp Đồng Lao Động Hết Hạn"
      size="md"
      footer={
        <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isLoading}>
            Xác nhận
          </Button>
        </div>
      }
    >
      <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
        {apiError && (
          <div className={styles.errorSection}>
            <span>{apiError}</span>
          </div>
        )}

        <div className={styles.contractInfo}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Nhân viên:</span>
            <span className={styles.infoValue}>{employee.full_name} ({employee.employee_id})</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Hợp đồng hiện tại:</span>
            <span className={styles.infoValue}>{contract.contract_no} ({contract.start_date} ~ {contract.end_date || 'N/A'})</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Lương hiện tại:</span>
            <span className={styles.infoValue}>{formatVND(employee.salary_base)}</span>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>
            Chọn phương án xử lý <span className={styles.required}>*</span>
          </label>
          <div className={styles.radioGroup}>
            {[
              {
                value: 'renew',
                title: 'Gia hạn hợp đồng',
                desc: 'Tái ký hợp đồng mới liền mạch, giữ nguyên chức vụ và lương cơ bản hiện tại.',
              },
              {
                value: 'renew_with_salary_change',
                title: 'Gia hạn kèm điều chỉnh (Lương & Chức danh)',
                desc: 'Tái ký hợp đồng mới kèm nâng lương hoặc thay đổi chức danh. Tạo 1 đề xuất duyệt gộp.',
              },
              {
                value: 'terminate',
                title: 'Chấm dứt hợp đồng lao động',
                desc: 'Cho thôi việc khi hết hạn hợp đồng, chuyển trạng thái nhân viên sang Nghỉ việc.',
              },
              {
                value: 'defer',
                title: 'Trì hoãn xử lý',
                desc: 'Đánh dấu đã xem và trì hoãn quyết định, giữ nguyên trạng thái hợp đồng hiện tại.',
              },
            ].map((opt) => (
              <div
                key={opt.value}
                className={`${styles.radioOption} ${selectedAction === opt.value ? styles.radioOptionActive : ''}`}
                onClick={() => setValue('action', opt.value as any, { shouldValidate: true })}
              >
                <input
                  type="radio"
                  value={opt.value}
                  checked={selectedAction === opt.value}
                  className={styles.radioInput}
                  onChange={() => {}}
                />
                <div className={styles.radioLabel}>
                  <span className={styles.radioTitle}>{opt.title}</span>
                  <span className={styles.radioDesc}>{opt.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedAction === 'renew_with_salary_change' && (
          <>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="new_salary_base">
                Lương cơ bản mới <span className={styles.required}>*</span>
              </label>
              <input
                id="new_salary_base"
                type="number"
                placeholder="Nhập mức lương mới (VND)"
                className={styles.input}
                {...register('new_salary_base')}
              />
              {errors.new_salary_base && (
                <span className={styles.errorText}>{errors.new_salary_base.message}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="new_title">
                Chức danh mới (Tùy chọn)
              </label>
              <input
                id="new_title"
                type="text"
                placeholder="Nhập chức danh mới"
                className={styles.input}
                {...register('new_title')}
              />
              {errors.new_title && (
                <span className={styles.errorText}>{errors.new_title.message}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="start_date">
                Ngày bắt đầu hợp đồng mới (Tùy chọn)
              </label>
              <input
                id="start_date"
                type="date"
                className={styles.input}
                {...register('start_date')}
              />
              <span className={styles.helperText}>Mặc định là ngày liền sau ngày hết hạn của hợp đồng cũ.</span>
              {errors.start_date && (
                <span className={styles.errorText}>{errors.start_date.message}</span>
              )}
            </div>
          </>
        )}

        {selectedAction === 'terminate' && (
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="reason">
              Lý do chấm dứt hợp đồng <span className={styles.required}>*</span>
            </label>
            <textarea
              id="reason"
              placeholder="Nhập lý do chi tiết (tối thiểu 10 ký tự)"
              className={styles.textarea}
              {...register('reason')}
            />
            {errors.reason && (
              <span className={styles.errorText}>{errors.reason.message}</span>
            )}
          </div>
        )}

        {(selectedAction === 'renew' || selectedAction === 'defer') && (
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="reason_opt">
              Ghi chú thêm (Tùy chọn)
            </label>
            <textarea
              id="reason_opt"
              placeholder="Nhập ghi chú hoặc lý do trì hoãn..."
              className={styles.textarea}
              {...register('reason')}
            />
          </div>
        )}
      </form>
    </Modal>
  );
};

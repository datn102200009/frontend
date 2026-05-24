import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { usePostHrmContractsMutation } from '@entities/hrm/api/hrmApi';
import type { Employee } from '@entities/hrm/model/types';
import { Modal } from '@shared/ui/Modal/Modal';
import { Button } from '@shared/ui/Button/Button';
import styles from './ContractFormModal.module.css';

interface ContractFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employee: Employee;
}

interface FormValues {
  contract_no: string;
  contract_type: 'probation' | 'definite_term' | 'indefinite_term' | 'other';
  start_date: string;
  end_date?: string;
  note?: string;
  file_url?: string;
}

export const ContractFormModal: React.FC<ContractFormModalProps> = ({
  open,
  onClose,
  onSuccess,
  employee,
}) => {
  const [createContract, { isLoading }] = usePostHrmContractsMutation();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<FormValues>({
    defaultValues: {
      contract_no: '',
      contract_type: 'definite_term',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      note: '',
      file_url: '',
    },
  });

  const contractType = watch('contract_type');

  useEffect(() => {
    if (open && employee) {
      reset({
        contract_no: '',
        contract_type: 'definite_term',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        note: '',
        file_url: '',
      });
      setApiError(null);
    }
  }, [open, employee, reset]);

  const onSubmit = async (values: FormValues) => {
    setApiError(null);
    if (!employee.id) return;

    // Validate dates
    if (values.end_date && values.start_date && values.end_date <= values.start_date) {
      setApiError('Ngày kết thúc phải sau ngày bắt đầu hợp đồng.');
      return;
    }

    try {
      const body = {
        employee_id: employee.id,
        contract_no: values.contract_no,
        contract_type: values.contract_type,
        start_date: values.start_date,
        end_date: values.end_date || undefined,
        note: values.note || undefined,
        file_url: values.file_url || undefined,
      };

      await createContract({ body }).unwrap();
      onSuccess();
    } catch (err: any) {
      console.error('Failed to create contract', err);
      setApiError(err?.data?.detail || 'Có lỗi xảy ra khi tạo hợp đồng. Vui lòng kiểm tra lại.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Tạo Mới / Gia Hạn Hợp Đồng - ${employee.full_name}`}
      size="md"
      footer={
        <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isLoading}>
            Tạo hợp đồng
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

        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="contract_no">
              Số hợp đồng <span className={styles.required}>*</span>
            </label>
            <input
              id="contract_no"
              type="text"
              placeholder="VD: HĐLD-2026-099"
              className={styles.input}
              {...register('contract_no', { required: 'Số hợp đồng là bắt buộc' })}
              disabled={isLoading}
            />
            {errors.contract_no && <span className={styles.errorText}>{errors.contract_no.message}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="contract_type">
              Loại hợp đồng <span className={styles.required}>*</span>
            </label>
            <select
              id="contract_type"
              className={styles.select}
              {...register('contract_type', { required: 'Loại hợp đồng là bắt buộc' })}
              disabled={isLoading}
            >
              <option value="probation">Hợp đồng thử việc</option>
              <option value="definite_term">Hợp đồng xác định thời hạn</option>
              <option value="indefinite_term">Hợp đồng không xác định thời hạn</option>
              <option value="other">Hợp đồng khác</option>
            </select>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="start_date">
              Ngày bắt đầu <span className={styles.required}>*</span>
            </label>
            <input
              id="start_date"
              type="date"
              className={styles.input}
              {...register('start_date', { required: 'Ngày bắt đầu là bắt buộc' })}
              disabled={isLoading}
            />
            {errors.start_date && <span className={styles.errorText}>{errors.start_date.message}</span>}
          </div>

          {contractType !== 'indefinite_term' && (
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="end_date">
                Ngày kết thúc {contractType !== 'other' && <span className={styles.required}>*</span>}
              </label>
              <input
                id="end_date"
                type="date"
                className={styles.input}
                {...register('end_date', {
                  required: contractType !== 'other' ? 'Ngày kết thúc là bắt buộc' : false,
                })}
                disabled={isLoading}
              />
              {errors.end_date && <span className={styles.errorText}>{errors.end_date.message}</span>}
            </div>
          )}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="file_url">
            Link file đính kèm (Scan PDF/Image)
          </label>
          <input
            id="file_url"
            type="text"
            placeholder="https://storage.example.com/contracts/hdld.pdf"
            className={styles.input}
            {...register('file_url')}
            disabled={isLoading}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="note">Ghi chú</label>
          <input
            id="note"
            type="text"
            placeholder="Ghi chú thêm về hợp đồng..."
            className={styles.input}
            {...register('note')}
            disabled={isLoading}
          />
        </div>
      </form>
    </Modal>
  );
};

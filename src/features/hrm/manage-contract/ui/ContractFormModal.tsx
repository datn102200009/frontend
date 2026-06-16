import React, { useEffect, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePostHrmContractsMutation, usePostHrmContractsByIdRenewMutation } from '@entities/hrm/api/hrmApi';
import type { Employee } from '@entities/hrm/model/types';
import { Modal } from '@shared/ui/Modal/Modal';
import { Button } from '@shared/ui/Button/Button';
import { contractSchema, type ContractFormValues } from '../model/contract.schema';
import styles from './ContractFormModal.module.css';
import { DatePickerField } from '@shared/ui/DatePickerField/DatePickerField';

interface ContractFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employee: Employee;
  oldContractId?: string;
}

export const ContractFormModal: React.FC<ContractFormModalProps> = ({
  open,
  onClose,
  onSuccess,
  employee,
  oldContractId,
}) => {
  const [createContract, { isLoading: isCreating }] = usePostHrmContractsMutation();
  const [renewContract, { isLoading: isRenewing }] = usePostHrmContractsByIdRenewMutation();
  const isLoading = isCreating || isRenewing;
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    control,
  } = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema) as unknown as Resolver<ContractFormValues>,
    defaultValues: {
      contract_no: '',
      contract_type: 'definite_term',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      note: '',
      file_url: '',
      salary_base: '',
      adjust_salary: false,
      new_salary_base: '',
      is_renewal: !!oldContractId,
    },
  });

  const contractType = watch('contract_type');
  const adjustSalary = watch('adjust_salary');

  useEffect(() => {
    if (open && employee) {
      reset({
        contract_no: '',
        contract_type: 'definite_term',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        note: '',
        file_url: '',
        salary_base: '',
        adjust_salary: false,
        new_salary_base: '',
        is_renewal: !!oldContractId,
      });
      setApiError(null);
    }
  }, [open, employee, reset]);

  const onSubmit = async (values: ContractFormValues) => {
    setApiError(null);
    if (!employee.id) return;

    try {
      if (oldContractId) {
        const body = {
          new_contract_no: values.contract_no,
          new_contract_type: values.contract_type,
          start_date: values.start_date,
          new_salary_base: values.adjust_salary && values.new_salary_base ? Number(values.new_salary_base) : undefined,
          file_url: values.file_url || undefined,
          note: values.note || undefined,
        };
        await renewContract({ id: oldContractId, body }).unwrap();
      } else {
        const body = {
          employee_id: employee.id,
          contract_no: values.contract_no,
          contract_type: values.contract_type,
          start_date: values.start_date,
          end_date: values.end_date || undefined,
          salary_base: values.salary_base ? Number(values.salary_base) : undefined,
          note: values.note || undefined,
          file_url: values.file_url || undefined,
        };
        await createContract({ body }).unwrap();
      }
      onSuccess();
    } catch (err: unknown) {
      console.error('Failed to save contract', err);
      const error = err as { data?: { detail?: string } };
      setApiError(error?.data?.detail || 'Có lỗi xảy ra khi lưu hợp đồng. Vui lòng kiểm tra lại.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={oldContractId ? `Gia Hạn Hợp Đồng - ${employee.full_name}` : `Tạo Mới Hợp Đồng - ${employee.full_name}`}
      size="md"
      footer={
        <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isLoading}>
            {oldContractId ? 'Gia hạn hợp đồng' : 'Tạo hợp đồng'}
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
              {...register('contract_no')}
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
              {...register('contract_type')}
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
            <label className={styles.label} htmlFor="start_date_read_only">Ngày bắt đầu</label>
            <input
              id="start_date_read_only"
              type="text"
              className={styles.input}
              value={`Hôm nay (${new Date().toLocaleDateString('vi-VN')})`}
              disabled={true}
            />
            <input
              type="hidden"
              {...register('start_date')}
            />
          </div>

          {contractType !== 'indefinite_term' && (
            <DatePickerField
              name="end_date"
              label="Ngày kết thúc"
              control={control}
              error={errors.end_date?.message}
              required={contractType !== 'other'}
              disabled={isLoading}
            />
          )}
        </div>

        {!oldContractId && (
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="salary_base">
              Lương cơ bản theo hợp đồng (VND) <span className={styles.required}>*</span>
            </label>
            <input
              id="salary_base"
              type="number"
              min={0}
              step={100000}
              placeholder="VD: 10000000"
              className={styles.input}
              {...register('salary_base', {
                required: 'Lương cơ bản theo hợp đồng là bắt buộc',
              })}
              disabled={isLoading}
            />
            {errors.salary_base && <span className={styles.errorText}>{errors.salary_base.message}</span>}
          </div>
        )}

        {oldContractId && (
          <>
            <div className={styles.checkboxGroup}>
              <input
                id="adjust_salary"
                type="checkbox"
                {...register('adjust_salary')}
                disabled={isLoading}
              />
              <label className={styles.label} style={{ cursor: 'pointer' }} htmlFor="adjust_salary">
                Có điều chỉnh lương cơ bản đi kèm hợp đồng
              </label>
            </div>

            {adjustSalary && (
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="new_salary_base">
                  Mức lương mới (VND) <span className={styles.required}>*</span>
                </label>
                <input
                  id="new_salary_base"
                  type="number"
                  placeholder="VD: 12000000"
                  className={styles.input}
                  {...register('new_salary_base')}
                  disabled={isLoading}
                />
                {errors.new_salary_base && <span className={styles.errorText}>{errors.new_salary_base.message}</span>}
              </div>
            )}
          </>
        )}

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

        <div className={styles.infoBox}>
          ℹ️ Hợp đồng sẽ có hiệu lực từ hôm nay ({new Date().toLocaleDateString('vi-VN')}). Hợp đồng cũ đang hoạt động của nhân viên (nếu có) sẽ tự động chuyển sang trạng thái "expired".
        </div>
      </form>
    </Modal>
  );
};

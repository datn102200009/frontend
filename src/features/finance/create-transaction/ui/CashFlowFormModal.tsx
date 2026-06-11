import React, { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useToast } from '@shared/ui/Toast/Toast';
import { usePostFinanceCashFlowsMutation } from '@entities/finance/api/financeApi';
import type { CashFlowInput } from '@entities/finance/model/types';
import { Modal } from '@shared/ui/Modal/Modal';
import { Button } from '@shared/ui/Button/Button';
import { Input } from '@shared/ui/Input/Input';
import styles from './CashFlowFormModal.module.css';

interface CashFlowFormState {
  payment_type: 'receive' | 'pay';
  amount: number;
  payment_date: string;
  sales_invoice_id: string | null;
  purchase_invoice_id: string | null;
  sales_order_id: string | null;
  purchase_order_id: string | null;
  category: string;
  payment_method: 'cash' | 'bank_transfer' | 'credit_card' | 'other';
  remarks?: string;
}

interface CashFlowFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultValues?: Partial<Omit<CashFlowInput, 'amount'>> & { amount?: string | number };
}

export const CashFlowFormModal: React.FC<CashFlowFormModalProps> = ({ open, onClose, onSuccess, defaultValues }) => {
  const [createTx, { isLoading }] = usePostFinanceCashFlowsMutation();
  const { toast } = useToast();
  const paymentType = defaultValues?.payment_type || 'receive';
  
  const isDirect = !!defaultValues?.sales_order_id || !!defaultValues?.purchase_order_id || !!defaultValues?.sales_invoice_id || !!defaultValues?.purchase_invoice_id;

  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!open) {
      hasInitialized.current = false;
    }
  }, [open]);

  const { register, handleSubmit, formState: { errors } } = useForm<CashFlowFormState>({
    defaultValues: {
      payment_type: paymentType,
      amount: Number(defaultValues?.amount) || 0,
      payment_date: defaultValues?.payment_date || new Date().toISOString().split('T')[0],
      sales_invoice_id: defaultValues?.sales_invoice_id || null,
      purchase_invoice_id: defaultValues?.purchase_invoice_id || null,
      sales_order_id: defaultValues?.sales_order_id || null,
      purchase_order_id: defaultValues?.purchase_order_id || null,
      category: defaultValues?.category || '',
      payment_method: defaultValues?.payment_method || 'bank_transfer',
      remarks: defaultValues?.remarks || ''
    }
  });

  const onSubmit = async (data: CashFlowFormState) => {
    if (!isDirect) {
      toast('error', 'Yêu cầu mã chứng từ tham chiếu hợp lệ.');
      return;
    }

    try {
      let inferredCategory = data.category || defaultValues?.category;
      if (!inferredCategory) {
        if (data.sales_order_id || defaultValues?.sales_order_id) {
          inferredCategory = 'Đặt cọc đơn hàng';
        } else if (data.purchase_order_id || defaultValues?.purchase_order_id) {
          inferredCategory = 'Đặt cọc đơn hàng';
        } else if (data.sales_invoice_id || defaultValues?.sales_invoice_id) {
          inferredCategory = 'Thanh toán hóa đơn';
        } else if (data.purchase_invoice_id || defaultValues?.purchase_invoice_id) {
          inferredCategory = 'Thanh toán hóa đơn';
        } else {
          inferredCategory = 'Thu/Chi khác';
        }
      }

      const payload = {
        ...data,
        amount: String(data.amount),
        category: inferredCategory,
      };

      await createTx({ cashFlowInput: payload }).unwrap();
      onSuccess();
    } catch (err) {
      console.error('Failed to record transaction', err);
      const errData = err as { data?: { detail?: string } };
      toast('error', errData?.data?.detail || 'Ghi nhận dòng tiền thất bại');
    }
  };

  return (
    <Modal 
      open={open} 
      onClose={onClose} 
      title={paymentType === 'receive' ? 'Ghi Nhận Thu Tiền' : 'Ghi Nhận Chi Tiền'}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>Hủy</Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isLoading} disabled={isLoading}>Xác nhận</Button>
        </>
      }
    >
      <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
        <div className={styles.row}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)', flex: 1 }}>
            <label htmlFor="target_id" style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--clr-text-secondary)' }}>Mã Chứng Từ <span style={{ color: 'var(--clr-danger)' }}>*</span></label>
            <select id="target_id" className={styles.itemInput} {...register(
              defaultValues?.sales_order_id ? 'sales_order_id' :
              defaultValues?.purchase_order_id ? 'purchase_order_id' :
              defaultValues?.sales_invoice_id ? 'sales_invoice_id' :
              defaultValues?.purchase_invoice_id ? 'purchase_invoice_id' :
              paymentType === 'receive' ? 'sales_invoice_id' : 'purchase_invoice_id'
            , { required: 'Bắt buộc' })} disabled={true}>
              {defaultValues?.sales_order_id ? (
                <option value={defaultValues.sales_order_id}>{defaultValues.sales_order_id.slice(0,8).toUpperCase()} (Đặt Cọc Bán)</option>
              ) : defaultValues?.purchase_order_id ? (
                <option value={defaultValues.purchase_order_id}>{defaultValues.purchase_order_id.slice(0,8).toUpperCase()} (Đặt Cọc Mua)</option>
              ) : defaultValues?.sales_invoice_id ? (
                <option value={defaultValues.sales_invoice_id}>{defaultValues.sales_invoice_id.slice(0,8).toUpperCase()} (Hóa Đơn Bán)</option>
              ) : defaultValues?.purchase_invoice_id ? (
                <option value={defaultValues.purchase_invoice_id}>{defaultValues.purchase_invoice_id.slice(0,8).toUpperCase()} (Hóa Đơn Mua)</option>
              ) : (
                <option value="">Không tìm thấy mã chứng từ hợp lệ</option>
              )}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)', flex: 1 }}>
            <label htmlFor="payment_method" style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--clr-text-secondary)' }}>Phương Thức <span style={{ color: 'var(--clr-danger)' }}>*</span></label>
            <select id="payment_method" className={styles.itemInput} {...register('payment_method', { required: 'Bắt buộc' })} disabled={isLoading}>
              <option value="cash">Tiền mặt</option>
              <option value="bank_transfer">Chuyển khoản</option>
              <option value="credit_card">Thẻ tín dụng</option>
            </select>
          </div>
        </div>

        <Input 
          label="Số Tiền" 
          type="number" 
          min="0"
          {...register('amount', { required: 'Bắt buộc', valueAsNumber: true, min: { value: 0, message: 'Số tiền tối thiểu là 0' }, validate: val => !isNaN(val) || 'Bắt buộc' })}
          error={errors.amount?.message}
          disabled={isLoading}
        />

        <Input 
          label="Ghi Chú" 
          {...register('remarks')}
          disabled={isLoading}
        />
      </form>
    </Modal>
  );
};

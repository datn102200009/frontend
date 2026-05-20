import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { usePostFinanceCashFlowsMutation } from '@entities/finance/api/financeApi';
import { useGetSalesInvoicesQuery } from '@entities/sales/api/salesApi';
import { useGetPurchasingInvoicesQuery } from '@entities/purchasing/api/purchasingApi';
import type { CashFlowInput } from '@entities/finance/model/types';
import { Modal } from '@shared/ui/Modal/Modal';
import { Button } from '@shared/ui/Button/Button';
import { Input } from '@shared/ui/Input/Input';
import styles from './CashFlowFormModal.module.css';

interface CashFlowFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultValues?: Partial<CashFlowInput>;
}

export const CashFlowFormModal: React.FC<CashFlowFormModalProps> = ({ open, onClose, onSuccess, defaultValues }) => {
  const [createTx, { isLoading }] = usePostFinanceCashFlowsMutation();
  const paymentType = defaultValues?.payment_type || 'receive';
  const isDirect = !!defaultValues?.sales_order_id || !!defaultValues?.purchase_order_id || !!defaultValues?.sales_invoice_id || !!defaultValues?.purchase_invoice_id;

  const { data: salesInvoices, isLoading: isLoadingSales } = useGetSalesInvoicesQuery(undefined, { skip: paymentType !== 'receive' || isDirect });
  const { data: purchaseInvoices, isLoading: isLoadingPurchasing } = useGetPurchasingInvoicesQuery(undefined, { skip: paymentType !== 'pay' || isDirect });

  const [hasInitialized, setHasInitialized] = useState(false);

  const { register, handleSubmit, reset } = useForm<CashFlowInput>({
    defaultValues: {
      payment_type: paymentType,
      amount: defaultValues?.amount || 0,
      payment_date: defaultValues?.payment_date || new Date().toISOString().split('T')[0],
      sales_invoice_id: defaultValues?.sales_invoice_id || null,
      purchase_invoice_id: defaultValues?.purchase_invoice_id || null,
      sales_order_id: defaultValues?.sales_order_id || null,
      purchase_order_id: defaultValues?.purchase_order_id || null,
      category: defaultValues?.category || 'bank_transfer',
      remarks: defaultValues?.remarks || ''
    }
  });

  useEffect(() => {
    if (isDirect) return;

    if (!hasInitialized) {
      if (paymentType === 'receive' && salesInvoices && salesInvoices.length > 0) {
        reset({
          payment_type: 'receive',
          amount: defaultValues?.amount || 0,
          payment_date: defaultValues?.payment_date || new Date().toISOString().split('T')[0],
          sales_invoice_id: salesInvoices[0].id || '',
          purchase_invoice_id: null,
          sales_order_id: null,
          purchase_order_id: null,
          category: defaultValues?.category || 'bank_transfer',
          remarks: defaultValues?.remarks || ''
        });
        setHasInitialized(true);
      } else if (paymentType === 'pay' && purchaseInvoices && purchaseInvoices.length > 0) {
        reset({
          payment_type: 'pay',
          amount: defaultValues?.amount || 0,
          payment_date: defaultValues?.payment_date || new Date().toISOString().split('T')[0],
          sales_invoice_id: null,
          purchase_invoice_id: purchaseInvoices[0].id || '',
          sales_order_id: null,
          purchase_order_id: null,
          category: defaultValues?.category || 'bank_transfer',
          remarks: defaultValues?.remarks || ''
        });
        setHasInitialized(true);
      }
    }
  }, [salesInvoices, purchaseInvoices, paymentType, reset, defaultValues, hasInitialized, isDirect]);

  const onSubmit = async (data: CashFlowInput) => {
    try {
      await createTx({ cashFlowInput: data }).unwrap();
      onSuccess();
    } catch (err) {
      console.error('Failed to record transaction', err);
    }
  };

  const isWorking = isLoading || isLoadingSales || isLoadingPurchasing;

  return (
    <Modal 
      open={open} 
      onClose={onClose} 
      title={defaultValues?.payment_type === 'receive' ? 'Ghi Nhận Thu Tiền' : 'Ghi Nhận Chi Tiền'}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isWorking}>Hủy</Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isLoading} disabled={isWorking}>Xác nhận</Button>
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
              defaultValues?.payment_type === 'receive' ? 'sales_invoice_id' : 'purchase_invoice_id'
            , { required: 'Bắt buộc' })} disabled={isWorking || isDirect}>
              {defaultValues?.sales_order_id ? (
                <option value={defaultValues.sales_order_id}>{defaultValues.sales_order_id.slice(0,8).toUpperCase()} (Đặt Cọc Bán)</option>
              ) : defaultValues?.purchase_order_id ? (
                <option value={defaultValues.purchase_order_id}>{defaultValues.purchase_order_id.slice(0,8).toUpperCase()} (Đặt Cọc Mua)</option>
              ) : defaultValues?.sales_invoice_id ? (
                <option value={defaultValues.sales_invoice_id}>{defaultValues.sales_invoice_id.slice(0,8).toUpperCase()} (Hóa Đơn Bán)</option>
              ) : defaultValues?.purchase_invoice_id ? (
                <option value={defaultValues.purchase_invoice_id}>{defaultValues.purchase_invoice_id.slice(0,8).toUpperCase()} (Hóa Đơn Mua)</option>
              ) : defaultValues?.payment_type === 'receive' ? (
                salesInvoices?.map(inv => inv.id ? (
                  <option key={inv.id} value={inv.id}>
                    {inv.id.slice(0,8).toUpperCase()} - {inv.customer_name || 'N/A'} ({new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(inv.total_amount || 0)})
                  </option>
                ) : null)
              ) : (
                purchaseInvoices?.map(inv => inv.id ? (
                  <option key={inv.id} value={inv.id}>
                    {inv.id.slice(0,8).toUpperCase()} - {inv.vendor_name || 'N/A'} ({new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(inv.total_amount || 0)})
                  </option>
                ) : null)
              )}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)', flex: 1 }}>
            <label htmlFor="category" style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--clr-text-secondary)' }}>Phương Thức <span style={{ color: 'var(--clr-danger)' }}>*</span></label>
            <select id="category" className={styles.itemInput} {...register('category', { required: 'Bắt buộc' })} disabled={isWorking}>
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
          {...register('amount', { required: true, valueAsNumber: true, min: 0 })}
          disabled={isWorking}
        />

        <Input 
          label="Ghi Chú" 
          {...register('remarks')}
          disabled={isWorking}
        />
      </form>
    </Modal>
  );
};

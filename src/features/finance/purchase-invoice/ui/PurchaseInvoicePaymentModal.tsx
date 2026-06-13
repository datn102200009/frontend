import React, { useState, useEffect } from 'react';
import { usePostFinanceInvoicesPurchaseByPkPayMutation } from '@entities/finance/api/financeApi';
import { Modal } from '@shared/ui/Modal/Modal';
import { Button } from '@shared/ui/Button/Button';
import { Input } from '@shared/ui/Input/Input';
import { useToast } from '@shared/ui/Toast/Toast';

interface PurchaseInvoicePaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  invoiceId: string;
  remainingAmount: number;
}

export const PurchaseInvoicePaymentModal: React.FC<PurchaseInvoicePaymentModalProps> = ({
  open,
  onClose,
  onSuccess,
  invoiceId,
  remainingAmount,
}) => {
  const [payAmount, setPayAmount] = useState<number>(remainingAmount);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer'>('bank_transfer');
  const [payError, setPayError] = useState('');
  
  const [payPurchaseInvoice, { isLoading }] = usePostFinanceInvoicesPurchaseByPkPayMutation();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setPayAmount(remainingAmount);
      setPaymentMethod('bank_transfer');
      setPayError('');
    }
  }, [open, remainingAmount]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayError('');

    if (payAmount <= 0) {
      setPayError('Số tiền thanh toán phải lớn hơn 0.');
      return;
    }
    if (payAmount > remainingAmount) {
      setPayError(`Số tiền thanh toán vượt quá số tiền còn nợ (${formatCurrency(remainingAmount)}).`);
      return;
    }

    try {
      await payPurchaseInvoice({
        pk: invoiceId,
        payInvoiceInput: {
          amount: payAmount,
          payment_method: paymentMethod,
        }
      }).unwrap();
      
      toast('success', 'Thanh toán hóa đơn mua hàng thành công');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const error = err as { data?: { detail?: string } };
      setPayError(error?.data?.detail || 'Thanh toán thất bại. Vui lòng kiểm tra lại.');
    }
  };

  return (
    <Modal 
      open={open} 
      onClose={onClose} 
      title="Thanh Toán Hóa Đơn Mua (AP)"
      size="md"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {payError && (
          <div style={{ padding: '12px', backgroundColor: '#fef2f2', color: 'var(--clr-danger, #ef4444)', borderRadius: '6px', fontSize: '14px' }}>
            {payError}
          </div>
        )}
        
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderBottom: '1px solid var(--clr-border, #e2e8f0)', paddingBottom: '8px' }}>
          <span>Số tiền còn nợ:</span>
          <strong style={{ color: 'var(--clr-danger, #ef4444)' }}>{formatCurrency(remainingAmount)}</strong>
        </div>

        <Input 
          label="Số tiền thanh toán (VND)" 
          type="number"
          value={payAmount}
          onChange={(e) => setPayAmount(Number(e.target.value))}
          required
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--clr-text-secondary, #475569)' }}>Phương thức thanh toán</label>
          <select 
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'bank_transfer')}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md, 8px)',
              border: '1.5px solid var(--clr-border, #e2e8f0)',
              backgroundColor: 'white',
              fontSize: '14px',
              outline: 'none'
            }}
          >
            <option value="bank_transfer">Chuyển khoản ngân hàng</option>
            <option value="cash">Tiền mặt</option>
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>Hủy</Button>
          <Button type="submit" loading={isLoading}>Xác nhận thanh toán</Button>
        </div>
      </form>
    </Modal>
  );
};

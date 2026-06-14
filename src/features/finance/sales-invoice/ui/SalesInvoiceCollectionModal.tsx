import React, { useState, useEffect } from 'react';
import { usePostFinanceInvoicesSalesByPkCollectMutation } from '@entities/finance/api/financeApi';
import { Modal } from '@shared/ui/Modal/Modal';
import { Button } from '@shared/ui/Button/Button';
import { Input } from '@shared/ui/Input/Input';
import { useToast } from '@shared/ui/Toast/Toast';

interface SalesInvoiceCollectionModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  invoiceId: string;
  remainingAmount: number;
  customerName?: string;
}

export const SalesInvoiceCollectionModal: React.FC<SalesInvoiceCollectionModalProps> = ({
  open,
  onClose,
  onSuccess,
  invoiceId,
  remainingAmount,
  customerName,
}) => {
  const [collectAmount, setCollectAmount] = useState<number>(remainingAmount);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer'>('bank_transfer');
  const [collectError, setCollectError] = useState('');
  
  const [collectSalesInvoice, { isLoading }] = usePostFinanceInvoicesSalesByPkCollectMutation();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setCollectAmount(remainingAmount);
      setPaymentMethod('bank_transfer');
      setCollectError('');
    }
  }, [open, remainingAmount]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCollectError('');

    if (collectAmount <= 0) {
      setCollectError('Số tiền thu phải lớn hơn 0.');
      return;
    }
    if (collectAmount > remainingAmount) {
      setCollectError(`Số tiền thu vượt quá số tiền còn nợ (${formatCurrency(remainingAmount)}).`);
      return;
    }

    try {
      await collectSalesInvoice({
        pk: invoiceId,
        collectInvoiceInput: {
          amount: collectAmount,
          payment_method: paymentMethod,
        }
      }).unwrap();
      
      toast('success', 'Thu tiền hóa đơn bán hàng thành công');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const error = err as { data?: { detail?: string } };
      setCollectError(error?.data?.detail || 'Giao dịch thất bại. Vui lòng kiểm tra lại.');
    }
  };

  return (
    <Modal 
      open={open} 
      onClose={onClose} 
      title="Thu Tiền Hóa Đơn Bán (AR)"
      size="md"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {collectError && (
          <div style={{ padding: '12px', backgroundColor: '#fef2f2', color: 'var(--clr-danger, #ef4444)', borderRadius: '6px', fontSize: '14px' }}>
            {collectError}
          </div>
        )}
        
        {customerName && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderBottom: '1px solid var(--clr-border, #e2e8f0)', paddingBottom: '8px' }}>
            <span>Khách hàng:</span>
            <strong>{customerName}</strong>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderBottom: '1px solid var(--clr-border, #e2e8f0)', paddingBottom: '8px' }}>
          <span>Số tiền còn nợ:</span>
          <strong style={{ color: 'var(--clr-danger, #ef4444)' }}>{formatCurrency(remainingAmount)}</strong>
        </div>

        <Input 
          label="Số tiền thu nợ (VND)" 
          type="number"
          value={collectAmount}
          onChange={(e) => setCollectAmount(Number(e.target.value))}
          required
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--clr-text-secondary, #475569)' }}>Phương thức thu tiền</label>
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
          <Button type="submit" loading={isLoading}>Xác nhận thu tiền</Button>
        </div>
      </form>
    </Modal>
  );
};

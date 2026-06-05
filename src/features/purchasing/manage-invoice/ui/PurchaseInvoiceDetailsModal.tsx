import React, { useState } from 'react';
import { 
  useGetPurchasingInvoicesByPkQuery,
  usePostPurchasingInvoicesByPkPayMutation,
  usePostPurchasingInvoicesByPkVerifyMutation
} from '@entities/purchasing/api/purchasingApi';
import { Modal } from '@shared/ui/Modal/Modal';
import { Button } from '@shared/ui/Button/Button';
import { Badge } from '@shared/ui/Badge/Badge';
import { Input } from '@shared/ui/Input/Input';
import { CreditCard, Printer, FileText, AlertTriangle, ShieldCheck, Check } from 'lucide-react';
import styles from './InvoiceDetailsModal.module.css';

interface PurchaseInvoiceDetailsModalProps {
  invoiceId: string;
  onClose: () => void;
}

export const PurchaseInvoiceDetailsModal: React.FC<PurchaseInvoiceDetailsModalProps> = ({ invoiceId, onClose }) => {
  const { data: invoice, isLoading, refetch } = useGetPurchasingInvoicesByPkQuery({ pk: invoiceId });
  const [payInvoice, { isLoading: isPaying }] = usePostPurchasingInvoicesByPkPayMutation();
  const [verifyMatching, { isLoading: isVerifying }] = usePostPurchasingInvoicesByPkVerifyMutation();

  const [showPayment, setShowPayment] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer'>('bank_transfer');
  const [payError, setPayError] = useState('');

  if (isLoading || !invoice) {
    return (
      <Modal open={true} onClose={onClose} title="Chi Tiết Hóa Đơn Mua" size="md">
        <div style={{ padding: 'var(--sp-6)', textAlign: 'center', color: 'var(--clr-text-muted)' }}>Đang tải dữ liệu...</div>
      </Modal>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const isPaid = invoice.status === 'paid';
  const totalAmount = invoice.total_amount || 0;
  const paidAmount = invoice.paid_amount || 0;
  const remainingAmount = totalAmount - paidAmount;

  const handleOpenPayment = () => {
    setPayAmount(remainingAmount);
    setPayError('');
    setShowPayment(true);
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
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
      await payInvoice({
        pk: invoiceId,
        payInvoiceInput: {
          amount: payAmount,
          payment_method: paymentMethod,
        }
      }).unwrap();
      setShowPayment(false);
      refetch();
    } catch (err: any) {
      setPayError(err?.data?.detail || 'Giao dịch thất bại. Vui lòng kiểm tra lại.');
    }
  };

  const handleVerify = async () => {
    try {
      await verifyMatching({ pk: invoiceId }).unwrap();
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Modal 
        open={!showPayment} 
        onClose={onClose} 
        title={`Hóa Đơn ${(invoice.id || '').slice(0, 8).toUpperCase()}`}
        size="lg"
        footer={
          <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-end', gap: '8px' }}>
            <Button variant="ghost" onClick={onClose}>Đóng</Button>
            {invoice.block_reason && (
              <Button 
                variant="outline" 
                onClick={handleVerify} 
                loading={isVerifying}
                icon={<ShieldCheck size={16} />}
              >
                Chạy lại Đối soát
              </Button>
            )}
            <Button variant="outline" icon={<Printer size={16} />}>In Hóa Đơn</Button>
            {!isPaid && (
              <Button 
                onClick={handleOpenPayment} 
                icon={<CreditCard size={16} />}
              >
                Thanh Toán Hóa Đơn
              </Button>
            )}
          </div>
        }
      >
        <div className={styles.container}>
          {/* Blocks & warning alerts */}
          {invoice.block_reason && (
            <div className={styles.blockAlert} style={{ borderColor: 'var(--clr-warning)', backgroundColor: '#fffdf5' }}>
              <AlertTriangle size={20} className={styles.blockIcon} style={{ color: 'var(--clr-warning)' }} />
              <div>
                <h4 className={styles.alertTitle} style={{ color: '#856404' }}>Cảnh báo đối soát (Matching Warnings)</h4>
                <p className={styles.alertDesc} style={{ color: '#856404' }}>
                  <strong>Lý do:</strong> {invoice.block_reason}
                </p>
              </div>
            </div>
          )}

          {invoice.qty_fulfillment_rate !== null && Number(invoice.qty_fulfillment_rate) !== 100 && (
            <div className={styles.mismatchAlert}>
              <AlertTriangle size={18} className={styles.mismatchIcon} />
              <div>
                <h4 className={styles.mismatchTitle}>Lưu ý: Chênh lệch số lượng nhận hàng</h4>
                <p className={styles.mismatchDesc}>
                  Số lượng thực tế nhập kho đạt <strong>{invoice.qty_fulfillment_rate}%</strong> so với đơn hàng yêu cầu. Chênh lệch số lượng được chấp nhận và lưu trữ làm cơ sở đánh giá chất lượng nhà cung cấp (Supplier Rating).
                </p>
              </div>
            </div>
          )}

          <div className={styles.headerInfo}>
            <div className={styles.infoGroup}>
              <span className={styles.label}>Nhà Cung Cấp</span>
              <span className={styles.value}>{invoice.vendor_name || 'Tech Component Supplier Ltd.'}</span>
            </div>
            <div className={styles.infoGroup}>
              <span className={styles.label}>Trạng Thái</span>
              <Badge variant={
                invoice.status === 'paid' ? 'success' : 
                invoice.status === 'partial' ? 'warning' : 
                invoice.status === 'blocked_for_payment' ? 'error' :
                invoice.status === 'cancelled' ? 'neutral' : 'error'
              }>
                {invoice.status === 'paid' ? 'Đã thanh toán' : 
                 invoice.status === 'partial' ? 'Thanh toán một phần' : 
                 invoice.status === 'blocked_for_payment' ? 'Bị Chặn Thanh Toán' :
                 invoice.status === 'cancelled' ? 'Đã Hủy' : 'Chưa thanh toán'}
              </Badge>
            </div>
            <div className={styles.infoGroup}>
              <span className={styles.label}>Hạn Thanh Toán (Due date)</span>
              <span className={styles.value}>{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('vi-VN') : 'Không có'}</span>
            </div>
            <div className={styles.infoGroup}>
              <span className={styles.label}>Đơn Hàng Gốc</span>
              <span className={styles.value} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FileText size={14} />
                {(invoice.order || '').slice(0, 8).toUpperCase()}
              </span>
            </div>
          </div>

          <div className={styles.summaryCards}>
            <div className={styles.card}>
              <span className={styles.cardTitle}>Tổng Tiền</span>
              <span className={styles.cardAmount}>{formatCurrency(totalAmount)}</span>
            </div>
            <div className={styles.card}>
              <span className={styles.cardTitle}>Đã Thanh Toán</span>
              <span className={styles.cardAmount} style={{ color: 'var(--clr-success)' }}>{formatCurrency(paidAmount)}</span>
            </div>
            <div className={styles.card}>
              <span className={styles.cardTitle}>Còn Nợ</span>
              <span className={styles.cardAmount} style={{ color: 'var(--clr-danger)' }}>{formatCurrency(remainingAmount)}</span>
            </div>
          </div>

          <div className={styles.itemsSection}>
            <h4 className={styles.itemsTitle}>Chi Tiết Mặt Hàng</h4>
            <div className={styles.itemsTable}>
              <div className={styles.tableHeader}>
                <span>Mặt Hàng</span>
                <span>Kiểm Định QC</span>
                <span style={{ textAlign: 'right' }}>Số Lượng</span>
                <span style={{ textAlign: 'right' }}>Tỷ lệ nhận</span>
                <span style={{ textAlign: 'right' }}>Đơn Giá</span>
                <span style={{ textAlign: 'right' }}>Thành Tiền</span>
              </div>
              {(invoice.lines || []).map((line, index) => (
                <div key={line.id || index} className={styles.tableRow}>
                   <span>{line.item_name || 'Linh Kiện'}</span>
                   <span style={{ display: 'inline-flex' }}>
                     {line.qc_status === 'PASSED' ? (
                       <Badge variant="success">Đạt (PASSED)</Badge>
                     ) : line.qc_status === 'FAILED' ? (
                       <Badge variant="error">Lỗi (FAILED)</Badge>
                     ) : (
                       <Badge variant="neutral">Chờ QC</Badge>
                     )}
                   </span>
                   <span style={{ textAlign: 'right' }}>{line.quantity}</span>
                   <span style={{ textAlign: 'right', fontWeight: 500, color: Number(line.qty_fulfillment_rate) === 100 ? 'var(--clr-success)' : 'var(--clr-warning)' }}>
                     {line.qty_fulfillment_rate !== null ? `${line.qty_fulfillment_rate}%` : '100%'}
                   </span>
                   <span style={{ textAlign: 'right' }}>{formatCurrency(line.unit_price || 0)}</span>
                   <span style={{ textAlign: 'right', fontWeight: 500 }}>{formatCurrency(line.line_total || 0)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Payment Processing Modal Overlay */}
      <Modal 
        open={showPayment} 
        onClose={() => setShowPayment(false)} 
        title="Thanh Toán Hóa Đơn Mua"
        size="md"
      >
        <form onSubmit={handlePaySubmit} className={styles.payForm}>
          {payError && <div className={styles.errorAlert}>{payError}</div>}
          
          <div className={styles.paymentSum}>
            <span>Số tiền còn nợ:</span>
            <strong>{formatCurrency(remainingAmount)}</strong>
          </div>

          <Input 
            label="Số tiền thanh toán (VND)" 
            type="number"
            value={payAmount}
            onChange={(e) => setPayAmount(Number(e.target.value))}
            required
          />

          <div className={styles.selectWrap}>
            <label className={styles.selectLabel}>Phương thức thanh toán</label>
            <select 
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className={styles.select}
            >
              <option value="bank_transfer">Chuyển khoản ngân hàng</option>
              <option value="cash">Tiền mặt</option>
            </select>
          </div>

          <div className={styles.payFooter}>
            <Button type="button" variant="secondary" onClick={() => setShowPayment(false)}>Hủy</Button>
            <Button type="submit" loading={isPaying} icon={<Check size={16} />}>Xác nhận thanh toán</Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

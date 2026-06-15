import React from 'react';
import { useGetFinanceInvoicesSalesByPkQuery } from '@entities/finance/api/financeApi';
import { Modal } from '@shared/ui/Modal/Modal';
import { Button } from '@shared/ui/Button/Button';
import { Badge } from '@shared/ui/Badge/Badge';
import { Printer, FileText } from 'lucide-react';
import styles from './InvoiceDetailsModal.module.css';
import { shortId } from '@shared/lib/shortId';

interface SalesInvoiceDetailsModalProps {
  invoiceId: string;
  onClose: () => void;
}

export const SalesInvoiceDetailsModal: React.FC<SalesInvoiceDetailsModalProps> = ({ invoiceId, onClose }) => {
  const { data: invoice, isLoading } = useGetFinanceInvoicesSalesByPkQuery({ pk: invoiceId });

  if (isLoading || !invoice) {
    return (
      <Modal open={true} onClose={onClose} title="Chi Tiết Hóa Đơn Bán" size="md">
        <div style={{ padding: 'var(--sp-6)', textAlign: 'center', color: 'var(--clr-text-muted)' }}>Đang tải dữ liệu...</div>
      </Modal>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const totalAmount = invoice.total_amount || 0;
  const paidAmount = invoice.paid_amount || 0;
  const remainingAmount = totalAmount - paidAmount;

  return (
    <>
      <Modal 
        open={true} 
        onClose={onClose} 
        title={`Hóa Đơn ${shortId(invoice.id)}`}
        size="lg"
        footer={
          <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-end', gap: '8px' }}>
            <Button variant="ghost" onClick={onClose}>Đóng</Button>
            <Button variant="outline" icon={<Printer size={16} />}>In Hóa Đơn</Button>
          </div>
        }
      >
        <div className={styles.container}>
          <div className={styles.headerInfo}>
            <div className={styles.infoGroup}>
              <span className={styles.label}>Khách Hàng</span>
              <span className={styles.value}>{invoice.customer_name || 'Khách Hàng'}</span>
            </div>
            <div className={styles.infoGroup}>
              <span className={styles.label}>Trạng Thái</span>
              <Badge variant={
                invoice.status === 'paid' ? 'success' : 
                invoice.status === 'partial' ? 'warning' : 
                invoice.status === 'cancelled' ? 'neutral' : 'error'
              }>
                {invoice.status === 'paid' ? 'Đã thu tiền' : 
                 invoice.status === 'partial' ? 'Thu một phần' : 
                 invoice.status === 'cancelled' ? 'Đã Hủy' : 'Chưa thanh toán'}
              </Badge>
            </div>
            <div className={styles.infoGroup}>
              <span className={styles.label}>Ngày Tạo</span>
              <span className={styles.value}>{new Date(invoice.created_at || '').toLocaleDateString('vi-VN')}</span>
            </div>
            <div className={styles.infoGroup}>
              <span className={styles.label}>Đơn Hàng Gốc</span>
              <span className={styles.value} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FileText size={14} />
                {shortId(invoice.order)}
              </span>
            </div>
          </div>

          <div className={styles.summaryCards}>
            <div className={styles.card}>
              <span className={styles.cardTitle}>Tổng Tiền</span>
              <span className={styles.cardAmount}>{formatCurrency(totalAmount)}</span>
            </div>
            <div className={styles.card}>
              <span className={styles.cardTitle}>Đã Thu</span>
              <span className={styles.cardAmount} style={{ color: 'var(--clr-success)' }}>{formatCurrency(paidAmount)}</span>
            </div>
            <div className={styles.card}>
              <span className={styles.cardTitle}>Còn Nợ</span>
              <span className={styles.cardAmount} style={{ color: 'var(--clr-danger)' }}>{formatCurrency(remainingAmount)}</span>
            </div>
          </div>

          <div className={styles.itemsSection}>
            <h4 className={styles.itemsTitle}>Chi Tiết Sản Phẩm</h4>
            <div className={styles.itemsTable}>
              <div className={styles.tableHeader}>
                <span>Sản Phẩm</span>
                <span style={{ textAlign: 'right' }}>Số Lượng</span>
                <span style={{ textAlign: 'right' }}>Đơn Giá</span>
                <span style={{ textAlign: 'right' }}>VAT</span>
                <span style={{ textAlign: 'right' }}>Thành Tiền</span>
              </div>
              {(invoice.lines || []).map((line, index) => (
                <div key={line.id || index} className={styles.tableRow}>
                  <span>{line.item_name || 'Sản phẩm'}</span>
                  <span style={{ textAlign: 'right' }}>{line.quantity}</span>
                  <span style={{ textAlign: 'right' }}>{formatCurrency(line.unit_price || 0)}</span>
                  <span style={{ textAlign: 'right' }}>{formatCurrency(line.vat_tax || 0)}</span>
                  <span style={{ textAlign: 'right', fontWeight: 500 }}>{formatCurrency(line.line_total || 0)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

import React from 'react';

interface InvoiceStatusFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export const InvoiceStatusFilter: React.FC<InvoiceStatusFilterProps> = ({ value, onChange }) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: '6px 12px',
        border: '1.5px solid var(--clr-border, #e2e8f0)',
        borderRadius: 'var(--radius-md, 8px)',
        fontSize: 'var(--fs-sm, 14px)',
        backgroundColor: 'var(--clr-surface, #ffffff)',
        color: 'var(--clr-text, #0f172a)',
        outline: 'none',
        cursor: 'pointer',
        transition: 'border-color var(--duration-fast) ease',
      }}
      onFocus={(e) => {
        e.target.style.borderColor = 'var(--clr-primary-400, #3b82f6)';
      }}
      onBlur={(e) => {
        e.target.style.borderColor = 'var(--clr-border, #e2e8f0)';
      }}
    >
      <option value="unpaid,partial">Chưa hoàn tất</option>
      <option value="">Tất cả</option>
      <option value="unpaid">Chưa thanh toán</option>
      <option value="partial">Thanh toán một phần</option>
      <option value="paid">Đã thanh toán</option>
      <option value="cancelled">Đã hủy</option>
    </select>
  );
};

import React from 'react';

interface SalesOrderStatusFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export const SalesOrderStatusFilter: React.FC<SalesOrderStatusFilterProps> = ({ value, onChange }) => {
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
      <option value="">Tất cả trạng thái</option>
      <option value="draft">Nháp</option>
      <option value="pending">Đang hoạt động</option>
      <option value="pending_credit_approval">Chờ duyệt tín dụng</option>
      <option value="paid_unshipped">Chờ giao hàng (Đã TT)</option>
      <option value="shipped_unpaid">Chờ thanh toán (Đã giao)</option>
      <option value="completed">Hoàn thành</option>
      <option value="cancelled">Đã hủy</option>
    </select>
  );
};

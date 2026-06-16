import React, { useMemo } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { DataTable } from '@shared/ui/DataTable/DataTable';
import { Badge } from '@shared/ui/Badge/Badge';
import { TableActions, ActionButton } from '@shared/ui/TableActions/TableActions';
import type { PurchaseInvoice } from '@entities/finance/api/financeApi';
import { Eye, CreditCard } from 'lucide-react';
import { shortId } from '@shared/lib/shortId';

interface PurchaseInvoiceTableProps {
  data: PurchaseInvoice[];
  loading: boolean;
  onView?: (id: string) => void;
  onPay?: (invoice: { id: string; amount: number }) => void;
  filterSlot?: React.ReactNode;
}

export const PurchaseInvoiceTable: React.FC<PurchaseInvoiceTableProps> = ({ 
  data, 
  loading, 
  onView, 
  onPay,
  filterSlot
}) => {
  const columns = useMemo(() => {
    const helper = createColumnHelper<PurchaseInvoice>();
    return [
      helper.accessor('id', {
        header: 'Mã Hóa Đơn',
        cell: (info) => <span className="font-medium text-slate-900">{shortId(info.getValue())}</span>,
      }),
      helper.accessor('order', {
        header: 'Tham Chiếu Đơn',
        cell: (info) => <span className="text-slate-500">{shortId(info.getValue())}</span>,
      }),
      helper.accessor('vendor_name', {
        header: 'Nhà Cung Cấp',
        cell: (info) => info.getValue() || 'Unknown',
      }),
      helper.accessor('total_amount', {
        header: 'Tổng Tiền',
        cell: (info) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(info.getValue() || 0),
      }),
      helper.accessor('paid_amount', {
        header: 'Đã Thanh Toán',
        cell: (info) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(info.getValue() || 0),
      }),
      helper.display({
        id: 'remaining',
        header: 'Còn Nợ',
        cell: (info) => {
          const inv = info.row.original;
          const remaining = (inv.total_amount || 0) - (inv.paid_amount || 0);
          return <span className="text-rose-600 font-medium">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(remaining)}</span>;
        },
      }),
      helper.accessor('due_date', {
        header: 'Hạn Thanh Toán',
        cell: (info) => {
          const val = info.getValue();
          return val ? new Date(val).toLocaleDateString('vi-VN') : 'Không có';
        },
      }),
      helper.accessor('status', {
        header: 'Trạng Thái',
        cell: (info) => {
          const status = info.getValue() || 'unpaid';
          const colorMap: Record<string, 'neutral' | 'success' | 'error' | 'warning' | 'info'> = {
            unpaid: 'error',
            partial: 'warning',
            paid: 'success',
            blocked_for_payment: 'error',
            cancelled: 'neutral',
          };
          const labelMap: Record<string, string> = {
            unpaid: 'Chưa Thanh Toán',
            partial: 'Thanh Toán Một Phần',
            paid: 'Đã Thanh Toán',
            blocked_for_payment: 'Bị Chặn Thanh Toán',
            cancelled: 'Đã Hủy',
          };
          return <Badge variant={colorMap[status] || 'neutral'}>{labelMap[status] || status.toUpperCase()}</Badge>;
        },
      }),
      helper.display({
        id: 'actions',
        header: 'Thao Tác',
        size: 100,
        enableSorting: false,
        cell: (info) => {
          const inv = info.row.original;
          const remaining = (inv.total_amount || 0) - (inv.paid_amount || 0);
          const showPay = inv.status === 'unpaid' || inv.status === 'partial';
          return (
            <TableActions>
              <ActionButton icon={<Eye size={15} />} title="Xem chi tiết" onClick={() => onView?.(inv.id!)} />
              {showPay && onPay && (
                <ActionButton 
                  icon={<CreditCard size={15} />} 
                  title="Thanh toán" 
                  onClick={() => onPay({ id: inv.id!, amount: remaining })} 
                />
              )}
            </TableActions>
          );
        },
      })
    ];
  }, [onView, onPay]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <DataTable 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        columns={columns as any} 
        data={data} 
        loading={loading}
        searchPlaceholder="Tìm kiếm hóa đơn mua..."
        emptyMessage="Không tìm thấy hóa đơn mua hàng nào"
        filterSlot={filterSlot}
      />
    </div>
  );
};

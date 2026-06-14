import React, { useMemo } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { DataTable } from '@shared/ui/DataTable/DataTable';
import { Badge } from '@shared/ui/Badge/Badge';
import { TableActions, ActionButton } from '@shared/ui/TableActions/TableActions';
import type { SalesInvoice } from '@entities/finance/api/financeApi';
import { Eye, Printer, DollarSign } from 'lucide-react';

interface SalesInvoiceTableProps {
  data: SalesInvoice[];
  loading: boolean;
  onView?: (id: string) => void;
  onCollect?: (invoice: { id: string; amount: number; name?: string }) => void;
}

export const SalesInvoiceTable: React.FC<SalesInvoiceTableProps> = ({ 
  data, 
  loading, 
  onView, 
  onCollect 
}) => {
  const columns = useMemo(() => {
    const helper = createColumnHelper<SalesInvoice>();
    return [
      helper.accessor('id', {
        header: 'Mã Hóa Đơn',
        cell: (info) => <span className="font-medium text-slate-900">{(info.getValue() || '').slice(0, 8).toUpperCase()}</span>,
      }),
      helper.accessor('order', {
        header: 'Tham Chiếu Đơn',
        cell: (info) => <span className="text-slate-500">{(info.getValue() || '').slice(0, 8).toUpperCase()}</span>,
      }),
      helper.accessor('customer_name', {
        header: 'Khách Hàng',
        cell: (info) => info.getValue() || 'Unknown',
      }),
      helper.accessor('total_amount', {
        header: 'Tổng Tiền',
        cell: (info) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(info.getValue() || 0),
      }),
      helper.accessor('paid_amount', {
        header: 'Đã Thu',
        cell: (info) => <span className="text-emerald-700 font-medium">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(info.getValue() || 0)}</span>,
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
      helper.accessor('created_at', {
        header: 'Ngày Tạo',
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
            cancelled: 'neutral',
          };
          const labelMap: Record<string, string> = {
            unpaid: 'Chưa Thanh Toán',
            partial: 'Thanh Toán Một Phần',
            paid: 'Đã Thanh Toán',
            cancelled: 'Đã Hủy',
          };
          return <Badge variant={colorMap[status] || 'neutral'}>{labelMap[status] || status.toUpperCase()}</Badge>;
        },
      }),
      helper.display({
        id: 'actions',
        header: 'Thao Tác',
        size: 150,
        enableSorting: false,
        cell: (info) => {
          const inv = info.row.original;
          const remaining = (inv.total_amount || 0) - (inv.paid_amount || 0);
          const showCollect = inv.status === 'unpaid' || inv.status === 'partial';
          return (
            <TableActions>
              <ActionButton icon={<Eye size={15} />} title="Xem chi tiết" onClick={() => onView?.(inv.id!)} />
              {showCollect && onCollect && (
                <ActionButton 
                  icon={<DollarSign size={15} />} 
                  title="Thu tiền" 
                  onClick={() => onCollect({ id: inv.id!, amount: remaining, name: inv.customer_name })} 
                />
              )}
              <ActionButton icon={<Printer size={15} />} title="In hóa đơn" />
            </TableActions>
          );
        },
      })
    ];
  }, [onView, onCollect]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <DataTable 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        columns={columns as any} 
        data={data} 
        loading={loading}
        searchPlaceholder="Tìm kiếm hóa đơn bán..."
        emptyMessage="Không tìm thấy hóa đơn nào"
      />
    </div>
  );
};

import React, { useMemo } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { DataTable } from '@shared/ui/DataTable/DataTable';
import { Badge } from '@shared/ui/Badge/Badge';
import { TableActions, ActionButton } from '@shared/ui/TableActions/TableActions';
import { useGetSalesInvoicesQuery } from '@entities/sales/api/salesApi';
import type { SalesInvoice } from '@entities/sales/model/types';
import { Eye, Printer } from 'lucide-react';

interface SalesInvoiceTableProps {
  onView?: (id: string) => void;
}

export const SalesInvoiceTable: React.FC<SalesInvoiceTableProps> = ({ onView }) => {
  const { data: invoices = [], isLoading } = useGetSalesInvoicesQuery();

  const columns = useMemo(() => {
    const helper = createColumnHelper<SalesInvoice>();
    return [
      helper.accessor('id', {
        header: 'Mã Hóa Đơn',
        cell: (info) => <span className="font-medium text-slate-900">{info.getValue().slice(0, 8).toUpperCase()}</span>,
      }),
      helper.accessor('order', {
        header: 'Tham Chiếu Đơn',
        cell: (info) => <span className="text-slate-500">{info.getValue().slice(0, 8).toUpperCase()}</span>,
      }),
      helper.accessor('customer_name', {
        header: 'Khách Hàng',
        cell: (info) => info.getValue() || 'Unknown',
      }),
      helper.accessor('total_amount', {
        header: 'Tổng Tiền',
        cell: (info) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(info.getValue()),
      }),
      helper.accessor('paid_amount', {
        header: 'Đã Thanh Toán',
        cell: (info) => <span className="text-emerald-700 font-medium">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(info.getValue())}</span>,
      }),
      helper.accessor('status', {
        header: 'Trạng Thái',
        cell: (info) => {
          const status = info.getValue();
          const colorMap: Record<string, 'neutral' | 'success' | 'error' | 'warning' | 'info'> = {
            unpaid: 'error',
            partial: 'warning',
            paid: 'success',
            cancelled: 'neutral',
          };
          return <Badge variant={colorMap[status] || 'neutral'}>{status.toUpperCase()}</Badge>;
        },
      }),
      helper.display({
        id: 'actions',
        header: 'Thao Tác',
        size: 100,
        enableSorting: false,
        cell: (info) => {
          const inv = info.row.original;
          return (
            <TableActions>
              <ActionButton icon={<Eye size={15} />} title="Xem chi tiết" onClick={() => onView?.(inv.id)} />
              <ActionButton icon={<Printer size={15} />} title="In hóa đơn" />
            </TableActions>
          );
        },
      })
    ];
  }, [onView]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <DataTable 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        columns={columns as any} 
        data={invoices} 
        loading={isLoading}
        searchPlaceholder="Tìm kiếm hóa đơn..."
        emptyMessage="Không tìm thấy hóa đơn nào"
      />
    </div>
  );
};

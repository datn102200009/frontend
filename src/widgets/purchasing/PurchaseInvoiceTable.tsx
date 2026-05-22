import React, { useMemo } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { DataTable } from '@shared/ui/DataTable/DataTable';
import { Badge } from '@shared/ui/Badge/Badge';
import { TableActions, ActionButton } from '@shared/ui/TableActions/TableActions';
import { useGetPurchasingInvoicesQuery } from '@entities/purchasing/api/purchasingApi';
import type { PurchaseInvoice } from '@entities/purchasing/model/types';
import { Eye, Printer } from 'lucide-react';

interface PurchaseInvoiceTableProps {
  onView?: (id: string) => void;
}

export const PurchaseInvoiceTable: React.FC<PurchaseInvoiceTableProps> = ({ onView }) => {
  const { data: invoices = [], isLoading } = useGetPurchasingInvoicesQuery();

  const columns = useMemo(() => {
    const helper = createColumnHelper<PurchaseInvoice>();
    return [
      helper.accessor('id', {
        header: 'Mã Hóa Đơn',
        cell: (info) => <span className="font-medium text-slate-900">{info.getValue().slice(0, 8).toUpperCase()}</span>,
      }),
      helper.accessor('order', {
        header: 'Tham Chiếu Đơn',
        cell: (info) => <span className="text-slate-500">{info.getValue().slice(0, 8).toUpperCase()}</span>,
      }),
      helper.accessor('vendor_name', {
        header: 'Nhà Cung Cấp',
        cell: (info) => info.getValue() || 'Unknown',
      }),
      helper.accessor('total_amount', {
        header: 'Tổng Tiền',
        cell: (info) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(info.getValue()),
      }),
      helper.accessor('paid_amount', {
        header: 'Đã Thanh Toán',
        cell: (info) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(info.getValue()),
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

import React, { useMemo } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { DataTable } from '@shared/ui/DataTable/DataTable';
import { Badge } from '@shared/ui/Badge/Badge';
import { TableActions, ActionButton } from '@shared/ui/TableActions/TableActions';
import { useGetSalesOrdersQuery } from '@entities/sales/api/salesApi';
import type { SalesOrder } from '@entities/sales/model/types';
import { Eye, Printer } from 'lucide-react';

interface SalesOrderTableProps {
  onView?: (id: string) => void;
}

export const SalesOrderTable: React.FC<SalesOrderTableProps> = ({ onView }) => {
  const { data: orders = [], isLoading } = useGetSalesOrdersQuery();

  const columns = useMemo(() => {
    const helper = createColumnHelper<SalesOrder>();
    return [
      helper.accessor('id', {
        header: 'Mã Đơn',
        cell: (info) => <span className="font-medium text-blue-900">{info.getValue().slice(0, 8).toUpperCase()}</span>,
      }),
      helper.accessor('customer_name', {
        header: 'Khách Hàng',
        cell: (info) => <span className="font-medium">{info.getValue() || 'Unknown'}</span>,
      }),
      helper.accessor('total_amount', {
        header: 'Tổng Tiền',
        cell: (info) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(info.getValue()),
      }),
      helper.accessor('status', {
        header: 'Trạng Thái',
        cell: (info) => {
          const status = info.getValue() || 'draft';
          const labelMap: Record<string, string> = {
            draft: 'Nháp',
            pending: 'Đang hoạt động',
            pending_credit_approval: 'Chờ duyệt tín dụng',
            paid_unshipped: 'Chờ giao hàng',
            shipped_unpaid: 'Chờ thanh toán',
            completed: 'Hoàn thành',
            cancelled: 'Đã hủy',
          };
          const colorMap: Record<string, 'neutral' | 'success' | 'error' | 'warning' | 'info'> = {
            draft: 'neutral',
            pending: 'info',
            pending_credit_approval: 'error',
            paid_unshipped: 'warning',
            shipped_unpaid: 'warning',
            completed: 'success',
            cancelled: 'error',
          };
          return <Badge variant={colorMap[status] || 'neutral'}>{labelMap[status] || status.toUpperCase()}</Badge>;
        },
      }),
      helper.accessor('created_at', {
        header: 'Ngày Tạo',
        cell: (info) => new Date(info.getValue()).toLocaleDateString('vi-VN'),
      }),
      helper.display({
        id: 'actions',
        header: 'Thao Tác',
        size: 140,
        enableSorting: false,
        cell: ({ row }) => (
          <TableActions>
            <ActionButton icon={<Eye size={15} />} title="Xem chi tiết" onClick={() => onView?.(row.original.id)} />
            <ActionButton icon={<Printer size={15} />} title="In đơn hàng" />
          </TableActions>
        ),
      }),
    ];
  }, [onView]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <DataTable 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        columns={columns as any} 
        data={orders} 
        loading={isLoading}
        searchPlaceholder="Tìm kiếm đơn bán hàng..."
        emptyMessage="Không tìm thấy đơn bán hàng nào"
      />
    </div>
  );
};

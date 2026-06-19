import React, { useMemo } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { DataTable } from '@shared/ui/DataTable/DataTable';
import { Badge } from '@shared/ui/Badge/Badge';
import { TableActions, ActionButton } from '@shared/ui/TableActions/TableActions';
import { useGetSalesOrdersQuery } from '@entities/sales/api/salesApi';
import type { SalesOrder } from '@entities/sales/model/types';
import { Eye } from 'lucide-react';
import { useSalesOrderFilters } from '@entities/sales/lib/useSalesOrderFilters';
import { SalesOrderStatusFilter } from '@entities/sales/ui/SalesOrderStatusFilter';
import { shortId } from '@shared/lib/shortId';
import { formatVND } from '@shared/lib/formatVND';

interface SalesOrderTableProps {
  onView?: (id: string) => void;
}

export const SalesOrderTable: React.FC<SalesOrderTableProps> = ({ onView }) => {
  const { data: orders = [], isLoading } = useGetSalesOrdersQuery();
  const { status, search, setStatus, setSearch } = useSalesOrderFilters();

  const filteredOrders = useMemo(() => {
    if (!status) return orders;
    return orders.filter((o) => o.status === status);
  }, [orders, status]);

  const columns = useMemo(() => {
    const helper = createColumnHelper<SalesOrder>();
    return [
      helper.accessor('id', {
        header: 'Mã Đơn',
        cell: (info) => <span className="font-medium text-blue-900">{shortId(info.getValue())}</span>,
      }),
      helper.accessor('customer_name', {
        header: 'Khách Hàng',
        cell: (info) => <span className="font-medium">{info.getValue() || 'Unknown'}</span>,
      }),
      helper.accessor('total_amount', {
        header: 'Tổng Tiền',
        cell: (info) => formatVND(info.getValue()),
      }),
      helper.accessor('receipt_fulfillment_rate', {
        header: 'Giao Hàng',
        cell: (info) => {
          const val = Number(info.getValue() || 0);
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '120px' }}>
              <div style={{ flex: 1, backgroundColor: 'var(--clr-border)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    backgroundColor: 'var(--clr-success)', 
                    height: '100%', 
                    width: `${Math.min(val, 100)}%`,
                    transition: 'width 0.3s ease'
                  }} 
                />
              </div>
              <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 'var(--fw-semibold)', color: 'var(--clr-text-secondary)', minWidth: '32px', textAlign: 'right' }}>
                {val}%
              </span>
            </div>
          );
        },
      }),
      helper.accessor('payment_fulfillment_rate', {
        header: 'Thanh Toán',
        cell: (info) => {
          const val = Number(info.getValue() || 0);
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '120px' }}>
              <div style={{ flex: 1, backgroundColor: 'var(--clr-border)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    backgroundColor: 'var(--clr-primary)', 
                    height: '100%', 
                    width: `${Math.min(val, 100)}%`,
                    transition: 'width 0.3s ease'
                  }} 
                />
              </div>
              <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 'var(--fw-semibold)', color: 'var(--clr-text-secondary)', minWidth: '32px', textAlign: 'right' }}>
                {val}%
              </span>
            </div>
          );
        },
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
        size: 100,
        enableSorting: false,
        cell: ({ row }) => (
          <TableActions>
            <ActionButton icon={<Eye size={15} />} title="Xem chi tiết" onClick={() => onView?.(row.original.id)} />
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
        data={filteredOrders} 
        loading={isLoading}
        searchPlaceholder="Tìm kiếm đơn bán hàng..."
        emptyMessage="Không tìm thấy đơn bán hàng nào"
        initialSearch={search}
        onSearch={setSearch}
        filterSlot={<SalesOrderStatusFilter value={status} onChange={setStatus} />}
      />
    </div>
  );
};

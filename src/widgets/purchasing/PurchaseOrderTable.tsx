import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import { DataTable } from '@shared/ui/DataTable/DataTable';
import { Badge } from '@shared/ui/Badge/Badge';
import { TableActions, ActionButton } from '@shared/ui/TableActions/TableActions';
import { useGetPurchasingOrdersQuery } from '@entities/purchasing/api/purchasingApi';
import type { PurchaseOrder } from '@entities/purchasing/model/types';
import { Eye, Edit, Printer } from 'lucide-react';

interface PurchaseOrderTableProps {
  onView?: (id: string) => void;
  onEdit?: (order: PurchaseOrder) => void;
}

export const PurchaseOrderTable: React.FC<PurchaseOrderTableProps> = ({ onView, onEdit }) => {
  const { data: orders = [], isLoading } = useGetPurchasingOrdersQuery();
  const [searchParams] = useSearchParams();
  const statusFilter = searchParams.get('status');

  const filteredOrders = useMemo(() => {
    if (!statusFilter) return orders;
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  const columns = useMemo(() => {
    const helper = createColumnHelper<PurchaseOrder>();
    return [
      helper.accessor('id', {
        header: 'Mã Đơn',
        cell: (info) => <span className="font-medium text-indigo-900">{info.getValue().slice(0, 8).toUpperCase()}</span>,
      }),
      helper.accessor('vendor_name', {
        header: 'Nhà Cung Cấp',
        cell: (info) => info.getValue() || 'Unknown Vendor',
      }),
      helper.accessor('total_amount', {
        header: 'Tổng Tiền',
        cell: (info) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(info.getValue()),
      }),
      helper.accessor('expected_delivery_date', {
        header: 'Hẹn Giao',
        cell: (info) => {
          const val = info.getValue();
          return val ? new Date(val as string).toLocaleDateString('vi-VN') : '—';
        },
      }),
      helper.accessor('receipt_fulfillment_rate', {
        header: 'Nhập Kho',
        cell: (info) => {
          const val = Number(info.getValue() || 0);
          return (
            <div className="flex items-center gap-2 min-w-[100px]">
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-300" 
                  style={{ width: `${Math.min(val, 100)}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-slate-700">{val}%</span>
            </div>
          );
        },
      }),
      helper.accessor('payment_fulfillment_rate', {
        header: 'Thanh Toán',
        cell: (info) => {
          const val = Number(info.getValue() || 0);
          return (
            <div className="flex items-center gap-2 min-w-[100px]">
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full transition-all duration-300" 
                  style={{ width: `${Math.min(val, 100)}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-slate-700">{val}%</span>
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
            paid_unshipped: 'Chờ giao hàng',
            shipped_unpaid: 'Chờ thanh toán',
            completed: 'Hoàn thành',
            cancelled: 'Đã hủy',
          };
          const colorMap: Record<string, 'neutral' | 'success' | 'error' | 'warning' | 'info'> = {
            draft: 'neutral',
            pending: 'info',
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
        cell: (info) => {
          const order = info.row.original;
          return (
            <TableActions>
              <ActionButton icon={<Eye size={15} />} title="Xem chi tiết" onClick={() => onView?.(order.id)} />
              {order.status === 'draft' && (
                <ActionButton icon={<Edit size={15} />} title="Chỉnh sửa" onClick={() => onEdit?.(order)} />
              )}
              <ActionButton icon={<Printer size={15} />} title="In đơn hàng" />
            </TableActions>
          );
        },
      })
    ];
  }, [onView, onEdit]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <DataTable 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        columns={columns as any} 
        data={filteredOrders} 
        loading={isLoading}
        searchPlaceholder="Tìm kiếm đơn mua hàng..."
        emptyMessage="Không tìm thấy đơn mua hàng nào"
      />
    </div>
  );
};

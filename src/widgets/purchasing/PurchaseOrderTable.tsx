import React, { useMemo } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { DataTable } from '@shared/ui/DataTable/DataTable';
import { Badge } from '@shared/ui/Badge/Badge';
import { TableActions, ActionButton } from '@shared/ui/TableActions/TableActions';
import { useGetPurchasingOrdersQuery } from '@entities/purchasing/api/purchasingApi';
import type { PurchaseOrder } from '@entities/purchasing/model/types';
import { Eye, Edit } from 'lucide-react';
import { usePurchaseOrderFilters } from '@entities/purchasing/lib/usePurchaseOrderFilters';
import { PurchaseOrderStatusFilter } from '@entities/purchasing/ui/PurchaseOrderStatusFilter';
import { shortId } from '@shared/lib/shortId';
import { formatVND } from '@shared/lib/formatVND';

interface PurchaseOrderTableProps {
  onView?: (id: string) => void;
  onEdit?: (order: PurchaseOrder) => void;
}

export const PurchaseOrderTable: React.FC<PurchaseOrderTableProps> = ({ onView, onEdit }) => {
  const { data: orders = [], isLoading } = useGetPurchasingOrdersQuery();
  const { status, search, setStatus, setSearch } = usePurchaseOrderFilters();

  const filteredOrders = useMemo(() => {
    if (!status) return orders;
    return orders.filter((o) => o.status === status);
  }, [orders, status]);

  const columns = useMemo(() => {
    const helper = createColumnHelper<PurchaseOrder>();
    return [
      helper.accessor('id', {
        header: 'Mã Đơn',
        cell: (info) => <span className="font-medium text-indigo-900">{shortId(info.getValue())}</span>,
      }),
      helper.accessor('vendor_name', {
        header: 'Nhà Cung Cấp',
        cell: (info) => info.getValue() || 'Unknown Vendor',
      }),
      helper.accessor('total_amount', {
        header: 'Tổng Tiền',
        cell: (info) => formatVND(info.getValue()),
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
            paid_unshipped: 'Chờ nhập kho',
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
        size: 100,
        cell: (info) => {
          const order = info.row.original;
          return (
            <TableActions>
              <ActionButton icon={<Eye size={15} />} title="Xem chi tiết" onClick={() => onView?.(order.id)} />
              {order.status === 'draft' && (
                <ActionButton icon={<Edit size={15} />} title="Chỉnh sửa" onClick={() => onEdit?.(order)} />
              )}
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
        initialSearch={search}
        onSearch={setSearch}
        filterSlot={<PurchaseOrderStatusFilter value={status} onChange={setStatus} />}
      />
    </div>
  );
};

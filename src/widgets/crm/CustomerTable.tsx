import React, { useMemo } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { DataTable } from '@shared/ui/DataTable/DataTable';
import { Badge } from '@shared/ui/Badge/Badge';
import { TableActions, ActionButton } from '@shared/ui/TableActions/TableActions';
import { useGetCrmCustomersQuery } from '@entities/crm/api/crmApi';
import type { Customer } from '@entities/crm/model/types';
import { Eye, Edit } from 'lucide-react';

interface CustomerTableProps {
  onView?: (id: string) => void;
  onEdit?: (customer: Customer) => void;
}

export const CustomerTable: React.FC<CustomerTableProps> = ({ onView, onEdit }) => {
  const { data: customers = [], isLoading } = useGetCrmCustomersQuery();

  const columns = useMemo(() => {
    const helper = createColumnHelper<Customer>();
    return [
      helper.accessor('name', {
        header: 'Mã KH',
        cell: (info) => <span className="font-semibold text-slate-800">{info.getValue()}</span>,
      }),
      helper.accessor('customer_name', {
        header: 'Tên Khách Hàng',
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
      }),
      helper.accessor('customer_group', {
        header: 'Nhóm Khách Hàng',
        cell: (info) => {
          const group = info.getValue() || 'Commercial';
          const labelMap: Record<string, string> = {
            Commercial: 'Doanh Nghiệp',
            Individual: 'Cá Nhân',
            Government: 'Chính Phủ',
          };
          const colorMap: Record<string, 'info' | 'success' | 'warning'> = {
            Commercial: 'info',
            Individual: 'success',
            Government: 'warning',
          };
          return <Badge variant={colorMap[group] || 'info'}>{labelMap[group] || group}</Badge>;
        },
      }),
      helper.accessor('contact_email', {
        header: 'Email',
        cell: (info) => info.getValue() || '-',
      }),
      helper.accessor('contact_phone', {
        header: 'Số Điện Thoại',
        cell: (info) => info.getValue() || '-',
      }),
      helper.accessor('address', {
        header: 'Địa Chỉ',
        cell: (info) => <span className="truncate max-w-[200px] inline-block">{info.getValue() || '-'}</span>,
      }),
      helper.display({
        id: 'actions',
        header: 'Thao Tác',
        size: 100,
        cell: (info) => {
          const customer = info.row.original;
          return (
            <TableActions>
              <ActionButton icon={<Eye size={15} />} title="Xem chi tiết" onClick={() => onView?.(customer.id)} />
              <ActionButton icon={<Edit size={15} />} title="Chỉnh sửa" onClick={() => onEdit?.(customer)} />
            </TableActions>
          );
        },
      }),
    ];
  }, [onView, onEdit]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <DataTable
        columns={columns as any}
        data={customers}
        loading={isLoading}
        searchPlaceholder="Tìm kiếm khách hàng..."
        emptyMessage="Không tìm thấy khách hàng nào"
      />
    </div>
  );
};

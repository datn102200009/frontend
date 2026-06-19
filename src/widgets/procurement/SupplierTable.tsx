import React, { useMemo } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { DataTable } from '@shared/ui/DataTable/DataTable';
import { Badge } from '@shared/ui/Badge/Badge';
import { TableActions, ActionButton } from '@shared/ui/TableActions/TableActions';
import { useGetProcurementSuppliersQuery } from '@entities/procurement/api/procurementApi';
import type { Supplier } from '@entities/procurement/model/types';
import { Edit } from 'lucide-react';

interface SupplierTableProps {
  onEdit?: (supplier: Supplier) => void;
}

export const SupplierTable: React.FC<SupplierTableProps> = ({ onEdit }) => {
  const { data: suppliers = [], isLoading } = useGetProcurementSuppliersQuery();

  const columns = useMemo(() => {
    const helper = createColumnHelper<Supplier>();
    return [
      helper.accessor('name', {
        header: 'Mã NCC',
        cell: (info) => <span className="font-semibold text-slate-800">{info.getValue()}</span>,
      }),
      helper.accessor('supplier_name', {
        header: 'Tên Nhà Cung Cấp',
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
      }),
      helper.accessor('supplier_group', {
        header: 'Nhóm Nhà Cung Cấp',
        cell: (info) => {
          const group = info.getValue() || 'Local';
          const labelMap: Record<string, string> = {
            Local: 'Trong Nước',
            Import: 'Nhập Khẩu',
            Distributor: 'Nhà Phân Phối',
          };
          const colorMap: Record<string, 'info' | 'success' | 'warning'> = {
            Local: 'success',
            Import: 'warning',
            Distributor: 'info',
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
          const supplier = info.row.original;
          return (
            <TableActions>
              <ActionButton icon={<Edit size={15} />} title="Chỉnh sửa" onClick={() => onEdit?.(supplier)} />
            </TableActions>
          );
        },
      }),
    ];
  }, [onEdit]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <DataTable
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        columns={columns as any}
        data={suppliers}
        loading={isLoading}
        searchPlaceholder="Tìm kiếm nhà cung cấp..."
        emptyMessage="Không tìm thấy nhà cung cấp nào"
      />
    </div>
  );
};

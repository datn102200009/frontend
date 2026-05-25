import React, { useMemo } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { DataTable } from '@shared/ui/DataTable/DataTable';
import { TableActions, ActionButton } from '@shared/ui/TableActions/TableActions';
import {
  useGetHrmPublicHolidaysQuery,
  useDeleteHrmPublicHolidaysByIdMutation,
} from '@entities/hrm/api/hrmApi';
import type { PublicHoliday } from '@entities/hrm/api/hrmApi';
import { Edit, Trash2 } from 'lucide-react';

interface PublicHolidayTableProps {
  onEdit?: (holiday: PublicHoliday) => void;
}

export const PublicHolidayTable: React.FC<PublicHolidayTableProps> = ({ onEdit }) => {
  const { data: holidays = [], isLoading, refetch } = useGetHrmPublicHolidaysQuery();
  const [deleteHoliday] = useDeleteHrmPublicHolidaysByIdMutation();

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa ngày nghỉ lễ "${name}" không?`)) {
      try {
        await deleteHoliday({ id }).unwrap();
        refetch();
      } catch (err) {
        console.error('Failed to delete public holiday', err);
        alert('Có lỗi xảy ra khi xóa ngày nghỉ lễ. Vui lòng kiểm tra lại.');
      }
    }
  };

  const columns = useMemo(() => {
    const helper = createColumnHelper<PublicHoliday>();
    return [
      helper.accessor('date', {
        header: 'Ngày nghỉ lễ',
        cell: (info) => <span className="font-semibold text-slate-800">{info.getValue() || '-'}</span>,
      }),
      helper.accessor('name', {
        header: 'Tên ngày nghỉ lễ',
        cell: (info) => <span className="font-medium text-slate-700">{info.getValue() || '-'}</span>,
      }),
      helper.accessor('description', {
        header: 'Mô tả',
        cell: (info) => <span>{info.getValue() || '-'}</span>,
      }),
      helper.display({
        id: 'actions',
        header: 'Thao Tác',
        size: 80,
        cell: (info) => {
          const holiday = info.row.original;
          return (
            <TableActions>
              <ActionButton
                icon={<Edit size={15} />}
                title="Sửa ngày nghỉ lễ"
                onClick={() => onEdit?.(holiday)}
              />
              <ActionButton
                icon={<Trash2 size={15} />}
                title="Xóa ngày nghỉ lễ"
                onClick={() => holiday.id && handleDelete(holiday.id, holiday.name || '')}
              />
            </TableActions>
          );
        },
      }),
    ];
  }, [onEdit]);

  return (
    <DataTable
      columns={columns as any}
      data={holidays}
      loading={isLoading}
      searchPlaceholder="Tìm kiếm ngày lễ theo tên hoặc ngày..."
      emptyMessage="Không tìm thấy ngày nghỉ lễ nào"
    />
  );
};

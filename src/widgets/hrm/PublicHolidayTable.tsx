import React, { useMemo, useState } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { DataTable } from '@shared/ui/DataTable/DataTable';
import { TableActions, ActionButton } from '@shared/ui/TableActions/TableActions';
import { Modal } from '@shared/ui/Modal/Modal';
import { Button } from '@shared/ui/Button/Button';
import { useToast } from '@shared/ui/Toast/Toast';
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
  const { data: holidays = [], isLoading } = useGetHrmPublicHolidaysQuery();
  const [deleteHoliday, { isLoading: isDeleting }] = useDeleteHrmPublicHolidaysByIdMutation();
  const [deletingHoliday, setDeletingHoliday] = useState<PublicHoliday | null>(null);
  const { toast } = useToast();

  const confirmDelete = async () => {
    if (!deletingHoliday || !deletingHoliday.id) return;
    try {
      await deleteHoliday({ id: deletingHoliday.id }).unwrap();
      toast('success', `Đã xóa ngày nghỉ lễ "${deletingHoliday.name}"`);
      setDeletingHoliday(null);
    } catch (err) {
      console.error('Failed to delete public holiday', err);
      toast('error', 'Có lỗi xảy ra khi xóa ngày nghỉ lễ. Vui lòng kiểm tra lại.');
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
                onClick={() => setDeletingHoliday(holiday)}
              />
            </TableActions>
          );
        },
      }),
    ];
  }, [onEdit]);

  return (
    <div>
      <DataTable
        columns={columns as any}
        data={holidays}
        loading={isLoading}
        searchPlaceholder="Tìm kiếm ngày lễ theo tên hoặc ngày..."
        emptyMessage="Không tìm thấy ngày nghỉ lễ nào"
      />

      {deletingHoliday && (
        <Modal
          open
          onClose={() => setDeletingHoliday(null)}
          title="Xác Nhận Xóa"
          size="sm"
          footer={
            <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-end', gap: '8px' }}>
              <Button variant="ghost" onClick={() => setDeletingHoliday(null)} disabled={isDeleting}>
                Hủy
              </Button>
              <Button variant="danger" onClick={confirmDelete} loading={isDeleting}>
                Xóa ngày lễ
              </Button>
            </div>
          }
        >
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text)' }}>
            Bạn có chắc chắn muốn xóa ngày nghỉ lễ <strong>"{deletingHoliday.name}"</strong> không? Hành động này không thể hoàn tác.
          </p>
        </Modal>
      )}
    </div>
  );
};

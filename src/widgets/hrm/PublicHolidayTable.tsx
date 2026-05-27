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
import type { PublicHoliday } from '@entities/hrm/model/types';
import { Edit, Trash2 } from 'lucide-react';
import { formatDateVN } from '@shared/lib/formatDate';

interface PublicHolidayTableProps {
  onEdit?: (holiday: PublicHoliday) => void;
}

export const PublicHolidayTable: React.FC<PublicHolidayTableProps> = ({ onEdit }) => {
  const [selectedYear, setSelectedYear] = useState<number | 'all'>(new Date().getFullYear());
  const queryArg = useMemo(() => {
    return selectedYear === 'all' ? {} : { year: selectedYear };
  }, [selectedYear]);

  const hasHolidayStarted = (startDateStr?: string) => {
    if (!startDateStr) return false;
    const cleanDateStr = startDateStr.split('T')[0];
    const parts = cleanDateStr.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const parsedHolidayDate = new Date(y, m, d);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return parsedHolidayDate <= today;
    }
    return false;
  };

  const { data: holidays = [], isLoading } = useGetHrmPublicHolidaysQuery(queryArg);
  const [deleteHoliday, { isLoading: isDeleting }] = useDeleteHrmPublicHolidaysByIdMutation();
  const [deletingHoliday, setDeletingHoliday] = useState<PublicHoliday | null>(null);
  const { toast } = useToast();

  const confirmDelete = async () => {
    if (!deletingHoliday || !deletingHoliday.id) {
      toast('error', 'Không tìm thấy ID ngày nghỉ lễ hợp lệ để xóa.');
      setDeletingHoliday(null);
      return;
    }
    try {
      await deleteHoliday({ id: deletingHoliday.id }).unwrap();
      toast('success', `Đã xóa ngày nghỉ lễ "${deletingHoliday.name || ''}"`);
      setDeletingHoliday(null);
    } catch (err) {
      console.error('Failed to delete public holiday', err);
      toast('error', 'Có lỗi xảy ra khi xóa ngày nghỉ lễ. Vui lòng kiểm tra lại.');
    }
  };

  const columns = useMemo(() => {
    const helper = createColumnHelper<PublicHoliday>();
    return [
      helper.accessor('start_date', {
        header: 'Ngày bắt đầu',
        cell: (info) => <span className="font-semibold text-slate-800">{formatDateVN(info.getValue())}</span>,
      }),
      helper.accessor('days', {
        header: 'Số ngày nghỉ',
        cell: (info) => <span className="font-medium text-slate-700">{info.getValue() ?? 1}</span>,
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
          const hasStarted = hasHolidayStarted(holiday.start_date);
          if (hasStarted) {
            return <span style={{ color: 'var(--clr-text-secondary)', fontSize: 'var(--fs-xs)' }}>-</span>;
          }
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
                variant="danger"
              />
            </TableActions>
          );
        },
      }),
    ];
  }, [onEdit]);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const result: (number | 'all')[] = ['all'];
    for (let y = currentYear - 2; y <= currentYear + 5; y++) {
      result.push(y);
    }
    return result;
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 'var(--sp-4)', gap: 'var(--sp-2)' }}>
        <label htmlFor="year-filter" style={{ fontSize: 'var(--fs-sm)', fontWeight: 'var(--fw-medium)', color: 'var(--clr-text-secondary)' }}>
          Năm nghỉ lễ:
        </label>
        <select
          id="year-filter"
          value={selectedYear}
          onChange={(e) => {
            const val = e.target.value;
            setSelectedYear(val === 'all' ? 'all' : Number(val));
          }}
          style={{
            padding: '6px 12px',
            borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--clr-border)',
            backgroundColor: 'var(--clr-surface)',
            color: 'var(--clr-text)',
            fontSize: 'var(--fs-sm)',
            outline: 'none',
            cursor: 'pointer',
            minWidth: '140px',
            transition: 'border-color var(--duration-fast) ease',
          }}
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y === 'all' ? 'Tất cả các năm' : `Năm ${y}`}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={holidays as PublicHoliday[]}
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
            Bạn có chắc chắn muốn xóa ngày nghỉ lễ <strong>"{deletingHoliday.name || ''}"</strong> không? Hành động này không thể hoàn tác.
          </p>
        </Modal>
      )}
    </div>
  );
};

import React, { useMemo, useState } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { DataTable } from '@shared/ui/DataTable/DataTable';
import { Badge } from '@shared/ui/Badge/Badge';
import { useGetHrmAttendancesQuery } from '@entities/hrm/api/hrmApi';
import type { Attendance } from '@entities/hrm/model/types';
import { DatePickerModal } from '@shared/ui/DatePickerModal/DatePickerModal';
import { Calendar } from 'lucide-react';
import { formatDateVN } from '@shared/lib/formatDate';

interface AttendanceTableProps {
  selectedDate?: string;
  onChangeDate?: (date: string) => void;
}

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  selectedDate: propSelectedDate,
  onChangeDate,
}) => {
  const [localSelectedDate, setLocalSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const selectedDate = propSelectedDate !== undefined ? propSelectedDate : localSelectedDate;

  const { data: attendancesData, isLoading } = useGetHrmAttendancesQuery({
    date: selectedDate,
  });
  const attendancesList = Array.isArray(attendancesData) ? attendancesData : (attendancesData as any)?.results || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'working':
        return <Badge variant="success">Ngày công thường</Badge>;
      case 'paid_leave':
        return <Badge variant="info">Nghỉ phép (Hưởng lương)</Badge>;
      case 'unpaid_leave':
        return <Badge variant="neutral">Nghỉ không lương</Badge>;
      case 'holiday':
        return <Badge variant="accent">Nghỉ lễ</Badge>;
      default:
        return <Badge variant="neutral">Khác</Badge>;
    }
  };

  const columns = useMemo(() => {
    const helper = createColumnHelper<Attendance>();
    return [
      helper.accessor('employee_code', {
        header: 'Mã NV',
        cell: (info) => <span className="font-semibold text-slate-800">{info.getValue() || 'N/A'}</span>,
      }),
      helper.accessor('employee_name', {
        header: 'Họ và Tên',
        cell: (info) => <span className="font-medium text-slate-700">{info.getValue() || 'N/A'}</span>,
      }),
      helper.accessor('status', {
        header: 'Trạng thái',
        cell: (info) => getStatusBadge(info.getValue()),
      }),
      helper.accessor('work_hours', {
        header: 'Số giờ công',
        cell: (info) => {
          const val = info.getValue();
          return val !== undefined && val !== null ? `${val} giờ` : '-';
        },
      }),
      helper.accessor('overtime_hours', {
        header: 'Giờ OT',
        cell: (info) => {
          const val = info.getValue();
          return val !== undefined && val !== null ? `${val} giờ` : '-';
        },
      }),
      helper.accessor('remarks', {
        header: 'Ghi chú',
        cell: (info) => info.getValue() || '-',
      }),
    ];
  }, []);

  return (
    <div>
      {/* Date filter toolbar */}
      <div className="filterToolbar">
        <div className="filterGroup">
          <span className="filterLabel">Ngày chấm công:</span>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              id="attendance-date-filter"
              type="text"
              readOnly
              value={formatDateVN(selectedDate)}
              onClick={() => setIsDatePickerOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsDatePickerOpen(true);
                }
              }}
              className="filterDateInput"
              style={{ paddingRight: '36px', cursor: 'pointer', minWidth: '150px' }}
              aria-label="Chọn ngày xem chấm công"
            />
            <Calendar
              size={16}
              style={{
                position: 'absolute',
                right: '12px',
                color: 'var(--clr-text-secondary)',
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={attendancesList as Attendance[]}
        loading={isLoading}
        searchPlaceholder="Tìm kiếm bản ghi chấm công theo mã hoặc tên..."
        emptyMessage="Không tìm thấy bản ghi chấm công nào"
      />

      <DatePickerModal
        open={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        value={selectedDate}
        onChange={(newDate) => {
          if (onChangeDate) {
            onChangeDate(newDate);
          } else {
            setLocalSelectedDate(newDate);
          }
        }}
      />
    </div>
  );
};

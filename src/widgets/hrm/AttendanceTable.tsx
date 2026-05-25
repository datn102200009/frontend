import React, { useMemo, useState } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { DataTable } from '@shared/ui/DataTable/DataTable';
import { Badge } from '@shared/ui/Badge/Badge';
import { useGetHrmAttendancesQuery } from '@entities/hrm/api/hrmApi';
import type { Attendance } from '@entities/hrm/model/types';

export const AttendanceTable: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const { data: attendances = [], isLoading } = useGetHrmAttendancesQuery({
    date: selectedDate,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'working':
        return <Badge variant="success">Đi làm</Badge>;
      case 'paid_leave':
        return <Badge variant="info">Nghỉ phép (Hưởng lương)</Badge>;
      case 'unpaid_leave':
        return <Badge variant="neutral">Nghỉ không lương</Badge>;
      case 'sick_leave':
        return <Badge variant="warning">Nghỉ ốm</Badge>;
      case 'holiday':
        return <Badge variant="success">Nghỉ lễ</Badge>;
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
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="filterDateInput"
            aria-label="Chọn ngày xem chấm công"
          />
        </div>
      </div>

      <DataTable
        columns={columns as any}
        data={attendances}
        loading={isLoading}
        searchPlaceholder="Tìm kiếm bản ghi chấm công theo mã hoặc tên..."
        emptyMessage="Không tìm thấy bản ghi chấm công nào"
      />
    </div>
  );
};

import React, { useMemo, useState } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { DataTable } from '@shared/ui/DataTable/DataTable';
import { Badge } from '@shared/ui/Badge/Badge';
import { TableActions, ActionButton } from '@shared/ui/TableActions/TableActions';
import { useGetHrmLeaveRequestsQuery } from '@entities/hrm/api/hrmApi';
import type { LeaveRequest } from '@entities/hrm/model/types';
import { Eye, ChevronDown } from 'lucide-react';

interface LeaveRequestTableProps {
  onViewDetails?: (leaveRequest: LeaveRequest) => void;
}

export const LeaveRequestTable: React.FC<LeaveRequestTableProps> = ({ onViewDetails }) => {
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

  const { data: leaveRequests = [], isLoading } = useGetHrmLeaveRequestsQuery(
    statusFilter === 'all' ? {} : { status: statusFilter }
  );

  const getLeaveTypeLabel = (type: string) => {
    switch (type) {
      case 'annual':
        return 'Nghỉ phép năm';
      case 'sick':
        return 'Nghỉ ốm';
      case 'unpaid':
        return 'Nghỉ không lương';
      case 'maternity':
        return 'Nghỉ thai sản';
      case 'personal':
        return 'Nghỉ việc riêng';
      default:
        return 'Khác';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Chờ duyệt</Badge>;
      case 'approved':
        return <Badge variant="success">Đã duyệt</Badge>;
      case 'rejected':
        return <Badge variant="error">Từ chối</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const columns = useMemo(() => {
    const helper = createColumnHelper<LeaveRequest>();
    return [
      helper.accessor('employee_code', {
        header: 'Mã NV',
        cell: (info) => <span className="font-semibold text-slate-800">{(info.row.original as any).employee_code || 'N/A'}</span>,
      }),
      helper.accessor('employee_name', {
        header: 'Nhân viên',
        cell: (info) => <span className="font-medium text-slate-700">{(info.row.original as any).employee_name || 'N/A'}</span>,
      }),
      helper.accessor('leave_type', {
        header: 'Loại phép',
        cell: (info) => getLeaveTypeLabel(info.getValue()),
      }),
      helper.accessor('start_date', {
        header: 'Từ ngày',
        cell: (info) => info.getValue() || '-',
      }),
      helper.accessor('end_date', {
        header: 'Đến ngày',
        cell: (info) => info.getValue() || '-',
      }),
      helper.accessor('days', {
        header: 'Số ngày nghỉ',
        cell: (info) => `${info.getValue() || 0} ngày`,
      }),
      helper.accessor('reason', {
        header: 'Lý do',
        cell: (info) => <span className="truncate max-w-[200px] inline-block">{(info.row.original as any).reason || '-'}</span>,
      }),
      helper.accessor('status', {
        header: 'Trạng thái',
        cell: (info) => getStatusBadge(info.getValue()),
      }),
      helper.display({
        id: 'actions',
        header: 'Thao Tác',
        size: 80,
        cell: (info) => {
          const lr = info.row.original;
          return (
            <TableActions>
              <ActionButton
                icon={<Eye size={15} />}
                title={lr.status === 'pending' ? 'Xem & Duyệt đơn' : 'Xem chi tiết'}
                onClick={() => onViewDetails?.(lr)}
              />
            </TableActions>
          );
        },
      }),
    ];
  }, [onViewDetails]);

  return (
    <div>
      {/* Status filter toolbar */}
      <div className="filterToolbar">
        <div className="filterGroup">
          <span className="filterLabel">Trạng thái:</span>
          <div className="filterSelectWrapper">
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="filterSelectInput"
              aria-label="Lọc trạng thái đơn nghỉ phép"
            >
              <option value="pending">Chờ phê duyệt</option>
              <option value="approved">Đã phê duyệt</option>
              <option value="rejected">Đã từ chối</option>
              <option value="all">Tất cả đơn phép</option>
            </select>
            <ChevronDown size={14} className="filterSelectIcon" />
          </div>
        </div>
      </div>

      <DataTable
        columns={columns as any}
        data={leaveRequests}
        loading={isLoading}
        searchPlaceholder="Tìm kiếm đơn phép theo mã hoặc tên..."
        emptyMessage="Không tìm thấy đơn nghỉ phép nào"
      />
    </div>
  );
};

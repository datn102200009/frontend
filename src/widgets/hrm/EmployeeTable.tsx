import React, { useMemo, useState } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { DataTable } from '@shared/ui/DataTable/DataTable';
import { Badge } from '@shared/ui/Badge/Badge';
import { TableActions, ActionButton } from '@shared/ui/TableActions/TableActions';
import { useGetHrmEmployeesQuery } from '@entities/hrm/api/hrmApi';
import type { Employee } from '@entities/hrm/model/types';
import { Eye, Edit, DollarSign, FileText, Gift, AlertTriangle } from 'lucide-react';

interface EmployeeTableProps {
  onView?: (employee: Employee) => void;
  onEdit?: (employee: Employee) => void;
  onUpdateSalary?: (employee: Employee) => void;
  onCreateContract?: (employee: Employee) => void;
  onReward?: (employee: Employee) => void;
  onDiscipline?: (employee: Employee) => void;
}

export const EmployeeTable: React.FC<EmployeeTableProps> = ({
  onView,
  onEdit,
  onUpdateSalary,
  onCreateContract,
  onReward,
  onDiscipline,
}) => {
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');

  const { data: employeeResponse, isLoading } = useGetHrmEmployeesQuery({
    limit: 100,
  });

  const employees = useMemo(() => {
    if (!employeeResponse?.results) return [];
    if (statusFilter === 'all') return employeeResponse.results;
    return employeeResponse.results.filter((emp) => emp.employment_status === statusFilter);
  }, [employeeResponse, statusFilter]);

  const formatVND = (value: any) => {
    if (value === undefined || value === null) return '0 đ';
    const amount = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const columns = useMemo(() => {
    const helper = createColumnHelper<Employee>();
    return [
      helper.accessor('employee_id', {
        header: 'Mã NV',
        cell: (info) => <span className="font-semibold text-slate-800">{info.getValue() || 'N/A'}</span>,
      }),
      helper.accessor('full_name', {
        header: 'Họ và Tên',
        cell: (info) => <span className="font-medium text-slate-700">{info.getValue() || 'N/A'}</span>,
      }),
      helper.accessor('department', {
        header: 'Bộ phận',
        cell: (info) => info.getValue() || '-',
      }),
      helper.accessor('position_title', {
        header: 'Chức vụ',
        cell: (info) => info.getValue() || '-',
      }),
      helper.accessor('salary_base', {
        header: 'Lương cơ bản',
        cell: (info) => formatVND(info.getValue()),
      }),
      helper.accessor('employment_status', {
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue();
          return status === 'active' ? (
            <Badge variant="success">Hoạt động</Badge>
          ) : (
            <Badge variant="neutral">Nghỉ việc</Badge>
          );
        },
      }),
      helper.accessor('join_date', {
        header: 'Ngày vào làm',
        cell: (info) => info.getValue() || '-',
      }),
      helper.display({
        id: 'actions',
        header: 'Thao Tác',
        size: 220,
        cell: (info) => {
          const emp = info.row.original;
          const isActive = emp.employment_status === 'active';
          return (
            <TableActions>
              <ActionButton
                icon={<Eye size={15} />}
                title="Xem chi tiết & Hợp đồng"
                onClick={() => onView?.(emp)}
              />
              {isActive && (
                <>
                  <ActionButton
                    icon={<Edit size={15} />}
                    title="Sửa thông tin"
                    onClick={() => onEdit?.(emp)}
                  />
                  <ActionButton
                    icon={<DollarSign size={15} />}
                    title="Điều chỉnh lương/chức danh"
                    onClick={() => onUpdateSalary?.(emp)}
                  />
                  <ActionButton
                    icon={<FileText size={15} />}
                    title="Gia hạn hợp đồng"
                    onClick={() => onCreateContract?.(emp)}
                  />
                  <ActionButton
                    icon={<Gift size={15} />}
                    title="Khen thưởng"
                    onClick={() => onReward?.(emp)}
                  />
                  <ActionButton
                    icon={<AlertTriangle size={15} />}
                    title="Kỷ luật"
                    onClick={() => onDiscipline?.(emp)}
                  />
                </>
              )}
            </TableActions>
          );
        },
      }),
    ];
  }, [onView, onEdit, onUpdateSalary, onCreateContract, onReward, onDiscipline]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Custom status toolbar */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-500">Trạng thái:</span>
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary-400"
            aria-label="Lọc trạng thái nhân viên"
          >
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Đã nghỉ việc</option>
            <option value="all">Tất cả nhân sự</option>
          </select>
        </div>
      </div>

      <DataTable
        columns={columns as any}
        data={employees}
        loading={isLoading}
        searchPlaceholder="Tìm kiếm nhân viên theo mã hoặc tên..."
        emptyMessage="Không tìm thấy nhân viên nào"
      />
    </div>
  );
};

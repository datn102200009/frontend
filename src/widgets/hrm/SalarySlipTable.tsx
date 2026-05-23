import React, { useMemo, useState } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { DataTable } from '@shared/ui/DataTable/DataTable';
import { Badge } from '@shared/ui/Badge/Badge';
import { TableActions, ActionButton } from '@shared/ui/TableActions/TableActions';
import { useGetHrmSalarySlipsQuery } from '@entities/hrm/api/hrmApi';
import type { SalarySlip } from '@entities/hrm/model/types';
import { Eye } from 'lucide-react';

interface SalarySlipTableProps {
  onViewDetails?: (salarySlip: SalarySlip) => void;
}

export const SalarySlipTable: React.FC<SalarySlipTableProps> = ({ onViewDetails }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${mm}`;
  });
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'paid'>('all');

  const { data: salarySlips = [], isLoading } = useGetHrmSalarySlipsQuery({
    salaryPeriod: selectedPeriod || undefined,
  });

  const filteredSlips = useMemo(() => {
    if (statusFilter === 'all') return salarySlips;
    return salarySlips.filter((slip) => slip.status === statusFilter);
  }, [salarySlips, statusFilter]);

  const formatVND = (value: any) => {
    if (value === undefined || value === null) return '0 đ';
    const amount = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    return status === 'paid' ? (
      <Badge variant="success">Đã thanh toán</Badge>
    ) : (
      <Badge variant="warning">Bản nháp</Badge>
    );
  };

  const columns = useMemo(() => {
    const helper = createColumnHelper<SalarySlip>();
    return [
      helper.accessor('employee_code', {
        header: 'Mã NV',
        cell: (info) => <span className="font-semibold text-slate-800">{(info.row.original as any).employee_code || 'N/A'}</span>,
      }),
      helper.accessor('employee_name', {
        header: 'Họ và Tên',
        cell: (info) => <span className="font-medium text-slate-700">{(info.row.original as any).employee_name || 'N/A'}</span>,
      }),
      helper.accessor('salary_period', {
        header: 'Kỳ lương',
        cell: (info) => info.getValue() || '-',
      }),
      helper.accessor('base_salary', {
        header: 'Lương cơ bản',
        cell: (info) => formatVND((info.row.original as any).base_salary),
      }),
      helper.accessor('reward_amount_total', {
        header: 'Thưởng',
        cell: (info) => formatVND((info.row.original as any).reward_amount_total),
      }),
      helper.accessor('discipline_deduction_total', {
        header: 'Khấu trừ',
        cell: (info) => formatVND((info.row.original as any).discipline_deduction_total),
      }),
      helper.accessor('net_pay', {
        header: 'Thực nhận',
        cell: (info) => <span className="font-semibold text-primary-600">{formatVND((info.row.original as any).net_pay)}</span>,
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
          const slip = info.row.original;
          return (
            <TableActions>
              <ActionButton
                icon={<Eye size={15} />}
                title={slip.status === 'draft' ? 'Xem & Tính lương' : 'Xem phiếu lương'}
                onClick={() => onViewDetails?.(slip)}
              />
            </TableActions>
          );
        },
      }),
    ];
  }, [onViewDetails]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Filters toolbar */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-500">Kỳ lương:</span>
          <input
            type="month"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary-400"
            aria-label="Chọn kỳ lương cần xem"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-500">Trạng thái:</span>
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary-400"
            aria-label="Lọc trạng thái phiếu lương"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="draft">Bản nháp</option>
            <option value="paid">Đã thanh toán</option>
          </select>
        </div>
      </div>

      <DataTable
        columns={columns as any}
        data={filteredSlips}
        loading={isLoading}
        searchPlaceholder="Tìm kiếm phiếu lương theo mã hoặc tên..."
        emptyMessage="Không tìm thấy phiếu lương nào cho kỳ này"
      />
    </div>
  );
};

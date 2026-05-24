import React, { useMemo, useState } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { DataTable } from '@shared/ui/DataTable/DataTable';
import { Badge } from '@shared/ui/Badge/Badge';
import { TableActions, ActionButton } from '@shared/ui/TableActions/TableActions';
import { useGetHrmSalarySlipsQuery } from '@entities/hrm/api/hrmApi';
import type { SalarySlip } from '@entities/hrm/model/types';
import { Eye, ChevronDown } from 'lucide-react';
import { SalarySlipDetailsModal } from '@features/hrm/manage-salary-slip/ui/SalarySlipDetailsModal';

interface SalarySlipTableProps {
  onViewDetails?: (salarySlip: SalarySlip) => void;
  selectedPeriod: string;
  onChangePeriod: (period: string) => void;
}

export const SalarySlipTable: React.FC<SalarySlipTableProps> = ({
  onViewDetails,
  selectedPeriod,
  onChangePeriod,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'paid'>('all');
  const [selectedSlipId, setSelectedSlipId] = useState<string | null>(null);

  const { data: salarySlips = [], isLoading, refetch } = useGetHrmSalarySlipsQuery({
    salaryPeriod: selectedPeriod || undefined,
  });

  const filteredSlips = useMemo(() => {
    if (statusFilter === 'all') return salarySlips;
    return salarySlips.filter((slip) => slip.status === statusFilter);
  }, [salarySlips, statusFilter]);

  const selectedSlip = useMemo(() => {
    return filteredSlips.find((s) => s.id === selectedSlipId);
  }, [filteredSlips, selectedSlipId]);

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
                onClick={() => {
                  setSelectedSlipId(slip.id || null);
                  onViewDetails?.(slip as SalarySlip);
                }}
              />
            </TableActions>
          );
        },
      }),
    ];
  }, [onViewDetails]);

  return (
    <div>
      {/* Filters toolbar */}
      <div className="hrmFilterToolbar">
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <div className="hrmFilterGroup">
            <span className="hrmFilterLabel">Kỳ lương:</span>
            <div className="hrmSelectWrapper">
              <select
                value={selectedPeriod.split('-')[1]}
                onChange={(e) => {
                  const [y, _] = selectedPeriod.split('-');
                  onChangePeriod(`${y}-${e.target.value}`);
                }}
                className="hrmSelectInput"
                style={{ minWidth: '90px', paddingRight: '24px' }}
                aria-label="Chọn tháng kỳ lương"
              >
                {Array.from({ length: 12 }, (_, i) => {
                  const m = String(i + 1).padStart(2, '0');
                  return (
                    <option key={m} value={m}>
                      Tháng {i + 1}
                    </option>
                  );
                })}
              </select>
              <ChevronDown size={14} className="hrmSelectIcon" />
            </div>

            <div className="hrmSelectWrapper">
              <select
                value={selectedPeriod.split('-')[0]}
                onChange={(e) => {
                  const [_, m] = selectedPeriod.split('-');
                  onChangePeriod(`${e.target.value}-${m}`);
                }}
                className="hrmSelectInput"
                style={{ minWidth: '95px', paddingRight: '24px' }}
                aria-label="Chọn năm kỳ lương"
              >
                {Array.from({ length: 10 }, (_, i) => {
                  const y = String(2020 + i);
                  return (
                    <option key={y} value={y}>
                      Năm {y}
                    </option>
                  );
                })}
              </select>
              <ChevronDown size={14} className="hrmSelectIcon" />
            </div>
          </div>

          <div className="hrmFilterGroup">
            <span className="hrmFilterLabel">Trạng thái:</span>
            <div className="hrmSelectWrapper">
              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="hrmSelectInput"
                aria-label="Lọc trạng thái phiếu lương"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="draft">Bản nháp</option>
                <option value="paid">Đã thanh toán</option>
              </select>
              <ChevronDown size={14} className="hrmSelectIcon" />
            </div>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns as any}
        data={filteredSlips}
        loading={isLoading}
        searchPlaceholder="Tìm kiếm phiếu lương theo mã hoặc tên..."
        emptyMessage="Không tìm thấy phiếu lương nào cho kỳ này"
      />

      {selectedSlip && (
        <SalarySlipDetailsModal
          open={!!selectedSlipId}
          onClose={() => setSelectedSlipId(null)}
          onSuccess={() => {
            refetch();
            setSelectedSlipId(null);
          }}
          onCalculateSuccess={refetch}
          salarySlip={selectedSlip as SalarySlip}
        />
      )}
    </div>
  );
};

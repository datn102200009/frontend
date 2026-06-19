import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import { DataTable } from '@shared/ui/DataTable/DataTable';
import { Badge } from '@shared/ui/Badge/Badge';
import { useToast } from '@shared/ui/Toast/Toast';
import { usePermission } from '@shared/hooks/usePermission';
import { TableActions, ActionButton } from '@shared/ui/TableActions/TableActions';
import {
  useGetHrmSalarySlipsQuery,
  usePostHrmSalarySlipsByIdSubmitForReviewMutation,
} from '@entities/hrm/api/hrmApi';
import { useSalaryPeriods } from '@entities/hrm/lib/useSalaryPeriods';
import type { SalarySlip } from '@entities/hrm/model/types';
import { Eye, ChevronDown, Send } from 'lucide-react';
import { SalarySlipDetailsModal } from '@features/hrm/manage-salary-slip/ui/SalarySlipDetailsModal';
import { ConfirmDialog } from '@shared/ui/ConfirmDialog/ConfirmDialog';
import { isCurrentPayrollPeriod } from '@entities/hrm/lib/payrollPeriod';
import { formatNumber } from '@shared/lib/formatNumber';

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
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'calculated' | 'pending_finance_review' | 'approved' | 'paid'>('all');
  const [searchParams, setSearchParams] = useSearchParams();
  const querySlipId = searchParams.get('id');
  const selectedSlipId = querySlipId || null;
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [slipToSubmit, setSlipToSubmit] = useState<SalarySlip | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();

  // Permissions
  const canSubmit = usePermission('hrm.payroll_submit');

  // Queries & Mutations
  const { monthOptions, yearOptions, isLoading: isPeriodsLoading } = useSalaryPeriods({ selectedPeriod });

  const { data: salarySlips = [], isLoading, refetch } = useGetHrmSalarySlipsQuery({
    salaryPeriod: selectedPeriod || undefined,
  });

  const [submitForReview] = usePostHrmSalarySlipsByIdSubmitForReviewMutation();


  const urlStatus = searchParams.get('status');
  useEffect(() => {
    if (urlStatus && ['all', 'draft', 'calculated', 'pending_finance_review', 'approved', 'paid'].includes(urlStatus)) {
      setStatusFilter(urlStatus as any);
    }
  }, [urlStatus]);

  const filteredSlips = useMemo(() => {
    if (statusFilter === 'all') return salarySlips;
    return salarySlips.filter((slip) => slip.status === statusFilter);
  }, [salarySlips, statusFilter]);

  const selectedSlip = useMemo(() => {
    return filteredSlips.find((s) => s.id === selectedSlipId);
  }, [filteredSlips, selectedSlipId]);



  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success">Đã thanh toán</Badge>;
      case 'approved':
        return <Badge variant="info">Đã phê duyệt</Badge>;
      case 'pending_finance_review':
        return <Badge variant="warning">Chờ phê duyệt</Badge>;
      case 'calculated':
        return <Badge variant="warning">Đã tính toán</Badge>;
      case 'draft':
      default:
        return <Badge variant="neutral">Bản nháp</Badge>;
    }
  };

  const handleConfirmSubmit = async () => {
    if (!slipToSubmit) return;
    setIsSubmitting(true);
    try {
      await submitForReview({ id: slipToSubmit.id }).unwrap();
      toast('success', 'Gửi duyệt phiếu lương thành công');
      setIsConfirmOpen(false);
      refetch();
    } catch (err) {
      toast('error', 'Gửi duyệt phiếu lương thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitClick = (slip: SalarySlip) => {
    setSlipToSubmit(slip);
    setIsConfirmOpen(true);
  };



  const columns = useMemo(() => {
    const helper = createColumnHelper<SalarySlip>();
    return [
      helper.accessor('employee_code', {
        header: 'Mã nhân viên',
        cell: (info) => <span className="font-semibold text-slate-800">{info.row.original.employee_code || 'N/A'}</span>,
      }),
      helper.accessor('employee_name', {
        header: 'Họ và Tên',
        cell: (info) => <span className="font-medium text-slate-700">{info.row.original.employee_name || 'N/A'}</span>,
      }),
      helper.accessor('updated_at', {
        header: 'Cập nhật vào',
        cell: (info) => info.getValue() ? new Date(info.getValue()!).toLocaleString('vi-VN') : '-',
      }),
      helper.accessor('base_salary', {
        header: 'Lương cơ bản',
        cell: (info) => formatNumber(info.row.original.base_salary, 0),
      }),
      helper.accessor('reward_amount_total', {
        header: 'Thưởng',
        cell: (info) => formatNumber(info.row.original.reward_amount_total, 0),
      }),
      helper.accessor('discipline_deduction_total', {
        header: 'Khấu trừ',
        cell: (info) => formatNumber(info.row.original.discipline_deduction_total, 0),
      }),
      helper.accessor('net_pay', {
        header: 'Thực nhận',
        cell: (info) => <span className="font-semibold text-primary-600">{formatNumber(info.row.original.net_pay, 0)}</span>,
      }),
      helper.accessor('status', {
        header: 'Trạng thái',
        cell: (info) => getStatusBadge(info.getValue()),
      }),
      helper.display({
        id: 'actions',
        header: 'Thao Tác',
        size: 120,
        cell: (info) => {
          const slip = info.row.original;
          const isCurrentPeriod = isCurrentPayrollPeriod(selectedPeriod);
          const isFinalSlip = slip.name?.startsWith('FINAL-SALARY-') || false;
          const isSubmitDisabled = isCurrentPeriod && !isFinalSlip;
          return (
            <TableActions>
              <ActionButton
                icon={<Eye size={15} />}
                title={slip.status === 'draft' ? 'Xem & Tính lương' : 'Xem phiếu lương'}
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  if (slip.id) {
                    params.set('id', slip.id);
                  } else {
                    params.delete('id');
                  }
                  setSearchParams(params);
                  onViewDetails?.(slip as SalarySlip);
                }}
              />
              {slip.status === 'calculated' && canSubmit && (
                <ActionButton
                  icon={<Send size={15} />}
                  title={isSubmitDisabled ? `Không thể gửi duyệt kỳ ${selectedPeriod} (tháng hiện tại)` : "Gửi Finance Duyệt"}
                  disabled={isSubmitDisabled}
                  onClick={() => handleSubmitClick(slip as SalarySlip)}
                />
              )}
            </TableActions>
          );
        },
      }),
    ];
  }, [onViewDetails, searchParams, canSubmit, selectedPeriod]);

  const noPeriods = monthOptions.length === 0 || yearOptions.length === 0;

  return (
    <div>
      {/* Filters toolbar */}
      <div className="filterToolbar">
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <div className="filterGroup">
            <span className="filterLabel">Kỳ lương:</span>
            <div className="filterSelectWrapper">
              <select
                value={selectedPeriod.split('-')[1] || ''}
                onChange={(e) => {
                  const [y] = selectedPeriod.split('-');
                  onChangePeriod(`${y}-${e.target.value}`);
                }}
                className="filterSelectInput"
                style={{ minWidth: '90px', paddingRight: '24px' }}
                aria-label="Chọn tháng kỳ lương"
                disabled={noPeriods}
              >
                {noPeriods ? (
                  <option value="">Chưa có kỳ lương</option>
                ) : (
                  monthOptions.map((m) => (
                    <option key={m} value={m}>
                      Tháng {parseInt(m, 10)}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown size={14} className="filterSelectIcon" />
            </div>

            <div className="filterSelectWrapper">
              <select
                value={selectedPeriod.split('-')[0] || ''}
                onChange={(e) => {
                  const [, m] = selectedPeriod.split('-');
                  onChangePeriod(`${e.target.value}-${m}`);
                }}
                className="filterSelectInput"
                style={{ minWidth: '95px', paddingRight: '24px' }}
                aria-label="Chọn năm kỳ lương"
                disabled={noPeriods}
              >
                {noPeriods ? (
                  <option value="">Chưa có kỳ lương</option>
                ) : (
                  yearOptions.map((y) => (
                    <option key={y} value={y}>
                      Năm {y}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown size={14} className="filterSelectIcon" />
            </div>
          </div>

          <div className="filterGroup">
            <span className="filterLabel">Trạng thái:</span>
            <div className="filterSelectWrapper">
              <select
                value={statusFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value as any)}
                className="filterSelectInput"
                aria-label="Lọc trạng thái phiếu lương"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="draft">Bản nháp</option>
                <option value="calculated">Đã tính toán</option>
                <option value="pending_finance_review">Chờ Finance duyệt</option>
                <option value="approved">Đã phê duyệt</option>
                <option value="paid">Đã thanh toán</option>
              </select>
              <ChevronDown size={14} className="filterSelectIcon" />
            </div>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredSlips as SalarySlip[]}
        loading={isLoading || isPeriodsLoading}
        searchPlaceholder="Tìm kiếm phiếu lương theo mã hoặc tên..."
        emptyMessage="Không tìm thấy phiếu lương nào cho kỳ này"
      />

      {selectedSlip && (
        <SalarySlipDetailsModal
          open={!!selectedSlipId}
          onClose={() => {
            const params = new URLSearchParams(searchParams);
            params.delete('id');
            setSearchParams(params);
          }}
          onSuccess={() => {
            refetch();
            const params = new URLSearchParams(searchParams);
            params.delete('id');
            setSearchParams(params);
          }}
          onCalculateSuccess={refetch}
          salarySlip={selectedSlip as SalarySlip}
        />
      )}

      <ConfirmDialog
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmSubmit}
        loading={isSubmitting}
        title="Gửi duyệt phiếu lương"
        message="Gửi phiếu lương này sang Finance duyệt? Hành động không thể hoàn tác."
      />
    </div>
  );
};

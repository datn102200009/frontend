import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import { DataTable } from '@shared/ui/DataTable/DataTable';
import { Badge } from '@shared/ui/Badge/Badge';
import { Modal } from '@shared/ui/Modal/Modal';
import { Button } from '@shared/ui/Button/Button';
import { useToast } from '@shared/ui/Toast/Toast';
import { usePermission } from '@shared/hooks/usePermission';
import { TableActions, ActionButton } from '@shared/ui/TableActions/TableActions';
import {
  useGetHrmSalarySlipsQuery,
  usePostHrmSalarySlipsByIdSubmitForReviewMutation,
  usePostHrmSalarySlipsByIdRecallMutation,
} from '@entities/hrm/api/hrmApi';
import {
  usePostFinanceSalarySlipsByIdApproveMutation,
  usePostFinanceSalarySlipsByIdRejectMutation,
  usePostFinanceSalarySlipsByIdPayMutation,
} from '@entities/finance/api/financeApi';
import { useSalaryPeriods } from '@entities/hrm/lib/useSalaryPeriods';
import type { SalarySlip } from '@entities/hrm/model/types';
import { Eye, ChevronDown, Send, RotateCcw, CheckCircle, XCircle, CreditCard } from 'lucide-react';
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'calculated' | 'pending_finance_review' | 'approved' | 'paid'>('all');
  const [searchParams, setSearchParams] = useSearchParams();
  const querySlipId = searchParams.get('id');
  const selectedSlipId = querySlipId || null;

  const { toast } = useToast();

  // Permissions
  const canSubmit = usePermission('hrm.payroll_submit');
  const canApprove = usePermission('finance.payroll_approve');
  const canPay = usePermission('finance.change_salaryslip');

  // Action states
  const [recallingSlip, setRecallingSlip] = useState<SalarySlip | null>(null);
  const [rejectingSlip, setRejectingSlip] = useState<SalarySlip | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');
  const [payingSlip, setPayingSlip] = useState<SalarySlip | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer'>('bank_transfer');

  // Queries & Mutations
  const { monthOptions, yearOptions, isLoading: isPeriodsLoading } = useSalaryPeriods({ selectedPeriod });

  const { data: salarySlips = [], isLoading, refetch } = useGetHrmSalarySlipsQuery({
    salaryPeriod: selectedPeriod || undefined,
  });

  const [submitForReview] = usePostHrmSalarySlipsByIdSubmitForReviewMutation();
  const [recallToCalculated] = usePostHrmSalarySlipsByIdRecallMutation();
  const [approveSalarySlip] = usePostFinanceSalarySlipsByIdApproveMutation();
  const [rejectSalarySlip] = usePostFinanceSalarySlipsByIdRejectMutation();
  const [paySalarySlip] = usePostFinanceSalarySlipsByIdPayMutation();

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

  const formatVND = (value?: string | number | null) => {
    if (value === undefined || value === null) return '0 đ';
    const amount = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success">Đã thanh toán</Badge>;
      case 'approved':
        return <Badge variant="info">Đã phê duyệt</Badge>;
      case 'pending_finance_review':
        return <Badge variant="warning">Chờ Finance duyệt</Badge>;
      case 'calculated':
        return <Badge variant="warning">Đã tính toán</Badge>;
      case 'draft':
      default:
        return <Badge variant="neutral">Bản nháp</Badge>;
    }
  };

  const handleSubmit = async (slip: SalarySlip) => {
    try {
      await submitForReview({ id: slip.id }).unwrap();
      toast('success', 'Gửi duyệt phiếu lương thành công');
      refetch();
    } catch (err) {
      toast('error', 'Gửi duyệt phiếu lương thất bại');
    }
  };

  const handleRecallConfirm = async () => {
    if (!recallingSlip) return;
    try {
      await recallToCalculated({ id: recallingSlip.id }).unwrap();
      toast('success', 'Rút lại phiếu lương thành công');
      setRecallingSlip(null);
      refetch();
    } catch (err) {
      toast('error', 'Rút lại phiếu lương thất bại');
    }
  };

  const handleApprove = async (slip: SalarySlip) => {
    try {
      await approveSalarySlip({ id: slip.id }).unwrap();
      toast('success', 'Phê duyệt phiếu lương thành công');
      refetch();
    } catch (err) {
      toast('error', 'Phê duyệt phiếu lương thất bại');
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectingSlip) return;
    if (rejectReason.trim().length < 10) {
      setRejectError('Lý do từ chối phải dài ít nhất 10 ký tự');
      return;
    }
    try {
      await rejectSalarySlip({ id: rejectingSlip.id, salarySlipRejectInput: { reason: rejectReason } }).unwrap();
      toast('success', 'Từ chối phiếu lương thành công');
      setRejectingSlip(null);
      setRejectReason('');
      refetch();
    } catch (err) {
      toast('error', 'Từ chối phiếu lương thất bại');
    }
  };

  const handlePayConfirm = async () => {
    if (!payingSlip) return;
    try {
      await paySalarySlip({ id: payingSlip.id, salarySlipPaymentInput: { payment_method: paymentMethod } }).unwrap();
      toast('success', 'Thanh toán phiếu lương thành công');
      setPayingSlip(null);
      refetch();
    } catch (err) {
      toast('error', 'Thanh toán phiếu lương thất bại');
    }
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
      helper.accessor('salary_period', {
        header: 'Kỳ lương',
        cell: (info) => info.getValue() || '-',
      }),
      helper.accessor('base_salary', {
        header: 'Lương cơ bản',
        cell: (info) => formatVND(info.row.original.base_salary),
      }),
      helper.accessor('reward_amount_total', {
        header: 'Thưởng',
        cell: (info) => formatVND(info.row.original.reward_amount_total),
      }),
      helper.accessor('discipline_deduction_total', {
        header: 'Khấu trừ',
        cell: (info) => formatVND(info.row.original.discipline_deduction_total),
      }),
      helper.accessor('net_pay', {
        header: 'Thực nhận',
        cell: (info) => <span className="font-semibold text-primary-600">{formatVND(info.row.original.net_pay)}</span>,
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
                  title="Gửi Finance Duyệt"
                  onClick={() => handleSubmit(slip as SalarySlip)}
                />
              )}
              {slip.status === 'pending_finance_review' && canSubmit && (
                <ActionButton
                  icon={<RotateCcw size={15} />}
                  title="Rút Lại Yêu Cầu"
                  onClick={() => setRecallingSlip(slip as SalarySlip)}
                />
              )}
              {slip.status === 'pending_finance_review' && canApprove && (
                <ActionButton
                  icon={<CheckCircle size={15} />}
                  title="Phê Duyệt"
                  onClick={() => handleApprove(slip as SalarySlip)}
                />
              )}
              {slip.status === 'approved' && canApprove && (
                <ActionButton
                  icon={<XCircle size={15} />}
                  title="Từ Chối"
                  onClick={() => setRejectingSlip(slip as SalarySlip)}
                />
              )}
              {slip.status === 'approved' && canPay && (
                <ActionButton
                  icon={<CreditCard size={15} />}
                  title="Chi Trả"
                  onClick={() => setPayingSlip(slip as SalarySlip)}
                />
              )}
            </TableActions>
          );
        },
      }),
    ];
  }, [onViewDetails, searchParams, canSubmit, canApprove, canPay]);

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

      {/* Action Modals */}
      {recallingSlip && (
        <Modal
          open={!!recallingSlip}
          onClose={() => setRecallingSlip(null)}
          title="Rút Lại Yêu Cầu Duyệt Lương"
          size="sm"
          footer={
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
              <Button variant="ghost" onClick={() => setRecallingSlip(null)}>
                Hủy
              </Button>
              <Button variant="primary" onClick={handleRecallConfirm}>
                Rút lại
              </Button>
            </div>
          }
        >
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text-secondary)', margin: 0 }}>
            Bạn có chắc chắn muốn rút lại phiếu lương của nhân viên <strong>{recallingSlip.employee_name}</strong> về trạng thái đã tính toán?
          </p>
        </Modal>
      )}

      {rejectingSlip && (
        <Modal
          open={!!rejectingSlip}
          onClose={() => setRejectingSlip(null)}
          title="Từ Chối Phiếu Lương"
          size="sm"
          footer={
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
              <Button variant="ghost" onClick={() => setRejectingSlip(null)}>
                Hủy
              </Button>
              <Button
                variant="primary"
                onClick={handleRejectConfirm}
                disabled={rejectReason.trim().length < 10}
              >
                Xác nhận
              </Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text-secondary)', margin: 0 }}>
              Nhập lý do từ chối phiếu lương của nhân viên <strong>{rejectingSlip.employee_name}</strong> (tối thiểu 10 ký tự).
            </p>
            <textarea
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '8px 12px',
                border: '1.5px solid var(--clr-border)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--fs-sm)',
                resize: 'vertical',
                background: 'var(--clr-surface)',
                color: 'var(--clr-text)',
                outline: 'none',
              }}
              value={rejectReason}
              onChange={(e) => {
                setRejectReason(e.target.value);
                setRejectError('');
              }}
              placeholder="Lý do từ chối..."
              aria-label="Lý do từ chối phiếu lương"
            />
            {rejectError && (
              <span style={{ color: 'var(--clr-error)', fontSize: 'var(--fs-xs)' }}>{rejectError}</span>
            )}
          </div>
        </Modal>
      )}

      {payingSlip && (
        <Modal
          open={!!payingSlip}
          onClose={() => setPayingSlip(null)}
          title="Thanh Toán Phiếu Lương"
          size="sm"
          footer={
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
              <Button variant="ghost" onClick={() => setPayingSlip(null)}>
                Hủy
              </Button>
              <Button variant="primary" onClick={handlePayConfirm}>
                Thanh toán
              </Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text-secondary)', margin: 0 }}>
              Chọn phương thức thanh toán cho phiếu lương của <strong>{payingSlip.employee_name}</strong>.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--fs-sm)', cursor: 'pointer', color: 'var(--clr-text)' }}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="bank_transfer"
                  checked={paymentMethod === 'bank_transfer'}
                  onChange={() => setPaymentMethod('bank_transfer')}
                />
                Chuyển khoản ngân hàng (Bank Transfer)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--fs-sm)', cursor: 'pointer', color: 'var(--clr-text)' }}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={() => setPaymentMethod('cash')}
                />
                Tiền mặt (Cash)
              </label>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

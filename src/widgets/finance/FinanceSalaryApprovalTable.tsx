import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createColumnHelper } from '@tanstack/react-table';
import { CheckCircle, XCircle, CreditCard, ChevronDown } from 'lucide-react';
import { DataTable } from '@shared/ui/DataTable/DataTable';
import { Badge } from '@shared/ui/Badge/Badge';
import { Button } from '@shared/ui/Button/Button';
import { ConfirmModal } from '@shared/ui/Modal/ConfirmModal';
import { useToast } from '@shared/ui/Toast/Toast';
import { usePermission } from '@shared/hooks/usePermission';
import { useGetHrmSalarySlipsQuery } from '@entities/hrm/api/hrmApi';
import { useSalaryPeriods } from '@entities/hrm/lib/useSalaryPeriods';
import {
  usePostFinanceSalarySlipsByIdApproveMutation,
  usePostFinanceSalarySlipsByIdRejectMutation,
  usePostFinanceSalarySlipsByIdPayMutation,
  usePostFinanceSalarySlipsBulkApproveMutation,
  usePostFinanceSalarySlipsBulkPayMutation,
} from '@entities/finance/api/financeApi';
import type { SalarySlip } from '@entities/hrm/api/hrmApi';

export const FinanceSalaryApprovalTable: React.FC = () => {
  const canApprove = usePermission('finance.payroll_approve');
  const canPay = usePermission('finance.change_salaryslip');
  const { toast } = useToast();

  // URL State for period filter
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedPeriod = useMemo(() => {
    const periodParam = searchParams.get('period');
    if (periodParam && /^\d{4}-\d{2}$/.test(periodParam)) return periodParam;
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${mm}`;
  }, [searchParams]);

  const setSelectedPeriod = (newPeriod: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('period', newPeriod);
        return next;
      },
      { replace: true }
    );
  };

  // Salary periods hook
  const { monthOptions, yearOptions, isLoading: isPeriodsLoading } = useSalaryPeriods({ selectedPeriod });
  const noPeriods = monthOptions.length === 0 || yearOptions.length === 0;

  // Queries for pending finance review and approved slips filtered by period
  const {
    data: pendingSlips = [],
    isLoading: isLoadingPending,
    refetch: refetchPending,
  } = useGetHrmSalarySlipsQuery({
    status: 'pending_finance_review' as any,
    salaryPeriod: selectedPeriod,
  });

  const {
    data: approvedSlips = [],
    isLoading: isLoadingApproved,
    refetch: refetchApproved,
  } = useGetHrmSalarySlipsQuery({
    status: 'approved' as any,
    salaryPeriod: selectedPeriod,
  });

  const isLoading = isLoadingPending || isLoadingApproved || isPeriodsLoading;

  const refetch = () => {
    refetchPending();
    refetchApproved();
  };

  // Mutations
  const [approve, { isLoading: isApproving }] = usePostFinanceSalarySlipsByIdApproveMutation();
  const [reject, { isLoading: isRejecting }] = usePostFinanceSalarySlipsByIdRejectMutation();
  const [pay, { isLoading: isPaying }] = usePostFinanceSalarySlipsByIdPayMutation();
  const [bulkApprove, { isLoading: isBulkApproving }] = usePostFinanceSalarySlipsBulkApproveMutation();
  const [bulkPay, { isLoading: isBulkPaying }] = usePostFinanceSalarySlipsBulkPayMutation();

  // Modal states
  const [rejectingSlip, setRejectingSlip] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [payingSlip, setPayingSlip] = useState<{ id: string; name: string; amount: number } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'cash'>('bank_transfer');

  // Bulk modal states
  const [isBulkApproveOpen, setIsBulkApproveOpen] = useState(false);
  const [isBulkPayOpen, setIsBulkPayOpen] = useState(false);
  const [bulkPayMethod, setBulkPayMethod] = useState<'bank_transfer' | 'cash'>('bank_transfer');

  // Handlers
  const handleApprove = async (id: string) => {
    try {
      await approve({ id }).unwrap();
      toast('success', 'Phê duyệt phiếu lương thành công');
      refetch();
    } catch (err: any) {
      toast('error', err?.data?.detail || 'Phê duyệt thất bại');
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingSlip) return;
    if (rejectReason.trim().length < 10) {
      toast('error', 'Lý do từ chối phải có ít nhất 10 ký tự');
      return;
    }
    try {
      await reject({
        id: rejectingSlip.id,
        salarySlipRejectInput: { reason: rejectReason },
      }).unwrap();
      toast('success', 'Từ chối phiếu lương thành công');
      setRejectingSlip(null);
      setRejectReason('');
      refetch();
    } catch (err: any) {
      toast('error', err?.data?.detail || 'Từ chối thất bại');
    }
  };

  const handleConfirmPay = async () => {
    if (!payingSlip) return;
    try {
      await pay({
        id: payingSlip.id,
        salarySlipPaymentInput: { payment_method: paymentMethod },
      }).unwrap();
      toast('success', `Thanh toán cho ${payingSlip.name} thành công`);
      setPayingSlip(null);
      refetch();
    } catch (err: any) {
      toast('error', err?.data?.detail || 'Thanh toán thất bại');
    }
  };

  const handleConfirmBulkApprove = async () => {
    try {
      await bulkApprove({
        salarySlipBulkApproveInput: { salary_period: selectedPeriod },
      }).unwrap();
      toast('success', `Phê duyệt hàng loạt kỳ lương ${selectedPeriod} thành công.`);
      setIsBulkApproveOpen(false);
      refetch();
    } catch (err: any) {
      toast('error', err?.data?.detail || 'Phê duyệt hàng loạt thất bại.');
    }
  };

  const handleConfirmBulkPay = async () => {
    try {
      await bulkPay({
        salarySlipBulkPayInput: {
          salary_period: selectedPeriod,
          payment_method: bulkPayMethod,
        },
      }).unwrap();
      toast('success', `Chi trả hàng loạt kỳ lương ${selectedPeriod} thành công.`);
      setIsBulkPayOpen(false);
      refetch();
    } catch (err: any) {
      toast('error', err?.data?.detail || 'Chi trả hàng loạt thất bại.');
    }
  };

  // Calculations for bulk action metrics
  const totalBulkPayAmount = useMemo(() => {
    return approvedSlips.reduce((sum, slip) => sum + parseFloat(slip.net_pay || '0'), 0);
  }, [approvedSlips]);

  // Formatting helper
  const formatVND = (value?: string | number | null) => {
    if (value === undefined || value === null) return '0 đ';
    const amount = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'pending_finance_review':
        return <Badge variant="warning">Chờ duyệt</Badge>;
      case 'approved':
        return <Badge variant="info">Đã duyệt</Badge>;
      case 'paid':
        return <Badge variant="success">Đã thanh toán</Badge>;
      default:
        return <Badge variant="neutral">—</Badge>;
    }
  };

  // Columns definition (NO "View" button)
  const columns = useMemo(() => {
    const helper = createColumnHelper<SalarySlip>();
    return [
      helper.accessor('employee_code', {
        header: 'Mã NV',
        cell: (info) => <span className="font-semibold text-slate-800">{info.getValue() || 'N/A'}</span>,
      }),
      helper.accessor('employee_name', {
        header: 'Họ và Tên',
        cell: (info) => <span className="font-medium text-slate-700">{info.getValue() || 'N/A'}</span>,
      }),
      helper.accessor('salary_period', {
        header: 'Kỳ lương',
        cell: (info) => info.getValue() || '-',
      }),
      helper.accessor('net_pay', {
        header: 'Số tiền',
        cell: (info) => (
          <strong style={{ color: 'var(--clr-primary)' }}>
            {formatVND(info.getValue())}
          </strong>
        ),
      }),
      helper.accessor('status', {
        header: 'Trạng thái',
        cell: (info) => getStatusBadge(info.getValue()),
      }),
      helper.display({
        id: 'actions',
        header: 'Thao Tác',
        cell: (info) => {
          const slip = info.row.original;
          if (!slip.id) return null;
          return (
            <div style={{ display: 'flex', gap: '8px' }}>
              {(slip.status as string) === 'pending_finance_review' && canApprove && (
                <Button
                  size="sm"
                  variant="primary"
                  icon={<CheckCircle size={14} />}
                  onClick={() => handleApprove(slip.id!)}
                  loading={isApproving}
                >
                  Phê Duyệt
                </Button>
              )}
              {(slip.status as string) === 'pending_finance_review' && canApprove && (
                <Button
                  size="sm"
                  variant="danger"
                  icon={<XCircle size={14} />}
                  onClick={() => setRejectingSlip({ id: slip.id!, name: slip.employee_name || '' })}
                  loading={isRejecting}
                >
                  Từ Chiếu
                </Button>
              )}
              {slip.status === 'approved' && canPay && (
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<CreditCard size={14} />}
                  onClick={() =>
                    setPayingSlip({
                      id: slip.id!,
                      name: slip.employee_name || '',
                      amount: parseFloat(slip.net_pay || '0'),
                    })
                  }
                  loading={isPaying}
                >
                  Chi Trả
                </Button>
              )}
            </div>
          );
        },
      }),
    ];
  }, [canApprove, canPay, isApproving, isRejecting, isPaying]);

  // Combine both arrays of slips to display
  const displaySlips = useMemo(() => {
    return [...pendingSlips, ...approvedSlips];
  }, [pendingSlips, approvedSlips]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <DataTable
        columns={columns as any}
        data={displaySlips}
        loading={isLoading}
        searchPlaceholder="Tìm theo mã NV hoặc tên..."
        emptyMessage="Không có phiếu lương nào chờ xử lý."
        filterSlot={
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', width: '100%' }}>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text-secondary)', fontWeight: 500 }}>Kỳ lương:</span>
              <div className="filterSelectWrapper">
                <select
                  value={selectedPeriod.split('-')[1] || ''}
                  onChange={(e) => {
                    const [y] = selectedPeriod.split('-');
                    setSelectedPeriod(`${y}-${e.target.value}`);
                  }}
                  className="filterSelectInput"
                  style={{ minWidth: '90px', paddingRight: '24px' }}
                  aria-label="Chọn tháng kỳ lương"
                  disabled={noPeriods}
                >
                  {noPeriods ? (
                    <option value="">Tháng --</option>
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
                    setSelectedPeriod(`${e.target.value}-${m}`);
                  }}
                  className="filterSelectInput"
                  style={{ minWidth: '90px', paddingRight: '24px' }}
                  aria-label="Chọn năm kỳ lương"
                  disabled={noPeriods}
                >
                  {noPeriods ? (
                    <option value="">Năm --</option>
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

            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
              {canApprove && (
                <Button
                  variant="primary"
                  icon={<CheckCircle size={14} />}
                  onClick={() => setIsBulkApproveOpen(true)}
                  disabled={pendingSlips.length === 0}
                  title={pendingSlips.length === 0 ? "Không có phiếu lương nào chờ phê duyệt trong kỳ này" : undefined}
                >
                  Phê Duyệt Toàn Bộ
                </Button>
              )}

              {canPay && (
                <Button
                  variant="secondary"
                  icon={<CreditCard size={14} />}
                  onClick={() => setIsBulkPayOpen(true)}
                  disabled={approvedSlips.length === 0}
                  title={approvedSlips.length === 0 ? "Không có phiếu lương nào đã duyệt chờ chi trả trong kỳ này" : undefined}
                >
                  Chi Trả Toàn Bộ
                </Button>
              )}
            </div>
          </div>
        }
      />

      {/* Reject Modal */}
      <ConfirmModal
        open={!!rejectingSlip}
        title="Từ chối phiếu lương"
        message={
          <div>
            <p style={{ margin: 0, fontSize: 'var(--fs-sm)', color: 'var(--clr-text)' }}>
              Từ chối phiếu lương của nhân viên <strong>{rejectingSlip?.name}</strong>?
            </p>
            <p style={{ marginTop: '8px', fontSize: 'var(--fs-xs)', color: 'var(--clr-text-secondary)' }}>
              Phiếu lương sẽ được chuyển lại cho bộ phận nhân sự về trạng thái "Đã tính toán" để chỉnh sửa.
            </p>
            <textarea
              placeholder="Nhập lý do từ chối (bắt buộc, tối thiểu 10 ký tự)..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '8px 12px',
                border: '1.5px solid var(--clr-border)',
                borderRadius: 'var(--radius-md)',
                marginTop: '12px',
                fontFamily: 'inherit',
                fontSize: 'var(--fs-sm)',
                resize: 'vertical',
                outline: 'none',
              }}
            />
          </div>
        }
        confirmText="Từ chối"
        cancelText="Hủy"
        confirmVariant="danger"
        onConfirm={handleConfirmReject}
        onCancel={() => {
          setRejectingSlip(null);
          setRejectReason('');
        }}
        isLoading={isRejecting}
      />

      {/* Payment Modal */}
      <ConfirmModal
        open={!!payingSlip}
        title="Xác nhận chi trả lương"
        message={
          <div>
            <p style={{ margin: 0, fontSize: 'var(--fs-sm)', color: 'var(--clr-text)' }}>
              Xác nhận chi trả lương cho nhân viên <strong>{payingSlip?.name}</strong>?
            </p>
            <p style={{ marginTop: '8px', fontSize: 'var(--fs-sm)', color: 'var(--clr-text)' }}>
              Số tiền: <strong style={{ color: 'var(--clr-primary)' }}>{formatVND(payingSlip?.amount || 0)}</strong>
            </p>
            <div style={{ marginTop: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: 'var(--fs-sm)', color: 'var(--clr-text)' }}>
                Phương thức thanh toán:
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1.5px solid var(--clr-border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--fs-sm)',
                  backgroundColor: 'white',
                  outline: 'none',
                }}
              >
                <option value="bank_transfer">Chuyển khoản ngân hàng (Bank Transfer)</option>
                <option value="cash">Tiền mặt (Cash)</option>
              </select>
            </div>
            <p style={{ marginTop: '16px', fontSize: 'var(--fs-xs)', color: 'var(--clr-text-secondary)', margin: '16px 0 0 0' }}>
              Ngày chi: <strong>{new Date().toLocaleDateString('vi-VN')}</strong> (mặc định là hôm nay)
            </p>
          </div>
        }
        confirmText="Xác nhận chi trả"
        cancelText="Hủy"
        confirmVariant="primary"
        onConfirm={handleConfirmPay}
        onCancel={() => setPayingSlip(null)}
        isLoading={isPaying}
      />

      {/* Bulk Approve Modal */}
      <ConfirmModal
        open={isBulkApproveOpen}
        title={`Phê duyệt toàn bộ bảng lương kỳ ${selectedPeriod}`}
        message={
          <div>
            <p style={{ margin: 0, fontSize: 'var(--fs-sm)', color: 'var(--clr-text)' }}>
              Bạn có chắc chắn muốn phê duyệt <strong>TOÀN BỘ ({pendingSlips.length})</strong> phiếu lương đang chờ xử lý trong kỳ lương <strong>{selectedPeriod}</strong>?
            </p>
            <p style={{ marginTop: '8px', fontSize: 'var(--fs-xs)', color: 'var(--clr-warning)', fontWeight: 500 }}>
              Hành động này sẽ chuyển trạng thái các phiếu lương từ "Chờ duyệt" sang "Đã duyệt". Bạn không thể hoàn tác hành động này.
            </p>
          </div>
        }
        confirmText="Phê duyệt toàn bộ"
        cancelText="Hủy"
        confirmVariant="primary"
        onConfirm={handleConfirmBulkApprove}
        onCancel={() => setIsBulkApproveOpen(false)}
        isLoading={isBulkApproving}
      />

      {/* Bulk Pay Modal */}
      <ConfirmModal
        open={isBulkPayOpen}
        title={`Chi trả toàn bộ bảng lương kỳ ${selectedPeriod}`}
        message={
          <div>
            <p style={{ margin: 0, fontSize: 'var(--fs-sm)', color: 'var(--clr-text)' }}>
              Xác nhận chi trả lương hàng loạt cho <strong>TOÀN BỘ ({approvedSlips.length})</strong> phiếu lương đã duyệt trong kỳ lương <strong>{selectedPeriod}</strong>?
            </p>
            <p style={{ marginTop: '8px', fontSize: 'var(--fs-sm)', color: 'var(--clr-text)' }}>
              Tổng số tiền chi: <strong style={{ color: 'var(--clr-primary)' }}>{formatVND(totalBulkPayAmount)}</strong>
            </p>
            <div style={{ marginTop: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: 'var(--fs-sm)', color: 'var(--clr-text)' }}>
                Phương thức thanh toán hàng loạt:
              </label>
              <select
                value={bulkPayMethod}
                onChange={(e) => setBulkPayMethod(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1.5px solid var(--clr-border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--fs-sm)',
                  backgroundColor: 'white',
                  outline: 'none',
                }}
              >
                <option value="bank_transfer">Chuyển khoản ngân hàng (Bank Transfer)</option>
                <option value="cash">Tiền mặt (Cash)</option>
              </select>
            </div>
            <p style={{ marginTop: '16px', fontSize: 'var(--fs-xs)', color: 'var(--clr-text-secondary)', margin: '16px 0 0 0' }}>
              Hệ thống sẽ tự động chuyển trạng thái các phiếu lương sang "Đã thanh toán" và sinh các giao dịch dòng tiền chi tương ứng.
            </p>
          </div>
        }
        confirmText="Xác nhận chi trả toàn bộ"
        cancelText="Hủy"
        confirmVariant="primary"
        onConfirm={handleConfirmBulkPay}
        onCancel={() => setIsBulkPayOpen(false)}
        isLoading={isBulkPaying}
      />
    </div>
  );
};


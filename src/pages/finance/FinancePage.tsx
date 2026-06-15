import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CashFlowTable } from '@widgets/finance/CashFlowTable';
import { Button } from '@shared/ui/Button/Button';
import { Badge } from '@shared/ui/Badge/Badge';
import { useToast } from '@shared/ui/Toast/Toast';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import {
  useGetFinanceCashFlowsQuery,
  usePostFinanceCashFlowsByPkApproveMutation,
} from '@entities/finance/api/financeApi';
import { usePermission } from '@shared/hooks/usePermission';
import { DataTable } from '@shared/ui/DataTable/DataTable';
import { createColumnHelper } from '@tanstack/react-table';
import type { CashFlowTransaction } from '@entities/finance/api/financeApi';
import styles from './FinancePage.module.css';

const FinancePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const rawTab = searchParams.get('tab') || 'cashflow';
  
  // If tab is ap, ar, purchase_invoices, or sales_invoices, redirect to /finance/invoices with the corresponding tab
  useEffect(() => {
    if (['ap', 'ar', 'purchase_invoices', 'sales_invoices'].includes(rawTab)) {
      const targetTab = rawTab === 'ap' ? 'purchase_invoices' : rawTab === 'ar' ? 'sales_invoices' : rawTab;
      const params = new URLSearchParams(searchParams);
      params.set('tab', targetTab);
      navigate(`/finance/invoices?${params.toString()}`, { replace: true });
    }
  }, [rawTab, navigate, searchParams]);

  const activeTab = useMemo(() => {
    if (['cashflow', 'approvals'].includes(rawTab)) {
      return rawTab as 'cashflow' | 'approvals';
    }
    return 'cashflow';
  }, [rawTab]);

  const setActiveTab = (newTab: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('tab', newTab);
      next.delete('id');
      return next;
    }, { replace: true });
  };

  // Permissions
  const hasApprovePermission = usePermission('finance.approve_cash_flow');

  // Pagination & query state for Approvals
  const [pageApprovals, setPageApprovals] = useState(1);
  const { data: approvalsData, isLoading: isLoadingApprovals, refetch: refetchApprovals } = useGetFinanceCashFlowsQuery(
    { status: 'pending_approval', page: pageApprovals, limit: 10 },
    { skip: activeTab !== 'approvals' || !hasApprovePermission }
  );
  
  const [approveCashFlow, { isLoading: isApproving }] = usePostFinanceCashFlowsByPkApproveMutation();
  const { toast } = useToast();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const handleApproveCashFlow = async (id: string) => {
    try {
      await approveCashFlow({ pk: id }).unwrap();
      toast('success', 'Phê duyệt giao dịch dòng tiền thành công');
      refetchApprovals();
    } catch (err: unknown) {
      const error = err as { data?: { detail?: string } };
      toast('error', error?.data?.detail || 'Phê duyệt thất bại. Vui lòng kiểm tra lại.');
    }
  };

  const approvalColumnHelper = createColumnHelper<CashFlowTransaction>();
  const approvalColumns = useMemo(() => [
    approvalColumnHelper.accessor('id', {
      header: 'Mã Giao Dịch',
      cell: (info) => <span style={{ color: 'var(--clr-text-secondary)' }}>{(info.getValue() || '').slice(0, 8).toUpperCase()}</span>,
    }),
    approvalColumnHelper.accessor('payment_type', {
      header: 'Loại',
      cell: (info) => {
        const type = info.getValue();
        return type === 'receive' ? (
          <Badge variant="success">Thu Tiền</Badge>
        ) : (
          <Badge variant="error">Chi Tiền</Badge>
        );
      },
    }),
    approvalColumnHelper.accessor('amount', {
      header: 'Số Tiền',
      cell: (info) => {
        const amt = Number(info.getValue() || 0);
        const type = info.row.original.payment_type;
        return <span style={{ fontWeight: 500, color: type === 'receive' ? 'var(--clr-success)' : 'var(--clr-danger)' }}>{formatCurrency(amt)}</span>;
      },
    }),
    approvalColumnHelper.accessor('category', {
      header: 'Phân Loại',
      cell: (info) => <Badge variant="neutral">{info.getValue() || 'Chưa phân loại'}</Badge>,
    }),
    approvalColumnHelper.accessor('remarks', {
      header: 'Ghi Chú',
      cell: (info) => <span style={{ color: 'var(--clr-text-secondary)' }}>{info.getValue() || '-'}</span>,
    }),
    approvalColumnHelper.accessor('payment_date', {
      header: 'Ngày',
      cell: (info) => {
        const val = info.getValue();
        return val ? new Date(val).toLocaleDateString('vi-VN') : '-';
      },
    }),
    approvalColumnHelper.display({
      id: 'actions',
      header: 'Thao Tác',
      cell: (info) => (
        <Button 
          size="sm"
          icon={<Check size={14} />}
          onClick={() => handleApproveCashFlow(info.row.original.id!)}
          disabled={isApproving}
        >
          Duyệt
        </Button>
      ),
    }),
  ], [isApproving]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Quản Lý Dòng Tiền</h2>
          <p className={styles.subtitle}>Quản lý phê duyệt dòng tiền và báo cáo dòng tiền</p>
        </div>
      </div>

      <div className={styles.tabs} role="tablist">
        <button 
          type="button"
          role="tab"
          aria-selected={activeTab === 'cashflow'}
          className={`${styles.tab} ${activeTab === 'cashflow' ? styles.active : ''}`}
          onClick={() => setActiveTab('cashflow')}
        >
          Dòng Tiền
        </button>
        {hasApprovePermission && (
          <button 
            type="button"
            role="tab"
            aria-selected={activeTab === 'approvals'}
            className={`${styles.tab} ${activeTab === 'approvals' ? styles.active : ''}`}
            onClick={() => setActiveTab('approvals')}
          >
            Duyệt Giao Dịch
          </button>
        )}
      </div>

      <div className={styles.content}>
        {activeTab === 'cashflow' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <CashFlowTable />
          </div>
        )}

        {activeTab === 'approvals' && hasApprovePermission && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" style={{ display: 'flex', flexDirection: 'column' }}>
            <DataTable 
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              columns={approvalColumns as any} 
              data={approvalsData?.results || []} 
              loading={isLoadingApprovals}
              searchPlaceholder="Tìm kiếm giao dịch chờ duyệt..."
              emptyMessage="Không có giao dịch nào chờ phê duyệt."
            />

            {/* Pagination for approvals */}
            {approvalsData && approvalsData.total_pages && approvalsData.total_pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', padding: 'var(--sp-4)', borderTop: '1px solid var(--clr-border)' }}>
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>
                  Trang {pageApprovals} / {approvalsData.total_pages} (Tổng {approvalsData.count} giao dịch)
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    icon={<ChevronLeft size={16} />} 
                    disabled={pageApprovals <= 1}
                    onClick={() => setPageApprovals(p => p - 1)}
                  >
                    {""}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    icon={<ChevronRight size={16} />} 
                    disabled={pageApprovals >= (approvalsData.total_pages || 1)}
                    onClick={() => setPageApprovals(p => p + 1)}
                  >
                    {""}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancePage;

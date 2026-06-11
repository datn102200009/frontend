import React, { useMemo, useState } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { DataTable } from '@shared/ui/DataTable/DataTable';
import { Button } from '@shared/ui/Button/Button';
import { Badge } from '@shared/ui/Badge/Badge';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import {
  useGetHrmEmploymentHistoriesQuery,
  usePostHrmEmploymentHistoriesByIdApproveMutation,
} from '@entities/hrm/api/hrmApi';
import type { EmploymentHistory } from '@entities/hrm/model/types';
import { usePermission } from '@shared/hooks/usePermission';
import { useToast } from '@shared/ui/Toast/Toast';

export const EmploymentHistoryApprovalTable: React.FC = () => {
  const [page, setPage] = useState(1);
  const limit = 10;
  const offset = (page - 1) * limit;

  const hasHrmApprovePermission = usePermission('hrm.change_employee');
  const { toast } = useToast();

  const {
    data: historiesData,
    isLoading,
    refetch,
  } = useGetHrmEmploymentHistoriesQuery({
    status: 'pending_approval',
    limit,
    offset,
  });

  const [approveHistory, { isLoading: isApproving }] = usePostHrmEmploymentHistoriesByIdApproveMutation();

  const historiesList = historiesData?.results || [];

  const handleApprove = async (id: string) => {
    try {
      await approveHistory({ id }).unwrap();
      toast('success', 'Phê duyệt đề xuất thay đổi nhân sự thành công');
      refetch();
    } catch (err: any) {
      toast('error', err?.data?.detail || 'Phê duyệt thất bại. Vui lòng kiểm tra lại.');
    }
  };

  const formatVND = (value?: string | number | null) => {
    if (value === undefined || value === null) return '0 đ';
    const amount = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getChangeTypeLabel = (type: string) => {
    switch (type) {
      case 'salary_change':
        return <Badge variant="info">Thay đổi lương</Badge>;
      case 'title_change':
        return <Badge variant="success">Thay đổi chức danh</Badge>;
      case 'department_transfer':
        return <Badge variant="warning">Điều chuyển bộ phận</Badge>;
      default:
        return <Badge variant="neutral">Khác</Badge>;
    }
  };

  const formatChangeDetail = (row: EmploymentHistory) => {
    switch (row.change_type) {
      case 'salary_change':
        return (
          <span>
            {formatVND(row.old_salary_base)} &rarr;{' '}
            <strong className="text-emerald-700">{formatVND(row.new_salary_base)}</strong>
          </span>
        );
      case 'title_change':
        return (
          <span>
            {row.old_title || 'N/A'} &rarr;{' '}
            <strong className="text-blue-700">{row.new_title || 'N/A'}</strong>
          </span>
        );
      case 'department_transfer':
        return (
          <span>
            {row.old_department || 'N/A'} &rarr;{' '}
            <strong className="text-amber-700">{row.new_department || 'N/A'}</strong>
          </span>
        );
      default:
        return '-';
    }
  };

  const columns = useMemo(() => {
    const helper = createColumnHelper<EmploymentHistory>();
    return [
      helper.accessor('employee_code', {
        header: 'Mã NV',
        cell: (info) => <span className="font-semibold text-slate-800">{info.getValue() || 'N/A'}</span>,
      }),
      helper.accessor('employee_name', {
        header: 'Nhân viên',
        cell: (info) => <span className="font-medium text-slate-700">{info.getValue() || 'N/A'}</span>,
      }),
      helper.accessor('change_type', {
        header: 'Loại thay đổi',
        cell: (info) => getChangeTypeLabel(info.getValue() || ''),
      }),
      helper.display({
        id: 'detail',
        header: 'Chi tiết thay đổi',
        cell: (info) => formatChangeDetail(info.row.original),
      }),
      helper.accessor('effective_date', {
        header: 'Ngày hiệu lực',
        cell: (info) => info.getValue() || '-',
      }),
      helper.accessor('reason', {
        header: 'Lý do đề xuất',
        cell: (info) => <span className="text-slate-600 max-w-xs truncate inline-block" title={info.getValue() || ''}>{info.getValue() || '-'}</span>,
      }),
      helper.display({
        id: 'actions',
        header: 'Thao Tác',
        cell: (info) => {
          const record = info.row.original;
          if (hasHrmApprovePermission) {
            return (
              <Button
                size="sm"
                icon={<Check size={14} />}
                onClick={() => handleApprove(record.id!)}
                disabled={isApproving}
              >
                Duyệt
              </Button>
            );
          }
          return <span className="text-slate-400">-</span>;
        },
      }),
    ];
  }, [hasHrmApprovePermission, isApproving]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" style={{ display: 'flex', flexDirection: 'column' }}>
      <DataTable
        columns={columns as any}
        data={historiesList as any}
        loading={isLoading}
        searchPlaceholder="Tìm kiếm đề xuất nhân sự..."
        emptyMessage="Không có đề xuất thay đổi nhân sự nào chờ phê duyệt."
      />

      {historiesData && historiesData.total_pages && historiesData.total_pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', padding: 'var(--sp-4)', borderTop: '1px solid var(--clr-border)' }}>
          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>
            Trang {page} / {historiesData.total_pages} (Tổng {historiesData.count} đề xuất)
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <Button
              size="sm"
              variant="ghost"
              icon={<ChevronLeft size={16} />}
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              {""}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              icon={<ChevronRight size={16} />}
              disabled={page >= (historiesData.total_pages || 1)}
              onClick={() => setPage(p => p + 1)}
            >
              {""}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

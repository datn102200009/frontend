import React, { useMemo, useState } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { DataTable } from '@shared/ui/DataTable/DataTable';
import { Button } from '@shared/ui/Button/Button';
import { Badge } from '@shared/ui/Badge/Badge';
import { Plus, Gift, AlertTriangle } from 'lucide-react';
import {
  useGetHrmRewardsQuery,
  useGetHrmDisciplinesQuery,
  usePostHrmRewardsByIdApproveMutation,
  usePostHrmDisciplinesByIdApproveMutation
} from '@entities/hrm/api/hrmApi';
import type { RewardRecord, DisciplineRecord } from '@entities/hrm/model/types';
import { RewardFormModal } from '@features/hrm/manage-salary-slip/ui/RewardFormModal';
import { DisciplineFormModal } from '@features/hrm/manage-salary-slip/ui/DisciplineFormModal';
import { usePermission } from '@shared/hooks/usePermission';
import { useToast } from '@shared/ui/Toast/Toast';
import { extractApiError } from '@shared/lib/extractApiError';
import styles from './RewardDisciplineTable.module.css';

export const RewardDisciplineTable: React.FC = () => {
  const [subTab, setSubTab] = useState<'rewards' | 'disciplines'>('rewards');
  const [isRewardOpen, setIsRewardOpen] = useState(false);
  const [isDisciplineOpen, setIsDisciplineOpen] = useState(false);

  const {
    data: rewards = [],
    isLoading: isRewardsLoading,
    refetch: refetchRewards,
  } = useGetHrmRewardsQuery({});

  const {
    data: disciplines = [],
    isLoading: isDisciplinesLoading,
    refetch: refetchDisciplines,
  } = useGetHrmDisciplinesQuery({});

  const [approveReward, { isLoading: isApprovingReward }] = usePostHrmRewardsByIdApproveMutation();
  const [approveDiscipline, { isLoading: isApprovingDiscipline }] = usePostHrmDisciplinesByIdApproveMutation();
  
  const hasRewardApprovePermission = usePermission('hrm.change_rewardrecord');
  const hasDisciplineApprovePermission = usePermission('hrm.change_disciplinerecord');
  const { toast } = useToast();

  const handleApproveReward = async (id: string) => {
    try {
      await approveReward({ id }).unwrap();
      toast('success', 'Phê duyệt khen thưởng thành công');
      refetchRewards();
    } catch (err) {
      toast('error', extractApiError(err, 'Phê duyệt thất bại'));
    }
  };

  const handleApproveDiscipline = async (id: string) => {
    try {
      await approveDiscipline({ id }).unwrap();
      toast('success', 'Phê duyệt kỷ luật thành công');
      refetchDisciplines();
    } catch (err) {
      toast('error', extractApiError(err, 'Phê duyệt thất bại'));
    }
  };

  const formatVND = (value?: string | number | null) => {
    if (value === undefined || value === null) return '0 đ';
    const amount = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getRewardTypeBadge = (type: string) => {
    switch (type) {
      case 'performance_bonus':
        return <Badge variant="success">Hiệu quả công việc</Badge>;
      case 'initiative':
        return <Badge variant="info">Sáng kiến</Badge>;
      case 'holiday_bonus':
        return <Badge variant="neutral">Lễ tết</Badge>;
      default:
        return <Badge variant="neutral">Thưởng khác</Badge>;
    }
  };

  const getDisciplineTypeBadge = (type: string) => {
    switch (type) {
      case 'reprimand':
        return <Badge variant="neutral">Phê bình/Nhắc nhở</Badge>;
      case 'warning':
        return <Badge variant="warning">Khiển trách</Badge>;
      case 'salary_deduction':
        return <Badge variant="error">Khấu trừ lương</Badge>;
      case 'termination':
        return <Badge variant="error">Sa thải</Badge>;
      default:
        return <Badge variant="neutral">Khác</Badge>;
    }
  };

  const getApprovalStatusBadge = (status?: string) => {
    switch (status) {
      case 'pending_approval':
        return <Badge variant="warning">Chờ duyệt</Badge>;
      case 'approved':
        return <Badge variant="success">Đã duyệt</Badge>;
      case 'rejected':
        return <Badge variant="error">Từ chối</Badge>;
      default:
        return <Badge variant="neutral">{status || 'N/A'}</Badge>;
    }
  };

  const rewardColumns = useMemo(() => {
    const helper = createColumnHelper<RewardRecord>();
    return [
      helper.accessor('employee_code', {
        header: 'Mã NV',
        cell: (info) => <span className="font-semibold text-slate-800">{info.getValue() || 'N/A'}</span>,
      }),
      helper.accessor('employee_name', {
        header: 'Họ và Tên',
        cell: (info) => <span className="font-medium text-slate-700">{info.getValue() || 'N/A'}</span>,
      }),
      helper.accessor('reward_date', {
        header: 'Ngày quyết định',
        cell: (info) => info.getValue() || '-',
      }),
      helper.accessor('reward_type', {
        header: 'Loại khen thưởng',
        cell: (info) => getRewardTypeBadge(info.getValue() || ''),
      }),
      helper.accessor('amount', {
        header: 'Số tiền thưởng',
        cell: (info) => <span className="font-semibold text-emerald-600">{formatVND(info.getValue())}</span>,
      }),
      helper.accessor('description', {
        header: 'Lý do/Mô tả',
        cell: (info) => <span className="text-slate-600">{info.getValue() || '-'}</span>,
      }),
      helper.accessor('status', {
        header: 'Trạng thái',
        cell: (info) => getApprovalStatusBadge(info.getValue()),
      }),
      helper.display({
        id: 'actions',
        header: 'Thao Tác',
        cell: (info) => {
          const record = info.row.original;
          if (record.status === 'pending_approval' && hasRewardApprovePermission) {
            return (
              <Button
                size="sm"
                onClick={() => handleApproveReward(record.id!)}
                disabled={isApprovingReward}
              >
                Duyệt
              </Button>
            );
          }
          return <span className="text-slate-400">-</span>;
        },
      }),
    ];
  }, [hasRewardApprovePermission, isApprovingReward]);

  const disciplineColumns = useMemo(() => {
    const helper = createColumnHelper<DisciplineRecord>();
    return [
      helper.accessor('employee_code', {
        header: 'Mã NV',
        cell: (info) => <span className="font-semibold text-slate-800">{info.getValue() || 'N/A'}</span>,
      }),
      helper.accessor('employee_name', {
        header: 'Họ và Tên',
        cell: (info) => <span className="font-medium text-slate-700">{info.getValue() || 'N/A'}</span>,
      }),
      helper.accessor('incident_date', {
        header: 'Ngày xảy ra',
        cell: (info) => info.getValue() || '-',
      }),
      helper.accessor('discipline_date', {
        header: 'Ngày quyết định',
        cell: (info) => info.getValue() || '-',
      }),
      helper.accessor('discipline_type', {
        header: 'Hình thức kỷ luật',
        cell: (info) => getDisciplineTypeBadge(info.getValue() || ''),
      }),
      helper.accessor('penalty_amount', {
        header: 'Số tiền phạt',
        cell: (info) => {
          const amount = info.getValue();
          return amount ? (
            <span className="font-semibold text-rose-600">{formatVND(amount)}</span>
          ) : (
            <span className="text-slate-400">-</span>
          );
        },
      }),
      helper.accessor('description', {
        header: 'Nội dung vi phạm',
        cell: (info) => <span className="text-slate-600">{info.getValue() || '-'}</span>,
      }),
      helper.accessor('file_url', {
        header: 'Tài liệu quyết định',
        cell: (info) => {
          const url = info.getValue();
          return url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline font-medium"
            >
              Xem quyết định
            </a>
          ) : (
            <span className="text-slate-400">-</span>
          );
        },
      }),
      helper.accessor('status', {
        header: 'Trạng thái',
        cell: (info) => getApprovalStatusBadge(info.getValue()),
      }),
      helper.display({
        id: 'actions',
        header: 'Thao Tác',
        cell: (info) => {
          const record = info.row.original;
          if (record.status === 'pending_approval' && hasDisciplineApprovePermission) {
            return (
              <Button
                size="sm"
                onClick={() => handleApproveDiscipline(record.id!)}
                disabled={isApprovingDiscipline}
              >
                Duyệt
              </Button>
            );
          }
          return <span className="text-slate-400">-</span>;
        },
      }),
    ];
  }, [hasDisciplineApprovePermission, isApprovingDiscipline]);

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.subTabs}>
          <button
            type="button"
            className={`${styles.subTab} ${subTab === 'rewards' ? styles.activeSubTab : ''}`}
            onClick={() => setSubTab('rewards')}
          >
            <Gift size={16} />
            Danh sách Khen Thưởng
          </button>
          <button
            type="button"
            className={`${styles.subTab} ${subTab === 'disciplines' ? styles.activeSubTab : ''}`}
            onClick={() => setSubTab('disciplines')}
          >
            <AlertTriangle size={16} />
            Danh sách Kỷ Luật
          </button>
        </div>

        <div className={styles.actions}>
          {subTab === 'rewards' ? (
            <Button icon={<Plus size={16} />} onClick={() => setIsRewardOpen(true)}>
              Ghi Nhận Thưởng
            </Button>
          ) : (
            <Button icon={<Plus size={16} />} onClick={() => setIsDisciplineOpen(true)}>
              Ghi Nhận Kỷ Luật
            </Button>
          )}
        </div>
      </div>

      <div className={styles.tableSection}>
        {subTab === 'rewards' ? (
          <DataTable
            columns={rewardColumns}
            data={rewards as RewardRecord[]}
            loading={isRewardsLoading}
            searchPlaceholder="Tìm kiếm thông tin khen thưởng..."
            emptyMessage="Chưa có bản ghi khen thưởng nào"
          />
        ) : (
          <DataTable
            columns={disciplineColumns}
            data={disciplines as DisciplineRecord[]}
            loading={isDisciplinesLoading}
            searchPlaceholder="Tìm kiếm thông tin kỷ luật..."
            emptyMessage="Chưa có bản ghi kỷ luật nào"
          />
        )}
      </div>

      {isRewardOpen && (
        <RewardFormModal
          open={isRewardOpen}
          onClose={() => setIsRewardOpen(false)}
          onSuccess={() => {
            refetchRewards();
            setIsRewardOpen(false);
          }}
        />
      )}

      {isDisciplineOpen && (
        <DisciplineFormModal
          open={isDisciplineOpen}
          onClose={() => setIsDisciplineOpen(false)}
          onSuccess={() => {
            refetchDisciplines();
            setIsDisciplineOpen(false);
          }}
        />
      )}
    </div>
  );
};

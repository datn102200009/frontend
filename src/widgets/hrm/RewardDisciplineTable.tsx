import React, { useMemo, useState } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { DataTable } from '@shared/ui/DataTable/DataTable';
import { Button } from '@shared/ui/Button/Button';
import { Badge } from '@shared/ui/Badge/Badge';
import { Plus, Gift, AlertTriangle, Eye, Edit2, XCircle, Trash2, Check } from 'lucide-react';
import {
  useGetHrmRewardsQuery,
  useGetHrmDisciplinesQuery,
  usePostHrmRewardsByIdApproveMutation,
  usePostHrmDisciplinesByIdApproveMutation,
  useDeleteHrmRewardsByIdMutation,
  useDeleteHrmDisciplinesByIdMutation,
  usePostHrmRewardsByIdCancelMutation,
  usePostHrmDisciplinesByIdCancelMutation,
  useGetHrmEmployeesQuery,
} from '@entities/hrm/api/hrmApi';
import type { RewardRecord, DisciplineRecord } from '@entities/hrm/model/types';
import { RewardFormModal } from '@features/hrm/manage-salary-slip/ui/RewardFormModal';
import { DisciplineFormModal } from '@features/hrm/manage-salary-slip/ui/DisciplineFormModal';
import { RewardEditModal } from '@features/hrm/manage-salary-slip/ui/RewardEditModal';
import { DisciplineEditModal } from '@features/hrm/manage-salary-slip/ui/DisciplineEditModal';
import { RewardDetailsModal } from '@features/hrm/manage-salary-slip/ui/RewardDetailsModal';
import { DisciplineDetailsModal } from '@features/hrm/manage-salary-slip/ui/DisciplineDetailsModal';
import { CancelRecordDialog } from '@features/hrm/manage-salary-slip/ui/CancelRecordDialog';
import { SearchableSelect } from '@shared/ui/Select/SearchableSelect';
import { usePermission } from '@shared/hooks/usePermission';
import { useToast } from '@shared/ui/Toast/Toast';
import { extractApiError } from '@shared/lib/extractApiError';
import {
  getRewardTypeLabel,
  getDisciplineTypeLabel,
  REWARD_TYPE_OPTIONS,
  DISCIPLINE_TYPE_OPTIONS,
} from '@shared/constants/hrmRewardDiscipline';
import styles from './RewardDisciplineTable.module.css';

export const RewardDisciplineTable: React.FC = () => {
  const [subTab, setSubTab] = useState<'rewards' | 'disciplines'>('rewards');
  const [isRewardOpen, setIsRewardOpen] = useState(false);
  const [isDisciplineOpen, setIsDisciplineOpen] = useState(false);

  // Filters state
  const [employeeId, setEmployeeId] = useState('');
  const [status, setStatus] = useState('');
  const [rewardType, setRewardType] = useState('');
  const [disciplineType, setDisciplineType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Modals state
  const [editRewardRecord, setEditRewardRecord] = useState<RewardRecord | null>(null);
  const [editDisciplineRecord, setEditDisciplineRecord] = useState<DisciplineRecord | null>(null);
  const [detailsRewardRecord, setDetailsRewardRecord] = useState<RewardRecord | null>(null);
  const [detailsDisciplineRecord, setDetailsDisciplineRecord] = useState<DisciplineRecord | null>(null);
  const [cancelRewardRecord, setCancelRewardRecord] = useState<RewardRecord | null>(null);
  const [cancelDisciplineRecord, setCancelDisciplineRecord] = useState<DisciplineRecord | null>(null);

  const { data: employeesData } = useGetHrmEmployeesQuery({ status: 'active', limit: 100 });

  const employeeOptions = useMemo(() => {
    const opts = (employeesData?.results || []).map((emp) => ({
      value: emp.id!,
      label: `${emp.employee_id} - ${emp.full_name}`,
    }));
    return [{ value: '', label: 'Tất cả nhân viên' }, ...opts];
  }, [employeesData]);

  const rewardFilters = useMemo(() => ({
    employeeId: employeeId || undefined,
    status: (status as any) || undefined,
    rewardType: (rewardType as any) || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  }), [employeeId, status, rewardType, dateFrom, dateTo]);

  const disciplineFilters = useMemo(() => ({
    employeeId: employeeId || undefined,
    status: (status as any) || undefined,
    disciplineType: (disciplineType as any) || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  }), [employeeId, status, disciplineType, dateFrom, dateTo]);

  const {
    data: rewardsData,
    isLoading: isRewardsLoading,
    refetch: refetchRewards,
  } = useGetHrmRewardsQuery(rewardFilters);

  const {
    data: disciplinesData,
    isLoading: isDisciplinesLoading,
    refetch: refetchDisciplines,
  } = useGetHrmDisciplinesQuery(disciplineFilters);

  const rewards = rewardsData?.results || [];
  const disciplines = disciplinesData?.results || [];

  const [approveReward, { isLoading: isApprovingReward }] = usePostHrmRewardsByIdApproveMutation();
  const [approveDiscipline, { isLoading: isApprovingDiscipline }] = usePostHrmDisciplinesByIdApproveMutation();
  const [deleteReward] = useDeleteHrmRewardsByIdMutation();
  const [deleteDiscipline] = useDeleteHrmDisciplinesByIdMutation();
  const [cancelReward, { isLoading: isCancellingReward }] = usePostHrmRewardsByIdCancelMutation();
  const [cancelDiscipline, { isLoading: isCancellingDiscipline }] = usePostHrmDisciplinesByIdCancelMutation();
  
  const hasRewardApprovePermission = usePermission('hrm.change_rewardrecord');
  const hasDisciplineApprovePermission = usePermission('hrm.change_disciplinerecord');
  const canEditReward = usePermission('hrm.change_rewardrecord');
  const canEditDiscipline = usePermission('hrm.change_disciplinerecord');
  const canDeleteReward = usePermission('hrm.delete_rewardrecord');
  const canDeleteDiscipline = usePermission('hrm.delete_disciplinerecord');

  const { toast } = useToast();

  const handleTabChange = (tab: 'rewards' | 'disciplines') => {
    setSubTab(tab);
    setRewardType('');
    setDisciplineType('');
  };

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

  const handleDeleteReward = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bản ghi khen thưởng này không?')) return;
    try {
      await deleteReward({ id }).unwrap();
      toast('success', 'Xóa khen thưởng thành công');
      refetchRewards();
    } catch (err) {
      toast('error', extractApiError(err, 'Xóa thất bại'));
    }
  };

  const handleDeleteDiscipline = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bản ghi kỷ luật này không?')) return;
    try {
      await deleteDiscipline({ id }).unwrap();
      toast('success', 'Xóa kỷ luật thành công');
      refetchDisciplines();
    } catch (err) {
      toast('error', extractApiError(err, 'Xóa thất bại'));
    }
  };

  const handleConfirmCancelReward = async (reason: string) => {
    if (!cancelRewardRecord) return;
    try {
      await cancelReward({
        id: cancelRewardRecord.id!,
        body: { reason },
      }).unwrap();
      toast('success', 'Hủy khen thưởng thành công');
      setCancelRewardRecord(null);
      refetchRewards();
    } catch (err) {
      toast('error', extractApiError(err, 'Hủy thất bại'));
    }
  };

  const handleConfirmCancelDiscipline = async (reason: string) => {
    if (!cancelDisciplineRecord) return;
    try {
      await cancelDiscipline({
        id: cancelDisciplineRecord.id!,
        body: { reason },
      }).unwrap();
      toast('success', 'Hủy kỷ luật thành công');
      setCancelDisciplineRecord(null);
      refetchDisciplines();
    } catch (err) {
      toast('error', extractApiError(err, 'Hủy thất bại'));
    }
  };

  const formatVND = (value?: string | number | null) => {
    if (value === undefined || value === null) return '0 đ';
    const amount = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getRewardTypeBadge = (type: string) => {
    const label = getRewardTypeLabel(type);
    switch (type) {
      case 'performance_bonus':
        return <Badge variant="success">{label}</Badge>;
      case 'initiative':
        return <Badge variant="info">{label}</Badge>;
      case 'holiday_bonus':
        return <Badge variant="neutral">{label}</Badge>;
      default:
        return <Badge variant="neutral">{label}</Badge>;
    }
  };

  const getDisciplineTypeBadge = (type: string) => {
    const label = getDisciplineTypeLabel(type);
    switch (type) {
      case 'reprimand':
        return <Badge variant="neutral">{label}</Badge>;
      case 'warning':
        return <Badge variant="warning">{label}</Badge>;
      case 'salary_deduction':
        return <Badge variant="error">{label}</Badge>;
      case 'termination':
        return <Badge variant="error">{label}</Badge>;
      default:
        return <Badge variant="neutral">{label}</Badge>;
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
      case 'cancelled':
        return <Badge variant="neutral">Đã hủy</Badge>;
      default:
        return <Badge variant="neutral">{status || 'N/A'}</Badge>;
    }
  };

  const rewardColumns = useMemo(() => {
    const helper = createColumnHelper<RewardRecord>();
    return [
      helper.accessor('employee_code', {
        header: 'Mã nhân viên',
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
        cell: (info) => <span className="text-slate-600 text-ellipsis overflow-hidden whitespace-nowrap block max-w-xs">{info.getValue() || '-'}</span>,
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
          const isPending = record.status === 'pending_approval';

          return (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Button
                variant="ghost"
                onClick={() => setDetailsRewardRecord(record)}
                title="Xem chi tiết"
                style={{ padding: '4px' }}
              >
                <Eye size={16} />
              </Button>
              {isPending && (
                <>
                  {hasRewardApprovePermission && (
                    <Button
                      variant="primary"
                      onClick={() => handleApproveReward(record.id!)}
                      disabled={isApprovingReward}
                      title="Duyệt"
                      style={{ padding: '4px 8px', backgroundColor: 'var(--clr-success)' }}
                    >
                      <Check size={16} />
                    </Button>
                  )}
                  {canEditReward && (
                    <Button
                      variant="ghost"
                      onClick={() => setEditRewardRecord(record)}
                      title="Sửa"
                      style={{ padding: '4px' }}
                    >
                      <Edit2 size={16} />
                    </Button>
                  )}
                  {hasRewardApprovePermission && (
                    <Button
                      variant="ghost"
                      onClick={() => setCancelRewardRecord(record)}
                      title="Hủy quyết định"
                      style={{ padding: '4px', color: 'var(--clr-warning)' }}
                    >
                      <XCircle size={16} />
                    </Button>
                  )}
                  {canDeleteReward && (
                    <Button
                      variant="ghost"
                      onClick={() => handleDeleteReward(record.id!)}
                      title="Xóa"
                      style={{ padding: '4px', color: 'var(--clr-danger)' }}
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </>
              )}
            </div>
          );
        },
      }),
    ];
  }, [hasRewardApprovePermission, isApprovingReward, canEditReward, canDeleteReward]);

  const disciplineColumns = useMemo(() => {
    const helper = createColumnHelper<DisciplineRecord>();
    return [
      helper.accessor('employee_code', {
        header: 'Mã nhân viên',
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
        cell: (info) => <span className="text-slate-600 text-ellipsis overflow-hidden whitespace-nowrap block max-w-xs">{info.getValue() || '-'}</span>,
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
          const isPending = record.status === 'pending_approval';

          return (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Button
                variant="ghost"
                onClick={() => setDetailsDisciplineRecord(record)}
                title="Xem chi tiết"
                style={{ padding: '4px' }}
              >
                <Eye size={16} />
              </Button>
              {isPending && (
                <>
                  {hasDisciplineApprovePermission && (
                    <Button
                      variant="primary"
                      onClick={() => handleApproveDiscipline(record.id!)}
                      disabled={isApprovingDiscipline}
                      title="Duyệt"
                      style={{ padding: '4px 8px', backgroundColor: 'var(--clr-success)' }}
                    >
                      <Check size={16} />
                    </Button>
                  )}
                  {canEditDiscipline && (
                    <Button
                      variant="ghost"
                      onClick={() => setEditDisciplineRecord(record)}
                      title="Sửa"
                      style={{ padding: '4px' }}
                    >
                      <Edit2 size={16} />
                    </Button>
                  )}
                  {hasDisciplineApprovePermission && (
                    <Button
                      variant="ghost"
                      onClick={() => setCancelDisciplineRecord(record)}
                      title="Hủy quyết định"
                      style={{ padding: '4px', color: 'var(--clr-warning)' }}
                    >
                      <XCircle size={16} />
                    </Button>
                  )}
                  {canDeleteDiscipline && (
                    <Button
                      variant="ghost"
                      onClick={() => handleDeleteDiscipline(record.id!)}
                      title="Xóa"
                      style={{ padding: '4px', color: 'var(--clr-danger)' }}
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </>
              )}
            </div>
          );
        },
      }),
    ];
  }, [hasDisciplineApprovePermission, isApprovingDiscipline, canEditDiscipline, canDeleteDiscipline]);

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.subTabs}>
          <button
            type="button"
            className={`${styles.subTab} ${subTab === 'rewards' ? styles.activeSubTab : ''}`}
            onClick={() => handleTabChange('rewards')}
          >
            <Gift size={16} />
            Danh sách Khen Thưởng
          </button>
          <button
            type="button"
            className={`${styles.subTab} ${subTab === 'disciplines' ? styles.activeSubTab : ''}`}
            onClick={() => handleTabChange('disciplines')}
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

      {/* Advanced Filter Bar */}
      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Nhân viên</span>
          <SearchableSelect
            options={employeeOptions}
            value={employeeId}
            onChange={setEmployeeId}
            placeholder="Tất cả nhân viên"
          />
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Trạng thái</span>
          <select
            className={styles.filterInput}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="pending_approval">Chờ duyệt</option>
            <option value="approved">Đã duyệt</option>
            <option value="rejected">Từ chối</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>

        {subTab === 'rewards' ? (
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Loại khen thưởng</span>
            <select
              className={styles.filterInput}
              value={rewardType}
              onChange={(e) => setRewardType(e.target.value)}
            >
              <option value="">Tất cả loại</option>
              {REWARD_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Hình thức kỷ luật</span>
            <select
              className={styles.filterInput}
              value={disciplineType}
              onChange={(e) => setDisciplineType(e.target.value)}
            >
              <option value="">Tất cả hình thức</option>
              {DISCIPLINE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Từ ngày</span>
          <input
            type="date"
            className={styles.filterInput}
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Đến ngày</span>
          <input
            type="date"
            className={styles.filterInput}
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>

        <Button
          variant="ghost"
          onClick={() => {
            setEmployeeId('');
            setStatus('');
            setRewardType('');
            setDisciplineType('');
            setDateFrom('');
            setDateTo('');
          }}
        >
          Xóa bộ lọc
        </Button>
      </div>

      <div className={styles.tableSection}>
        {subTab === 'rewards' ? (
          <DataTable
            columns={rewardColumns}
            data={rewards as RewardRecord[]}
            loading={isRewardsLoading}
            searchPlaceholder="Tìm kiếm thông tin khen thưởng..."
            emptyMessage="Chưa có bản ghi khen thưởng nào"
            showSearch={false}
          />
        ) : (
          <DataTable
            columns={disciplineColumns}
            data={disciplines as DisciplineRecord[]}
            loading={isDisciplinesLoading}
            searchPlaceholder="Tìm kiếm thông tin kỷ luật..."
            emptyMessage="Chưa có bản ghi kỷ luật nào"
            showSearch={false}
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

      {/* Reward Edit Modal */}
      {editRewardRecord && (
        <RewardEditModal
          open={!!editRewardRecord}
          record={editRewardRecord}
          onClose={() => setEditRewardRecord(null)}
          onSuccess={() => {
            refetchRewards();
            setEditRewardRecord(null);
          }}
        />
      )}

      {/* Discipline Edit Modal */}
      {editDisciplineRecord && (
        <DisciplineEditModal
          open={!!editDisciplineRecord}
          record={editDisciplineRecord}
          onClose={() => setEditDisciplineRecord(null)}
          onSuccess={() => {
            refetchDisciplines();
            setEditDisciplineRecord(null);
          }}
        />
      )}

      {/* Reward Details Modal */}
      {detailsRewardRecord && (
        <RewardDetailsModal
          open={!!detailsRewardRecord}
          record={detailsRewardRecord}
          onClose={() => setDetailsRewardRecord(null)}
        />
      )}

      {/* Discipline Details Modal */}
      {detailsDisciplineRecord && (
        <DisciplineDetailsModal
          open={!!detailsDisciplineRecord}
          record={detailsDisciplineRecord}
          onClose={() => setDetailsDisciplineRecord(null)}
        />
      )}

      {/* Cancel Reward Dialog */}
      {cancelRewardRecord && (
        <CancelRecordDialog
          open={!!cancelRewardRecord}
          title="Hủy Quyết Định Khen Thưởng"
          isLoading={isCancellingReward}
          onClose={() => setCancelRewardRecord(null)}
          onConfirm={handleConfirmCancelReward}
        />
      )}

      {/* Cancel Discipline Dialog */}
      {cancelDisciplineRecord && (
        <CancelRecordDialog
          open={!!cancelDisciplineRecord}
          title="Hủy Quyết Định Kỷ Luật"
          isLoading={isCancellingDiscipline}
          onClose={() => setCancelDisciplineRecord(null)}
          onConfirm={handleConfirmCancelDiscipline}
        />
      )}
    </div>
  );
};


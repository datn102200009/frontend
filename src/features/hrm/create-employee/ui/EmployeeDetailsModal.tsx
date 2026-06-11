import React, { useState } from 'react';
import { useGetHrmEmployeesByIdQuery, usePostHrmEmploymentHistoriesByIdApproveMutation } from '@entities/hrm/api/hrmApi';
import type { Employee } from '@entities/hrm/model/types';
import { Modal } from '@shared/ui/Modal/Modal';
import { Button } from '@shared/ui/Button/Button';
import { Badge } from '@shared/ui/Badge/Badge';
import { usePermission } from '@shared/hooks/usePermission';
import { useToast } from '@shared/ui/Toast/Toast';
import { Check } from 'lucide-react';
import styles from './EmployeeDetailsModal.module.css';
import { extractApiError } from '@shared/lib/extractApiError';

interface EmployeeDetailsModalProps {
  open: boolean;
  onClose: () => void;
  employee: Employee;
  onTerminateContract: (employee: Employee, contractId: string) => void;
}

type TabType = 'general' | 'contracts' | 'history' | 'rewards';

export const EmployeeDetailsModal: React.FC<EmployeeDetailsModalProps> = ({
  open,
  onClose,
  employee,
  onTerminateContract,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('general');

  const { data: detail, isLoading, refetch } = useGetHrmEmployeesByIdQuery(
    { id: employee.id },
    { skip: !open }
  );

  const hasHrmApprovePermission = usePermission('hrm.change_employee');
  const { toast } = useToast();
  const [approveHistory, { isLoading: isApproving }] = usePostHrmEmploymentHistoriesByIdApproveMutation();

  const handleApproveHistory = async (id: string) => {
    try {
      await approveHistory({ id }).unwrap();
      toast('success', 'Phê duyệt đề xuất thay đổi nhân sự thành công');
      refetch();
    } catch (err) {
      toast('error', extractApiError(err, 'Phê duyệt thất bại. Vui lòng kiểm tra lại.'));
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

  const getInitials = (name: string) => {
    if (!name) return 'NV';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const formatVND = (value?: string | number | null) => {
    if (value === undefined || value === null) return '0 đ';
    const amount = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getContractTypeLabel = (type: string | undefined) => {
    if (!type) return 'Khác';
    switch (type) {
      case 'probation':
        return 'Thử việc';
      case 'definite_term':
        return 'Xác định thời hạn';
      case 'indefinite_term':
        return 'Không xác định thời hạn';
      default:
        return 'Khác';
    }
  };

  const getContractStatusBadge = (status: string | undefined) => {
    if (!status) return <span className={styles.badge}>-</span>;
    switch (status) {
      case 'active':
        return <span className={`${styles.badge} ${styles.active}`}>Đang hiệu lực</span>;
      case 'terminated':
        return <span className={`${styles.badge} ${styles.terminated}`}>Đã chấm dứt</span>;
      case 'expired':
        return <span className={`${styles.badge} ${styles.expired}`}>Hết hạn</span>;
      default:
        return <span className={styles.badge}>{status}</span>;
    }
  };

  const getChangeTypeLabel = (type: string | undefined) => {
    if (!type) return 'Thay đổi khác';
    switch (type) {
      case 'salary_change':
        return 'Thay đổi lương';
      case 'title_change':
        return 'Thay đổi chức danh';
      case 'department_transfer':
        return 'Điều chuyển bộ phận';
      default:
        return 'Thay đổi khác';
    }
  };

  const getRewardTypeLabel = (type: string | undefined) => {
    if (!type) return 'Thưởng khác';
    switch (type) {
      case 'performance_bonus':
        return 'Hiệu quả công việc';
      case 'initiative':
        return 'Sáng kiến cải tiến';
      case 'holiday_bonus':
        return 'Thưởng lễ tết';
      default:
        return 'Thưởng khác';
    }
  };

  const getDisciplineTypeLabel = (type: string | undefined) => {
    if (!type) return 'Kỷ luật khác';
    switch (type) {
      case 'reprimand':
        return 'Phê bình/Nhắc nhở';
      case 'warning':
        return 'Khiển trách';
      case 'salary_deduction':
        return 'Khấu trừ lương';
      case 'termination':
        return 'Sa thải';
      default:
        return 'Kỷ luật khác';
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Hồ Sơ Nhân Sự Chi Tiết"
      size="md"
      footer={
        <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-end' }}>
          <Button variant="primary" onClick={onClose}>
            Đóng
          </Button>
        </div>
      }
    >
      <div className={styles.container}>
        <div className={styles.profileHeader}>
          <div className={styles.avatar}>{getInitials(employee.full_name)}</div>
          <div className={styles.profileInfo}>
            <div className={styles.name}>{employee.full_name}</div>
            <div className={styles.meta}>
              Mã NV: {employee.employee_id} | {employee.position_title || 'Nhân viên'}
            </div>
            <div className={styles.meta}>
              Bộ phận: {employee.department || 'N/A'} | Trạng thái:{' '}
              {employee.employment_status === 'active' ? 'Đang làm việc' : 'Đã nghỉ việc'}
            </div>
          </div>
        </div>

        <div className={styles.subTabs}>
          <button
            type="button"
            className={`${styles.subTab} ${activeTab === 'general' ? styles.subTabActive : ''}`}
            onClick={() => setActiveTab('general')}
          >
            Thông tin chung
          </button>
          <button
            type="button"
            className={`${styles.subTab} ${activeTab === 'contracts' ? styles.subTabActive : ''}`}
            onClick={() => setActiveTab('contracts')}
          >
            Hợp đồng
          </button>
          <button
            type="button"
            className={`${styles.subTab} ${activeTab === 'history' ? styles.subTabActive : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Lịch sử công tác
          </button>
          <button
            type="button"
            className={`${styles.subTab} ${activeTab === 'rewards' ? styles.subTabActive : ''}`}
            onClick={() => setActiveTab('rewards')}
          >
            Thưởng & Kỷ luật
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8 text-slate-500">Đang tải dữ liệu hồ sơ...</div>
        ) : !detail ? (
          <div className={styles.emptyState}>Không tìm thấy chi tiết hồ sơ nhân viên.</div>
        ) : (
          <>
            {/* General Info Tab */}
            {activeTab === 'general' && (
              <div className={styles.infoGrid}>
                <div className={styles.infoGroup}>
                  <span className={styles.label}>Email</span>
                  <span className={styles.value}>{detail.email || '-'}</span>
                </div>
                <div className={styles.infoGroup}>
                  <span className={styles.label}>Số điện thoại</span>
                  <span className={styles.value}>{detail.phone || '-'}</span>
                </div>
                <div className={styles.infoGroup}>
                  <span className={styles.label}>Giới tính</span>
                  <span className={styles.value}>
                    {detail.gender === 'male' ? 'Nam' : detail.gender === 'female' ? 'Nữ' : 'Khác'}
                  </span>
                </div>
                <div className={styles.infoGroup}>
                  <span className={styles.label}>Ngày sinh</span>
                  <span className={styles.value}>{detail.date_of_birth || '-'}</span>
                </div>
                <div className={styles.infoGroup}>
                  <span className={styles.label}>Địa chỉ</span>
                  <span className={styles.value}>{detail.address || '-'}</span>
                </div>
                <div className={styles.infoGroup}>
                  <span className={styles.label}>Liên hệ khẩn cấp</span>
                  <span className={styles.value}>{detail.emergency_contact || '-'}</span>
                </div>
                <div className={styles.infoGroup}>
                  <span className={styles.label}>Ngày vào làm</span>
                  <span className={styles.value}>{detail.join_date || '-'}</span>
                </div>
                <div className={styles.infoGroup}>
                  <span className={styles.label}>Lương cơ bản hiện tại</span>
                  <span className={styles.value}>{formatVND(detail.salary_base)}</span>
                </div>
              </div>
            )}

            {/* Contracts Tab */}
            {activeTab === 'contracts' && (
              <div className={styles.listSection}>
                {detail.contracts && detail.contracts.length > 0 ? (
                  detail.contracts.map((contract) => (
                    <div key={contract.id} className={styles.itemCard}>
                      <div className={styles.itemDetails}>
                        <div className={styles.itemTitle}>Số: {contract.contract_no}</div>
                        <div className={styles.itemMeta}>
                          Loại: {getContractTypeLabel(contract.contract_type)}
                        </div>
                        <div className={styles.itemMeta}>
                          Thời hạn: {contract.start_date} đến {contract.end_date || 'Không xác định'}
                        </div>
                        {contract.note && <div className={styles.itemMeta}>Ghi chú: {contract.note}</div>}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                        {getContractStatusBadge(contract.status)}
                        {contract.status === 'active' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onTerminateContract(employee, contract.id || '')}
                            style={{ color: 'var(--clr-error)', borderColor: 'var(--clr-error)', padding: '4px 8px', fontSize: '11px' }}
                          >
                            Chấm dứt HĐ
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyState}>Chưa có hợp đồng nào được tạo.</div>
                )}
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div className={styles.listSection}>
                {detail.employment_histories && detail.employment_histories.length > 0 ? (
                  detail.employment_histories.map((hist) => (
                    <div key={hist.id} className={styles.itemCard}>
                      <div className={styles.itemDetails}>
                        <div className={styles.itemTitle}>{getChangeTypeLabel(hist.change_type)}</div>
                        <div className={styles.itemMeta}>Ngày hiệu lực: {hist.effective_date}</div>
                        {hist.change_type === 'salary_change' && (
                          <div className={styles.itemMeta}>
                            Lương: {formatVND(hist.old_salary_base)} → {formatVND(hist.new_salary_base)}
                          </div>
                        )}
                        {hist.change_type === 'title_change' && (
                          <div className={styles.itemMeta}>
                            Chức danh: {hist.old_title || '-'} → {hist.new_title || '-'}
                          </div>
                        )}
                        {hist.change_type === 'department_transfer' && (
                          <div className={styles.itemMeta}>
                            Bộ phận: {hist.old_department || '-'} → {hist.new_department || '-'}
                          </div>
                        )}
                        {hist.reason && <div className={styles.itemMeta}>Lý do: {hist.reason}</div>}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                        {getApprovalStatusBadge(hist.status)}
                        {hist.status === 'pending_approval' && hasHrmApprovePermission && (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Check size={12} />}
                            onClick={() => handleApproveHistory(hist.id!)}
                            disabled={isApproving}
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                          >
                            Duyệt
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyState}>Chưa có lịch sử thay đổi thông tin công tác.</div>
                )}
              </div>
            )}

            {/* Rewards Tab */}
            {activeTab === 'rewards' && (
              <div className={styles.infoGrid} style={{ gridTemplateColumns: '1fr', gap: '16px' }}>
                {/* Rewards List */}
                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '600', color: 'var(--clr-text-secondary)' }}>
                    Khen Thưởng
                  </h4>
                  <div className={styles.listSection}>
                    {detail.rewards && detail.rewards.length > 0 ? (
                      detail.rewards.map((reward) => (
                        <div key={reward.id} className={styles.itemCard}>
                          <div className={styles.itemDetails}>
                            <div className={styles.itemTitle}>{getRewardTypeLabel(reward.reward_type)}</div>
                            <div className={styles.itemMeta}>Ngày quyết định: {reward.reward_date}</div>
                            <div className={styles.itemMeta}>Nội dung: {reward.description}</div>
                          </div>
                          <strong>+{formatVND(reward.amount)}</strong>
                        </div>
                      ))
                    ) : (
                      <div className={styles.emptyState} style={{ padding: '16px' }}>Chưa có ghi nhận khen thưởng.</div>
                    )}
                  </div>
                </div>

                {/* Disciplines List */}
                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '600', color: 'var(--clr-text-secondary)' }}>
                    Kỷ Luật
                  </h4>
                  <div className={styles.listSection}>
                    {detail.disciplines && detail.disciplines.length > 0 ? (
                      detail.disciplines.map((disc) => (
                        <div key={disc.id} className={styles.itemCard}>
                          <div className={styles.itemDetails}>
                            <div className={styles.itemTitle} style={{ color: 'var(--clr-error)' }}>
                              {getDisciplineTypeLabel(disc.discipline_type)}
                            </div>
                            <div className={styles.itemMeta}>Ngày vi phạm: {disc.incident_date} | Quyết định: {disc.discipline_date}</div>
                            <div className={styles.itemMeta}>Lý do: {disc.description}</div>
                          </div>
                          {disc.penalty_amount && parseFloat(disc.penalty_amount) > 0 && (
                            <strong style={{ color: 'var(--clr-error)' }}>-{formatVND(disc.penalty_amount)}</strong>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className={styles.emptyState} style={{ padding: '16px' }}>Chưa có ghi nhận kỷ luật.</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import { Plus, CheckSquare, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@shared/ui/Button/Button';

// Tables
import { AttendanceTable } from '@widgets/hrm/AttendanceTable';
import { LeaveRequestTable } from '@widgets/hrm/LeaveRequestTable';

// Modals
import { BatchAttendanceModal } from '@features/hrm/batch-attendance/ui/BatchAttendanceModal';
import { LeaveRequestFormModal } from '@features/hrm/manage-leave-request/ui/LeaveRequestFormModal';
import { LeaveRequestDetailsModal } from '@features/hrm/manage-leave-request/ui/LeaveRequestDetailsModal';

import { formatDateVN } from '@shared/lib/formatDate';
// Hooks & Types
import { 
  useGetHrmPublicHolidaysQuery, 
  useGetHrmSalarySlipsQuery,
  useGetHrmLeaveRequestsQuery,
} from '@entities/hrm/api/hrmApi';
import type { LeaveRequest } from '@entities/hrm/model/types';
import { calculateHolidayAnalysis, getSelectedHolidayInfo } from '@entities/hrm/lib/holiday';
import styles from '../HrmPage.module.css';

type Tab = 'attendance' | 'leave';

const AttendanceLeavePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab') || 'attendance';
  
  const activeTab = React.useMemo(() => {
    if (rawTab === 'leave') return 'leave';
    return 'attendance' as Tab;
  }, [rawTab]);

  const setActiveTab = (newTab: Tab) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('tab', newTab);
      next.delete('id');
      return next;
    }, { replace: true });
  };

  const queryId = searchParams.get('id');
  const queryRequestId = activeTab === 'leave' ? queryId : null;

  // Modals States
  const [isBatchAttendanceOpen, setIsBatchAttendanceOpen] = useState(false);
  const [isLeaveRequestFormOpen, setIsLeaveRequestFormOpen] = useState(false);

  // Attendance Date (Lifted state)
  const [attendanceDate, setAttendanceDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const { data: holidays = [] } = useGetHrmPublicHolidaysQuery({});

  const attendancePeriod = attendanceDate ? attendanceDate.slice(0, 7) : '';
  const { data: attendanceSalarySlips = [] } = useGetHrmSalarySlipsQuery(
    { salaryPeriod: attendancePeriod },
    { skip: activeTab !== 'attendance' || !attendancePeriod }
  );

  const isAttendancePeriodPaid = React.useMemo(() => {
    if (!attendanceSalarySlips || attendanceSalarySlips.length === 0) return false;
    return attendanceSalarySlips.every((slip) => slip.status === 'paid');
  }, [attendanceSalarySlips]);

  // Analyze holidays and calculate compensatory holidays
  const holidayAnalysis = React.useMemo(() => {
    return calculateHolidayAnalysis(holidays);
  }, [holidays]);

  // Info for the currently selected date
  const selectedHolidayInfo = React.useMemo(() => {
    return getSelectedHolidayInfo(attendanceDate, holidayAnalysis);
  }, [holidayAnalysis, attendanceDate]);

  const { data: leaveRequestsResponse } = useGetHrmLeaveRequestsQuery(
    {},
    { skip: !queryRequestId || activeTab !== 'leave' }
  );

  const selectedLeaveRequestForDetails = React.useMemo(() => {
    if (!queryRequestId || !leaveRequestsResponse) return null;
    const list = Array.isArray(leaveRequestsResponse)
      ? leaveRequestsResponse
      : ((leaveRequestsResponse as unknown) as { results?: LeaveRequest[] }).results || [];
    return (list.find((r) => r.id === queryRequestId) || null) as LeaveRequest | null;
  }, [queryRequestId, leaveRequestsResponse]);

  const handleCloseLeaveDetails = () => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete('id');
      return next;
    }, { replace: true });
  };

  return (
    <div className={styles.page}>
      <div className={styles.tabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'attendance'}
          className={clsx(styles.tab, activeTab === 'attendance' && styles.active)}
          onClick={() => setActiveTab('attendance')}
        >
          Chấm Công
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'leave'}
          className={clsx(styles.tab, activeTab === 'leave' && styles.active)}
          onClick={() => setActiveTab('leave')}
        >
          Đơn Xin Nghỉ Phép
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.container}>
          {activeTab === 'attendance' && (
            <>
              <div className={styles.header}>
                <div>
                  <h2 className={styles.title}>Quản Lý Chấm Công</h2>
                  <p className={styles.subtitle}>Ghi nhận ngày công làm việc và giờ tăng ca của nhân sự</p>
                </div>
                <Button
                  icon={<CheckSquare size={16} />}
                  onClick={() => setIsBatchAttendanceOpen(true)}
                  disabled={isAttendancePeriodPaid}
                  title={isAttendancePeriodPaid ? "Kỳ lương cho ngày này đã được thanh toán 100%" : undefined}
                >
                  Chấm Công
                </Button>
              </div>

              {isAttendancePeriodPaid && (
                <div className={styles.paidBanner} data-testid="paid-period-banner">
                  <AlertTriangle className={styles.paidIcon} size={18} />
                  <p className={styles.holidayText}>
                    <strong>Kỳ lương đã thanh toán:</strong> Kỳ lương {attendancePeriod} cho ngày {formatDateVN(attendanceDate)} đã được thanh toán 100%. Không cho phép chỉnh sửa chấm công.
                  </p>
                </div>
              )}

              {selectedHolidayInfo && (
                selectedHolidayInfo.type === 'official' ? (
                  <div className={styles.holidayBanner} data-testid="public-holiday-banner">
                    <AlertTriangle className={styles.holidayIcon} size={18} />
                    <p className={styles.holidayText}>
                      <strong>Thông báo nghỉ lễ:</strong> Ngày {formatDateVN(attendanceDate)} là ngày nghỉ Lễ/Tết <strong>{selectedHolidayInfo.name || ''}</strong>
                      {selectedHolidayInfo.isSunday && selectedHolidayInfo.compensatoryDayName ? (
                        <> trùng Chủ Nhật (sẽ được nghỉ bù vào <strong>{selectedHolidayInfo.compensatoryDayName}</strong>)</>
                      ) : null}.
                    </p>
                  </div>
                ) : (
                  <div className={styles.compensatoryBanner} data-testid="compensatory-holiday-banner">
                    <CheckCircle className={styles.compensatoryIcon} size={18} />
                    <p className={styles.holidayText}>
                      <strong>Thông báo nghỉ bù:</strong> Ngày {formatDateVN(attendanceDate)} là ngày nghỉ bù cho ngày lễ <strong>{selectedHolidayInfo.name || ''}</strong> (do trùng vào Chủ Nhật).
                    </p>
                  </div>
                )
              )}

              <AttendanceTable selectedDate={attendanceDate} onChangeDate={setAttendanceDate} />
            </>
          )}

          {activeTab === 'leave' && (
            <>
              <div className={styles.header}>
                <div>
                  <h2 className={styles.title}>Đơn Xin Nghỉ Phép</h2>
                  <p className={styles.subtitle}>Quản lý và phê duyệt danh sách đơn nghỉ phép của nhân sự</p>
                </div>
                <Button icon={<Plus size={16} />} onClick={() => setIsLeaveRequestFormOpen(true)}>
                  Tạo Đơn Phép
                </Button>
              </div>
              <LeaveRequestTable onViewDetails={(lr) => {
                setSearchParams(prev => {
                  const next = new URLSearchParams(prev);
                  if (lr.id) {
                    next.set('id', lr.id);
                  } else {
                    next.delete('id');
                  }
                  return next;
                }, { replace: true });
              }} />
            </>
          )}
        </div>
      </div>

      {/* Attendance Modals */}
      {isBatchAttendanceOpen && (
        <BatchAttendanceModal
          open={isBatchAttendanceOpen}
          onClose={() => setIsBatchAttendanceOpen(false)}
          onSuccess={() => setIsBatchAttendanceOpen(false)}
          initialDate={attendanceDate}
        />
      )}

      {/* Leave Request Modals */}
      {isLeaveRequestFormOpen && (
        <LeaveRequestFormModal
          open={isLeaveRequestFormOpen}
          onClose={() => setIsLeaveRequestFormOpen(false)}
          onSuccess={() => setIsLeaveRequestFormOpen(false)}
        />
      )}

      {selectedLeaveRequestForDetails && (
        <LeaveRequestDetailsModal
          open={!!selectedLeaveRequestForDetails}
          onClose={handleCloseLeaveDetails}
          onSuccess={handleCloseLeaveDetails}
          leaveRequest={selectedLeaveRequestForDetails}
        />
      )}
    </div>
  );
};

export default AttendanceLeavePage;

import React, { useState } from 'react';
import clsx from 'clsx';
import { Plus, CheckSquare, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@shared/ui/Button/Button';

// Tables
import { EmployeeTable } from '@widgets/hrm/EmployeeTable';
import { AttendanceTable } from '@widgets/hrm/AttendanceTable';
import { LeaveRequestTable } from '@widgets/hrm/LeaveRequestTable';
import { SalarySlipTable } from '@widgets/hrm/SalarySlipTable';
import { RewardDisciplineTable } from '@widgets/hrm/RewardDisciplineTable';
import { PublicHolidayTable } from '@widgets/hrm/PublicHolidayTable';

// Modals
import { EmployeeFormModal } from '@features/hrm/create-employee/ui/EmployeeFormModal';
import { EmployeeUpdateModal } from '@features/hrm/create-employee/ui/EmployeeUpdateModal';
import { EmployeeDetailsModal } from '@features/hrm/create-employee/ui/EmployeeDetailsModal';
import { UpdateSalaryTitleModal } from '@features/hrm/update-salary-title/ui/UpdateSalaryTitleModal';
import { ContractFormModal } from '@features/hrm/manage-contract/ui/ContractFormModal';
import { TerminateContractModal } from '@features/hrm/manage-contract/ui/TerminateContractModal';
import { LeaveRequestFormModal } from '@features/hrm/manage-leave-request/ui/LeaveRequestFormModal';
import { LeaveRequestDetailsModal } from '@features/hrm/manage-leave-request/ui/LeaveRequestDetailsModal';
import { BatchAttendanceModal } from '@features/hrm/batch-attendance/ui/BatchAttendanceModal';
import { InitializeSalarySlipModal } from '@features/hrm/manage-salary-slip/ui/InitializeSalarySlipModal';
import { RewardFormModal } from '@features/hrm/manage-salary-slip/ui/RewardFormModal';
import { DisciplineFormModal } from '@features/hrm/manage-salary-slip/ui/DisciplineFormModal';
import { BulkConfirmSalarySlipModal } from '@features/hrm/manage-salary-slip/ui/BulkConfirmSalarySlipModal';
import { PublicHolidayFormModal } from '@features/hrm/manage-public-holiday/ui/PublicHolidayFormModal';

import { formatDateVN } from '@shared/lib/formatDate';
// Hooks & Types
import { useGetHrmPublicHolidaysQuery } from '@entities/hrm/api/hrmApi';
import type { Employee, LeaveRequest, PublicHoliday } from '@entities/hrm/model/types';
import styles from './HrmPage.module.css';

const parseLocalDate = (dateStr: string): Date => {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return new Date(y, m, d);
  }
  return new Date(dateStr);
};

type ActiveTab = 'employees' | 'attendance' | 'leave' | 'salary' | 'rewards_disciplines' | 'public_holidays';

const HrmPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('employees');

  // Employee Modals States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedEmployeeForUpdate, setSelectedEmployeeForUpdate] = useState<Employee | null>(null);
  const [selectedEmployeeForView, setSelectedEmployeeForView] = useState<Employee | null>(null);
  const [selectedEmployeeForSalaryUpdate, setSelectedEmployeeForSalaryUpdate] = useState<Employee | null>(null);
  const [selectedEmployeeForContractCreate, setSelectedEmployeeForContractCreate] = useState<Employee | null>(null);
  const [selectedEmployeeForReward, setSelectedEmployeeForReward] = useState<Employee | null>(null);
  const [selectedEmployeeForDiscipline, setSelectedEmployeeForDiscipline] = useState<Employee | null>(null);
  const [terminationState, setTerminationState] = useState<{ employee: Employee; contractId: string } | null>(null);

  // Public Holiday States
  const [isHolidayCreateOpen, setIsHolidayCreateOpen] = useState(false);
  const [selectedHolidayForEdit, setSelectedHolidayForEdit] = useState<PublicHoliday | null>(null);

  // Other Modals States
  const [isBatchAttendanceOpen, setIsBatchAttendanceOpen] = useState(false);
  const [isLeaveRequestFormOpen, setIsLeaveRequestFormOpen] = useState(false);
  const [selectedLeaveRequestForDetails, setSelectedLeaveRequestForDetails] = useState<LeaveRequest | null>(null);
  const [isInitializeSalarySlipOpen, setIsInitializeSalarySlipOpen] = useState(false);
  const [isBulkPayOpen, setIsBulkPayOpen] = useState(false);

  // Attendance Date (Lifted state)
  const [attendanceDate, setAttendanceDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const { data: holidays = [] } = useGetHrmPublicHolidaysQuery({});

  // Analyze holidays and calculate compensatory holidays (compensating official holidays on Sunday)
  const holidayAnalysis = React.useMemo(() => {
    const officialMap = new Map<string, typeof holidays[number]>();
    holidays.forEach((h) => {
      if (!h.start_date) return;
      const start = parseLocalDate(h.start_date);
      const days = h.days || 1;
      for (let i = 0; i < days; i++) {
        const current = new Date(start);
        current.setDate(start.getDate() + i);
        const y = current.getFullYear();
        const m = String(current.getMonth() + 1).padStart(2, '0');
        const d = String(current.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;
        officialMap.set(dateStr, h);
      }
    });

    const sortedDates = Array.from(officialMap.keys()).sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime();
    });

    const compensatoryMap = new Map<string, typeof holidays[number]>();
    const officialToCompensatoryMap = new Map<string, string>();
    sortedDates.forEach((dateStr) => {
      const d = parseLocalDate(dateStr);
      if (d.getDay() === 0) { // Sunday is rest day
        const compDate = new Date(d);
        compDate.setDate(d.getDate() + 1);

        const getFormatted = (dt: Date) => {
          const y = dt.getFullYear();
          const m = String(dt.getMonth() + 1).padStart(2, '0');
          const day = String(dt.getDate()).padStart(2, '0');
          return `${y}-${m}-${day}`;
        };

        while (
          compDate.getDay() === 0 ||
          officialMap.has(getFormatted(compDate)) ||
          compensatoryMap.has(getFormatted(compDate))
        ) {
          compDate.setDate(compDate.getDate() + 1);
        }
        const compDateStr = getFormatted(compDate);
        compensatoryMap.set(compDateStr, officialMap.get(dateStr)!);
        officialToCompensatoryMap.set(dateStr, compDateStr);
      }
    });

    return {
      officialMap,
      compensatoryMap,
      officialToCompensatoryMap,
    };
  }, [holidays]);

  // Info for the currently selected date
  const selectedHolidayInfo = React.useMemo(() => {
    if (!attendanceDate) return null;
    const official = holidayAnalysis.officialMap.get(attendanceDate);
    if (official) {
      const d = parseLocalDate(attendanceDate);
      const isSunday = d.getDay() === 0;
      let compensatoryDayName = '';
      if (isSunday) {
        const compDateStr = holidayAnalysis.officialToCompensatoryMap.get(attendanceDate);
        if (compDateStr) {
          const compDate = parseLocalDate(compDateStr);
          const dayOfWeek = compDate.getDay();
          const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
          compensatoryDayName = dayNames[dayOfWeek];
        }
      }
      return {
        type: 'official' as const,
        name: official.name,
        isSunday,
        compensatoryDayName,
      };
    }
    const compensatory = holidayAnalysis.compensatoryMap.get(attendanceDate);
    if (compensatory) {
      return {
        type: 'compensatory' as const,
        name: compensatory.name,
      };
    }
    return null;
  }, [holidayAnalysis, attendanceDate]);

  const [selectedPeriod, setSelectedPeriod] = useState<string>(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${mm}`;
  });

  // Actions
  const handleTerminateContractTrigger = (emp: Employee, contractId: string) => {
    setSelectedEmployeeForView(null); // Close Details modal first to avoid overlay overlap
    setTerminationState({ employee: emp, contractId });
  };

  return (
    <div className={styles.page}>
      {/* Tabs list */}
      <div className={styles.tabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'employees'}
          className={clsx(styles.tab, activeTab === 'employees' && styles.active)}
          onClick={() => setActiveTab('employees')}
        >
          Nhân Viên
        </button>
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
          Nghỉ Phép
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'rewards_disciplines'}
          className={clsx(styles.tab, activeTab === 'rewards_disciplines' && styles.active)}
          onClick={() => setActiveTab('rewards_disciplines')}
        >
          Khen Thưởng & Kỷ Luật
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'salary'}
          className={clsx(styles.tab, activeTab === 'salary' && styles.active)}
          onClick={() => setActiveTab('salary')}
        >
          Bảng Lương
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'public_holidays'}
          className={clsx(styles.tab, activeTab === 'public_holidays' && styles.active)}
          onClick={() => setActiveTab('public_holidays')}
        >
          Ngày Nghỉ Lễ
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.container}>
          {/* Active tab content heading & table */}
          {activeTab === 'employees' && (
            <>
              <div className={styles.header}>
                <div>
                  <h2 className={styles.title}>Hồ Sơ Nhân Sự</h2>
                  <p className={styles.subtitle}>Quản lý danh sách nhân sự, thông tin cá nhân và hợp đồng</p>
                </div>
                <Button icon={<Plus size={16} />} onClick={() => setIsCreateOpen(true)}>
                  Thêm Nhân Viên
                </Button>
              </div>
              <EmployeeTable
                onView={(emp) => setSelectedEmployeeForView(emp)}
                onEdit={(emp) => setSelectedEmployeeForUpdate(emp)}
                onUpdateSalary={(emp) => setSelectedEmployeeForSalaryUpdate(emp)}
                onCreateContract={(emp) => setSelectedEmployeeForContractCreate(emp)}
                onReward={(emp) => setSelectedEmployeeForReward(emp)}
                onDiscipline={(emp) => setSelectedEmployeeForDiscipline(emp)}
              />
            </>
          )}

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
                >
                  Chấm Công
                </Button>
              </div>

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
                {/* Fallback button: create a request for some employee */}
                <Button icon={<Plus size={16} />} onClick={() => setIsLeaveRequestFormOpen(true)}>
                  Tạo Đơn Phép
                </Button>
              </div>
              <LeaveRequestTable onViewDetails={(lr) => setSelectedLeaveRequestForDetails(lr)} />
            </>
          )}

          {activeTab === 'salary' && (
            <>
              <div className={styles.header}>
                <div>
                  <h2 className={styles.title}>Tính Toán & Thanh Toán Lương</h2>
                  <p className={styles.subtitle}>Quản lý bảng lương nhân sự, tính toán công nợ và chi lương</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button variant="secondary" onClick={() => setIsBulkPayOpen(true)}>
                    Thanh Toán Nhanh
                  </Button>
                  <Button icon={<Plus size={16} />} onClick={() => setIsInitializeSalarySlipOpen(true)}>
                    Khởi Tạo Kỳ Lương
                  </Button>
                </div>
              </div>
              <SalarySlipTable
                selectedPeriod={selectedPeriod}
                onChangePeriod={setSelectedPeriod}
              />
            </>
          )}

          {activeTab === 'rewards_disciplines' && (
            <>
              <div className={styles.header}>
                <div>
                  <h2 className={styles.title}>Khen Thưởng & Kỷ Luật</h2>
                  <p className={styles.subtitle}>Ghi nhận khen thưởng thành tích và xử lý kỷ luật lao động</p>
                </div>
              </div>
              <RewardDisciplineTable />
            </>
          )}

          {activeTab === 'public_holidays' && (
            <>
              <div className={styles.header}>
                <div>
                  <h2 className={styles.title}>Quản Lý Ngày Nghỉ Lễ</h2>
                  <p className={styles.subtitle}>Cấu hình danh sách ngày nghỉ Lễ/Tết trong năm</p>
                </div>
                <Button icon={<Plus size={16} />} onClick={() => setIsHolidayCreateOpen(true)}>
                  Thêm Ngày Nghỉ Lễ
                </Button>
              </div>
              <PublicHolidayTable onEdit={(holiday) => setSelectedHolidayForEdit(holiday)} />
            </>
          )}
        </div>
      </div>

      {/* Employee Modals */}
      {isCreateOpen && (
        <EmployeeFormModal
          open={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSuccess={() => setIsCreateOpen(false)}
        />
      )}

      {selectedEmployeeForUpdate && (
        <EmployeeUpdateModal
          open={!!selectedEmployeeForUpdate}
          onClose={() => setSelectedEmployeeForUpdate(null)}
          onSuccess={() => setSelectedEmployeeForUpdate(null)}
          employee={selectedEmployeeForUpdate}
        />
      )}

      {selectedEmployeeForView && (
        <EmployeeDetailsModal
          open={!!selectedEmployeeForView}
          onClose={() => setSelectedEmployeeForView(null)}
          employee={selectedEmployeeForView}
          onTerminateContract={handleTerminateContractTrigger}
        />
      )}

      {selectedEmployeeForSalaryUpdate && (
        <UpdateSalaryTitleModal
          open={!!selectedEmployeeForSalaryUpdate}
          onClose={() => setSelectedEmployeeForSalaryUpdate(null)}
          onSuccess={() => setSelectedEmployeeForSalaryUpdate(null)}
          employee={selectedEmployeeForSalaryUpdate}
        />
      )}

      {selectedEmployeeForContractCreate && (
        <ContractFormModal
          open={!!selectedEmployeeForContractCreate}
          onClose={() => setSelectedEmployeeForContractCreate(null)}
          onSuccess={() => setSelectedEmployeeForContractCreate(null)}
          employee={selectedEmployeeForContractCreate}
        />
      )}

      {selectedEmployeeForReward && (
        <RewardFormModal
          open={!!selectedEmployeeForReward}
          onClose={() => setSelectedEmployeeForReward(null)}
          onSuccess={() => setSelectedEmployeeForReward(null)}
          employee={selectedEmployeeForReward}
        />
      )}

      {selectedEmployeeForDiscipline && (
        <DisciplineFormModal
          open={!!selectedEmployeeForDiscipline}
          onClose={() => setSelectedEmployeeForDiscipline(null)}
          onSuccess={() => setSelectedEmployeeForDiscipline(null)}
          employee={selectedEmployeeForDiscipline}
        />
      )}

      {terminationState && (
        <TerminateContractModal
          open={!!terminationState}
          onClose={() => setTerminationState(null)}
          onSuccess={() => setTerminationState(null)}
          employee={terminationState.employee}
          contractId={terminationState.contractId}
        />
      )}

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
          onClose={() => setSelectedLeaveRequestForDetails(null)}
          onSuccess={() => setSelectedLeaveRequestForDetails(null)}
          leaveRequest={selectedLeaveRequestForDetails}
        />
      )}

      {/* Salary Slip Modals */}
      {isInitializeSalarySlipOpen && (
        <InitializeSalarySlipModal
          open={isInitializeSalarySlipOpen}
          onClose={() => setIsInitializeSalarySlipOpen(false)}
          onSuccess={() => setIsInitializeSalarySlipOpen(false)}
        />
      )}

      {isBulkPayOpen && (
        <BulkConfirmSalarySlipModal
          open={isBulkPayOpen}
          onClose={() => setIsBulkPayOpen(false)}
          onSuccess={() => setIsBulkPayOpen(false)}
          salaryPeriod={selectedPeriod}
        />
      )}

      {/* Public Holiday Modals */}
      {(isHolidayCreateOpen || !!selectedHolidayForEdit) && (
        <PublicHolidayFormModal
          open={isHolidayCreateOpen || !!selectedHolidayForEdit}
          onClose={() => {
            setIsHolidayCreateOpen(false);
            setSelectedHolidayForEdit(null);
          }}
          onSuccess={() => {
            setIsHolidayCreateOpen(false);
            setSelectedHolidayForEdit(null);
          }}
          holiday={selectedHolidayForEdit || undefined}
        />
      )}
    </div>
  );
};

export default HrmPage;

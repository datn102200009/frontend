import React, { useState } from 'react';
import clsx from 'clsx';
import { Plus, CheckSquare } from 'lucide-react';
import { Button } from '@shared/ui/Button/Button';

// Tables
import { EmployeeTable } from '@widgets/hrm/EmployeeTable';
import { AttendanceTable } from '@widgets/hrm/AttendanceTable';
import { LeaveRequestTable } from '@widgets/hrm/LeaveRequestTable';
import { SalarySlipTable } from '@widgets/hrm/SalarySlipTable';

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
import { SalarySlipDetailsModal } from '@features/hrm/manage-salary-slip/ui/SalarySlipDetailsModal';
import { RewardFormModal } from '@features/hrm/manage-salary-slip/ui/RewardFormModal';
import { DisciplineFormModal } from '@features/hrm/manage-salary-slip/ui/DisciplineFormModal';

// Types
import type { Employee, LeaveRequest, SalarySlip } from '@entities/hrm/model/types';
import styles from './HrmPage.module.css';

type ActiveTab = 'employees' | 'attendance' | 'leave' | 'salary';

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

  // Other Modals States
  const [isBatchAttendanceOpen, setIsBatchAttendanceOpen] = useState(false);
  const [isLeaveRequestFormOpen, setIsLeaveRequestFormOpen] = useState(false);
  const [selectedLeaveRequestForDetails, setSelectedLeaveRequestForDetails] = useState<LeaveRequest | null>(null);
  const [isInitializeSalarySlipOpen, setIsInitializeSalarySlipOpen] = useState(false);
  const [selectedSalarySlipForDetails, setSelectedSalarySlipForDetails] = useState<SalarySlip | null>(null);

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
          aria-selected={activeTab === 'salary'}
          className={clsx(styles.tab, activeTab === 'salary' && styles.active)}
          onClick={() => setActiveTab('salary')}
        >
          Bảng Lương
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
                <Button icon={<CheckSquare size={16} />} onClick={() => setIsBatchAttendanceOpen(true)}>
                  Chấm Công Hàng Loạt
                </Button>
              </div>
              <AttendanceTable />
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
                <Button icon={<Plus size={16} />} onClick={() => setIsInitializeSalarySlipOpen(true)}>
                  Khởi Tạo Kỳ Lương
                </Button>
              </div>
              <SalarySlipTable onViewDetails={(slip) => setSelectedSalarySlipForDetails(slip)} />
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
        />
      )}

      {/* Leave Request Modals */}
      {isLeaveRequestFormOpen && (
        <LeaveRequestFormModal
          open={isLeaveRequestFormOpen}
          onClose={() => setIsLeaveRequestFormOpen(false)}
          onSuccess={() => setIsLeaveRequestFormOpen(false)}
          // Set standard mock employee or choose first active employee if needed
          employee={{ id: 'emp-1', full_name: 'Nguyễn Văn An', employee_id: 'NV001', employment_status: 'active' }}
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

      {selectedSalarySlipForDetails && (
        <SalarySlipDetailsModal
          open={!!selectedSalarySlipForDetails}
          onClose={() => setSelectedSalarySlipForDetails(null)}
          onSuccess={() => setSelectedSalarySlipForDetails(null)}
          salarySlip={selectedSalarySlipForDetails}
        />
      )}
    </div>
  );
};

export default HrmPage;

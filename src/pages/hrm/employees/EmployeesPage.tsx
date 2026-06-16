import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import { Plus } from 'lucide-react';
import { Button } from '@shared/ui/Button/Button';

// Tables
import { EmployeeTable } from '@widgets/hrm/EmployeeTable';
import { EmploymentHistoryApprovalTable } from '@widgets/hrm/EmploymentHistoryApprovalTable';

// Modals
import { EmployeeFormModal } from '@features/hrm/create-employee/ui/EmployeeFormModal';
import { EmployeeUpdateModal } from '@features/hrm/create-employee/ui/EmployeeUpdateModal';
import { EmployeeDetailsModal } from '@features/hrm/create-employee/ui/EmployeeDetailsModal';
import { UpdateSalaryTitleModal } from '@features/hrm/update-salary-title/ui/UpdateSalaryTitleModal';
import { ContractFormModal } from '@features/hrm/manage-contract/ui/ContractFormModal';
import { TerminateContractModal } from '@features/hrm/manage-contract/ui/TerminateContractModal';


// Hooks & Types
import { useGetHrmEmployeesQuery } from '@entities/hrm/api/hrmApi';
import type { Employee } from '@entities/hrm/model/types';
import styles from '../HrmPage.module.css';

type Tab = 'employees' | 'proposals';

const EmployeesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab') || 'employees';
  
  const activeTab = React.useMemo(() => {
    if (rawTab === 'proposals') return 'proposals';
    return 'employees' as Tab;
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

  const { data: employeeDataResponse } = useGetHrmEmployeesQuery(
    { limit: 100 },
    { skip: !queryId || activeTab !== 'employees' }
  );

  const selectedEmployeeForView = React.useMemo(() => {
    if (!queryId || !employeeDataResponse?.results) return null;
    return (employeeDataResponse.results.find((e) => e.id === queryId) || null) as Employee | null;
  }, [queryId, employeeDataResponse]);

  // Employee Modals States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedEmployeeForUpdate, setSelectedEmployeeForUpdate] = useState<Employee | null>(null);
  const [selectedEmployeeForSalaryUpdate, setSelectedEmployeeForSalaryUpdate] = useState<Employee | null>(null);
  const [selectedEmployeeForContractCreate, setSelectedEmployeeForContractCreate] = useState<Employee | null>(null);

  const [terminationState, setTerminationState] = useState<{ employee: Employee; contractId: string } | null>(null);

  const handleTerminateContractTrigger = (emp: Employee, contractId: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete('id');
      return next;
    }, { replace: true });
    setTerminationState({ employee: emp, contractId });
  };

  const handleCloseViewDetails = () => {
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
          aria-selected={activeTab === 'employees'}
          className={clsx(styles.tab, activeTab === 'employees' && styles.active)}
          onClick={() => setActiveTab('employees')}
        >
          Hồ Sơ Nhân Sự
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'proposals'}
          className={clsx(styles.tab, activeTab === 'proposals' && styles.active)}
          onClick={() => setActiveTab('proposals')}
        >
          Phê Duyệt Đề Xuất
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.container}>
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
                onView={(emp) => {
                  setSearchParams(prev => {
                    const next = new URLSearchParams(prev);
                    if (emp.id) {
                      next.set('id', emp.id);
                    } else {
                      next.delete('id');
                    }
                    return next;
                  }, { replace: true });
                }}
                onEdit={(emp) => setSelectedEmployeeForUpdate(emp)}
                onUpdateSalary={(emp) => setSelectedEmployeeForSalaryUpdate(emp)}
                onCreateContract={(emp) => setSelectedEmployeeForContractCreate(emp)}
              />
            </>
          )}

          {activeTab === 'proposals' && (
            <>
              <div className={styles.header}>
                <div>
                  <h2 className={styles.title}>Phê Duyệt Đề Xuất</h2>
                  <p className={styles.subtitle}>Phê duyệt các thay đổi thông tin nhân sự (lương, chức vụ, phòng ban)</p>
                </div>
              </div>
              <EmploymentHistoryApprovalTable />
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
          onClose={handleCloseViewDetails}
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



      {terminationState && (
        <TerminateContractModal
          open={!!terminationState}
          onClose={() => setTerminationState(null)}
          onSuccess={() => setTerminationState(null)}
          employee={terminationState.employee}
          contractId={terminationState.contractId}
        />
      )}
    </div>
  );
};

export default EmployeesPage;

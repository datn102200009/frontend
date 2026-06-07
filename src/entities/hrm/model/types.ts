import type {
  Employee as GenEmployee,
  EmployeeDetail as GenEmployeeDetail,
  EmploymentContract as GenEmploymentContract,
  EmploymentHistory as GenEmploymentHistory,
  Attendance as GenAttendance,
  LeaveRequest as GenLeaveRequest,
  SalarySlip as GenSalarySlip,
  RewardRecord as GenRewardRecord,
  DisciplineRecord as GenDisciplineRecord,
  PublicHoliday as GenPublicHoliday,
} from '../api/hrmApi';

export type Employee = GenEmployee & {
  id: string;
  employee_id: string;
  full_name: string;
  employment_status: 'active' | 'inactive';
};

export type EmployeeDetail = GenEmployeeDetail & {
  id: string;
  employee_id: string;
  full_name: string;
  employment_status: 'active' | 'inactive';
  contracts: EmploymentContract[];
  employment_histories: EmploymentHistory[];
  rewards: RewardRecord[];
  disciplines: DisciplineRecord[];
};

export type EmploymentContract = GenEmploymentContract & {
  id: string;
  contract_no: string;
  contract_type: 'probation' | 'definite_term' | 'indefinite_term' | 'other';
  status: 'active' | 'expired' | 'terminated';
  start_date: string;
};

export type EmploymentHistory = GenEmploymentHistory & {
  id: string;
  change_type: 'salary_change' | 'title_change' | 'department_transfer' | 'other';
  effective_date: string;
};

export type Attendance = GenAttendance & {
  id: string;
  employee_id: string;
  date: string;
  status: 'working' | 'paid_leave' | 'unpaid_leave' | 'holiday';
};

export type LeaveRequest = GenLeaveRequest & {
  id: string;
  employee_id: string;
  leave_type: 'annual' | 'sick' | 'unpaid' | 'maternity' | 'personal' | 'other';
  status: 'pending' | 'approved' | 'rejected';
  start_date: string;
  end_date: string;
  days: string;
};

export type SalarySlip = GenSalarySlip & {
  id: string;
  employee_id: string;
  salary_period: string;
  status: 'draft' | 'calculated' | 'approved' | 'paid';
};

export type RewardRecord = GenRewardRecord & {
  id: string;
  reward_date: string;
  reward_type: 'performance_bonus' | 'initiative' | 'holiday_bonus' | 'other';
};

export type DisciplineRecord = GenDisciplineRecord & {
  id: string;
  incident_date: string;
  discipline_date: string;
  discipline_type: 'reprimand' | 'warning' | 'salary_deduction' | 'termination' | 'other';
};

export type PublicHoliday = GenPublicHoliday & {
  id: string;
  name: string;
  start_date: string;
  days: number;
};

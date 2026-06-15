import { baseApi as api } from '../../../shared/api/baseApi'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getHrmEmployees: build.query<GetHrmEmployeesApiResponse, GetHrmEmployeesApiArg>({
      query: (queryArg) => ({
        url: `/hrm/employees/`,
        params: {
          search: queryArg.search,
          status: queryArg.status,
          limit: queryArg.limit,
          offset: queryArg.offset,
        },
      }),
    }),
    postHrmEmployeesCreate: build.mutation<
      PostHrmEmployeesCreateApiResponse,
      PostHrmEmployeesCreateApiArg
    >({
      query: (queryArg) => ({ url: `/hrm/employees/create/`, method: 'POST', body: queryArg.body }),
    }),
    getHrmEmployeesById: build.query<GetHrmEmployeesByIdApiResponse, GetHrmEmployeesByIdApiArg>({
      query: (queryArg) => ({ url: `/hrm/employees/${queryArg.id}/` }),
    }),
    patchHrmEmployeesByIdUpdate: build.mutation<
      PatchHrmEmployeesByIdUpdateApiResponse,
      PatchHrmEmployeesByIdUpdateApiArg
    >({
      query: (queryArg) => ({
        url: `/hrm/employees/${queryArg.id}/update/`,
        method: 'PATCH',
        body: queryArg.body,
      }),
    }),
    postHrmEmployeesByIdUpdateSalaryTitle: build.mutation<
      PostHrmEmployeesByIdUpdateSalaryTitleApiResponse,
      PostHrmEmployeesByIdUpdateSalaryTitleApiArg
    >({
      query: (queryArg) => ({
        url: `/hrm/employees/${queryArg.id}/update-salary-title/`,
        method: 'POST',
        body: queryArg.body,
      }),
    }),
    getHrmEmploymentHistories: build.query<
      GetHrmEmploymentHistoriesApiResponse,
      GetHrmEmploymentHistoriesApiArg
    >({
      query: (queryArg) => ({
        url: `/hrm/employment-histories/`,
        params: {
          status: queryArg.status,
          employee_id: queryArg.employeeId,
          limit: queryArg.limit,
          offset: queryArg.offset,
        },
      }),
    }),
    postHrmEmploymentHistoriesByIdApprove: build.mutation<
      PostHrmEmploymentHistoriesByIdApproveApiResponse,
      PostHrmEmploymentHistoriesByIdApproveApiArg
    >({
      query: (queryArg) => ({
        url: `/hrm/employment-histories/${queryArg.id}/approve/`,
        method: 'POST',
      }),
    }),
    postHrmContracts: build.mutation<PostHrmContractsApiResponse, PostHrmContractsApiArg>({
      query: (queryArg) => ({ url: `/hrm/contracts/`, method: 'POST', body: queryArg.body }),
    }),
    postHrmContractsByIdTerminate: build.mutation<
      PostHrmContractsByIdTerminateApiResponse,
      PostHrmContractsByIdTerminateApiArg
    >({
      query: (queryArg) => ({
        url: `/hrm/contracts/${queryArg.id}/terminate/`,
        method: 'POST',
        body: queryArg.body,
      }),
    }),
    getHrmAttendances: build.query<GetHrmAttendancesApiResponse, GetHrmAttendancesApiArg>({
      query: (queryArg) => ({
        url: `/hrm/attendances/`,
        params: {
          date: queryArg.date,
          employee_id: queryArg.employeeId,
        },
      }),
    }),
    postHrmAttendancesBatch: build.mutation<
      PostHrmAttendancesBatchApiResponse,
      PostHrmAttendancesBatchApiArg
    >({
      query: (queryArg) => ({
        url: `/hrm/attendances/batch/`,
        method: 'POST',
        body: queryArg.body,
      }),
    }),
    getHrmLeaveRequests: build.query<GetHrmLeaveRequestsApiResponse, GetHrmLeaveRequestsApiArg>({
      query: (queryArg) => ({
        url: `/hrm/leave-requests/`,
        params: {
          status: queryArg.status,
          employee_id: queryArg.employeeId,
        },
      }),
    }),
    postHrmLeaveRequestsCreate: build.mutation<
      PostHrmLeaveRequestsCreateApiResponse,
      PostHrmLeaveRequestsCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/hrm/leave-requests/create/`,
        method: 'POST',
        body: queryArg.body,
      }),
    }),
    postHrmLeaveRequestsByIdApprove: build.mutation<
      PostHrmLeaveRequestsByIdApproveApiResponse,
      PostHrmLeaveRequestsByIdApproveApiArg
    >({
      query: (queryArg) => ({
        url: `/hrm/leave-requests/${queryArg.id}/approve/`,
        method: 'POST',
        body: queryArg.body,
      }),
    }),
    getHrmSalarySlips: build.query<GetHrmSalarySlipsApiResponse, GetHrmSalarySlipsApiArg>({
      query: (queryArg) => ({
        url: `/hrm/salary-slips/`,
        params: {
          salary_period: queryArg.salaryPeriod,
          employee_id: queryArg.employeeId,
          status: queryArg.status,
        },
      }),
    }),
    getHrmSalaryPeriods: build.query<GetHrmSalaryPeriodsApiResponse, GetHrmSalaryPeriodsApiArg>({
      query: () => ({ url: `/hrm/salary-periods/` }),
    }),
    postHrmSalarySlipsInitialize: build.mutation<
      PostHrmSalarySlipsInitializeApiResponse,
      PostHrmSalarySlipsInitializeApiArg
    >({
      query: (queryArg) => ({
        url: `/hrm/salary-slips/initialize/`,
        method: 'POST',
        body: queryArg.body,
      }),
    }),
    postHrmSalarySlipsByIdCalculate: build.mutation<
      PostHrmSalarySlipsByIdCalculateApiResponse,
      PostHrmSalarySlipsByIdCalculateApiArg
    >({
      query: (queryArg) => ({ url: `/hrm/salary-slips/${queryArg.id}/calculate/`, method: 'POST' }),
    }),
    postHrmSalarySlipsByIdApprove: build.mutation<
      PostHrmSalarySlipsByIdApproveApiResponse,
      PostHrmSalarySlipsByIdApproveApiArg
    >({
      query: (queryArg) => ({ url: `/hrm/salary-slips/${queryArg.id}/approve/`, method: 'POST' }),
    }),
    getHrmRewards: build.query<GetHrmRewardsApiResponse, GetHrmRewardsApiArg>({
      query: (queryArg) => ({
        url: `/hrm/rewards/`,
        params: {
          employee_id: queryArg.employeeId,
        },
      }),
    }),
    postHrmRewards: build.mutation<PostHrmRewardsApiResponse, PostHrmRewardsApiArg>({
      query: (queryArg) => ({ url: `/hrm/rewards/`, method: 'POST', body: queryArg.body }),
    }),
    postHrmRewardsByIdApprove: build.mutation<
      PostHrmRewardsByIdApproveApiResponse,
      PostHrmRewardsByIdApproveApiArg
    >({
      query: (queryArg) => ({ url: `/hrm/rewards/${queryArg.id}/approve/`, method: 'POST' }),
    }),
    getHrmDisciplines: build.query<GetHrmDisciplinesApiResponse, GetHrmDisciplinesApiArg>({
      query: (queryArg) => ({
        url: `/hrm/disciplines/`,
        params: {
          employee_id: queryArg.employeeId,
        },
      }),
    }),
    postHrmDisciplines: build.mutation<PostHrmDisciplinesApiResponse, PostHrmDisciplinesApiArg>({
      query: (queryArg) => ({ url: `/hrm/disciplines/`, method: 'POST', body: queryArg.body }),
    }),
    postHrmDisciplinesByIdApprove: build.mutation<
      PostHrmDisciplinesByIdApproveApiResponse,
      PostHrmDisciplinesByIdApproveApiArg
    >({
      query: (queryArg) => ({ url: `/hrm/disciplines/${queryArg.id}/approve/`, method: 'POST' }),
    }),
    postHrmSalarySlipsBulkConfirmPay: build.mutation<
      PostHrmSalarySlipsBulkConfirmPayApiResponse,
      PostHrmSalarySlipsBulkConfirmPayApiArg
    >({
      query: (queryArg) => ({
        url: `/hrm/salary-slips/bulk-confirm-pay/`,
        method: 'POST',
        body: queryArg.body,
      }),
    }),
    getHrmPublicHolidays: build.query<GetHrmPublicHolidaysApiResponse, GetHrmPublicHolidaysApiArg>({
      query: (queryArg) => ({
        url: `/hrm/public-holidays/`,
        params: {
          year: queryArg.year,
        },
      }),
    }),
    postHrmPublicHolidays: build.mutation<
      PostHrmPublicHolidaysApiResponse,
      PostHrmPublicHolidaysApiArg
    >({
      query: (queryArg) => ({ url: `/hrm/public-holidays/`, method: 'POST', body: queryArg.body }),
    }),
    getHrmPublicHolidaysById: build.query<
      GetHrmPublicHolidaysByIdApiResponse,
      GetHrmPublicHolidaysByIdApiArg
    >({
      query: (queryArg) => ({ url: `/hrm/public-holidays/${queryArg.id}/` }),
    }),
    putHrmPublicHolidaysById: build.mutation<
      PutHrmPublicHolidaysByIdApiResponse,
      PutHrmPublicHolidaysByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/hrm/public-holidays/${queryArg.id}/`,
        method: 'PUT',
        body: queryArg.body,
      }),
    }),
    patchHrmPublicHolidaysById: build.mutation<
      PatchHrmPublicHolidaysByIdApiResponse,
      PatchHrmPublicHolidaysByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/hrm/public-holidays/${queryArg.id}/`,
        method: 'PATCH',
        body: queryArg.body,
      }),
    }),
    deleteHrmPublicHolidaysById: build.mutation<
      DeleteHrmPublicHolidaysByIdApiResponse,
      DeleteHrmPublicHolidaysByIdApiArg
    >({
      query: (queryArg) => ({ url: `/hrm/public-holidays/${queryArg.id}/`, method: 'DELETE' }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as hrmApi }
export type GetHrmEmployeesApiResponse = /** status 200 Lấy danh sách thành công */ {
  count?: number
  results?: Employee[]
}
export type GetHrmEmployeesApiArg = {
  /** Tìm kiếm theo mã nhân viên hoặc tên đầy đủ. */
  search?: string
  /** Lọc theo trạng thái làm việc. */
  status?: 'active' | 'inactive'
  /** Số lượng bản ghi giới hạn trên mỗi trang. */
  limit?: number
  /** Vị trí bắt đầu lấy bản ghi. */
  offset?: number
}
export type PostHrmEmployeesCreateApiResponse = /** status 201 Tạo thành công */ Employee
export type PostHrmEmployeesCreateApiArg = {
  body: {
    employee_id: string
    full_name: string
    department?: string
    position_title?: string
    salary_base?: number
    email?: string
    phone?: string
    gender?: 'male' | 'female' | 'other'
    date_of_birth?: string
    address?: string
    join_date?: string
    /** Đặt là True nếu muốn tạo tài khoản đăng nhập đi kèm. */
    create_user?: boolean
    username?: string
    password?: string
    role_id?: string
  }
}
export type GetHrmEmployeesByIdApiResponse = /** status 200 Thành công */ EmployeeDetail
export type GetHrmEmployeesByIdApiArg = {
  id: string
}
export type PatchHrmEmployeesByIdUpdateApiResponse = /** status 200 Cập nhật thành công */ Employee
export type PatchHrmEmployeesByIdUpdateApiArg = {
  id: string
  body: {
    full_name?: string
    phone?: string
    address?: string
    employment_status?: 'active' | 'inactive'
  }
}
export type PostHrmEmployeesByIdUpdateSalaryTitleApiResponse =
  /** status 200 Cập nhật thành công */ Employee
export type PostHrmEmployeesByIdUpdateSalaryTitleApiArg = {
  id: string
  body: {
    change_type: 'salary_change' | 'title_change' | 'department_transfer' | 'other'
    new_salary_base?: number
    new_title?: string
    new_department?: string
    effective_date: string
    reason?: string
  }
}
export type GetHrmEmploymentHistoriesApiResponse = /** status 200 Thành công */ {
  count?: number
  total_pages?: number
  next?: string | null
  previous?: string | null
  results?: EmploymentHistory[]
}
export type GetHrmEmploymentHistoriesApiArg = {
  /** Lọc theo trạng thái phê duyệt. */
  status?: 'pending_approval' | 'approved' | 'rejected'
  /** Lọc theo ID nhân viên. */
  employeeId?: string
  limit?: number
  offset?: number
}
export type PostHrmEmploymentHistoriesByIdApproveApiResponse =
  /** status 200 Phê duyệt thành công */ EmploymentHistory
export type PostHrmEmploymentHistoriesByIdApproveApiArg = {
  id: string
}
export type PostHrmContractsApiResponse = /** status 201 Tạo thành công */ EmploymentContract
export type PostHrmContractsApiArg = {
  body: {
    employee_id: string
    contract_no: string
    contract_type: 'probation' | 'definite_term' | 'indefinite_term' | 'other'
    start_date: string
    end_date?: string
    note?: string
    file_url?: string
  }
}
export type PostHrmContractsByIdTerminateApiResponse =
  /** status 200 Chấm dứt thành công */ EmploymentContract
export type PostHrmContractsByIdTerminateApiArg = {
  id: string
  body: {
    termination_date: string
    reason: string
    file_url?: string
    /** Nghỉ việc đúng luật (true) hoặc trái luật/nghỉ ngang (false) */
    is_lawful?: boolean
    /** Số ngày phép năm chưa nghỉ cần thanh toán */
    unused_leave_days?: number
    /** Số ngày công chuẩn của tháng quyết toán */
    standard_working_days?: number
    /** Số ngày vi phạm thời hạn báo trước (nếu nghỉ trái luật) */
    unnotified_days?: number
  }
}
export type GetHrmAttendancesApiResponse = /** status 200 Thành công */ {
  count?: number
  results?: Attendance[]
}
export type GetHrmAttendancesApiArg = {
  /** Lọc chấm công theo ngày cụ thể (YYYY-MM-DD). */
  date?: string
  /** Lọc chấm công theo ID của nhân viên. */
  employeeId?: string
}
export type PostHrmAttendancesBatchApiResponse = /** status 201 Ghi nhận thành công */ Attendance[]
export type PostHrmAttendancesBatchApiArg = {
  body: {
    date: string
    records: {
      employee_id: string
      status: 'working' | 'paid_leave' | 'unpaid_leave' | 'holiday'
      work_hours?: number
      overtime_hours?: number
      remarks?: string
    }[]
  }
}
export type GetHrmLeaveRequestsApiResponse = /** status 200 Thành công */ LeaveRequest[]
export type GetHrmLeaveRequestsApiArg = {
  status?: 'pending' | 'approved' | 'rejected'
  employeeId?: string
}
export type PostHrmLeaveRequestsCreateApiResponse =
  /** status 201 Tạo đơn thành công */ LeaveRequest
export type PostHrmLeaveRequestsCreateApiArg = {
  body: {
    employee_id: string
    leave_type: 'paid' | 'unpaid'
    start_date: string
    end_date: string
    days: number
    reason?: string | null
  }
}
export type PostHrmLeaveRequestsByIdApproveApiResponse =
  /** status 200 Xử lý thành công */ LeaveRequest
export type PostHrmLeaveRequestsByIdApproveApiArg = {
  id: string
  body: {
    action: 'approve' | 'reject'
  }
}
export type GetHrmSalarySlipsApiResponse = /** status 200 Thành công */ SalarySlip[]
export type GetHrmSalarySlipsApiArg = {
  /** Lọc kỳ lương dạng YYYY-MM */
  salaryPeriod?: string
  employeeId?: string
  status?: 'draft' | 'calculated' | 'approved' | 'paid'
}
export type GetHrmSalaryPeriodsApiResponse = /** status 200 Thành công */ string[]
export type GetHrmSalaryPeriodsApiArg = void
export type PostHrmSalarySlipsInitializeApiResponse =
  /** status 201 Khởi tạo thành công */ SalarySlip[]
export type PostHrmSalarySlipsInitializeApiArg = {
  body: {
    /** Kỳ lương cần khởi tạo (YYYY-MM) */
    salary_period: string
  }
}
export type PostHrmSalarySlipsByIdCalculateApiResponse =
  /** status 200 Tính toán thành công */ SalarySlip
export type PostHrmSalarySlipsByIdCalculateApiArg = {
  id: string
}
export type PostHrmSalarySlipsByIdApproveApiResponse =
  /** status 200 Phê duyệt thành công */ SalarySlip
export type PostHrmSalarySlipsByIdApproveApiArg = {
  id: string
}
export type GetHrmRewardsApiResponse = /** status 200 Thành công */ RewardRecord[]
export type GetHrmRewardsApiArg = {
  /** Lọc theo ID nhân viên */
  employeeId?: string
}
export type PostHrmRewardsApiResponse = /** status 201 Ghi nhận thành công */ RewardRecord
export type PostHrmRewardsApiArg = {
  body: {
    employee_id: string
    reward_date: string
    reward_type: 'performance_bonus' | 'initiative' | 'holiday_bonus' | 'other'
    amount: number
    description: string
    salary_slip_id?: string | null
  }
}
export type PostHrmRewardsByIdApproveApiResponse =
  /** status 200 Phê duyệt thành công */ RewardRecord
export type PostHrmRewardsByIdApproveApiArg = {
  id: string
}
export type GetHrmDisciplinesApiResponse = /** status 200 Thành công */ DisciplineRecord[]
export type GetHrmDisciplinesApiArg = {
  /** Lọc theo ID nhân viên */
  employeeId?: string
}
export type PostHrmDisciplinesApiResponse = /** status 201 Ghi nhận thành công */ DisciplineRecord
export type PostHrmDisciplinesApiArg = {
  body: {
    employee_id: string
    incident_date: string
    discipline_date: string
    discipline_type: 'reprimand' | 'warning' | 'salary_deduction' | 'termination' | 'other'
    description: string
    penalty_amount?: number
    salary_slip_id?: string | null
    file_url?: string
  }
}
export type PostHrmDisciplinesByIdApproveApiResponse =
  /** status 200 Phê duyệt thành công */ DisciplineRecord
export type PostHrmDisciplinesByIdApproveApiArg = {
  id: string
}
export type PostHrmSalarySlipsBulkConfirmPayApiResponse =
  /** status 200 Xác nhận và thanh toán lương nhanh thành công */ SalarySlip[]
export type PostHrmSalarySlipsBulkConfirmPayApiArg = {
  body: {
    /** Kỳ lương cần thanh toán (YYYY-MM) */
    salary_period: string
    /** Hình thức chi trả lương */
    payment_method: 'cash' | 'bank_transfer'
  }
}
export type GetHrmPublicHolidaysApiResponse = /** status 200 Thành công */ PublicHoliday[]
export type GetHrmPublicHolidaysApiArg = {
  /** Lọc ngày nghỉ lễ theo năm cụ thể. Bao gồm cả các ngày nghỉ lễ kéo dài vắt qua ranh giới năm. */
  year?: number
}
export type PostHrmPublicHolidaysApiResponse = /** status 201 Tạo thành công */ PublicHoliday
export type PostHrmPublicHolidaysApiArg = {
  body: {
    name: string
    start_date: string
    days?: number
    description?: string
  }
}
export type GetHrmPublicHolidaysByIdApiResponse = /** status 200 Thành công */ PublicHoliday
export type GetHrmPublicHolidaysByIdApiArg = {
  /** ID của ngày nghỉ lễ */
  id: string
}
export type PutHrmPublicHolidaysByIdApiResponse =
  /** status 200 Cập nhật thành công */ PublicHoliday
export type PutHrmPublicHolidaysByIdApiArg = {
  /** ID của ngày nghỉ lễ */
  id: string
  body: {
    name: string
    start_date: string
    days?: number
    description?: string
  }
}
export type PatchHrmPublicHolidaysByIdApiResponse =
  /** status 200 Cập nhật thành công */ PublicHoliday
export type PatchHrmPublicHolidaysByIdApiArg = {
  /** ID của ngày nghỉ lễ */
  id: string
  body: {
    name?: string
    date?: string
    description?: string
  }
}
export type DeleteHrmPublicHolidaysByIdApiResponse = unknown
export type DeleteHrmPublicHolidaysByIdApiArg = {
  /** ID của ngày nghỉ lễ */
  id: string
}
export type Employee = {
  id?: string
  /** Mã nhân viên duy nhất (ví dụ NV001) */
  employee_id?: string
  full_name?: string
  department?: string | null
  position_title?: string | null
  /** Lương cơ bản dạng Decimal */
  salary_base?: string | null
  email?: string | null
  phone?: string | null
  gender?: ('male' | 'female' | 'other') | null
  date_of_birth?: string | null
  address?: string | null
  emergency_contact?: string | null
  join_date?: string | null
  leave_date?: string | null
  employment_status?: 'active' | 'inactive'
  created_at?: string
  updated_at?: string
}
export type ErrorResponse = {
  detail?: string
}
export type EmploymentContract = {
  id?: string
  contract_no?: string
  contract_type?: 'probation' | 'definite_term' | 'indefinite_term' | 'other'
  start_date?: string
  end_date?: string | null
  status?: 'active' | 'expired' | 'terminated'
  note?: string | null
  file_url?: string | null
  created_at?: string
  updated_at?: string
}
export type EmploymentHistory = {
  id?: string
  employee_id?: string
  employee_code?: string | null
  employee_name?: string | null
  change_type?: 'salary_change' | 'title_change' | 'department_transfer' | 'other'
  old_salary_base?: string | null
  new_salary_base?: string | null
  old_title?: string | null
  new_title?: string | null
  old_department?: string | null
  new_department?: string | null
  effective_date?: string
  approved_by_id?: string | null
  approved_by_username?: string | null
  reason?: string | null
  status?: 'pending_approval' | 'approved' | 'rejected'
  created_at?: string
}
export type EmployeeDocument = {
  id?: string
  doc_type?: string
  title?: string
  file_url?: string
  uploaded_by_id?: string
  uploaded_by_username?: string
  created_at?: string
  updated_at?: string
}
export type RewardRecord = {
  id?: string
  employee_id?: string
  employee_code?: string
  employee_name?: string
  reward_date?: string
  reward_type?: 'performance_bonus' | 'initiative' | 'holiday_bonus' | 'other'
  amount?: string | null
  description?: string
  salary_slip_id?: string | null
  status?: 'pending_approval' | 'approved' | 'rejected'
  approved_by_id?: string | null
  created_at?: string
}
export type DisciplineRecord = {
  id?: string
  employee_id?: string
  employee_code?: string
  employee_name?: string
  incident_date?: string
  discipline_date?: string
  discipline_type?: 'reprimand' | 'warning' | 'salary_deduction' | 'termination' | 'other'
  description?: string
  penalty_amount?: string | null
  salary_slip_id?: string | null
  file_url?: string | null
  status?: 'pending_approval' | 'approved' | 'rejected'
  approved_by_id?: string | null
  created_at?: string
}
export type EmployeeDetail = Employee & {
  contracts?: EmploymentContract[]
  employment_histories?: EmploymentHistory[]
  documents?: EmployeeDocument[]
  rewards?: RewardRecord[]
  disciplines?: DisciplineRecord[]
}
export type Attendance = {
  id?: string
  employee_id?: string
  employee_code?: string
  employee_name?: string
  date?: string
  status?: 'working' | 'paid_leave' | 'unpaid_leave' | 'holiday'
  work_hours?: string
  overtime_hours?: string
  remarks?: string | null
  created_at?: string
  updated_at?: string
}
export type LeaveRequest = {
  id?: string
  employee_id?: string
  employee_code?: string
  employee_name?: string
  leave_type?: 'paid' | 'unpaid'
  start_date?: string
  end_date?: string
  days?: string
  reason?: string | null
  status?: 'pending' | 'approved' | 'rejected'
  approved_by_id?: string | null
  approved_by_username?: string | null
  approved_at?: string | null
  created_at?: string
  updated_at?: string
}
export type SalarySlip = {
  id?: string
  name?: string
  employee_id?: string
  employee_code?: string
  employee_name?: string
  /** Định dạng YYYY-MM */
  salary_period?: string
  base_salary?: string
  overtime_amount?: string
  allowance_amount?: string
  reward_amount_total?: string
  discipline_deduction_total?: string
  gross_pay?: string
  deductions?: string
  net_pay?: string
  payment_method?: ('cash' | 'bank_transfer') | null
  status?: 'draft' | 'calculated' | 'approved' | 'paid'
  remarks?: string | null
  /** Chi tiết bảng lương bao gồm lương theo ngày công và phân loại các loại lương tăng ca ngoài giờ (OT ngày thường 1.5x, OT Chủ Nhật 2.0x, OT ngày Lễ 3.0x, OT ngày nghỉ bù theo cấu hình HRM_COMPENSATORY_OVERTIME_RATE). */
  breakdown?: {
    /** Số ngày công tiêu chuẩn hằng tháng theo chế độ làm việc của doanh nghiệp (ví dụ 26 ngày). */
    standard_working_days?: number
    incomes?: {
      name?: string
      amount?: number
    }[]
    deductions?: {
      name?: string
      amount?: number
    }[]
  } | null
  created_at?: string
  updated_at?: string
}
export type PublicHoliday = {
  id?: string
  name?: string
  start_date?: string
  days?: number
  description?: string | null
  created_at?: string
  updated_at?: string
}
export const {
  useGetHrmEmployeesQuery,
  usePostHrmEmployeesCreateMutation,
  useGetHrmEmployeesByIdQuery,
  usePatchHrmEmployeesByIdUpdateMutation,
  usePostHrmEmployeesByIdUpdateSalaryTitleMutation,
  useGetHrmEmploymentHistoriesQuery,
  usePostHrmEmploymentHistoriesByIdApproveMutation,
  usePostHrmContractsMutation,
  usePostHrmContractsByIdTerminateMutation,
  useGetHrmAttendancesQuery,
  usePostHrmAttendancesBatchMutation,
  useGetHrmLeaveRequestsQuery,
  usePostHrmLeaveRequestsCreateMutation,
  usePostHrmLeaveRequestsByIdApproveMutation,
  useGetHrmSalarySlipsQuery,
  useGetHrmSalaryPeriodsQuery,
  usePostHrmSalarySlipsInitializeMutation,
  usePostHrmSalarySlipsByIdCalculateMutation,
  usePostHrmSalarySlipsByIdApproveMutation,
  useGetHrmRewardsQuery,
  usePostHrmRewardsMutation,
  usePostHrmRewardsByIdApproveMutation,
  useGetHrmDisciplinesQuery,
  usePostHrmDisciplinesMutation,
  usePostHrmDisciplinesByIdApproveMutation,
  usePostHrmSalarySlipsBulkConfirmPayMutation,
  useGetHrmPublicHolidaysQuery,
  usePostHrmPublicHolidaysMutation,
  useGetHrmPublicHolidaysByIdQuery,
  usePutHrmPublicHolidaysByIdMutation,
  usePatchHrmPublicHolidaysByIdMutation,
  useDeleteHrmPublicHolidaysByIdMutation,
} = injectedRtkApi

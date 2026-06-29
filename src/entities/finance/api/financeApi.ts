import { baseApi as api } from '../../../shared/api/baseApi'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getFinanceCashFlows: build.query<GetFinanceCashFlowsApiResponse, GetFinanceCashFlowsApiArg>({
      query: (queryArg) => ({
        url: `/finance/cash-flows/`,
        params: {
          limit: queryArg.limit,
          page: queryArg.page,
          status: queryArg.status,
        },
      }),
    }),
    postFinanceCashFlows: build.mutation<
      PostFinanceCashFlowsApiResponse,
      PostFinanceCashFlowsApiArg
    >({
      query: (queryArg) => ({
        url: `/finance/cash-flows/`,
        method: 'POST',
        body: queryArg.cashFlowInput,
      }),
    }),
    getFinanceCashFlowsByPk: build.query<
      GetFinanceCashFlowsByPkApiResponse,
      GetFinanceCashFlowsByPkApiArg
    >({
      query: (queryArg) => ({ url: `/finance/cash-flows/${queryArg.pk}/` }),
    }),
    postFinanceCashFlowsByPkApprove: build.mutation<
      PostFinanceCashFlowsByPkApproveApiResponse,
      PostFinanceCashFlowsByPkApproveApiArg
    >({
      query: (queryArg) => ({ url: `/finance/cash-flows/${queryArg.pk}/approve/`, method: 'POST' }),
    }),
    postFinanceCashFlowsByPkReject: build.mutation<
      PostFinanceCashFlowsByPkRejectApiResponse,
      PostFinanceCashFlowsByPkRejectApiArg
    >({
      query: (queryArg) => ({
        url: `/finance/cash-flows/${queryArg.pk}/reject/`,
        method: 'POST',
        body: queryArg.body,
      }),
    }),
    getFinanceFixedAssets: build.query<
      GetFinanceFixedAssetsApiResponse,
      GetFinanceFixedAssetsApiArg
    >({
      query: (queryArg) => ({
        url: `/finance/fixed-assets/`,
        params: {
          limit: queryArg.limit,
          page: queryArg.page,
          status__in: queryArg.statusIn,
          assignable: queryArg.assignable,
          depreciation_method: queryArg.depreciationMethod,
        },
      }),
    }),
    postFinanceFixedAssets: build.mutation<
      PostFinanceFixedAssetsApiResponse,
      PostFinanceFixedAssetsApiArg
    >({
      query: (queryArg) => ({
        url: `/finance/fixed-assets/`,
        method: 'POST',
        body: queryArg.fixedAssetPurchaseInput,
      }),
    }),
    getFinanceFixedAssetsByPk: build.query<
      GetFinanceFixedAssetsByPkApiResponse,
      GetFinanceFixedAssetsByPkApiArg
    >({
      query: (queryArg) => ({ url: `/finance/fixed-assets/${queryArg.pk}/` }),
    }),
    patchFinanceFixedAssetsByPk: build.mutation<
      PatchFinanceFixedAssetsByPkApiResponse,
      PatchFinanceFixedAssetsByPkApiArg
    >({
      query: (queryArg) => ({
        url: `/finance/fixed-assets/${queryArg.pk}/`,
        method: 'PATCH',
        body: queryArg.fixedAssetUpdateInput,
      }),
    }),
    deleteFinanceFixedAssetsByPk: build.mutation<
      DeleteFinanceFixedAssetsByPkApiResponse,
      DeleteFinanceFixedAssetsByPkApiArg
    >({
      query: (queryArg) => ({ url: `/finance/fixed-assets/${queryArg.pk}/`, method: 'DELETE' }),
    }),
    postFinanceFixedAssetsByPkRequestDispose: build.mutation<
      PostFinanceFixedAssetsByPkRequestDisposeApiResponse,
      PostFinanceFixedAssetsByPkRequestDisposeApiArg
    >({
      query: (queryArg) => ({
        url: `/finance/fixed-assets/${queryArg.pk}/request-dispose/`,
        method: 'POST',
        body: queryArg.fixedAssetRequestDisposeInput,
      }),
    }),
    postFinanceFixedAssetsDepreciation: build.mutation<
      PostFinanceFixedAssetsDepreciationApiResponse,
      PostFinanceFixedAssetsDepreciationApiArg
    >({
      query: (queryArg) => ({
        url: `/finance/fixed-assets/depreciation/`,
        method: 'POST',
        body: queryArg.runDepreciationInput,
      }),
    }),
    getFinanceFixedAssetsDepreciationLogs: build.query<
      GetFinanceFixedAssetsDepreciationLogsApiResponse,
      GetFinanceFixedAssetsDepreciationLogsApiArg
    >({
      query: (queryArg) => ({
        url: `/finance/fixed-assets/depreciation-logs/`,
        params: {
          period: queryArg.period,
          asset_id: queryArg.assetId,
          limit: queryArg.limit,
          page: queryArg.page,
        },
      }),
    }),
    getFinanceInvoicesPurchase: build.query<
      GetFinanceInvoicesPurchaseApiResponse,
      GetFinanceInvoicesPurchaseApiArg
    >({
      query: (queryArg) => ({
        url: `/finance/invoices/purchase/`,
        params: {
          status: queryArg.status,
          search: queryArg.search,
          limit: queryArg.limit,
          page: queryArg.page,
        },
      }),
    }),
    getFinanceInvoicesPurchaseByPk: build.query<
      GetFinanceInvoicesPurchaseByPkApiResponse,
      GetFinanceInvoicesPurchaseByPkApiArg
    >({
      query: (queryArg) => ({ url: `/finance/invoices/purchase/${queryArg.pk}/` }),
    }),
    postFinanceInvoicesPurchaseByPkPay: build.mutation<
      PostFinanceInvoicesPurchaseByPkPayApiResponse,
      PostFinanceInvoicesPurchaseByPkPayApiArg
    >({
      query: (queryArg) => ({
        url: `/finance/invoices/purchase/${queryArg.pk}/pay/`,
        method: 'POST',
        body: queryArg.payInvoiceInput,
      }),
    }),
    getFinanceInvoicesSales: build.query<
      GetFinanceInvoicesSalesApiResponse,
      GetFinanceInvoicesSalesApiArg
    >({
      query: (queryArg) => ({
        url: `/finance/invoices/sales/`,
        params: {
          status: queryArg.status,
          search: queryArg.search,
          limit: queryArg.limit,
          page: queryArg.page,
        },
      }),
    }),
    getFinanceInvoicesSalesByPk: build.query<
      GetFinanceInvoicesSalesByPkApiResponse,
      GetFinanceInvoicesSalesByPkApiArg
    >({
      query: (queryArg) => ({ url: `/finance/invoices/sales/${queryArg.pk}/` }),
    }),
    postFinanceInvoicesSalesByPkCollect: build.mutation<
      PostFinanceInvoicesSalesByPkCollectApiResponse,
      PostFinanceInvoicesSalesByPkCollectApiArg
    >({
      query: (queryArg) => ({
        url: `/finance/invoices/sales/${queryArg.pk}/collect/`,
        method: 'POST',
        body: queryArg.collectInvoiceInput,
      }),
    }),
    postFinanceSalarySlipsBulkApprovePay: build.mutation<
      PostFinanceSalarySlipsBulkApprovePayApiResponse,
      PostFinanceSalarySlipsBulkApprovePayApiArg
    >({
      query: (queryArg) => ({
        url: `/finance/salary-slips/bulk-approve-pay/`,
        method: 'POST',
        body: queryArg.salarySlipBulkApprovePayInput,
      }),
    }),
    postFinanceSalarySlipsBulkApprove: build.mutation<
      PostFinanceSalarySlipsBulkApproveApiResponse,
      PostFinanceSalarySlipsBulkApproveApiArg
    >({
      query: (queryArg) => ({
        url: `/finance/salary-slips/bulk-approve/`,
        method: 'POST',
        body: queryArg.salarySlipBulkApproveInput,
      }),
    }),
    postFinanceSalarySlipsBulkPay: build.mutation<
      PostFinanceSalarySlipsBulkPayApiResponse,
      PostFinanceSalarySlipsBulkPayApiArg
    >({
      query: (queryArg) => ({
        url: `/finance/salary-slips/bulk-pay/`,
        method: 'POST',
        body: queryArg.salarySlipBulkPayInput,
      }),
    }),
    postFinanceSalarySlipsByIdApprove: build.mutation<
      PostFinanceSalarySlipsByIdApproveApiResponse,
      PostFinanceSalarySlipsByIdApproveApiArg
    >({
      query: (queryArg) => ({
        url: `/finance/salary-slips/${queryArg.id}/approve/`,
        method: 'POST',
      }),
    }),
    postFinanceSalarySlipsByIdReject: build.mutation<
      PostFinanceSalarySlipsByIdRejectApiResponse,
      PostFinanceSalarySlipsByIdRejectApiArg
    >({
      query: (queryArg) => ({
        url: `/finance/salary-slips/${queryArg.id}/reject/`,
        method: 'POST',
        body: queryArg.salarySlipRejectInput,
      }),
    }),
    postFinanceSalarySlipsByIdPay: build.mutation<
      PostFinanceSalarySlipsByIdPayApiResponse,
      PostFinanceSalarySlipsByIdPayApiArg
    >({
      query: (queryArg) => ({
        url: `/finance/salary-slips/${queryArg.id}/pay/`,
        method: 'POST',
        body: queryArg.salarySlipPaymentInput,
      }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as financeApi }
export type GetFinanceCashFlowsApiResponse = /** status 200 A paginated list of cash flows. */ {
  count?: number
  total_pages?: number
  current_page?: number
  results?: CashFlowTransaction[]
}
export type GetFinanceCashFlowsApiArg = {
  limit?: number
  page?: number
  status?: string
}
export type PostFinanceCashFlowsApiResponse =
  /** status 201 Cash flow successfully created and cross-updated. */ CashFlowTransaction
export type PostFinanceCashFlowsApiArg = {
  cashFlowInput: CashFlowInput
}
export type GetFinanceCashFlowsByPkApiResponse =
  /** status 200 Cash flow details. */ CashFlowTransaction
export type GetFinanceCashFlowsByPkApiArg = {
  pk: string
}
export type PostFinanceCashFlowsByPkApproveApiResponse =
  /** status 200 Cash flow transaction successfully approved. */ CashFlowTransaction
export type PostFinanceCashFlowsByPkApproveApiArg = {
  pk: string
}
export type PostFinanceCashFlowsByPkRejectApiResponse =
  /** status 200 Cash flow transaction successfully rejected. */ CashFlowTransaction
export type PostFinanceCashFlowsByPkRejectApiArg = {
  pk: string
  body: {
    /** Optional reason for rejecting the transaction. */
    remarks?: string
  }
}
export type GetFinanceFixedAssetsApiResponse = /** status 200 A paginated list of fixed assets. */ {
  count?: number
  total_pages?: number
  current_page?: number
  results?: FixedAsset[]
}
export type GetFinanceFixedAssetsApiArg = {
  limit?: number
  page?: number
  /** Comma-separated list of statuses to filter by. */
  statusIn?: string
  /** If true, only returns idle assets. */
  assignable?: boolean
  /** Depreciation method to filter by. */
  depreciationMethod?: 'straight_line' | 'unit_of_production'
}
export type PostFinanceFixedAssetsApiResponse =
  /** status 201 Fixed asset successfully created. */ FixedAsset
export type PostFinanceFixedAssetsApiArg = {
  fixedAssetPurchaseInput: FixedAssetPurchaseInput
}
export type GetFinanceFixedAssetsByPkApiResponse = /** status 200 Fixed asset details. */ FixedAsset
export type GetFinanceFixedAssetsByPkApiArg = {
  pk: string
}
export type PatchFinanceFixedAssetsByPkApiResponse =
  /** status 200 Fixed asset successfully updated. */ FixedAsset
export type PatchFinanceFixedAssetsByPkApiArg = {
  pk: string
  fixedAssetUpdateInput: FixedAssetUpdateInput
}
export type DeleteFinanceFixedAssetsByPkApiResponse =
  /** status 200 Fixed asset successfully deleted. */ {
    message?: string
  }
export type DeleteFinanceFixedAssetsByPkApiArg = {
  pk: string
}
export type PostFinanceFixedAssetsByPkRequestDisposeApiResponse =
  /** status 200 Fixed asset disposal request successfully registered. */ FixedAsset
export type PostFinanceFixedAssetsByPkRequestDisposeApiArg = {
  pk: string
  fixedAssetRequestDisposeInput: FixedAssetRequestDisposeInput
}
export type PostFinanceFixedAssetsDepreciationApiResponse =
  /** status 201 Depreciation successfully processed. Returns logs generated. */ FixedAssetDepreciationLog[]
export type PostFinanceFixedAssetsDepreciationApiArg = {
  runDepreciationInput: RunDepreciationInput
}
export type GetFinanceFixedAssetsDepreciationLogsApiResponse =
  /** status 200 A paginated list of depreciation logs. */ {
    count?: number
    total_pages?: number
    current_page?: number
    results?: FixedAssetDepreciationLog[]
  }
export type GetFinanceFixedAssetsDepreciationLogsApiArg = {
  period?: string
  assetId?: string
  limit?: number
  page?: number
}
export type GetFinanceInvoicesPurchaseApiResponse =
  /** status 200 A paginated list of purchase invoices. */ {
    count?: number
    total_pages?: number
    current_page?: number
    results?: PurchaseInvoice[]
  }
export type GetFinanceInvoicesPurchaseApiArg = {
  status?: string
  search?: string
  limit?: number
  page?: number
}
export type GetFinanceInvoicesPurchaseByPkApiResponse =
  /** status 200 Purchase invoice details. */ PurchaseInvoice
export type GetFinanceInvoicesPurchaseByPkApiArg = {
  pk: string
}
export type PostFinanceInvoicesPurchaseByPkPayApiResponse =
  /** status 200 Thanh toán thành công, trả về hóa đơn đã cập nhật. */ PurchaseInvoice
export type PostFinanceInvoicesPurchaseByPkPayApiArg = {
  pk: string
  payInvoiceInput: PayInvoiceInput
}
export type GetFinanceInvoicesSalesApiResponse =
  /** status 200 A paginated list of sales invoices. */ {
    count?: number
    total_pages?: number
    current_page?: number
    results?: SalesInvoice[]
  }
export type GetFinanceInvoicesSalesApiArg = {
  status?: string
  search?: string
  limit?: number
  page?: number
}
export type GetFinanceInvoicesSalesByPkApiResponse =
  /** status 200 Sales invoice details. */ SalesInvoice
export type GetFinanceInvoicesSalesByPkApiArg = {
  pk: string
}
export type PostFinanceInvoicesSalesByPkCollectApiResponse =
  /** status 200 Thu tiền thành công, trả về hóa đơn bán hàng đã cập nhật. */ SalesInvoice
export type PostFinanceInvoicesSalesByPkCollectApiArg = {
  pk: string
  collectInvoiceInput: CollectInvoiceInput
}
export type PostFinanceSalarySlipsBulkApprovePayApiResponse =
  /** status 200 Phê duyệt và thanh toán thành công. */ SalarySlip[]
export type PostFinanceSalarySlipsBulkApprovePayApiArg = {
  salarySlipBulkApprovePayInput: SalarySlipBulkApprovePayInput
}
export type PostFinanceSalarySlipsBulkApproveApiResponse =
  /** status 200 Phê duyệt thành công. */ SalarySlip[]
export type PostFinanceSalarySlipsBulkApproveApiArg = {
  salarySlipBulkApproveInput: SalarySlipBulkApproveInput
}
export type PostFinanceSalarySlipsBulkPayApiResponse =
  /** status 200 Chi trả thành công. */ SalarySlip[]
export type PostFinanceSalarySlipsBulkPayApiArg = {
  salarySlipBulkPayInput: SalarySlipBulkPayInput
}
export type PostFinanceSalarySlipsByIdApproveApiResponse =
  /** status 200 Phê duyệt thành công. */ SalarySlip
export type PostFinanceSalarySlipsByIdApproveApiArg = {
  id: string
}
export type PostFinanceSalarySlipsByIdRejectApiResponse =
  /** status 200 Từ chối thành công. */ SalarySlip
export type PostFinanceSalarySlipsByIdRejectApiArg = {
  id: string
  salarySlipRejectInput: SalarySlipRejectInput
}
export type PostFinanceSalarySlipsByIdPayApiResponse =
  /** status 200 Chi trả thành công. */ SalarySlip
export type PostFinanceSalarySlipsByIdPayApiArg = {
  id: string
  salarySlipPaymentInput: SalarySlipPaymentInput
}
export type CashFlowTransaction = {
  id?: string
  name?: string
  payment_type?: 'receive' | 'pay'
  category?: string
  amount?: string
  payment_date?: string
  remarks?: string
  purchase_order?: string | null
  sales_order?: string | null
  purchase_invoice?: string | null
  sales_invoice?: string | null
  fixed_asset?: string | null
  fixed_asset_code?: string | null
  status?: 'draft' | 'pending_approval' | 'posted' | 'rejected'
  approved_by?: string | null
  approved_by_username?: string | null
  approved_at?: string | null
  created_at?: string
  updated_at?: string
}
export type CashFlowInput = {
  payment_type: 'receive' | 'pay'
  amount: string
  payment_date: string
  category?: string
  payment_method?: 'cash' | 'bank_transfer' | 'credit_card' | 'other'
  purchase_order_id?: string | null
  sales_order_id?: string | null
  purchase_invoice_id?: string | null
  sales_invoice_id?: string | null
  remarks?: string
}
export type FixedAsset = {
  id?: string
  asset_code?: string
  asset_name?: string
  original_value?: string
  /** DEPRECATED - giá trị này không còn ý nghĩa nghiệp vụ */
  salvage_value?: string
  depreciation_method?: 'straight_line' | 'unit_of_production'
  useful_life_months?: number | null
  remaining_life_months?: number | null
  designed_capacity?: number | null
  accumulated_depreciation?: string
  remaining_value?: string
  department?: string | null
  status?: 'pending_receive' | 'idle' | 'active' | 'pending_dispose' | 'disposed'
  purchase_date?: string | null
  disposal_date?: string | null
  disposal_value?: string | null
  vendor_name?: string | null
  payment_method?: string | null
  is_active?: boolean
  created_at?: string
  updated_at?: string
}
export type FixedAssetPurchaseInput = {
  asset_name: string
  original_value: string
  depreciation_method: 'straight_line' | 'unit_of_production'
  useful_life_months?: number | null
  designed_capacity?: number | null
  vendor_name: string
  payment_method?: 'cash' | 'bank_transfer'
}
export type FixedAssetUpdateInput = {
  asset_name?: string
  useful_life_months?: number
}
export type FixedAssetRequestDisposeInput = {
  disposal_value?: string
  remarks?: string | null
}
export type FixedAssetDepreciationLog = {
  id?: string
  asset?: string
  asset_code?: string
  asset_name?: string
  period?: string
  depreciation_amount?: string
  remarks?: string
  created_at?: string
  updated_at?: string
}
export type RunDepreciationInput = {
  period: string
}
export type PurchaseInvoiceLine = {
  id?: string
  item?: string
  item_name?: string
  item_code?: string
  quantity?: number
  unit_price?: number
  import_tax?: number
  vat_tax?: number
  line_total?: number
}
export type PurchaseInvoice = {
  id?: string
  order?: string
  stock_entry?: string | null
  stock_entry_name?: string | null
  vendor?: string
  vendor_name?: string
  status?: 'unpaid' | 'partial' | 'paid' | 'blocked_for_payment' | 'cancelled'
  total_amount?: number
  paid_amount?: number
  due_date?: string | null
  created_at?: string
  updated_at?: string
  lines?: PurchaseInvoiceLine[]
}
export type PayInvoiceInput = {
  amount: number
  payment_method?: 'cash' | 'bank_transfer'
}
export type SalesInvoiceLine = {
  id?: string
  item?: string
  item_name?: string
  item_code?: string
  quantity?: number
  unit_price?: number
  vat_tax?: number
  line_total?: number
}
export type SalesInvoice = {
  id?: string
  order?: string
  stock_entry?: string | null
  stock_entry_name?: string | null
  customer?: string
  customer_name?: string
  status?: 'unpaid' | 'partial' | 'paid' | 'cancelled'
  total_amount?: number
  paid_amount?: number
  due_date?: string | null
  created_at?: string
  updated_at?: string
  lines?: SalesInvoiceLine[]
}
export type CollectInvoiceInput = {
  amount: number
  payment_method?: 'cash' | 'bank_transfer'
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
  status?: 'draft' | 'calculated' | 'pending_finance_review' | 'approved' | 'paid'
  remarks?: string | null
  breakdown?: {
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
export type SalarySlipBulkApprovePayInput = {
  salary_period: string
  payment_method?: 'cash' | 'bank_transfer'
}
export type SalarySlipBulkApproveInput = {
  salary_period: string
}
export type SalarySlipBulkPayInput = {
  salary_period: string
  payment_method?: 'cash' | 'bank_transfer'
}
export type SalarySlipRejectInput = {
  reason: string
}
export type SalarySlipPaymentInput = {
  payment_method?: 'cash' | 'bank_transfer'
}
export const {
  useGetFinanceCashFlowsQuery,
  usePostFinanceCashFlowsMutation,
  useGetFinanceCashFlowsByPkQuery,
  usePostFinanceCashFlowsByPkApproveMutation,
  usePostFinanceCashFlowsByPkRejectMutation,
  useGetFinanceFixedAssetsQuery,
  usePostFinanceFixedAssetsMutation,
  useGetFinanceFixedAssetsByPkQuery,
  usePatchFinanceFixedAssetsByPkMutation,
  useDeleteFinanceFixedAssetsByPkMutation,
  usePostFinanceFixedAssetsByPkRequestDisposeMutation,
  usePostFinanceFixedAssetsDepreciationMutation,
  useGetFinanceFixedAssetsDepreciationLogsQuery,
  useGetFinanceInvoicesPurchaseQuery,
  useGetFinanceInvoicesPurchaseByPkQuery,
  usePostFinanceInvoicesPurchaseByPkPayMutation,
  useGetFinanceInvoicesSalesQuery,
  useGetFinanceInvoicesSalesByPkQuery,
  usePostFinanceInvoicesSalesByPkCollectMutation,
  usePostFinanceSalarySlipsBulkApprovePayMutation,
  usePostFinanceSalarySlipsBulkApproveMutation,
  usePostFinanceSalarySlipsBulkPayMutation,
  usePostFinanceSalarySlipsByIdApproveMutation,
  usePostFinanceSalarySlipsByIdRejectMutation,
  usePostFinanceSalarySlipsByIdPayMutation,
} = injectedRtkApi

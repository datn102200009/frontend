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
    getFinanceFixedAssets: build.query<
      GetFinanceFixedAssetsApiResponse,
      GetFinanceFixedAssetsApiArg
    >({
      query: (queryArg) => ({
        url: `/finance/fixed-assets/`,
        params: {
          limit: queryArg.limit,
          page: queryArg.page,
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
        body: queryArg.fixedAssetInput,
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
export type GetFinanceFixedAssetsApiResponse = /** status 200 A paginated list of fixed assets. */ {
  count?: number
  total_pages?: number
  current_page?: number
  results?: FixedAsset[]
}
export type GetFinanceFixedAssetsApiArg = {
  limit?: number
  page?: number
}
export type PostFinanceFixedAssetsApiResponse =
  /** status 201 Fixed asset successfully created. */ FixedAsset
export type PostFinanceFixedAssetsApiArg = {
  fixedAssetInput: FixedAssetInput
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
export type PostFinanceInvoicesPurchaseByPkPayApiResponse =
  /** status 200 Thanh toán thành công, trả về hóa đơn đã cập nhật. */ PurchaseInvoice
export type PostFinanceInvoicesPurchaseByPkPayApiArg = {
  pk: string
  payInvoiceInput: PayInvoiceInput
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
  salvage_value?: string
  depreciation_method?: 'straight_line' | 'unit_of_production'
  useful_life_months?: number
  remaining_life_months?: number
  designed_capacity?: number | null
  accumulated_depreciation?: string
  remaining_value?: string
  department?: string | null
  is_active?: boolean
  created_at?: string
  updated_at?: string
}
export type FixedAssetInput = {
  asset_code: string
  asset_name: string
  original_value: string
  salvage_value?: string
  depreciation_method: 'straight_line' | 'unit_of_production'
  useful_life_months: number
  designed_capacity?: number | null
  department?: string | null
}
export type FixedAssetUpdateInput = {
  asset_name?: string
  original_value?: string
  salvage_value?: string
  depreciation_method?: 'straight_line' | 'unit_of_production'
  useful_life_months?: number
  designed_capacity?: number | null
  department?: string | null
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
export type PurchaseInvoice = {
  id?: string
  order?: string
  vendor?: string
  vendor_name?: string
  status?: 'unpaid' | 'partial' | 'paid' | 'blocked_for_payment' | 'cancelled'
  total_amount?: number
  paid_amount?: number
  due_date?: string | null
}
export type PayInvoiceInput = {
  amount: number
  payment_method?: 'cash' | 'bank_transfer'
}
export const {
  useGetFinanceCashFlowsQuery,
  usePostFinanceCashFlowsMutation,
  useGetFinanceCashFlowsByPkQuery,
  usePostFinanceCashFlowsByPkApproveMutation,
  useGetFinanceFixedAssetsQuery,
  usePostFinanceFixedAssetsMutation,
  useGetFinanceFixedAssetsByPkQuery,
  usePatchFinanceFixedAssetsByPkMutation,
  useDeleteFinanceFixedAssetsByPkMutation,
  usePostFinanceFixedAssetsDepreciationMutation,
  useGetFinanceFixedAssetsDepreciationLogsQuery,
  usePostFinanceInvoicesPurchaseByPkPayMutation,
} = injectedRtkApi

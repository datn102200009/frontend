import { baseApi as api } from '../../../shared/api/baseApi'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getFinanceCashFlows: build.query<GetFinanceCashFlowsApiResponse, GetFinanceCashFlowsApiArg>({
      query: () => ({ url: `/finance/cash-flows/` }),
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
  }),
  overrideExisting: false,
})
export { injectedRtkApi as financeApi }
export type GetFinanceCashFlowsApiResponse =
  /** status 200 A list of cash flows. */ CashFlowTransaction[]
export type GetFinanceCashFlowsApiArg = void
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
export type CashFlowTransaction = {
  id?: string
  name?: string
  payment_type?: 'receive' | 'pay'
  category?: string
  amount?: number
  payment_date?: string
  remarks?: string
  purchase_order?: string | null
  sales_order?: string | null
  purchase_invoice?: string | null
  sales_invoice?: string | null
  created_at?: string
  updated_at?: string
}
export type CashFlowInput = {
  payment_type: 'receive' | 'pay'
  amount: number
  payment_date: string
  category?: string
  payment_method?: 'cash' | 'bank_transfer' | 'credit_card' | 'other'
  purchase_order_id?: string | null
  sales_order_id?: string | null
  purchase_invoice_id?: string | null
  sales_invoice_id?: string | null
  remarks?: string
}
export const {
  useGetFinanceCashFlowsQuery,
  usePostFinanceCashFlowsMutation,
  useGetFinanceCashFlowsByPkQuery,
} = injectedRtkApi

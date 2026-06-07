import { baseApi as api } from '../../../shared/api/baseApi'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getDashboardWidgets: build.query<GetDashboardWidgetsApiResponse, GetDashboardWidgetsApiArg>({
      query: () => ({ url: `/dashboard/widgets/` }),
    }),
    getDashboardWidgetsBatchData: build.query<
      GetDashboardWidgetsBatchDataApiResponse,
      GetDashboardWidgetsBatchDataApiArg
    >({
      query: (queryArg) => ({
        url: `/dashboard/widgets/batch-data/`,
        params: {
          widgets: queryArg.widgets,
        },
      }),
    }),
    getDashboardWidgetsByWidgetCode: build.query<
      GetDashboardWidgetsByWidgetCodeApiResponse,
      GetDashboardWidgetsByWidgetCodeApiArg
    >({
      query: (queryArg) => ({ url: `/dashboard/widgets/${queryArg.widgetCode}/` }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as dashboardApi }
export type GetDashboardWidgetsApiResponse = /** status 200 Thành công */ WidgetMetadata[]
export type GetDashboardWidgetsApiArg = void
export type GetDashboardWidgetsBatchDataApiResponse = /** status 200 Thành công */ {
  [key: string]: WidgetBatchDataResult
}
export type GetDashboardWidgetsBatchDataApiArg = {
  /** Danh sách mã widget phân cách bằng dấu phẩy */
  widgets?: string
}
export type GetDashboardWidgetsByWidgetCodeApiResponse =
  /** status 200 Thành công */ WidgetBatchDataResult
export type GetDashboardWidgetsByWidgetCodeApiArg = {
  /** Mã của widget */
  widgetCode: string
}
export type WidgetMetadata = {
  code?: string
  title?: string
  type?: string
  size?: string
  quick_links?: string[]
}
export type ErrorResponse = {
  detail?: string
}
export type SalesTodayRevenueLine = {
  id?: string
  customer_name?: string
  total_amount?: number
  created_at?: string
}
export type SalesDraftOrderLine = {
  id?: string
  customer_name?: string
  total_amount?: number
  created_at?: string
}
export type SalesCreditBypassLine = {
  id?: string
  customer_name?: string
  total_amount?: number
  reason?: string
  created_at?: string
}
export type SalesPendingFulfillmentLine = {
  id?: string
  customer_name?: string
  total_amount?: number
  created_at?: string
}
export type ActivePoCountLine = {
  id?: string
  supplier_name?: string
  total_amount?: number
  created_at?: string
}
export type PurchasingDraftOrderLine = {
  id?: string
  supplier_name?: string
  total_amount?: number
  created_at?: string
}
export type PurchasingPendingDeliveryLine = {
  id?: string
  supplier_name?: string
  total_amount?: number
  expected_delivery_date?: string | null
  receipt_fulfillment_rate?: number
  payment_fulfillment_rate?: number
  created_at?: string
}
export type PurchasingPendingQcLine = {
  id?: string
  shipment_num?: string
  name?: string
  created_at?: string
}
export type PurchasingPendingLogisticLine = {
  id?: string
  shipment_num?: string
  name?: string
  created_at?: string
}
export type PurchasingBlockedInvoiceLine = {
  id?: string
  supplier_name?: string
  total_amount?: number
  block_reason?: string
  created_at?: string
}
export type InventoryLowStockLine = {
  item_code?: string
  item_name?: string
  uom?: string
  warehouse_name?: string
  balance?: number
  days_left?: number | null
  status?: string
  reason?: string
  action_suggest?: string
}
export type InventoryPendingEntryLine = {
  id?: string
  name?: string
  purpose?: string
  remarks?: string | null
  route_desc?: string
  item_count?: number
  posting_date?: string
  created_at?: string
}
export type FinanceCashflowSummaryLine = {
  id?: string
  name?: string
  category?: string
  payment_type?: string
  amount?: number
  payment_date?: string
}
export type FinanceUnpaidApLine = {
  id?: string
  supplier_name?: string
  total_amount?: number
  remaining_amount?: number
  due_date?: string | null
  created_at?: string
}
export type FinanceUnpaidArLine = {
  id?: string
  customer_name?: string
  total_amount?: number
  remaining_amount?: number
  created_at?: string
}
export type FinanceDepreciationStatusLine = {
  asset_code?: string
  asset_name?: string
  depreciation_amount?: number
  status?: string
}
export type HrmPayrollStatusLine = {
  id?: string
  employee_name?: string
  salary_period?: string
  net_pay?: number
  status?: string
}
export type HrmLeaveRequestLine = {
  id?: string
  employee_name?: string
  leave_type?: string
  start_date?: string
  end_date?: string
  days?: number
  created_at?: string
}
export type HrmExpiringContractLine = {
  id?: string
  employee_name?: string
  contract_no?: string
  contract_type?: string
  end_date?: string
  created_at?: string
}
export type HrmTodayAbsentLine = {
  id?: string
  employee_id?: string
  full_name?: string
  department?: string
  status?: string
}
export type ManufacturingPendingWoApprovalLine = {
  id?: string
  name?: string
  production_item_name?: string
  quantity?: number
  planned_start_date?: string
  created_at?: string
}
export type ManufacturingActiveWoLine = {
  id?: string
  name?: string
  production_item_name?: string
  quantity?: number
  produced_qty?: number
  planned_start_date?: string
  created_at?: string
}
export type ManufacturingPendingDeclarationLine = {
  id?: string
  name?: string
  production_item_name?: string
  quantity?: number
  produced_qty?: number
  planned_start_date?: string
  planned_end_date?: string
  status?: string
  days_left?: number | null
  created_at?: string
}
export type ManufacturingPendingCompletionLine = {
  id?: string
  name?: string
  production_item_name?: string
  quantity?: number
  produced_qty?: number
  target_warehouse_name?: string | null
  planned_start_date?: string
  created_at?: string
}
export type WidgetBatchDataResult = {
  success?: boolean
  /** Total count of items matching the criteria (which can be more than the 5 items returned). */
  total_count?: number
  data?:
    | (
        | (
            | (
                | SalesTodayRevenueLine
                | SalesDraftOrderLine
                | SalesCreditBypassLine
                | SalesPendingFulfillmentLine
                | ActivePoCountLine
                | PurchasingDraftOrderLine
                | PurchasingPendingDeliveryLine
                | PurchasingPendingQcLine
                | PurchasingPendingLogisticLine
                | PurchasingBlockedInvoiceLine
                | InventoryLowStockLine
                | InventoryPendingEntryLine
                | FinanceCashflowSummaryLine
                | FinanceUnpaidApLine
                | FinanceUnpaidArLine
                | FinanceDepreciationStatusLine
                | HrmPayrollStatusLine
                | HrmLeaveRequestLine
                | HrmExpiringContractLine
                | HrmTodayAbsentLine
                | ManufacturingPendingWoApprovalLine
                | ManufacturingActiveWoLine
                | ManufacturingPendingDeclarationLine
                | ManufacturingPendingCompletionLine
              )[]
            | null
          )
        | ({
            [key: string]: any
          } | null)
      )
    | null
  error?: string | null
}
export const {
  useGetDashboardWidgetsQuery,
  useGetDashboardWidgetsBatchDataQuery,
  useGetDashboardWidgetsByWidgetCodeQuery,
} = injectedRtkApi

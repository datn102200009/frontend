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
  type?:
    | 'kpi'
    | 'donut_chart'
    | 'aging_bar'
    | 'stacked_progress'
    | 'gauge'
    | 'mini_chart'
    | 'list_mini'
    | 'line_chart'
    | 'cashflow_overview'
  size?: string
  quick_links?: string[]
}
export type ErrorResponse = {
  detail?: string
}
export type KpiPayload = {
  [key: string]: any
}
export type LineChartPoint = {
  date: string
  revenue: string
}
export type LineChartPayload = {
  points: LineChartPoint[]
}
export type CashflowSummary = {
  receive_total: string
  pay_total: string
  net_cashflow: string
  tx_count: number
}
export type CashflowOverviewPayload = {
  summary: CashflowSummary
  weeks: {
    week_label: string
    receive: number
    pay: number
  }[]
}
export type DonutSegment = {
  label?: string
  value?: number
  color_key?: 'critical' | 'warning' | 'normal'
}
export type InventoryLowStockLine = {
  item_code?: string
  item_name?: string
  uom?: string
  warehouse_name?: string
  balance?: string
  days_left?: number | null
  status?: string
  reason?: string
  action_suggest?: string
}
export type DonutChartPayload = {
  segments?: DonutSegment[]
  total_alerts?: number
  top_alerts?: InventoryLowStockLine[]
}
export type AgingBucket = {
  label?: string
  value?: string
  count?: number
  color_key?: 'fresh' | 'aging' | 'overdue' | 'critical'
}
export type AgingTopOverdueLine = {
  id?: string
  supplier_name?: string
  customer_name?: string
  remaining_amount?: string
  due_date?: string | null
  created_at?: string | null
  overdue_days?: number
}
export type AgingBarPayload = {
  buckets?: AgingBucket[]
  total_outstanding?: string
  total_count?: number
  top_overdue?: AgingTopOverdueLine[]
}
export type GaugePayload = {
  attendance_rate?: number
  present_count?: number
  absent_count?: number
  total_active_employees?: number
}
export type StackedProgressLine = {
  id?: string
  name?: string
  production_item_name?: string
  quantity?: string
  produced_qty?: string
  progress_pct?: number
  planned_start_date?: string
  target_warehouse_name?: string | null
  created_at?: string
}
export type StackedProgressList = StackedProgressLine[]
export type MiniChartPayload = {
  weeks?: {
    week_label?: string
    receive?: number
    pay?: number
  }[]
}
export type GenericListLine = {
  [key: string]: any
}
export type ListMiniPayload = GenericListLine[]
export type WidgetBatchDataResult = {
  success?: boolean
  /** Total count of items matching the criteria. Present for list-based widgets (list_mini, stacked_progress, mini_chart). Omitted for KPI/donut/aging/gauge. */
  total_count?: number
  data?:
    | (
        | KpiPayload
        | DonutChartPayload
        | AgingBarPayload
        | GaugePayload
        | StackedProgressList
        | MiniChartPayload
        | ListMiniPayload
        | LineChartPayload
        | CashflowOverviewPayload
      )
    | null
  error?: string | null
}
export const {
  useGetDashboardWidgetsQuery,
  useGetDashboardWidgetsBatchDataQuery,
  useGetDashboardWidgetsByWidgetCodeQuery,
} = injectedRtkApi

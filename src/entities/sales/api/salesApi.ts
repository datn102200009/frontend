import { baseApi as api } from '../../../shared/api/baseApi'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getSalesOrders: build.query<GetSalesOrdersApiResponse, GetSalesOrdersApiArg>({
      query: () => ({ url: `/sales/orders/` }),
    }),
    postSalesOrders: build.mutation<PostSalesOrdersApiResponse, PostSalesOrdersApiArg>({
      query: (queryArg) => ({
        url: `/sales/orders/`,
        method: 'POST',
        body: queryArg.salesOrderInput,
      }),
    }),
    getSalesOrdersByPk: build.query<GetSalesOrdersByPkApiResponse, GetSalesOrdersByPkApiArg>({
      query: (queryArg) => ({ url: `/sales/orders/${queryArg.pk}/` }),
    }),
    putSalesOrdersByPk: build.mutation<PutSalesOrdersByPkApiResponse, PutSalesOrdersByPkApiArg>({
      query: (queryArg) => ({
        url: `/sales/orders/${queryArg.pk}/`,
        method: 'PUT',
        body: queryArg.salesOrderInput,
      }),
    }),
    deleteSalesOrdersByPk: build.mutation<
      DeleteSalesOrdersByPkApiResponse,
      DeleteSalesOrdersByPkApiArg
    >({
      query: (queryArg) => ({ url: `/sales/orders/${queryArg.pk}/`, method: 'DELETE' }),
    }),
    postSalesOrdersByPkDeliver: build.mutation<
      PostSalesOrdersByPkDeliverApiResponse,
      PostSalesOrdersByPkDeliverApiArg
    >({
      query: (queryArg) => ({ url: `/sales/orders/${queryArg.pk}/deliver/`, method: 'POST' }),
    }),
    postSalesOrdersByPkApprove: build.mutation<
      PostSalesOrdersByPkApproveApiResponse,
      PostSalesOrdersByPkApproveApiArg
    >({
      query: (queryArg) => ({ url: `/sales/orders/${queryArg.pk}/approve/`, method: 'POST' }),
    }),
    getSalesInvoices: build.query<GetSalesInvoicesApiResponse, GetSalesInvoicesApiArg>({
      query: () => ({ url: `/sales/invoices/` }),
    }),
    getSalesInvoicesByPk: build.query<GetSalesInvoicesByPkApiResponse, GetSalesInvoicesByPkApiArg>({
      query: (queryArg) => ({ url: `/sales/invoices/${queryArg.pk}/` }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as salesApi }
export type GetSalesOrdersApiResponse = /** status 200 A list of sales orders. */ SalesOrder[]
export type GetSalesOrdersApiArg = void
export type PostSalesOrdersApiResponse =
  /** status 201 Sales order successfully created. */ SalesOrder
export type PostSalesOrdersApiArg = {
  salesOrderInput: SalesOrderInput
}
export type GetSalesOrdersByPkApiResponse = /** status 200 Sales order details. */ SalesOrder
export type GetSalesOrdersByPkApiArg = {
  pk: string
}
export type PutSalesOrdersByPkApiResponse =
  /** status 200 Sales order successfully updated. */ SalesOrder
export type PutSalesOrdersByPkApiArg = {
  pk: string
  salesOrderInput: SalesOrderInput
}
export type DeleteSalesOrdersByPkApiResponse = unknown
export type DeleteSalesOrdersByPkApiArg = {
  pk: string
}
export type PostSalesOrdersByPkDeliverApiResponse = unknown
export type PostSalesOrdersByPkDeliverApiArg = {
  pk: string
}
export type PostSalesOrdersByPkApproveApiResponse =
  /** status 200 Đơn bán hàng đã được duyệt thành công. */ SalesOrder
export type PostSalesOrdersByPkApproveApiArg = {
  pk: string
}
export type GetSalesInvoicesApiResponse = /** status 200 A list of sales invoices. */ SalesInvoice[]
export type GetSalesInvoicesApiArg = void
export type GetSalesInvoicesByPkApiResponse = /** status 200 Sales invoice details. */ SalesInvoice
export type GetSalesInvoicesByPkApiArg = {
  pk: string
}
export type SalesOrderLine = {
  id?: string
  item?: string
  item_name?: string
  item_code?: string
  quantity?: number
  unit_price?: number
  line_total?: number
}
export type SalesOrder = {
  id?: string
  customer?: string
  customer_name?: string
  status?: 'draft' | 'pending' | 'paid_unshipped' | 'shipped_unpaid' | 'completed' | 'cancelled'
  total_amount?: number
  advance_paid_amount?: number
  created_at?: string
  updated_at?: string
  lines?: SalesOrderLine[]
  invoices?: {
    id?: string
    status?: 'unpaid' | 'partial' | 'paid' | 'cancelled'
    total_amount?: number
    paid_amount?: number
  }[]
  stock_entries?: {
    id?: string
    name?: string
    status?: 'draft' | 'submitted' | 'posted'
    purpose?: 'receipt' | 'issue' | 'transfer' | 'manufacture' | 'adjustment'
  }[]
}
export type SalesOrderLineInput = {
  item_id: string
  quantity: number
  unit_price: number
}
export type SalesOrderInput = {
  customer_id: string
  status?: 'draft' | 'pending' | 'paid_unshipped' | 'shipped_unpaid' | 'completed' | 'cancelled'
  lines: SalesOrderLineInput[]
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
  created_at?: string
  updated_at?: string
  lines?: SalesInvoiceLine[]
}
export const {
  useGetSalesOrdersQuery,
  usePostSalesOrdersMutation,
  useGetSalesOrdersByPkQuery,
  usePutSalesOrdersByPkMutation,
  useDeleteSalesOrdersByPkMutation,
  usePostSalesOrdersByPkDeliverMutation,
  usePostSalesOrdersByPkApproveMutation,
  useGetSalesInvoicesQuery,
  useGetSalesInvoicesByPkQuery,
} = injectedRtkApi

import { baseApi as api } from '../../../shared/api/baseApi'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getPurchasingOrders: build.query<GetPurchasingOrdersApiResponse, GetPurchasingOrdersApiArg>({
      query: () => ({ url: `/purchasing/orders/` }),
    }),
    postPurchasingOrders: build.mutation<
      PostPurchasingOrdersApiResponse,
      PostPurchasingOrdersApiArg
    >({
      query: (queryArg) => ({
        url: `/purchasing/orders/`,
        method: 'POST',
        body: queryArg.purchaseOrderInput,
      }),
    }),
    getPurchasingOrdersByPk: build.query<
      GetPurchasingOrdersByPkApiResponse,
      GetPurchasingOrdersByPkApiArg
    >({
      query: (queryArg) => ({ url: `/purchasing/orders/${queryArg.pk}/` }),
    }),
    putPurchasingOrdersByPk: build.mutation<
      PutPurchasingOrdersByPkApiResponse,
      PutPurchasingOrdersByPkApiArg
    >({
      query: (queryArg) => ({
        url: `/purchasing/orders/${queryArg.pk}/`,
        method: 'PUT',
        body: queryArg.purchaseOrderInput,
      }),
    }),
    deletePurchasingOrdersByPk: build.mutation<
      DeletePurchasingOrdersByPkApiResponse,
      DeletePurchasingOrdersByPkApiArg
    >({
      query: (queryArg) => ({ url: `/purchasing/orders/${queryArg.pk}/`, method: 'DELETE' }),
    }),
    postPurchasingOrdersByPkReceive: build.mutation<
      PostPurchasingOrdersByPkReceiveApiResponse,
      PostPurchasingOrdersByPkReceiveApiArg
    >({
      query: (queryArg) => ({ url: `/purchasing/orders/${queryArg.pk}/receive/`, method: 'POST' }),
    }),
    postPurchasingOrdersByPkApprove: build.mutation<
      PostPurchasingOrdersByPkApproveApiResponse,
      PostPurchasingOrdersByPkApproveApiArg
    >({
      query: (queryArg) => ({ url: `/purchasing/orders/${queryArg.pk}/approve/`, method: 'POST' }),
    }),
    getPurchasingInvoices: build.query<
      GetPurchasingInvoicesApiResponse,
      GetPurchasingInvoicesApiArg
    >({
      query: () => ({ url: `/purchasing/invoices/` }),
    }),
    getPurchasingInvoicesByPk: build.query<
      GetPurchasingInvoicesByPkApiResponse,
      GetPurchasingInvoicesByPkApiArg
    >({
      query: (queryArg) => ({ url: `/purchasing/invoices/${queryArg.pk}/` }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as purchasingApi }
export type GetPurchasingOrdersApiResponse =
  /** status 200 A list of purchase orders. */ PurchaseOrder[]
export type GetPurchasingOrdersApiArg = void
export type PostPurchasingOrdersApiResponse =
  /** status 201 Purchase order successfully created. */ PurchaseOrder
export type PostPurchasingOrdersApiArg = {
  purchaseOrderInput: PurchaseOrderInput
}
export type GetPurchasingOrdersByPkApiResponse =
  /** status 200 Purchase order details. */ PurchaseOrder
export type GetPurchasingOrdersByPkApiArg = {
  pk: string
}
export type PutPurchasingOrdersByPkApiResponse =
  /** status 200 Purchase order successfully updated. */ PurchaseOrder
export type PutPurchasingOrdersByPkApiArg = {
  pk: string
  purchaseOrderInput: PurchaseOrderInput
}
export type DeletePurchasingOrdersByPkApiResponse = unknown
export type DeletePurchasingOrdersByPkApiArg = {
  pk: string
}
export type PostPurchasingOrdersByPkReceiveApiResponse = unknown
export type PostPurchasingOrdersByPkReceiveApiArg = {
  pk: string
}
export type PostPurchasingOrdersByPkApproveApiResponse =
  /** status 200 Đơn mua hàng đã được duyệt thành công. */ PurchaseOrder
export type PostPurchasingOrdersByPkApproveApiArg = {
  pk: string
}
export type GetPurchasingInvoicesApiResponse =
  /** status 200 A list of purchase invoices. */ PurchaseInvoice[]
export type GetPurchasingInvoicesApiArg = void
export type GetPurchasingInvoicesByPkApiResponse =
  /** status 200 Purchase invoice details. */ PurchaseInvoice
export type GetPurchasingInvoicesByPkApiArg = {
  pk: string
}
export type PurchaseOrderLine = {
  id?: string
  item?: string
  item_name?: string
  item_code?: string
  quantity?: number
  unit_price?: number
  line_total?: number
}
export type PurchaseOrder = {
  id?: string
  vendor?: string
  vendor_name?: string
  status?: 'draft' | 'pending' | 'paid_unshipped' | 'shipped_unpaid' | 'completed' | 'cancelled'
  total_amount?: number
  advance_paid_amount?: number
  created_at?: string
  updated_at?: string
  lines?: PurchaseOrderLine[]
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
export type PurchaseOrderLineInput = {
  item_id: string
  quantity: number
  unit_price: number
}
export type PurchaseOrderInput = {
  vendor_id: string
  status?: 'draft' | 'pending' | 'completed' | 'cancelled'
  lines: PurchaseOrderLineInput[]
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
  status?: 'unpaid' | 'partial' | 'paid' | 'cancelled'
  total_amount?: number
  paid_amount?: number
  created_at?: string
  updated_at?: string
  lines?: PurchaseInvoiceLine[]
}
export const {
  useGetPurchasingOrdersQuery,
  usePostPurchasingOrdersMutation,
  useGetPurchasingOrdersByPkQuery,
  usePutPurchasingOrdersByPkMutation,
  useDeletePurchasingOrdersByPkMutation,
  usePostPurchasingOrdersByPkReceiveMutation,
  usePostPurchasingOrdersByPkApproveMutation,
  useGetPurchasingInvoicesQuery,
  useGetPurchasingInvoicesByPkQuery,
} = injectedRtkApi

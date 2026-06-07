import { baseApi as api } from '../../../shared/api/baseApi'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getPurchasingCertifications: build.query<
      GetPurchasingCertificationsApiResponse,
      GetPurchasingCertificationsApiArg
    >({
      query: (queryArg) => ({
        url: `/purchasing/certifications/`,
        params: {
          item_id: queryArg.itemId,
          stock_entry_id: queryArg.stockEntryId,
        },
      }),
    }),
    postPurchasingCertifications: build.mutation<
      PostPurchasingCertificationsApiResponse,
      PostPurchasingCertificationsApiArg
    >({
      query: (queryArg) => ({
        url: `/purchasing/certifications/`,
        method: 'POST',
        body: queryArg.technicalCertificationCreateInput,
      }),
    }),
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
    postPurchasingOrdersByPkCancel: build.mutation<
      PostPurchasingOrdersByPkCancelApiResponse,
      PostPurchasingOrdersByPkCancelApiArg
    >({
      query: (queryArg) => ({
        url: `/purchasing/orders/${queryArg.pk}/cancel/`,
        method: 'POST',
        body: queryArg.purchaseOrderCancelInput,
      }),
    }),
    getPurchasingInvoices: build.query<
      GetPurchasingInvoicesApiResponse,
      GetPurchasingInvoicesApiArg
    >({
      query: (queryArg) => ({
        url: `/purchasing/invoices/`,
        params: {
          status: queryArg.status,
          limit: queryArg.limit,
          page: queryArg.page,
        },
      }),
    }),
    getPurchasingInvoicesByPk: build.query<
      GetPurchasingInvoicesByPkApiResponse,
      GetPurchasingInvoicesByPkApiArg
    >({
      query: (queryArg) => ({ url: `/purchasing/invoices/${queryArg.pk}/` }),
    }),
    postPurchasingInvoicesByPkVerify: build.mutation<
      PostPurchasingInvoicesByPkVerifyApiResponse,
      PostPurchasingInvoicesByPkVerifyApiArg
    >({
      query: (queryArg) => ({ url: `/purchasing/invoices/${queryArg.pk}/verify/`, method: 'POST' }),
    }),
    getPurchasingShipments: build.query<
      GetPurchasingShipmentsApiResponse,
      GetPurchasingShipmentsApiArg
    >({
      query: () => ({ url: `/purchasing/shipments/` }),
    }),
    postPurchasingShipments: build.mutation<
      PostPurchasingShipmentsApiResponse,
      PostPurchasingShipmentsApiArg
    >({
      query: (queryArg) => ({
        url: `/purchasing/shipments/`,
        method: 'POST',
        body: queryArg.shipmentInput,
      }),
    }),
    getPurchasingShipmentsByPk: build.query<
      GetPurchasingShipmentsByPkApiResponse,
      GetPurchasingShipmentsByPkApiArg
    >({
      query: (queryArg) => ({ url: `/purchasing/shipments/${queryArg.pk}/` }),
    }),
    putPurchasingShipmentsByPk: build.mutation<
      PutPurchasingShipmentsByPkApiResponse,
      PutPurchasingShipmentsByPkApiArg
    >({
      query: (queryArg) => ({
        url: `/purchasing/shipments/${queryArg.pk}/`,
        method: 'PUT',
        body: queryArg.body,
      }),
    }),
    postPurchasingShipmentsAllocate: build.mutation<
      PostPurchasingShipmentsAllocateApiResponse,
      PostPurchasingShipmentsAllocateApiArg
    >({
      query: (queryArg) => ({
        url: `/purchasing/shipments/allocate/`,
        method: 'POST',
        body: queryArg.landedCostAllocationInput,
      }),
    }),
    getPurchasingReportsApAging: build.query<
      GetPurchasingReportsApAgingApiResponse,
      GetPurchasingReportsApAgingApiArg
    >({
      query: (queryArg) => ({
        url: `/purchasing/reports/ap-aging/`,
        params: {
          supplier_id: queryArg.supplierId,
        },
      }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as purchasingApi }
export type GetPurchasingCertificationsApiResponse =
  /** status 200 A list of certifications. */ TechnicalCertification[]
export type GetPurchasingCertificationsApiArg = {
  itemId?: string
  stockEntryId?: string
}
export type PostPurchasingCertificationsApiResponse =
  /** status 201 Certification successfully created. */ TechnicalCertification
export type PostPurchasingCertificationsApiArg = {
  technicalCertificationCreateInput: TechnicalCertificationCreateInput
}
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
export type PostPurchasingOrdersByPkCancelApiResponse =
  /** status 200 Đơn mua hàng đã được hủy thành công. */ PurchaseOrder
export type PostPurchasingOrdersByPkCancelApiArg = {
  pk: string
  purchaseOrderCancelInput: PurchaseOrderCancelInput
}
export type GetPurchasingInvoicesApiResponse =
  /** status 200 A paginated list of purchase invoices. */ {
    count?: number
    total_pages?: number
    current_page?: number
    results?: PurchaseInvoice[]
  }
export type GetPurchasingInvoicesApiArg = {
  status?: string
  limit?: number
  page?: number
}
export type GetPurchasingInvoicesByPkApiResponse =
  /** status 200 Purchase invoice details. */ PurchaseInvoice
export type GetPurchasingInvoicesByPkApiArg = {
  pk: string
}
export type PostPurchasingInvoicesByPkVerifyApiResponse =
  /** status 200 Kết quả đối soát cập nhật trên Hóa đơn. */ PurchaseInvoice
export type PostPurchasingInvoicesByPkVerifyApiArg = {
  pk: string
}
export type GetPurchasingShipmentsApiResponse = /** status 200 Danh sách lô hàng. */ Shipment[]
export type GetPurchasingShipmentsApiArg = void
export type PostPurchasingShipmentsApiResponse = /** status 201 Tạo thành công. */ Shipment
export type PostPurchasingShipmentsApiArg = {
  shipmentInput: ShipmentInput
}
export type GetPurchasingShipmentsByPkApiResponse = /** status 200 Chi tiết lô hàng. */ Shipment
export type GetPurchasingShipmentsByPkApiArg = {
  pk: string
}
export type PutPurchasingShipmentsByPkApiResponse = /** status 200 Cập nhật thành công. */ Shipment
export type PutPurchasingShipmentsByPkApiArg = {
  pk: string
  body: {
    status?: 'draft' | 'arrived' | 'inspected' | 'completed'
    remarks?: string | null
  }
}
export type PostPurchasingShipmentsAllocateApiResponse =
  /** status 200 Phân bổ thành công. */ Shipment
export type PostPurchasingShipmentsAllocateApiArg = {
  landedCostAllocationInput: LandedCostAllocationInput
}
export type GetPurchasingReportsApAgingApiResponse =
  /** status 200 Bảng báo cáo tuổi nợ. */ ApAging[]
export type GetPurchasingReportsApAgingApiArg = {
  supplierId?: string
}
export type TechnicalCertification = {
  id?: string
  cert_id?: string
  item?: string
  item_name?: string
  item_code?: string
  stock_entry?: string | null
  stock_entry_name?: string | null
  cert_type?: string
  assessment_fee?: number | null
  expiry_date?: string | null
  issue_date?: string
  result?: 'PASSED' | 'FAILED'
  remarks?: string | null
}
export type TechnicalCertificationCreateInput = {
  item_id: string
  stock_entry_id: string
  cert_type: string
  assessment_fee?: number | null
  expiry_date?: string | null
  result?: 'PASSED' | 'FAILED'
  remarks?: string | null
}
export type PurchaseOrderLine = {
  id?: string
  item?: string
  item_name?: string
  item_code?: string
  quantity?: number
  unit_price?: number
  line_total?: number
  receipt_fulfillment_rate?: number
}
export type PurchaseOrder = {
  id?: string
  vendor?: string
  vendor_name?: string
  status?: 'draft' | 'pending' | 'paid_unshipped' | 'shipped_unpaid' | 'completed' | 'cancelled'
  total_amount?: number
  advance_paid_amount?: number
  expected_delivery_date?: string | null
  receipt_fulfillment_rate?: number
  payment_fulfillment_rate?: number
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
  advance_paid_amount?: number
  expected_delivery_date?: string | null
  lines: PurchaseOrderLineInput[]
}
export type PurchaseOrderCancelInput = {
  /** Có nhận lại tiền cọc hay không (khi chưa có hàng nhập kho) */
  refund_deposit?: boolean
  /** Có giữ lại phần hàng đã nhận hay không (khi đã có hàng nhập kho) */
  keep_goods?: boolean
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
  qty_fulfillment_rate?: number | null
  qc_status?: string
  latest_cert?: {
    id?: string
    cert_id?: string
    result?: string
    remarks?: string | null
    issue_date?: string
  } | null
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
  block_reason?: string | null
  due_date?: string | null
  qty_fulfillment_rate?: number | null
  created_at?: string
  updated_at?: string
  lines?: PurchaseInvoiceLine[]
}
export type Shipment = {
  id?: string
  shipment_num?: string
  name?: string
  total_logistic_fees?: number
  status?: 'draft' | 'arrived' | 'inspected' | 'completed'
  remarks?: string | null
  stock_entries?: {
    id?: string
    name?: string
    status?: string
    purpose?: string
  }[]
  stock_entries_details?: {
    id?: string
    item_id?: string
    item_code?: string
    item_name?: string
    uom_name?: string
    quantity?: number
    source_warehouse_id?: string | null
    source_warehouse_name?: string | null
    target_warehouse_id?: string | null
    target_warehouse_name?: string | null
    qc_status?: string
    latest_cert?: object | null
    stock_entry_id?: string
    stock_entry_name?: string
    stock_entry_status?: string
  }[]
  created_at?: string
  updated_at?: string
}
export type ShipmentInput = {
  shipment_num: string
  name: string
  remarks?: string | null
  stock_entry_ids?: string[]
}
export type LandedCostAllocationInput = {
  shipment_id: string
  total_logistic_fees: number
}
export type ApAging = {
  vendor_id?: string
  vendor_code?: string
  vendor_name?: string
  total_unpaid?: number
  not_due?: number
  overdue_1_30?: number
  overdue_above_30?: number
}
export const {
  useGetPurchasingCertificationsQuery,
  usePostPurchasingCertificationsMutation,
  useGetPurchasingOrdersQuery,
  usePostPurchasingOrdersMutation,
  useGetPurchasingOrdersByPkQuery,
  usePutPurchasingOrdersByPkMutation,
  useDeletePurchasingOrdersByPkMutation,
  usePostPurchasingOrdersByPkReceiveMutation,
  usePostPurchasingOrdersByPkApproveMutation,
  usePostPurchasingOrdersByPkCancelMutation,
  useGetPurchasingInvoicesQuery,
  useGetPurchasingInvoicesByPkQuery,
  usePostPurchasingInvoicesByPkVerifyMutation,
  useGetPurchasingShipmentsQuery,
  usePostPurchasingShipmentsMutation,
  useGetPurchasingShipmentsByPkQuery,
  usePutPurchasingShipmentsByPkMutation,
  usePostPurchasingShipmentsAllocateMutation,
  useGetPurchasingReportsApAgingQuery,
} = injectedRtkApi

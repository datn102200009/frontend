import { baseApi as api } from '../../../shared/api/baseApi'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    postInventoryStockInCreate: build.mutation<
      PostInventoryStockInCreateApiResponse,
      PostInventoryStockInCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/inventory/stock-in/create/`,
        method: 'POST',
        body: queryArg.stockInInput,
      }),
    }),
    postInventoryStockInByStockEntryIdApprove: build.mutation<
      PostInventoryStockInByStockEntryIdApproveApiResponse,
      PostInventoryStockInByStockEntryIdApproveApiArg
    >({
      query: (queryArg) => ({
        url: `/inventory/stock-in/${queryArg.stockEntryId}/approve/`,
        method: 'POST',
      }),
    }),
    postInventoryStockIssueCreate: build.mutation<
      PostInventoryStockIssueCreateApiResponse,
      PostInventoryStockIssueCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/inventory/stock-issue/create/`,
        method: 'POST',
        body: queryArg.stockIssueInput,
      }),
    }),
    postInventoryStockIssueByStockEntryIdApprove: build.mutation<
      PostInventoryStockIssueByStockEntryIdApproveApiResponse,
      PostInventoryStockIssueByStockEntryIdApproveApiArg
    >({
      query: (queryArg) => ({
        url: `/inventory/stock-issue/${queryArg.stockEntryId}/approve/`,
        method: 'POST',
      }),
    }),
    postInventoryStockTransferCreate: build.mutation<
      PostInventoryStockTransferCreateApiResponse,
      PostInventoryStockTransferCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/inventory/stock-transfer/create/`,
        method: 'POST',
        body: queryArg.stockTransferInput,
      }),
    }),
    postInventoryStockTransferByStockEntryIdApprove: build.mutation<
      PostInventoryStockTransferByStockEntryIdApproveApiResponse,
      PostInventoryStockTransferByStockEntryIdApproveApiArg
    >({
      query: (queryArg) => ({
        url: `/inventory/stock-transfer/${queryArg.stockEntryId}/approve/`,
        method: 'POST',
      }),
    }),
    getInventoryStockLedgerBalance: build.query<
      GetInventoryStockLedgerBalanceApiResponse,
      GetInventoryStockLedgerBalanceApiArg
    >({
      query: (queryArg) => ({
        url: `/inventory/stock-ledger/balance/`,
        params: {
          warehouse_id: queryArg.warehouseId,
        },
      }),
    }),
    getInventoryStockEntryList: build.query<
      GetInventoryStockEntryListApiResponse,
      GetInventoryStockEntryListApiArg
    >({
      query: (queryArg) => ({
        url: `/inventory/stock-entry/list/`,
        params: {
          status: queryArg.status,
          purpose: queryArg.purpose,
          limit: queryArg.limit,
          offset: queryArg.offset,
        },
      }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as inventoryApi }
export type PostInventoryStockInCreateApiResponse = /** status 201 Created */ StockEntry
export type PostInventoryStockInCreateApiArg = {
  stockInInput: StockInInput
}
export type PostInventoryStockInByStockEntryIdApproveApiResponse =
  /** status 200 Approved */ StockEntry
export type PostInventoryStockInByStockEntryIdApproveApiArg = {
  stockEntryId: string
}
export type PostInventoryStockIssueCreateApiResponse = /** status 201 Created */ StockEntry
export type PostInventoryStockIssueCreateApiArg = {
  stockIssueInput: StockIssueInput
}
export type PostInventoryStockIssueByStockEntryIdApproveApiResponse =
  /** status 200 Approved */ StockEntry
export type PostInventoryStockIssueByStockEntryIdApproveApiArg = {
  stockEntryId: string
}
export type PostInventoryStockTransferCreateApiResponse = /** status 201 Created */ StockEntry
export type PostInventoryStockTransferCreateApiArg = {
  stockTransferInput: StockTransferInput
}
export type PostInventoryStockTransferByStockEntryIdApproveApiResponse =
  /** status 200 Approved */ StockEntry
export type PostInventoryStockTransferByStockEntryIdApproveApiArg = {
  stockEntryId: string
}
export type GetInventoryStockLedgerBalanceApiResponse = /** status 200 Success */ StockBalance[]
export type GetInventoryStockLedgerBalanceApiArg = {
  warehouseId?: string
}
export type GetInventoryStockEntryListApiResponse = /** status 200 Success */ StockEntryListResponse
export type GetInventoryStockEntryListApiArg = {
  status?: string
  purpose?: string
  limit?: number
  offset?: number
}
export type StockEntryDetail = {
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
}
export type StockEntry = {
  id?: string
  name?: string
  purpose?: 'receipt' | 'issue' | 'transfer' | 'manufacture' | 'adjustment'
  posting_date?: string
  posting_date_formatted?: string
  remarks?: string | null
  status?: 'draft' | 'submitted' | 'posted'
  details?: StockEntryDetail[]
  created_at?: string
  created_at_formatted?: string
  updated_at?: string
}
export type ErrorResponse = {
  detail?: string
}
export type StockEntryInputBase = {
  name: string
  posting_date: string
  remarks?: string | null
}
export type StockInInput = StockEntryInputBase & {
  details: {
    item_id: string
    quantity: number
    target_warehouse_id: string
  }[]
}
export type StockIssueInput = StockEntryInputBase & {
  source_warehouse_id: string
  details: {
    item_id: string
    quantity: number
  }[]
}
export type StockTransferInput = StockEntryInputBase & {
  source_warehouse_id: string
  target_warehouse_id: string
  details: {
    item_id: string
    quantity: number
  }[]
}
export type StockBalance = {
  item_id?: string
  item_code?: string
  item_name?: string
  uom?: string
  warehouse_id?: string | null
  warehouse_name?: string | null
  total_quantity?: number
}
export type StockEntryListResponse = {
  count?: number
  next?: string | null
  previous?: string | null
  results?: StockEntry[]
}
export const {
  usePostInventoryStockInCreateMutation,
  usePostInventoryStockInByStockEntryIdApproveMutation,
  usePostInventoryStockIssueCreateMutation,
  usePostInventoryStockIssueByStockEntryIdApproveMutation,
  usePostInventoryStockTransferCreateMutation,
  usePostInventoryStockTransferByStockEntryIdApproveMutation,
  useGetInventoryStockLedgerBalanceQuery,
  useGetInventoryStockEntryListQuery,
} = injectedRtkApi

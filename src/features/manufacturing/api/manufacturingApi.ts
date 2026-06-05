import { baseApi as api } from '../../../shared/api/baseApi'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    postManufacturingBomCreate: build.mutation<
      PostManufacturingBomCreateApiResponse,
      PostManufacturingBomCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/manufacturing/bom/create/`,
        method: 'POST',
        body: queryArg.bomInput,
      }),
    }),
    putManufacturingBomByBomIdUpdate: build.mutation<
      PutManufacturingBomByBomIdUpdateApiResponse,
      PutManufacturingBomByBomIdUpdateApiArg
    >({
      query: (queryArg) => ({
        url: `/manufacturing/bom/${queryArg.bomId}/update/`,
        method: 'PUT',
        body: queryArg.bomUpdateInput,
      }),
    }),
    deleteManufacturingBomByBomIdDelete: build.mutation<
      DeleteManufacturingBomByBomIdDeleteApiResponse,
      DeleteManufacturingBomByBomIdDeleteApiArg
    >({
      query: (queryArg) => ({
        url: `/manufacturing/bom/${queryArg.bomId}/delete/`,
        method: 'DELETE',
      }),
    }),
    getManufacturingBomList: build.query<
      GetManufacturingBomListApiResponse,
      GetManufacturingBomListApiArg
    >({
      query: (queryArg) => ({
        url: `/manufacturing/bom/list/`,
        params: {
          search: queryArg.search,
          is_active: queryArg.isActive,
          limit: queryArg.limit,
          offset: queryArg.offset,
        },
      }),
    }),
    getManufacturingBomByBomId: build.query<
      GetManufacturingBomByBomIdApiResponse,
      GetManufacturingBomByBomIdApiArg
    >({
      query: (queryArg) => ({ url: `/manufacturing/bom/${queryArg.bomId}/` }),
    }),
    postManufacturingMaterialPreview: build.mutation<
      PostManufacturingMaterialPreviewApiResponse,
      PostManufacturingMaterialPreviewApiArg
    >({
      query: (queryArg) => ({
        url: `/manufacturing/material-preview/`,
        method: 'POST',
        body: queryArg.materialPreviewInput,
      }),
    }),
    postManufacturingWorkOrderCreate: build.mutation<
      PostManufacturingWorkOrderCreateApiResponse,
      PostManufacturingWorkOrderCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/manufacturing/work-order/create/`,
        method: 'POST',
        body: queryArg.workOrderInput,
      }),
    }),
    postManufacturingWorkOrderByWorkOrderIdApprove: build.mutation<
      PostManufacturingWorkOrderByWorkOrderIdApproveApiResponse,
      PostManufacturingWorkOrderByWorkOrderIdApproveApiArg
    >({
      query: (queryArg) => ({
        url: `/manufacturing/work-order/${queryArg.workOrderId}/approve/`,
        method: 'POST',
      }),
    }),
    postManufacturingWorkOrderByWorkOrderIdDeclare: build.mutation<
      PostManufacturingWorkOrderByWorkOrderIdDeclareApiResponse,
      PostManufacturingWorkOrderByWorkOrderIdDeclareApiArg
    >({
      query: (queryArg) => ({
        url: `/manufacturing/work-order/${queryArg.workOrderId}/declare/`,
        method: 'POST',
        body: queryArg.workOrderDeclareInput,
      }),
    }),
    postManufacturingWorkOrderByWorkOrderIdComplete: build.mutation<
      PostManufacturingWorkOrderByWorkOrderIdCompleteApiResponse,
      PostManufacturingWorkOrderByWorkOrderIdCompleteApiArg
    >({
      query: (queryArg) => ({
        url: `/manufacturing/work-order/${queryArg.workOrderId}/complete/`,
        method: 'POST',
      }),
    }),
    postManufacturingWorkOrderByWorkOrderIdCancel: build.mutation<
      PostManufacturingWorkOrderByWorkOrderIdCancelApiResponse,
      PostManufacturingWorkOrderByWorkOrderIdCancelApiArg
    >({
      query: (queryArg) => ({
        url: `/manufacturing/work-order/${queryArg.workOrderId}/cancel/`,
        method: 'POST',
      }),
    }),
    getManufacturingWorkOrderList: build.query<
      GetManufacturingWorkOrderListApiResponse,
      GetManufacturingWorkOrderListApiArg
    >({
      query: (queryArg) => ({
        url: `/manufacturing/work-order/list/`,
        params: {
          search: queryArg.search,
          status: queryArg.status,
          limit: queryArg.limit,
          offset: queryArg.offset,
        },
      }),
    }),
    getManufacturingWorkOrderByWorkOrderId: build.query<
      GetManufacturingWorkOrderByWorkOrderIdApiResponse,
      GetManufacturingWorkOrderByWorkOrderIdApiArg
    >({
      query: (queryArg) => ({ url: `/manufacturing/work-order/${queryArg.workOrderId}/` }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as manufacturingApi }
export type PostManufacturingBomCreateApiResponse = /** status 201 Created */ Bom
export type PostManufacturingBomCreateApiArg = {
  bomInput: BomInput
}
export type PutManufacturingBomByBomIdUpdateApiResponse = /** status 200 Updated */ Bom
export type PutManufacturingBomByBomIdUpdateApiArg = {
  bomId: string
  bomUpdateInput: BomUpdateInput
}
export type DeleteManufacturingBomByBomIdDeleteApiResponse = unknown
export type DeleteManufacturingBomByBomIdDeleteApiArg = {
  bomId: string
}
export type GetManufacturingBomListApiResponse = /** status 200 Success */ BomListResponse
export type GetManufacturingBomListApiArg = {
  search?: string
  isActive?: boolean
  limit?: number
  offset?: number
}
export type GetManufacturingBomByBomIdApiResponse = /** status 200 Success */ Bom
export type GetManufacturingBomByBomIdApiArg = {
  bomId: string
}
export type PostManufacturingMaterialPreviewApiResponse =
  /** status 200 Success */ MaterialPreviewItem[]
export type PostManufacturingMaterialPreviewApiArg = {
  materialPreviewInput: MaterialPreviewInput
}
export type PostManufacturingWorkOrderCreateApiResponse = /** status 201 Created */ WorkOrder
export type PostManufacturingWorkOrderCreateApiArg = {
  workOrderInput: WorkOrderInput
}
export type PostManufacturingWorkOrderByWorkOrderIdApproveApiResponse =
  /** status 200 Approved */ WorkOrder
export type PostManufacturingWorkOrderByWorkOrderIdApproveApiArg = {
  workOrderId: string
}
export type PostManufacturingWorkOrderByWorkOrderIdDeclareApiResponse =
  /** status 200 Success */ WorkOrder
export type PostManufacturingWorkOrderByWorkOrderIdDeclareApiArg = {
  workOrderId: string
  workOrderDeclareInput: WorkOrderDeclareInput
}
export type PostManufacturingWorkOrderByWorkOrderIdCompleteApiResponse =
  /** status 200 Completed */ WorkOrder
export type PostManufacturingWorkOrderByWorkOrderIdCompleteApiArg = {
  workOrderId: string
}
export type PostManufacturingWorkOrderByWorkOrderIdCancelApiResponse =
  /** status 200 Cancelled */ WorkOrder
export type PostManufacturingWorkOrderByWorkOrderIdCancelApiArg = {
  workOrderId: string
}
export type GetManufacturingWorkOrderListApiResponse =
  /** status 200 Success */ WorkOrderListResponse
export type GetManufacturingWorkOrderListApiArg = {
  search?: string
  status?: 'pending_approval' | 'in_progress' | 'completed' | 'cancelled'
  limit?: number
  offset?: number
}
export type GetManufacturingWorkOrderByWorkOrderIdApiResponse = /** status 200 Success */ WorkOrder
export type GetManufacturingWorkOrderByWorkOrderIdApiArg = {
  workOrderId: string
}
export type BomItem = {
  id?: string
  item?: string
  item_code?: string
  item_name?: string
  quantity?: number
}
export type Bom = {
  id?: string
  name?: string
  item?: string
  item_code?: string
  item_name?: string
  quantity?: number
  description?: string | null
  is_active?: boolean
  mold?: string | null
  mold_code?: string | null
  mold_name?: string | null
  items_count?: number
  items?: BomItem[]
  created_at?: string
  updated_at?: string
}
export type ErrorResponse = {
  detail?: string
}
export type BomInput = {
  name: string
  item_id: string
  quantity?: number
  description?: string | null
  mold_id?: string | null
  items: {
    item_id: string
    quantity: number
  }[]
}
export type BomUpdateInput = {
  name?: string
  quantity?: number
  description?: string | null
  mold_id?: string | null
  items?: {
    item_id: string
    quantity: number
  }[]
}
export type BomListResponse = {
  count?: number
  next?: string | null
  previous?: string | null
  results?: Bom[]
}
export type MaterialPreviewItem = {
  item_id?: string
  item_code?: string
  item_name?: string
  required_qty?: number
  available_qty?: number
  missing_qty?: number
}
export type MaterialPreviewInput = {
  bom_id: string
  quantity: number
  source_warehouse_id: string
}
export type WorkOrder = {
  id?: string
  name?: string
  bom_id?: string | null
  production_item_id?: string
  quantity?: number
  produced_qty?: number
  source_warehouse?: string
  target_warehouse?: string
  production_warehouse?: string
  status?: 'pending_approval' | 'in_progress' | 'completed' | 'cancelled'
  planned_start_date?: string
  planned_end_date?: string | null
  actual_end_date?: string | null
  remarks?: string | null
  created_at?: string
  updated_at?: string
}
export type WorkOrderInput = {
  name: string
  bom_id: string
  quantity: number
  source_warehouse_id: string
  target_warehouse_id: string
  production_warehouse_id: string
  planned_start_date: string
  planned_end_date?: string | null
  remarks?: string | null
}
export type WorkOrderDeclareInput = {
  produced_qty: number
}
export type WorkOrderListResponse = {
  count?: number
  next?: string | null
  previous?: string | null
  results?: WorkOrder[]
}
export const {
  usePostManufacturingBomCreateMutation,
  usePutManufacturingBomByBomIdUpdateMutation,
  useDeleteManufacturingBomByBomIdDeleteMutation,
  useGetManufacturingBomListQuery,
  useGetManufacturingBomByBomIdQuery,
  usePostManufacturingMaterialPreviewMutation,
  usePostManufacturingWorkOrderCreateMutation,
  usePostManufacturingWorkOrderByWorkOrderIdApproveMutation,
  usePostManufacturingWorkOrderByWorkOrderIdDeclareMutation,
  usePostManufacturingWorkOrderByWorkOrderIdCompleteMutation,
  usePostManufacturingWorkOrderByWorkOrderIdCancelMutation,
  useGetManufacturingWorkOrderListQuery,
  useGetManufacturingWorkOrderByWorkOrderIdQuery,
} = injectedRtkApi

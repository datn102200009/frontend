import { baseApi as api } from '../../../shared/api/baseApi'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getMasterDataWarehousesList: build.query<
      GetMasterDataWarehousesListApiResponse,
      GetMasterDataWarehousesListApiArg
    >({
      query: () => ({ url: `/master-data/warehouses/list/` }),
    }),
    getMasterDataUomsList: build.query<
      GetMasterDataUomsListApiResponse,
      GetMasterDataUomsListApiArg
    >({
      query: () => ({ url: `/master-data/uoms/list/` }),
    }),
    getMasterDataItemsList: build.query<
      GetMasterDataItemsListApiResponse,
      GetMasterDataItemsListApiArg
    >({
      query: (queryArg) => ({
        url: `/master-data/items/list/`,
        params: {
          search: queryArg.search,
          status: queryArg.status,
          limit: queryArg.limit,
          offset: queryArg.offset,
        },
      }),
    }),
    postMasterDataItemsCreate: build.mutation<
      PostMasterDataItemsCreateApiResponse,
      PostMasterDataItemsCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/master-data/items/create/`,
        method: 'POST',
        body: queryArg.itemCreateInput,
      }),
    }),
    putMasterDataItemsByItemCodeUpdate: build.mutation<
      PutMasterDataItemsByItemCodeUpdateApiResponse,
      PutMasterDataItemsByItemCodeUpdateApiArg
    >({
      query: (queryArg) => ({
        url: `/master-data/items/${queryArg.itemCode}/update/`,
        method: 'PUT',
        body: queryArg.itemUpdateInput,
      }),
    }),
    deleteMasterDataItemsByItemCodeDelete: build.mutation<
      DeleteMasterDataItemsByItemCodeDeleteApiResponse,
      DeleteMasterDataItemsByItemCodeDeleteApiArg
    >({
      query: (queryArg) => ({
        url: `/master-data/items/${queryArg.itemCode}/delete/`,
        method: 'DELETE',
      }),
    }),
    getMasterDataItemsByItemCodeDetail: build.query<
      GetMasterDataItemsByItemCodeDetailApiResponse,
      GetMasterDataItemsByItemCodeDetailApiArg
    >({
      query: (queryArg) => ({ url: `/master-data/items/${queryArg.itemCode}/detail/` }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as masterDataApi }
export type GetMasterDataWarehousesListApiResponse = /** status 200 Success */ {
  id?: string
  name?: string
}[]
export type GetMasterDataWarehousesListApiArg = void
export type GetMasterDataUomsListApiResponse = /** status 200 Success */ {
  id?: string
  name?: string
}[]
export type GetMasterDataUomsListApiArg = void
export type GetMasterDataItemsListApiResponse = /** status 200 Success */ {
  count?: number
  next?: string | null
  previous?: string | null
  results?: Item[]
}
export type GetMasterDataItemsListApiArg = {
  /** Tìm kiếm theo mã vật tư hoặc tên vật tư */
  search?: string
  status?: 'active' | 'inactive' | 'discontinued'
  /** Giới hạn số bản ghi trả về, tối đa 100 (Bảo vệ chống DoS). */
  limit?: number
  offset?: number
}
export type PostMasterDataItemsCreateApiResponse = /** status 201 Created successfully */ Item
export type PostMasterDataItemsCreateApiArg = {
  itemCreateInput: ItemCreateInput
}
export type PutMasterDataItemsByItemCodeUpdateApiResponse =
  /** status 200 Updated successfully */ Item
export type PutMasterDataItemsByItemCodeUpdateApiArg = {
  itemCode: string
  itemUpdateInput: ItemUpdateInput
}
export type DeleteMasterDataItemsByItemCodeDeleteApiResponse = unknown
export type DeleteMasterDataItemsByItemCodeDeleteApiArg = {
  itemCode: string
}
export type GetMasterDataItemsByItemCodeDetailApiResponse = /** status 200 Success */ Item
export type GetMasterDataItemsByItemCodeDetailApiArg = {
  itemCode: string
}
export type ErrorResponse = {
  detail?: string
}
export type Item = {
  id?: string
  item_code?: string
  item_name?: string
  item_group_id?: string | null
  stock_uom_id?: string | null
  stock_uom_name?: string | null
  hs_code?: string | null
  recycling_coef_a?: number | null
  vat_group?: string | null
  is_import?: boolean
  status?: 'active' | 'inactive' | 'discontinued'
  description?: string | null
  created_at?: string
  updated_at?: string
}
export type ItemCreateInput = {
  item_code: string
  item_name: string
  item_group_id?: string | null
  stock_uom_id?: string | null
  hs_code?: string | null
  /** Hệ số tái chế. Phải lớn hơn hoặc bằng 0. */
  recycling_coef_a?: number | null
  vat_group?: string | null
  is_import?: boolean
  status?: 'active' | 'inactive' | 'discontinued'
  description?: string | null
}
export type ItemUpdateInput = {
  item_name?: string
  item_group_id?: string | null
  stock_uom_id?: string | null
  hs_code?: string | null
  /** Hệ số tái chế. Phải lớn hơn hoặc bằng 0. */
  recycling_coef_a?: number | null
  vat_group?: string | null
  is_import?: boolean
  status?: 'active' | 'inactive' | 'discontinued'
  description?: string | null
}
export const {
  useGetMasterDataWarehousesListQuery,
  useGetMasterDataUomsListQuery,
  useGetMasterDataItemsListQuery,
  usePostMasterDataItemsCreateMutation,
  usePutMasterDataItemsByItemCodeUpdateMutation,
  useDeleteMasterDataItemsByItemCodeDeleteMutation,
  useGetMasterDataItemsByItemCodeDetailQuery,
} = injectedRtkApi

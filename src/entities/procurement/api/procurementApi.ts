import { baseApi as api } from '../../../shared/api/baseApi'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getProcurementSuppliers: build.query<
      GetProcurementSuppliersApiResponse,
      GetProcurementSuppliersApiArg
    >({
      query: () => ({ url: `/procurement/suppliers/` }),
    }),
    postProcurementSuppliers: build.mutation<
      PostProcurementSuppliersApiResponse,
      PostProcurementSuppliersApiArg
    >({
      query: (queryArg) => ({
        url: `/procurement/suppliers/`,
        method: 'POST',
        body: queryArg.supplierInput,
      }),
    }),
    getProcurementSuppliersBySupplierId: build.query<
      GetProcurementSuppliersBySupplierIdApiResponse,
      GetProcurementSuppliersBySupplierIdApiArg
    >({
      query: (queryArg) => ({ url: `/procurement/suppliers/${queryArg.supplierId}/` }),
    }),
    putProcurementSuppliersBySupplierId: build.mutation<
      PutProcurementSuppliersBySupplierIdApiResponse,
      PutProcurementSuppliersBySupplierIdApiArg
    >({
      query: (queryArg) => ({
        url: `/procurement/suppliers/${queryArg.supplierId}/`,
        method: 'PUT',
        body: queryArg.supplierInput,
      }),
    }),
    deleteProcurementSuppliersBySupplierId: build.mutation<
      DeleteProcurementSuppliersBySupplierIdApiResponse,
      DeleteProcurementSuppliersBySupplierIdApiArg
    >({
      query: (queryArg) => ({
        url: `/procurement/suppliers/${queryArg.supplierId}/`,
        method: 'DELETE',
      }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as procurementApi }
export type GetProcurementSuppliersApiResponse = /** status 200 Thành công */ Supplier[]
export type GetProcurementSuppliersApiArg = void
export type PostProcurementSuppliersApiResponse = /** status 201 Tạo thành công */ Supplier
export type PostProcurementSuppliersApiArg = {
  supplierInput: SupplierInput
}
export type GetProcurementSuppliersBySupplierIdApiResponse = /** status 200 Thành công */ Supplier
export type GetProcurementSuppliersBySupplierIdApiArg = {
  /** UUID của nhà cung cấp cần xem */
  supplierId: string
}
export type PutProcurementSuppliersBySupplierIdApiResponse =
  /** status 200 Cập nhật thành công */ Supplier
export type PutProcurementSuppliersBySupplierIdApiArg = {
  /** UUID của nhà cung cấp cần cập nhật */
  supplierId: string
  supplierInput: SupplierInput
}
export type DeleteProcurementSuppliersBySupplierIdApiResponse = unknown
export type DeleteProcurementSuppliersBySupplierIdApiArg = {
  /** UUID của nhà cung cấp cần xóa */
  supplierId: string
}
export type Supplier = {
  id: string
  /** Mã định danh duy nhất của nhà cung cấp */
  name: string
  /** Tên đầy đủ của nhà cung cấp */
  supplier_name: string
  /** Nhóm nhà cung cấp (ví dụ: Local, Import, Distributor) */
  supplier_group?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  address?: string | null
  is_active?: boolean
  created_at?: string
  updated_at?: string
}
export type ErrorResponse = {
  detail?: string
}
export type SupplierInput = {
  /** Mã định danh duy nhất của nhà cung cấp */
  name: string
  /** Tên đầy đủ của nhà cung cấp */
  supplier_name: string
  /** Nhóm nhà cung cấp */
  supplier_group?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  address?: string | null
}
export const {
  useGetProcurementSuppliersQuery,
  usePostProcurementSuppliersMutation,
  useGetProcurementSuppliersBySupplierIdQuery,
  usePutProcurementSuppliersBySupplierIdMutation,
  useDeleteProcurementSuppliersBySupplierIdMutation,
} = injectedRtkApi

import { baseApi as api } from '../../../shared/api/baseApi'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getCrmCustomers: build.query<GetCrmCustomersApiResponse, GetCrmCustomersApiArg>({
      query: () => ({ url: `/crm/customers/` }),
    }),
    postCrmCustomers: build.mutation<PostCrmCustomersApiResponse, PostCrmCustomersApiArg>({
      query: (queryArg) => ({
        url: `/crm/customers/`,
        method: 'POST',
        body: queryArg.customerInput,
      }),
    }),
    getCrmCustomersByCustomerId: build.query<
      GetCrmCustomersByCustomerIdApiResponse,
      GetCrmCustomersByCustomerIdApiArg
    >({
      query: (queryArg) => ({ url: `/crm/customers/${queryArg.customerId}/` }),
    }),
    putCrmCustomersByCustomerId: build.mutation<
      PutCrmCustomersByCustomerIdApiResponse,
      PutCrmCustomersByCustomerIdApiArg
    >({
      query: (queryArg) => ({
        url: `/crm/customers/${queryArg.customerId}/`,
        method: 'PUT',
        body: queryArg.customerInput,
      }),
    }),
    deleteCrmCustomersByCustomerId: build.mutation<
      DeleteCrmCustomersByCustomerIdApiResponse,
      DeleteCrmCustomersByCustomerIdApiArg
    >({
      query: (queryArg) => ({ url: `/crm/customers/${queryArg.customerId}/`, method: 'DELETE' }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as crmApi }
export type GetCrmCustomersApiResponse = /** status 200 Thành công */ Customer[]
export type GetCrmCustomersApiArg = void
export type PostCrmCustomersApiResponse = /** status 201 Tạo thành công */ Customer
export type PostCrmCustomersApiArg = {
  customerInput: CustomerInput
}
export type GetCrmCustomersByCustomerIdApiResponse = /** status 200 Thành công */ Customer
export type GetCrmCustomersByCustomerIdApiArg = {
  /** UUID của khách hàng cần xem */
  customerId: string
}
export type PutCrmCustomersByCustomerIdApiResponse = /** status 200 Cập nhật thành công */ Customer
export type PutCrmCustomersByCustomerIdApiArg = {
  /** UUID của khách hàng cần cập nhật */
  customerId: string
  customerInput: CustomerInput
}
export type DeleteCrmCustomersByCustomerIdApiResponse = unknown
export type DeleteCrmCustomersByCustomerIdApiArg = {
  /** UUID của khách hàng cần xóa */
  customerId: string
}
export type Customer = {
  id: string
  /** Mã định danh duy nhất của khách hàng */
  name: string
  /** Tên đầy đủ của khách hàng */
  customer_name: string
  /** Nhóm khách hàng (ví dụ: Commercial, Individual, Government) */
  customer_group?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  address?: string | null
  /** Hạn mức nợ tối đa cho phép đại lý mua chịu */
  credit_limit?: number
  /** Điều khoản thanh toán (ví dụ: NET30, NET45) */
  payment_terms?: string
  /** Khóa tín dụng chủ động */
  is_credit_locked?: boolean
  is_active?: boolean
  created_at?: string
  updated_at?: string
}
export type ErrorResponse = {
  detail?: string
}
export type CustomerInput = {
  /** Mã định danh duy nhất của khách hàng */
  name: string
  /** Tên đầy đủ của khách hàng */
  customer_name: string
  /** Nhóm khách hàng */
  customer_group?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  address?: string | null
  /** Hạn mức nợ tối đa cho phép đại lý mua chịu */
  credit_limit?: number
  /** Điều khoản thanh toán (ví dụ: NET30, NET45) */
  payment_terms?: string
  /** Khóa tín dụng chủ động */
  is_credit_locked?: boolean
}
export const {
  useGetCrmCustomersQuery,
  usePostCrmCustomersMutation,
  useGetCrmCustomersByCustomerIdQuery,
  usePutCrmCustomersByCustomerIdMutation,
  useDeleteCrmCustomersByCustomerIdMutation,
} = injectedRtkApi

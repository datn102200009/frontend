import { baseApi as api } from '../../../shared/api/baseApi'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    postAccountsAuthLogin: build.mutation<
      PostAccountsAuthLoginApiResponse,
      PostAccountsAuthLoginApiArg
    >({
      query: (queryArg) => ({ url: `/accounts/auth/login/`, method: 'POST', body: queryArg.body }),
    }),
    getAccountsRoles: build.query<GetAccountsRolesApiResponse, GetAccountsRolesApiArg>({
      query: () => ({ url: `/accounts/roles/` }),
    }),
    getAccountsAuthMe: build.query<GetAccountsAuthMeApiResponse, GetAccountsAuthMeApiArg>({
      query: () => ({ url: `/accounts/auth/me/` }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as accountsApi }
export type PostAccountsAuthLoginApiResponse = /** status 200 Đăng nhập thành công */ LoginResponse
export type PostAccountsAuthLoginApiArg = {
  body: {
    username: string
    password: string
  }
}
export type GetAccountsRolesApiResponse = /** status 200 Thành công */ UserRole[]
export type GetAccountsRolesApiArg = void
export type GetAccountsAuthMeApiResponse = /** status 200 Thành công */ {
  id?: string
  username?: string
  email?: string
  role?: string | null
  employee_id?: string | null
  permissions?: string[]
}
export type GetAccountsAuthMeApiArg = void
export type LoginResponse = {
  /** Access token (JWT) */
  access?: string
  /** Refresh token (JWT) */
  refresh?: string
  user_id?: string
  username?: string
  email?: string
  /** Tên role của user */
  role?: string | null
  /** Họ và tên đầy đủ của user (lấy từ Employee) */
  full_name?: string | null
  /** Danh sách mã quyền của user */
  permissions?: string[]
}
export type ErrorResponse = {
  detail?: string
}
export type UserRole = {
  id?: string
  name?: string
  description?: string
}
export const {
  usePostAccountsAuthLoginMutation,
  useGetAccountsRolesQuery,
  useGetAccountsAuthMeQuery,
} = injectedRtkApi

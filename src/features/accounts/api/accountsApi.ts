import { baseApi as api } from '../../../shared/api/baseApi'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    postAccountsAuthLogin: build.mutation<
      PostAccountsAuthLoginApiResponse,
      PostAccountsAuthLoginApiArg
    >({
      query: (queryArg) => ({ url: `/accounts/auth/login/`, method: 'POST', body: queryArg.body }),
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
}
export type ErrorResponse = {
  detail?: string
}
export const { usePostAccountsAuthLoginMutation } = injectedRtkApi

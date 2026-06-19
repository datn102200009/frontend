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
    getAccountsUsers: build.query<
      GetAccountsUsersApiResponse,
      GetAccountsUsersApiArg
    >({
      query: (queryArg) => ({
        url: `/accounts/users/`,
        params: {
          search: queryArg?.search,
          limit: queryArg?.limit,
          offset: queryArg?.offset,
        },
      }),
    }),
    postAccountsUsers: build.mutation<
      PostAccountsUsersApiResponse,
      PostAccountsUsersApiArg
    >({
      query: (queryArg) => ({
        url: `/accounts/users/`,
        method: 'POST',
        body: queryArg.body,
      }),
    }),
    putAccountsUsers: build.mutation<
      PutAccountsUsersApiResponse,
      PutAccountsUsersApiArg
    >({
      query: (queryArg) => ({
        url: `/accounts/users/${queryArg.id}/`,
        method: 'PUT',
        body: queryArg.body,
      }),
    }),
    deleteAccountsUsers: build.mutation<
      DeleteAccountsUsersApiResponse,
      DeleteAccountsUsersApiArg
    >({
      query: (queryArg) => ({
        url: `/accounts/users/${queryArg.id}/`,
        method: 'DELETE',
      }),
    }),
    postAccountsUsersChangePassword: build.mutation<
      PostAccountsUsersChangePasswordApiResponse,
      PostAccountsUsersChangePasswordApiArg
    >({
      query: (queryArg) => ({
        url: `/accounts/users/${queryArg.id}/change-password/`,
        method: 'POST',
        body: queryArg.body,
      }),
    }),
    getAccountsUsersUnlinkedEmployees: build.query<
      GetAccountsUsersUnlinkedEmployeesApiResponse,
      GetAccountsUsersUnlinkedEmployeesApiArg
    >({
      query: () => ({ url: `/accounts/users/unlinked-employees/` }),
    }),
    getAccountsPermissions: build.query<
      GetAccountsPermissionsApiResponse,
      GetAccountsPermissionsApiArg
    >({
      query: () => ({ url: `/accounts/permissions/` }),
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
  employee_id?: string | null
  permissions?: string[]
}
export type GetAccountsAuthMeApiArg = void
export type LoginResponse = {
  access?: string
  refresh?: string
  user_id?: string
  username?: string
  full_name?: string | null
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

export type UserOutput = {
  id: string
  username: string
  employee_id: string
  employee_name: string
  direct_permissions: string[]
  all_permissions: string[]
  is_active: boolean
  last_login?: string | null
  created_at: string
}

export type GetAccountsUsersApiResponse = {
  count: number
  next: string | null
  previous: string | null
  results: UserOutput[]
}

export type GetAccountsUsersApiArg = {
  search?: string
  limit?: number
  offset?: number
} | void

export type PostAccountsUsersApiResponse = {
  id: string
  username: string
  email: string
  employee_id: string
}

export type PostAccountsUsersApiArg = {
  body: {
    employee_id: string
    username: string
    password: string
    direct_permissions?: string[]
  }
}

export type PutAccountsUsersApiResponse = {
  id: string
  username: string
  direct_permissions: string[]
}

export type PutAccountsUsersApiArg = {
  id: string
  body: {
    direct_permissions?: string[]
  }
}

export type DeleteAccountsUsersApiResponse = void
export type DeleteAccountsUsersApiArg = {
  id: string
}

export type PostAccountsUsersChangePasswordApiResponse = {
  message: string
}

export type PostAccountsUsersChangePasswordApiArg = {
  id: string
  body: {
    password: string
  }
}

export type UnlinkedEmployee = {
  employee_id: string
  full_name: string
  email: string | null
}

export type GetAccountsUsersUnlinkedEmployeesApiResponse = UnlinkedEmployee[]
export type GetAccountsUsersUnlinkedEmployeesApiArg = void

export type SystemPermission = {
  code: string
  name: string
}

export type GetAccountsPermissionsApiResponse = SystemPermission[]
export type GetAccountsPermissionsApiArg = void

export const {
  usePostAccountsAuthLoginMutation,
  useGetAccountsRolesQuery,
  useGetAccountsAuthMeQuery,
  useGetAccountsUsersQuery,
  usePostAccountsUsersMutation,
  usePutAccountsUsersMutation,
  useDeleteAccountsUsersMutation,
  usePostAccountsUsersChangePasswordMutation,
  useGetAccountsUsersUnlinkedEmployeesQuery,
  useGetAccountsPermissionsQuery,
} = injectedRtkApi

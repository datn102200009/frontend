import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  prepareHeaders: (headers) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
   
  const result = await baseQuery(args, api, extraOptions);
  
  if (result.error && result.error.status === 401) {
    api.dispatch({ type: 'auth/logout' });
  }
  
  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  refetchOnMountOrArgChange: true,
  tagTypes: [
    'Customers',
    'Suppliers',
    'PurchaseOrders',
    'SalesOrders',
    'Invoices',
    'CashFlows',
    'WorkOrders',
    'Boms',
    'Inventory',
    'Employees',
    'Attendances',
    'LeaveRequests',
    'SalarySlips',
    'PublicHolidays',
    'Rewards',
    'Disciplines',
    'Uoms',
  ],
  endpoints: () => ({}),
});

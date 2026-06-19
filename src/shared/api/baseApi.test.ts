import { renderHook, waitFor } from '@testing-library/react';
import { masterDataApi } from '../../features/inventory/api/masterDataApi';
import { server } from '../../shared/lib/test/server';
import { http, HttpResponse } from 'msw';
import { describe, it, expect } from 'vitest';
import React from 'react';
import { Provider } from 'react-redux';
import { setupStore } from '@app/store';

describe('baseApi configuration', () => {
  it('should preserve refetchOnMountOrArgChange as true for other queries (e.g. warehouses)', async () => {
    let callCount = 0;
    server.use(
      http.get('http://localhost:8000/api/v1/master-data/warehouses/list/', () => {
        callCount++;
        return HttpResponse.json([{ id: '1', name: 'Kho nguồn' }]);
      })
    );

    const store = setupStore();

    function Wrapper({ children }: { children: React.ReactNode }) {
      return React.createElement(Provider as any, { store }, children);
    }

    // Call first time
    const { result, unmount } = renderHook(
      () => masterDataApi.useGetMasterDataWarehousesListQuery(),
      { wrapper: Wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(callCount).toBe(1);

    // Unmount and remount (should refetch since refetchOnMountOrArgChange is globally true)
    unmount();

    const { result: result2 } = renderHook(
      () => masterDataApi.useGetMasterDataWarehousesListQuery(),
      { wrapper: Wrapper }
    );

    await waitFor(() => expect(result2.current.isSuccess).toBe(true));
    // It should refetch, callCount must be 2
    expect(callCount).toBe(2);
  });
});

import { renderHook, waitFor } from '@testing-library/react';
import { masterDataApi } from './masterDataApi';
import { server } from '@shared/lib/test/server';
import { http, HttpResponse } from 'msw';
import { describe, it, expect } from 'vitest';
import React from 'react';
import { Provider } from 'react-redux';
import { setupStore } from '@app/store';

describe('masterDataApi UOM Cache Override', () => {
  it('overrides refetchOnMountOrArgChange to false and caches results', async () => {
    let callCount = 0;
    server.use(
      http.get('http://localhost:8000/api/v1/master-data/uoms/list/', () => {
        callCount++;
        return HttpResponse.json([{ id: '1', name: 'Cái' }]);
      })
    );

    const store = setupStore();

    function Wrapper({ children }: { children: React.ReactNode }) {
      return <Provider store={store}>{children}</Provider>;
    }

    // Call first time
    const { result, unmount } = renderHook(
      () => masterDataApi.useGetMasterDataUomsListQuery(undefined, { refetchOnMountOrArgChange: false }),
      { wrapper: Wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(callCount).toBe(1);

    // Unmount and remount (which would trigger refetch normally since baseApi has refetchOnMountOrArgChange: true)
    unmount();

    const { result: result2 } = renderHook(
      () => masterDataApi.useGetMasterDataUomsListQuery(undefined, { refetchOnMountOrArgChange: false }),
      { wrapper: Wrapper }
    );

    await waitFor(() => expect(result2.current.isSuccess).toBe(true));
    // It should NOT refetch, callCount must remain 1
    expect(callCount).toBe(1);
  });
});

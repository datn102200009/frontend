import { useSearchParams } from 'react-router-dom';
import { useCallback } from 'react';

export function usePurchaseOrderFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const status = searchParams.get('status') || '';
  const search = searchParams.get('search') || '';

  const setStatus = useCallback(
    (newStatus: string) => {
      const nextParams = new URLSearchParams(searchParams);
      if (newStatus) {
        nextParams.set('status', newStatus);
      } else {
        nextParams.delete('status');
      }
      // Clear specific order details view when filter changes to avoid confusion
      nextParams.delete('id');
      setSearchParams(nextParams);
    },
    [searchParams, setSearchParams]
  );

  const setSearch = useCallback(
    (newSearch: string) => {
      const nextParams = new URLSearchParams(searchParams);
      if (newSearch) {
        nextParams.set('search', newSearch);
      } else {
        nextParams.delete('search');
      }
      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const clearFilters = useCallback(() => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('status');
    nextParams.delete('search');
    nextParams.delete('id');
    setSearchParams(nextParams);
  }, [searchParams, setSearchParams]);

  return {
    status,
    search,
    setStatus,
    setSearch,
    clearFilters,
  };
}

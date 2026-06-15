import { useSearchParams } from 'react-router-dom';
import { useCallback } from 'react';

export function useInvoiceFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const status = searchParams.get('status') !== null ? searchParams.get('status')! : 'unpaid,partial';

  const setStatus = useCallback(
    (newStatus: string) => {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('status', newStatus);
      // Clear specific invoice details view when filter changes to avoid confusion
      nextParams.delete('id');
      setSearchParams(nextParams);
    },
    [searchParams, setSearchParams]
  );

  const clearFilters = useCallback(() => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('status');
    nextParams.delete('id');
    setSearchParams(nextParams);
  }, [searchParams, setSearchParams]);

  return {
    status,
    setStatus,
    clearFilters,
  };
}

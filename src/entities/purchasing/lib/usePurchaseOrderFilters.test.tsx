import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { usePurchaseOrderFilters } from './usePurchaseOrderFilters';

describe('usePurchaseOrderFilters', () => {
  it('updates status param', () => {
    const { result } = renderHook(() => usePurchaseOrderFilters(), {
      wrapper: MemoryRouter,
    });
    act(() => result.current.setStatus('pending'));
    expect(result.current.status).toBe('pending');
  });

  it('clears filters', () => {
    const { result } = renderHook(() => usePurchaseOrderFilters(), {
      wrapper: ({ children }) => <MemoryRouter initialEntries={['/?status=pending&search=abc']}>{children}</MemoryRouter>,
    });
    act(() => result.current.clearFilters());
    expect(result.current.status).toBe('');
    expect(result.current.search).toBe('');
  });
});

import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useInvoiceFilters } from './useInvoiceFilters';

describe('useInvoiceFilters', () => {
  it('defaults to unpaid,partial when no status param is provided', () => {
    const { result } = renderHook(() => useInvoiceFilters(), {
      wrapper: MemoryRouter,
    });
    expect(result.current.status).toBe('unpaid,partial');
  });

  it('updates status param', () => {
    const { result } = renderHook(() => useInvoiceFilters(), {
      wrapper: MemoryRouter,
    });
    act(() => result.current.setStatus('paid'));
    expect(result.current.status).toBe('paid');
  });

  it('clears filters and defaults back to unpaid,partial', () => {
    const { result } = renderHook(() => useInvoiceFilters(), {
      wrapper: ({ children }) => <MemoryRouter initialEntries={['/?status=paid']}>{children}</MemoryRouter>,
    });
    expect(result.current.status).toBe('paid');
    act(() => result.current.clearFilters());
    expect(result.current.status).toBe('unpaid,partial');
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any */
import { waitFor } from '@testing-library/react';
import HrmPage from './HrmPage';
import { renderWithProviders } from '@shared/lib/test/test-utils';

// Mock useNavigate from react-router-dom to verify redirection
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom') as any;
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('HrmPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects HrmPage root to /hrm/employees', async () => {
    renderWithProviders(<HrmPage />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/hrm/employees', { replace: true });
    });
  });

  it('redirects employee tabs to /hrm/employees', async () => {
    renderWithProviders(<HrmPage />, {
      initialEntries: ['/hrm?tab=employees&id=emp-1']
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/hrm/employees?tab=employees&id=emp-1', { replace: true });
    });
  });

  it('redirects attendance/leave tabs to /hrm/attendance-leave', async () => {
    renderWithProviders(<HrmPage />, {
      initialEntries: ['/hrm?tab=attendance&date=2026-06-15']
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/hrm/attendance-leave?tab=attendance&date=2026-06-15', { replace: true });
    });
  });

  it('redirects rewards_disciplines to /hrm/rewards-disciplines', async () => {
    renderWithProviders(<HrmPage />, {
      initialEntries: ['/hrm?tab=rewards_disciplines']
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/hrm/rewards-disciplines?', { replace: true });
    });
  });

  it('redirects public_holidays to /hrm/holidays', async () => {
    renderWithProviders(<HrmPage />, {
      initialEntries: ['/hrm?tab=public_holidays']
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/hrm/holidays?', { replace: true });
    });
  });

  it('redirects salary to /hrm/payroll', async () => {
    renderWithProviders(<HrmPage />, {
      initialEntries: ['/hrm?tab=salary']
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/hrm/payroll?', { replace: true });
    });
  });
});

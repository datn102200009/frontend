/* eslint-disable @typescript-eslint/no-explicit-any */
import { screen, waitFor } from '@testing-library/react';
import FinancePage from './FinancePage';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import { server } from '@shared/lib/test/server';
import { http, HttpResponse } from 'msw';

// Mock useNavigate from react-router-dom to verify redirection
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom') as any;
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('FinancePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders FinancePage and loads cash flow transactions list', async () => {
    server.use(
      http.get('*/api/v1/finance/cash-flows/', () => {
        return HttpResponse.json([
          {
            id: 'TX-001',
            name: 'Phiếu thu Alpha',
            payment_type: 'receive',
            category: 'bank_transfer',
            amount: 5000000,
            payment_date: '2026-05-20',
            remarks: 'Thu tiền hóa đơn'
          }
        ]);
      })
    );

    renderWithProviders(<FinancePage />);

    // Title should be present
    expect(screen.getByRole('heading', { name: /Quản Lý Dòng Tiền/i })).toBeInTheDocument();

    // Check loaded transaction
    expect(await screen.findByText('TX-001')).toBeInTheDocument();
    expect(screen.getByText('Thu tiền hóa đơn')).toBeInTheDocument();
  });

  it('redirects AP/AR tabs to InvoicesPage', async () => {
    server.use(
      http.get('*/api/v1/finance/cash-flows/', () => HttpResponse.json([]))
    );

    renderWithProviders(<FinancePage />, {
      initialEntries: ['/finance?tab=ap&id=PI-123']
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        '/finance/invoices?tab=purchase_invoices&id=PI-123',
        { replace: true }
      );
    });
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('allows rejecting pending cash flow from approvals tab', async () => {
    let rejectPayload: any = null;
    let rejectPk: string | null = null;

    server.use(
      http.get('*/api/v1/finance/cash-flows/', ({ request }) => {
        const url = new URL(request.url);
        const status = url.searchParams.get('status');
        
        if (status === 'pending_approval') {
          return HttpResponse.json({
            count: 1,
            total_pages: 1,
            current_page: 1,
            results: [
              {
                id: 'fa-pending-tx-123',
                name: 'CF-PAY-FA-001',
                payment_type: 'pay',
                category: 'Mua tài sản cố định',
                amount: 20000000,
                payment_date: '2026-06-15',
                status: 'pending_approval',
                remarks: 'Phiếu chi mua tài sản cố định'
              }
            ]
          });
        }
        return HttpResponse.json([]);
      }),
      http.post('*/api/v1/finance/cash-flows/:pk/reject/', async ({ params, request }) => {
        rejectPk = params.pk as string;
        rejectPayload = await request.json();
        return HttpResponse.json({ id: params.pk, status: 'rejected' });
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<FinancePage />, {
      initialEntries: ['/finance?tab=approvals'],
      preloadedState: {
        auth: {
          user: {
            id: 'user-001',
            username: 'admin',
            email: 'admin@test.com',
            role: 'admin',
            permissions: ['finance.approve_cash_flow'],
          } as any,
          token: 'mock-token',
          isAuthenticated: true,
        },
      },
    });

    // Check header/tab is active
    expect(await screen.findByText('Phiếu chi mua tài sản cố định')).toBeInTheDocument();

    // Find "Từ chối" button and click it
    const rejectBtn = screen.getByRole('button', { name: /Từ chối/i });
    await user.click(rejectBtn);

    // ConfirmModal should open
    const confirmModal = await screen.findByRole('dialog', { name: /Từ chối phê duyệt giao dịch/i });
    expect(confirmModal).toBeInTheDocument();

    // Type optional remarks
    const textarea = within(confirmModal).getByPlaceholderText(/Nhập lý do từ chối/i);
    await user.type(textarea, 'Không đồng ý mua');

    // Click confirm "Từ chối" button
    const confirmBtn = within(confirmModal).getByRole('button', { name: 'Từ chối' });
    await user.click(confirmBtn);

    // Verify API called correctly
    await waitFor(() => {
      expect(rejectPk).toBe('fa-pending-tx-123');
      expect(rejectPayload).toEqual({ remarks: 'Không đồng ý mua' });
      expect(screen.queryByRole('dialog', { name: /Từ chối phê duyệt giao dịch/i })).not.toBeInTheDocument();
    });
  });
});

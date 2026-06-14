/* eslint-disable @typescript-eslint/no-explicit-any */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FinancePage from './FinancePage';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import { server } from '@shared/lib/test/server';
import { http, HttpResponse } from 'msw';

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
    expect(screen.getByRole('heading', { name: /Quản Lý Tài Chính/i })).toBeInTheDocument();

    // Check loaded transaction
    expect(await screen.findByText('TX-001')).toBeInTheDocument();
    expect(screen.getByText('Thu tiền hóa đơn')).toBeInTheDocument();
  });

  it('navigates to AP tab and processes an AP invoice payment successfully', async () => {
    let payPayload: any = null;

    server.use(
      http.get('*/api/v1/finance/cash-flows/', () => HttpResponse.json([])),
      http.get('*/api/v1/finance/invoices/purchase/', () => {
        return HttpResponse.json({
          count: 1,
          total_pages: 1,
          current_page: 1,
          results: [
            {
              id: 'PI-001',
              order: 'PO-001',
              vendor: 'VND-01',
              vendor_name: 'Supplier A',
              total_amount: 10000000,
              paid_amount: 4000000,
              status: 'partial',
              due_date: '2026-06-30',
              lines: []
            }
          ]
        });
      }),
      http.post('*/api/v1/finance/invoices/purchase/PI-001/pay/', async ({ request }) => {
        payPayload = await request.json();
        return HttpResponse.json({
          id: 'PI-001',
          status: 'paid',
          total_amount: 10000000,
          paid_amount: 10000000
        });
      })
    );

    renderWithProviders(<FinancePage />);
    const user = userEvent.setup();

    // Click AP tab
    const apTab = screen.getByRole('tab', { name: /Phải Trả \(AP\)/i });
    await user.click(apTab);

    // Wait for unpaid purchase invoice to load
    expect(await screen.findByText('Supplier A')).toBeInTheDocument();
    expect(screen.getByText('Thanh Toán Một Phần')).toBeInTheDocument();

    // Click "Thanh Toán" button
    const payBtn = screen.getByRole('button', { name: /Thanh Toán/i });
    await user.click(payBtn);

    // Form inputs modal should appear
    expect(await screen.findByRole('heading', { name: /Thanh Toán Hóa Đơn Mua \(AP\)/i })).toBeInTheDocument();

    // Input pay amount
    const payModal = screen.getByRole('dialog');
    const payAmountInput = within(payModal).getByLabelText(/Số tiền thanh toán/i);
    await user.clear(payAmountInput);
    await user.type(payAmountInput, '6000000');

    // Submit payment
    const confirmBtn = within(payModal).getByRole('button', { name: /Xác nhận thanh toán/i });
    await user.click(confirmBtn);

    // Verify correct payment payload and modal closed
    await waitFor(() => {
      expect(payPayload).toEqual({
        amount: 6000000,
        payment_method: 'bank_transfer'
      });
      expect(screen.queryByRole('heading', { name: /Thanh Toán Hóa Đơn Mua \(AP\)/i })).not.toBeInTheDocument();
    });
  });

  it('navigates to AR tab and opens collection form prefilled with customer details', async () => {
    server.use(
      http.get('*/api/v1/finance/cash-flows/', () => HttpResponse.json([])),
      http.get('*/api/v1/finance/invoices/sales/', () => {
        return HttpResponse.json({
          count: 1,
          total_pages: 1,
          current_page: 1,
          results: [
            {
              id: 'SI-002',
              order: 'SO-002',
              customer: 'CUS-02',
              customer_name: 'Customer B',
              total_amount: 15000000,
              paid_amount: 5000000,
              status: 'partial',
              created_at: '2026-06-01',
              lines: []
            }
          ]
        });
      })
    );

    renderWithProviders(<FinancePage />);
    const user = userEvent.setup();

    // Click AR tab
    const arTab = screen.getByRole('tab', { name: /Phải Thu \(AR\)/i });
    await user.click(arTab);

    // Wait for unpaid sales invoice to load
    expect(await screen.findByText('Customer B')).toBeInTheDocument();
    expect(screen.getByText('Thanh Toán Một Phần')).toBeInTheDocument();

    // Click "Thu Tiền" button
    const collectBtn = screen.getByRole('button', { name: /Thu tiền/i });
    await user.click(collectBtn);

    // Form inputs modal should appear prefilled
    expect(await screen.findByRole('heading', { name: /Thu Tiền Hóa Đơn Bán \(AR\)/i })).toBeInTheDocument();
    
    // Check fields loaded in the modal
    const modal = screen.getByRole('dialog');
    expect(within(modal).getByText('Customer B')).toBeInTheDocument();

    const amountInput = within(modal).getByLabelText(/Số tiền thu nợ/i);
    expect(amountInput).toHaveValue(10000000); // Prefilled remaining amount: 15m - 5m = 10m
  });
});

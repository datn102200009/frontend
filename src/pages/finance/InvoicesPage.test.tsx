/* eslint-disable @typescript-eslint/no-explicit-any */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InvoicesPage from './InvoicesPage';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import { server } from '@shared/lib/test/server';
import { http, HttpResponse } from 'msw';

describe('InvoicesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('navigates to AP tab (Hoá Đơn Mua) and processes an AP invoice payment successfully', async () => {
    let payPayload: any = null;

    server.use(
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
      http.get('*/api/v1/finance/invoices/sales/', () => {
        return HttpResponse.json({
          count: 0,
          total_pages: 0,
          current_page: 1,
          results: []
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

    renderWithProviders(<InvoicesPage />);
    const user = userEvent.setup();

    // Click AP tab (Hoá Đơn Mua)
    const apTab = screen.getByRole('tab', { name: /Hoá Đơn Mua/i });
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

    // Submit payment form
    const submitBtn = within(payModal).getByRole('button', { name: /Xác nhận thanh toán/i });
    await user.click(submitBtn);

    // ConfirmModal appears
    const confirmModal = await screen.findByRole('dialog', { name: /Xác nhận thanh toán hóa đơn/i });
    const confirmBtn = within(confirmModal).getByRole('button', { name: /Xác nhận thanh toán/i });
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

  it('navigates to AR tab (Hoá Đơn Bán) and opens collection form prefilled with customer details', async () => {
    server.use(
      http.get('*/api/v1/finance/invoices/purchase/', () => {
        return HttpResponse.json({
          count: 0,
          total_pages: 0,
          current_page: 1,
          results: []
        });
      }),
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

    renderWithProviders(<InvoicesPage />);
    const user = userEvent.setup();

    // Click AR tab (Hoá Đơn Bán)
    const arTab = screen.getByRole('tab', { name: /Hoá Đơn Bán/i });
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

  it('filters invoices by status using status filter dropdown', async () => {
    let lastAPQueryStatus: string | null | undefined = undefined;

    server.use(
      http.get('*/api/v1/finance/invoices/purchase/', ({ request }) => {
        const url = new URL(request.url);
        lastAPQueryStatus = url.searchParams.get('status');
        return HttpResponse.json({
          count: 1,
          total_pages: 1,
          current_page: 1,
          results: [
            {
              id: 'PI-001',
              order: 'PO-001',
              vendor: 'VND-01',
              vendor_name: lastAPQueryStatus === 'paid' ? 'Paid Supplier' : 'General Supplier',
              total_amount: 10000000,
              paid_amount: 4000000,
              status: lastAPQueryStatus || 'unpaid',
              due_date: '2026-06-30',
              lines: []
            }
          ]
        });
      }),
      http.get('*/api/v1/finance/invoices/sales/', () => {
        return HttpResponse.json({
          count: 0,
          total_pages: 0,
          current_page: 1,
          results: []
        });
      })
    );

    renderWithProviders(<InvoicesPage />);
    const user = userEvent.setup();

    // Trạng thái mặc định phải là 'unpaid,partial'
    await waitFor(() => {
      expect(lastAPQueryStatus).toBe('unpaid,partial');
      expect(screen.getByText('General Supplier')).toBeInTheDocument();
    });

    // Định vị dropdown chọn bộ lọc
    const select = screen.getByRole('combobox');
    
    // Chọn "Đã thanh toán" (paid)
    await user.selectOptions(select, 'paid');
    
    // Kiểm tra API được gọi với status=paid và UI cập nhật dữ liệu
    await waitFor(() => {
      expect(lastAPQueryStatus).toBe('paid');
      expect(screen.getByText('Paid Supplier')).toBeInTheDocument();
    });

    // Chọn "Tất cả" (value rỗng)
    await user.selectOptions(select, '');

    // Kiểm tra API được gọi không có param status
    await waitFor(() => {
      expect(lastAPQueryStatus).toBeNull();
    });
  });
});

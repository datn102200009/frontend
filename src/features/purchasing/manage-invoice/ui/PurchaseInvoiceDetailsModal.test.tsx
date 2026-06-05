/* eslint-disable @typescript-eslint/no-explicit-any */
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PurchaseInvoiceDetailsModal } from './PurchaseInvoiceDetailsModal';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import { server } from '@shared/lib/test/server';
import { http, HttpResponse } from 'msw';

describe('PurchaseInvoiceDetailsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockInvoice = {
    id: 'PI-BLOCKED',
    order: 'PO-001',
    vendor: 'SUP01',
    vendor_name: 'Tech Component',
    status: 'blocked_for_payment',
    total_amount: 15000000,
    paid_amount: 0,
    block_reason: 'Chênh lệch đơn giá dòng sản phẩm LKA',
    due_date: '2026-06-30',
    qty_fulfillment_rate: 95.50,
    created_at: '2026-05-20',
    lines: [
      {
        id: 'PIL-001',
        item_name: 'Linh kiện A',
        item_code: 'LKA',
        quantity: 10,
        unit_price: 1500000,
        qty_fulfillment_rate: 95.50,
        import_tax: 0,
        vat_tax: 10,
        line_total: 15000000
      }
    ]
  };

  it('renders blocked warning alert and disables payment button when status is blocked_for_payment', async () => {
    server.use(
      http.get('*/api/v1/purchasing/invoices/PI-BLOCKED/', () => {
        return HttpResponse.json(mockInvoice);
      })
    );

    renderWithProviders(<PurchaseInvoiceDetailsModal invoiceId="PI-BLOCKED" onClose={vi.fn()} />);

    // Wait for data to load
    expect(await screen.findByText('Hóa Đơn PI-BLOCK')).toBeInTheDocument();

    // Check warning block alert exists and displays reason
    expect(screen.getByText(/Hóa đơn bị chặn thanh toán/i)).toBeInTheDocument();
    expect(screen.getByText(/Chênh lệch đơn giá dòng sản phẩm LKA/i)).toBeInTheDocument();

    // Check quantity mismatch alert is present
    expect(screen.getByText(/Lưu ý: Chênh lệch số lượng nhận hàng/i)).toBeInTheDocument();
    expect(screen.getAllByText('95.5%').length).toBeGreaterThan(0);

    // Check that payment button is disabled
    const payBtn = screen.getByRole('button', { name: /Thanh Toán Hóa Đơn/i });
    expect(payBtn).toBeDisabled();

    // Check the "Tỷ lệ nhận" column displays
    expect(screen.getByText('Tỷ lệ nhận')).toBeInTheDocument();
  });

  it('allows payment submission when invoice is not blocked', async () => {
    let payPayload: any = null;
    const unpaidInvoice = {
      ...mockInvoice,
      id: 'PI-UNPAID',
      status: 'unpaid',
      block_reason: null,
      qty_fulfillment_rate: 100.00,
      lines: [
        {
          ...mockInvoice.lines[0],
          qty_fulfillment_rate: 100.00
        }
      ]
    };

    server.use(
      http.get('*/api/v1/purchasing/invoices/PI-UNPAID/', () => {
        return HttpResponse.json(unpaidInvoice);
      }),
      http.post('*/api/v1/purchasing/invoices/PI-UNPAID/pay/', async ({ request }) => {
        payPayload = await request.json();
        return HttpResponse.json({ ...unpaidInvoice, status: 'paid', paid_amount: 15000000 });
      })
    );

    const handleClose = vi.fn();
    renderWithProviders(<PurchaseInvoiceDetailsModal invoiceId="PI-UNPAID" onClose={handleClose} />);

    // Wait for data to load
    expect(await screen.findByText('Hóa Đơn PI-UNPAI')).toBeInTheDocument();

    // Verify warnings are NOT present
    expect(screen.queryByText(/Hóa đơn bị chặn thanh toán/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Lưu ý: Chênh lệch số lượng nhận hàng/i)).not.toBeInTheDocument();

    // Click pay button
    const user = userEvent.setup();
    const payBtn = screen.getByRole('button', { name: /Thanh Toán Hóa Đơn/i });
    expect(payBtn).toBeEnabled();
    await user.click(payBtn);

    // Form inputs modal should appear
    expect(await screen.findByText('Thanh Toán Hóa Đơn Mua')).toBeInTheDocument();

    // Submit payment
    const confirmBtn = screen.getByRole('button', { name: /Xác nhận thanh toán/i });
    await user.click(confirmBtn);

    // Verify POST pay API is called
    await waitFor(() => {
      expect(payPayload).toEqual({
        amount: 15000000,
        payment_method: 'bank_transfer'
      });
    });
  });
});

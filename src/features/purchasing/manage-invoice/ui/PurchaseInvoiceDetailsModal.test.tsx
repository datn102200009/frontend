import { screen } from '@testing-library/react';
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

  it('renders blocked warning alert and verify payment and matching buttons are not present when status is blocked_for_payment', async () => {
    server.use(
      http.get('*/api/v1/purchasing/invoices/PI-BLOCKED/', () => {
        return HttpResponse.json(mockInvoice);
      })
    );

    renderWithProviders(<PurchaseInvoiceDetailsModal invoiceId="PI-BLOCKED" onClose={vi.fn()} />);

    // Wait for data to load
    expect(await screen.findByText('Hóa Đơn PI-BLOCK')).toBeInTheDocument();

    // Check warning block alert exists and displays reason
    expect(screen.getByText(/Cảnh báo đối soát/i)).toBeInTheDocument();
    expect(screen.getByText(/Chênh lệch đơn giá dòng sản phẩm LKA/i)).toBeInTheDocument();

    // Check quantity mismatch alert is present
    expect(screen.getByText(/Lưu ý: Chênh lệch số lượng nhận hàng/i)).toBeInTheDocument();
    expect(screen.getAllByText('95.5%').length).toBeGreaterThan(0);

    // Verify payment and matching buttons are NOT present
    expect(screen.queryByRole('button', { name: /Thanh Toán Hóa Đơn/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Chạy lại Đối soát/i })).not.toBeInTheDocument();

    // Check the "Tỷ lệ nhận" column displays
    expect(screen.getByText('Tỷ lệ nhận')).toBeInTheDocument();
  });

  it('renders normal details for unpaid invoice and does not show payment buttons', async () => {
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
      })
    );

    const handleClose = vi.fn();
    renderWithProviders(<PurchaseInvoiceDetailsModal invoiceId="PI-UNPAID" onClose={handleClose} />);

    // Wait for data to load
    expect(await screen.findByText('Hóa Đơn PI-UNPAI')).toBeInTheDocument();

    // Verify warnings are NOT present
    expect(screen.queryByText(/Hóa đơn bị chặn thanh toán/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Lưu ý: Chênh lệch số lượng nhận hàng/i)).not.toBeInTheDocument();

    // Verify buttons are not present
    expect(screen.queryByRole('button', { name: /Thanh Toán Hóa Đơn/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Chạy lại Đối soát/i })).not.toBeInTheDocument();
  });
});

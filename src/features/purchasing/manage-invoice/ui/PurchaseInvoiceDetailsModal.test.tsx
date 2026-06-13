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
    id: 'PI-UNPAID-12345',
    order: 'PO-001',
    vendor: 'SUP01',
    vendor_name: 'Tech Component',
    status: 'unpaid',
    total_amount: 15000000,
    paid_amount: 0,
    due_date: '2026-06-30',
    created_at: '2026-05-20',
    lines: [
      {
        id: 'PIL-001',
        item_name: 'Linh kiện A',
        item_code: 'LKA',
        quantity: 10,
        unit_price: 1500000,
        import_tax: 0,
        vat_tax: 10,
        line_total: 15000000
      }
    ]
  };

  it('renders details correctly for unpaid invoice', async () => {
    server.use(
      http.get('*/api/v1/purchasing/invoices/PI-UNPAID-12345/', () => {
        return HttpResponse.json(mockInvoice);
      })
    );

    const handleClose = vi.fn();
    renderWithProviders(<PurchaseInvoiceDetailsModal invoiceId="PI-UNPAID-12345" onClose={handleClose} />);

    // Wait for data to load
    expect(await screen.findByText('Hóa Đơn PI-UNPAI')).toBeInTheDocument();

    // Verify vendor name and status
    expect(screen.getByText('Tech Component')).toBeInTheDocument();
    expect(screen.getByText('Chưa thanh toán')).toBeInTheDocument();

    // Verify totals using regex to avoid non-breaking space issues
    expect(screen.getAllByText(/15\.000\.000/).length).toBeGreaterThan(0);

    // Verify item name and details
    expect(screen.getByText('Linh kiện A')).toBeInTheDocument();
  });
});


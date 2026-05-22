/* eslint-disable @typescript-eslint/no-explicit-any */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PurchasingPage } from './PurchasingPage';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import { server } from '@shared/lib/test/server';
import { http, HttpResponse } from 'msw';

describe('PurchasingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders PurchasingPage and switches between orders and invoices tabs', async () => {
    server.use(
      http.get('*/api/v1/purchasing/orders/', () => {
        return HttpResponse.json([
          {
            id: 'PO-001',
            vendor: 'SUP01',
            vendor_name: 'Tech Component',
            total_amount: 15000000,
            status: 'draft',
            created_at: '2026-05-20',
            lines: []
          }
        ]);
      }),
      http.get('*/api/v1/purchasing/invoices/', () => {
        return HttpResponse.json([
          {
            id: 'PI-001',
            order: 'PO-001',
            vendor: 'SUP01',
            vendor_name: 'Tech Component',
            total_amount: 15000000,
            paid_amount: 0,
            status: 'unpaid',
            created_at: '2026-05-20',
            lines: []
          }
        ]);
      })
    );

    renderWithProviders(<PurchasingPage />);

    // Title should be present
    expect(screen.getByRole('heading', { name: /Quản Lý Mua Hàng/i })).toBeInTheDocument();

    // Default tab is Orders, check loaded PO
    expect(await screen.findByText('PO-001')).toBeInTheDocument();
    expect(screen.getByText('Tech Component')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Thêm Đơn Mua/i })).toBeInTheDocument();

    // Click Invoices tab
    const user = userEvent.setup();
    const invoicesTab = screen.getByRole('tab', { name: /Hóa Đơn Mua/i });
    await user.click(invoicesTab);

    // Should load and display Invoices
    expect(await screen.findByText('PI-001')).toBeInTheDocument();
    // "Thêm Đơn Mua" button should not be rendered on Invoices tab
    expect(screen.queryByRole('button', { name: /Thêm Đơn Mua/i })).not.toBeInTheDocument();
  });

  it('opens order modal, selects supplier/items, and creates a PO successfully', async () => {
    let postPayload: any = null;

    server.use(
      http.get('*/api/v1/purchasing/orders/', () => {
        return HttpResponse.json([]);
      }),
      http.get('*/api/v1/master-data/items/list/', () => {
        return HttpResponse.json({
          results: [
            { id: 'VT001', item_code: 'VT001', item_name: 'Vật tư 1', stock_uom_name: 'Cái', status: 'active' }
          ]
        });
      }),
      http.get('*/api/v1/procurement/suppliers/', () => {
        return HttpResponse.json([
          { id: 'SUP01', name: 'SUP-001', supplier_name: 'Tech Component' }
        ]);
      }),
      http.post('*/api/v1/purchasing/orders/', async ({ request }) => {
        postPayload = await request.json();
        return HttpResponse.json({ id: 'PO-NEW', ...postPayload }, { status: 201 });
      })
    );

    renderWithProviders(<PurchasingPage />);
    const user = userEvent.setup();

    // Click Add Purchase Order
    await user.click(screen.getByRole('button', { name: /Thêm Đơn Mua/i }));

    // Wait for modal to render and options to load
    expect(await screen.findByRole('heading', { name: /Thêm Đơn Mua Hàng Mới/i })).toBeInTheDocument();

    // Select Vendor
    const vendorSelect = screen.getByLabelText(/Nhà Cung Cấp/i);
    await user.selectOptions(vendorSelect, 'SUP01');

    // Fill line quantity and price
    const priceInputs = screen.getAllByRole('spinbutton');
    const qtyInput = priceInputs[0];
    const priceInput = priceInputs[1];
    
    await user.clear(qtyInput);
    await user.type(qtyInput, '50');

    await user.clear(priceInput);
    await user.type(priceInput, '500000');

    // Submit
    const submitBtn = screen.getByRole('button', { name: 'Tạo Đơn Hàng' });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(postPayload).toEqual({
        vendor_id: 'SUP01',
        status: 'draft',
        lines: [
          {
            item_id: 'VT001',
            quantity: 50,
            unit_price: 500000
          }
        ]
      });
      expect(screen.queryByRole('heading', { name: /Thêm Đơn Mua Hàng Mới/i })).not.toBeInTheDocument();
    });
  });

  it('allows viewing invoice details in modal', async () => {
    server.use(
      http.get('*/api/v1/purchasing/orders/', () => {
        return HttpResponse.json([]);
      }),
      http.get('*/api/v1/purchasing/invoices/', () => {
        return HttpResponse.json([
          {
            id: 'PI-001',
            order: 'PO-001',
            vendor: 'SUP01',
            vendor_name: 'Tech Component',
            total_amount: 15000000,
            paid_amount: 0,
            status: 'unpaid',
            created_at: '2026-05-20',
            lines: []
          }
        ]);
      }),
      http.get('*/api/v1/purchasing/invoices/PI-001/', () => {
        return HttpResponse.json({
          id: 'PI-001',
          order: 'PO-001',
          vendor: 'SUP01',
          vendor_name: 'Tech Component',
          status: 'unpaid',
          total_amount: 15000000,
          paid_amount: 0,
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
        });
      })
    );

    renderWithProviders(<PurchasingPage />);
    const user = userEvent.setup();

    // Click Invoices tab
    const invoicesTab = screen.getByRole('tab', { name: /Hóa Đơn Mua/i });
    await user.click(invoicesTab);

    // Locate row and click View Details
    const row = await screen.findByText('PI-001');
    const actionButtons = within(row.closest('tr')!).getAllByRole('button');
    await user.click(actionButtons[0]); // First action is "Xem chi tiết"

    // Detail Modal should open
    const modal = await screen.findByRole('dialog');
    expect(within(modal).getByRole('heading', { name: /Hóa Đơn PI-001|Chi Tiết Hóa Đơn/i })).toBeInTheDocument();
    
    // Check fields loaded in the modal
    expect(await within(modal).findByText('Linh kiện A')).toBeInTheDocument();
    expect(within(modal).getByText('Tech Component')).toBeInTheDocument();
    expect(within(modal).getByText('10')).toBeInTheDocument();
    
    // Close modal
    const closeBtn = within(modal).getAllByRole('button', { name: /Đóng/i })[0];
    await user.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /Chi Tiết Hóa Đơn Mua Hàng/i })).not.toBeInTheDocument();
    });
  });
});

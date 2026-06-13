/* eslint-disable @typescript-eslint/no-explicit-any */
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PurchasingPage } from './PurchasingPage';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import { server } from '@shared/lib/test/server';
import { http, HttpResponse } from 'msw';

describe('PurchasingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders PurchasingPage and switches between orders and shipment tabs', async () => {
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
      http.get('*/api/v1/purchasing/shipment/', () => {
        return HttpResponse.json({
          count: 0,
          total_pages: 1,
          current_page: 1,
          results: []
        });
      })
    );

    renderWithProviders(<PurchasingPage />);

    // Title should be present
    expect(screen.getByRole('heading', { name: /Quản Lý Mua Hàng/i })).toBeInTheDocument();

    // Default tab is Orders, check loaded PO
    expect(await screen.findByText('PO-001')).toBeInTheDocument();
    expect(screen.getByText('Tech Component')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Thêm Đơn Mua/i })).toBeInTheDocument();

    // Click Shipment tab
    const user = userEvent.setup();
    const shipmentTab = screen.getByRole('tab', { name: /Lô Hàng/i });
    await user.click(shipmentTab);

    // "Thêm Đơn Mua" button should not be rendered on Shipment tab
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
        expected_delivery_date: '',
        advance_paid_amount: 0,
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

  it('automatically opens order modal when orderId is present in URL query params', async () => {
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
      http.get('*/api/v1/purchasing/orders/PO-001/', () => {
        return HttpResponse.json({
          id: 'PO-001',
          vendor: 'SUP01',
          vendor_name: 'Tech Component',
          total_amount: 15000000,
          status: 'draft',
          created_at: '2026-05-20',
          lines: []
        });
      }),
      http.get('*/api/v1/master-data/items/list/', () => {
        return HttpResponse.json({ results: [] });
      }),
      http.get('*/api/v1/procurement/suppliers/', () => {
        return HttpResponse.json([]);
      })
    );

    renderWithProviders(<PurchasingPage />, {
      initialEntries: ['/purchasing?tab=orders&id=PO-001']
    });

    // Check if the order detail modal is auto-opened
    expect(await screen.findByRole('heading', { name: /Chi Tiết Đơn Mua/i })).toBeInTheDocument();
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any */
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SalesPage } from './SalesPage';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import { server } from '@shared/lib/test/server';
import { http, HttpResponse } from 'msw';

describe('SalesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders SalesPage and displays sales orders', async () => {
    server.use(
      http.get('*/api/v1/sales/orders/', () => {
        return HttpResponse.json([
          {
            id: 'SO-001',
            customer: 'CUS01',
            customer_name: 'Công ty Alpha',
            total_amount: 8000000,
            status: 'draft',
            created_at: '2026-05-20',
            lines: []
          }
        ]);
      })
    );

    renderWithProviders(<SalesPage />);

    // Title should be present
    expect(screen.getByRole('heading', { name: /Quản Lý Bán Hàng/i })).toBeInTheDocument();

    // Default tab is Orders, check loaded SO
    expect(await screen.findByText('SO-001')).toBeInTheDocument();
    expect(screen.getByText('Công ty Alpha')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Thêm Đơn Bán/i })).toBeInTheDocument();
  });

  it('opens order modal, selects customer/items, and creates a SO successfully', async () => {
    let postPayload: any = null;

    server.use(
      http.get('*/api/v1/sales/orders/', () => {
        return HttpResponse.json([]);
      }),
      http.get('*/api/v1/master-data/items/list/', () => {
        return HttpResponse.json({
          results: [
            { id: 'SP001', item_code: 'SP001', item_name: 'Sản phẩm 1', stock_uom_name: 'Cái', status: 'active' }
          ]
        });
      }),
      http.get('*/api/v1/crm/customers/', () => {
        return HttpResponse.json([
          { id: 'CUS01', name: 'CUS-001', customer_name: 'Công ty Alpha' }
        ]);
      }),
      http.post('*/api/v1/sales/orders/', async ({ request }) => {
        postPayload = await request.json();
        return HttpResponse.json({ id: 'SO-NEW', ...postPayload }, { status: 201 });
      })
    );

    renderWithProviders(<SalesPage />);
    const user = userEvent.setup();

    // Click Add Sales Order
    await user.click(screen.getByRole('button', { name: /Thêm Đơn Bán/i }));

    // Wait for modal to render and options to load
    expect(await screen.findByRole('heading', { name: /Thêm Đơn Bán Hàng Mới/i })).toBeInTheDocument();

    // Select Customer
    const customerSelect = screen.getByLabelText(/Khách Hàng/i);
    await user.selectOptions(customerSelect, 'CUS01');

    // Fill line quantity and price
    const priceInputs = screen.getAllByRole('spinbutton');
    const qtyInput = priceInputs[0];
    const priceInput = priceInputs[1];
    
    await user.clear(qtyInput);
    await user.type(qtyInput, '20');

    await user.clear(priceInput);
    await user.type(priceInput, '1000000');

    // Submit
    const submitBtn = screen.getByRole('button', { name: 'Tạo Đơn Hàng' });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(postPayload).toEqual({
        customer_id: 'CUS01',
        advance_paid_amount: 0,
        lines: [
          {
            item_id: 'SP001',
            quantity: 20,
            unit_price: 1000000
          }
        ]
      });
      expect(screen.queryByRole('heading', { name: /Thêm Đơn Bán Hàng Mới/i })).not.toBeInTheDocument();
    });
  });

  it('automatically opens order modal when orderId is present in URL query params', async () => {
    server.use(
      http.get('*/api/v1/sales/orders/', () => {
        return HttpResponse.json([
          {
            id: 'SO-001',
            customer: 'CUS01',
            customer_name: 'Công ty Alpha',
            total_amount: 8000000,
            status: 'draft',
            created_at: '2026-05-20',
            lines: []
          }
        ]);
      }),
      http.get('*/api/v1/sales/orders/SO-001/', () => {
        return HttpResponse.json({
          id: 'SO-001',
          customer: 'CUS01',
          customer_name: 'Công ty Alpha',
          total_amount: 8000000,
          status: 'draft',
          created_at: '2026-05-20',
          lines: []
        });
      }),
      http.get('*/api/v1/master-data/items/list/', () => {
        return HttpResponse.json({ results: [] });
      }),
      http.get('*/api/v1/crm/customers/', () => {
        return HttpResponse.json([]);
      })
    );

    renderWithProviders(<SalesPage />, {
      initialEntries: ['/sales?tab=orders&id=SO-001']
    });

    // Check if the order detail modal is auto-opened
    expect(await screen.findByRole('heading', { name: /Chi Tiết Đơn Bán/i })).toBeInTheDocument();
  });
});

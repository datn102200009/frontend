/* eslint-disable @typescript-eslint/no-explicit-any */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SalesPage } from './SalesPage';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import { server } from '@shared/lib/test/server';
import { http, HttpResponse } from 'msw';

describe('SalesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders SalesPage and switches between orders and invoices tabs', async () => {
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
      http.get('*/api/v1/sales/invoices/', () => {
        return HttpResponse.json([
          {
            id: 'SI-001',
            order: 'SO-001',
            customer: 'CUS01',
            customer_name: 'Công ty Alpha',
            total_amount: 8000000,
            paid_amount: 0,
            status: 'unpaid',
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

    // Click Invoices tab
    const user = userEvent.setup();
    const invoicesTab = screen.getByRole('tab', { name: /Hóa Đơn Bán/i });
    await user.click(invoicesTab);

    // Should load and display Invoices
    expect(await screen.findByText('SI-001')).toBeInTheDocument();
    // "Thêm Đơn Bán" button should not be rendered on Invoices tab
    expect(screen.queryByRole('button', { name: /Thêm Đơn Bán/i })).not.toBeInTheDocument();
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
        status: 'draft',
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

  it('allows viewing invoice details in modal', async () => {
    server.use(
      http.get('*/api/v1/sales/orders/', () => {
        return HttpResponse.json([]);
      }),
      http.get('*/api/v1/sales/invoices/', () => {
        return HttpResponse.json([
          {
            id: 'SI-001',
            order: 'SO-001',
            customer: 'CUS01',
            customer_name: 'Công ty Alpha',
            total_amount: 8000000,
            paid_amount: 0,
            status: 'unpaid',
            created_at: '2026-05-20',
            lines: []
          }
        ]);
      }),
      http.get('*/api/v1/sales/invoices/SI-001/', () => {
        return HttpResponse.json({
          id: 'SI-001',
          order: 'SO-001',
          customer: 'CUS01',
          customer_name: 'Công ty Alpha',
          status: 'unpaid',
          total_amount: 8000000,
          paid_amount: 0,
          created_at: '2026-05-20',
          lines: [
            {
              id: 'SIL-001',
              item_name: 'Sản phẩm A',
              item_code: 'SPA',
              quantity: 8,
              unit_price: 1000000,
              vat_tax: 10,
              line_total: 8000000
            }
          ]
        });
      })
    );

    renderWithProviders(<SalesPage />);
    const user = userEvent.setup();

    // Click Invoices tab
    const invoicesTab = screen.getByRole('tab', { name: /Hóa Đơn Bán/i });
    await user.click(invoicesTab);

    // Locate row and click View Details
    const row = await screen.findByText('SI-001');
    const actionButtons = within(row.closest('tr')!).getAllByRole('button');
    await user.click(actionButtons[0]); // First action is "Xem chi tiết"

    // Detail Modal should open
    const modal = await screen.findByRole('dialog');
    expect(within(modal).getByRole('heading', { name: /Hóa Đơn SI-001|Chi Tiết Hóa Đơn/i })).toBeInTheDocument();
    
    // Check fields loaded in the modal
    expect(await within(modal).findByText('Sản phẩm A')).toBeInTheDocument();
    expect(within(modal).getByText('Công ty Alpha')).toBeInTheDocument();
    expect(within(modal).getByText('8')).toBeInTheDocument();
    
    // Close modal
    const closeBtn = within(modal).getAllByRole('button', { name: /Đóng/i })[0];
    await user.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /Hóa Đơn SI-001|Chi Tiết Hóa Đơn/i })).not.toBeInTheDocument();
    });
  });
});

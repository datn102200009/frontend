import { http, HttpResponse } from 'msw';

export const handlers = [
  // Authentication mock
  http.post('*/api/v1/accounts/auth/login/', async ({ request }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await request.json() as any;
    if (data.username === 'admin' && data.password === 'admin123') {
      return HttpResponse.json({
        access: 'mock-access-token',
        refresh: 'mock-refresh-token',
        user_id: '1',
        username: 'admin',
        role: 'admin'
      });
    }
    return new HttpResponse(
      JSON.stringify({ detail: 'No active account found with the given credentials' }),
      { status: 401 }
    );
  }),

  // BOM mocks
  http.post('*/api/v1/manufacturing/bom/create/', async ({ request }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await request.json() as any;
    if (data.item_id === 'EXISTING') {
      return HttpResponse.json(
        { detail: 'Sản phẩm này đã có định mức' },
        { status: 400 }
      );
    }
    return HttpResponse.json({ id: 'new-bom-123', ...data }, { status: 201 });
  }),

  http.put('*/api/v1/manufacturing/bom/:id/', async ({ params, request }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await request.json() as any;
    return HttpResponse.json({ id: params.id, ...data });
  }),

  http.post('*/api/v1/manufacturing/work-order/create/', async ({ request }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await request.json() as any;
    return HttpResponse.json({ id: 'wo-123', ...data }, { status: 201 });
  }),

  http.post('*/api/v1/manufacturing/material-preview/', async () => {
    // Mock 1 đủ, 1 thiếu
    return HttpResponse.json([
      {
        item_id: 'LK001',
        item_code: 'LK001',
        item_name: 'Linh kiện 1',
        required_qty: 10,
        available_qty: 50,
        missing_qty: 0
      },
      {
        item_id: 'LK002',
        item_code: 'LK002',
        item_name: 'Linh kiện 2',
        required_qty: 20,
        available_qty: 5,
        missing_qty: 15
      }
    ]);
  }),

  http.post('*/api/v1/manufacturing/work-order/:id/approve/', () => {
    return HttpResponse.json({ status: 'in_progress' }, { status: 200 });
  }),

  http.post('*/api/v1/manufacturing/work-order/:id/declare/', () => {
    return HttpResponse.json({}, { status: 200 });
  }),

  http.post('*/api/v1/manufacturing/work-order/:id/complete/', () => {
    return HttpResponse.json({ status: 'completed' }, { status: 200 });
  }),

  http.post('*/api/v1/manufacturing/work-order/:id/cancel/', () => {
    return HttpResponse.json({ status: 'cancelled' }, { status: 200 });
  }),

  // Inventory mocks
  http.post('*/api/v1/inventory/stock-in/create/', async ({ request }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await request.json() as any;
    return HttpResponse.json({ id: 'in-123', ...data }, { status: 201 });
  }),

  http.post('*/api/v1/inventory/stock-issue/create/', async ({ request }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await request.json() as any;
    console.log('stock-issue/create mock received data:', data);
    // Simulate insufficient stock error
    if (data.details && data.details[0]?.quantity > 1000) {
      console.log('throwing error');
      return HttpResponse.json(
        { detail: 'Không đủ tồn kho' },
        { status: 400 }
      );
    }
    console.log('returning success');
    return HttpResponse.json({ id: 'issue-123', ...data }, { status: 201 });
  }),

  http.post('*/api/v1/inventory/stock-transfer/create/', async ({ request }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await request.json() as any;
    return HttpResponse.json({ id: 'transfer-123', ...data }, { status: 201 });
  }),

  http.get('*/api/v1/inventory/stock-ledger/balance/', () => {
    return HttpResponse.json([
      { item_code: 'VT001', total_quantity: 500, warehouse_code: 'KHO_01' }
    ]);
  }),

  // Master Data & BOM Queries
  http.get('*/api/v1/master-data/items/list/', () => {
    return HttpResponse.json({
      results: [
        { id: 'VT001', item_code: 'VT001', item_name: 'Vật tư 1', stock_uom_name: 'Cái', status: 'active' },
        { id: 'LK001', item_code: 'LK001', item_name: 'Linh kiện 1', stock_uom_name: 'Bộ', status: 'active' },
        { id: 'SP001', item_code: 'SP001', item_name: 'Sản phẩm 1', stock_uom_name: 'Cái', status: 'active' },
        { id: 'EXISTING', item_code: 'EXISTING', item_name: 'Sản phẩm đã có định mức', stock_uom_name: 'Cái', status: 'active' }
      ]
    });
  }),
  http.get('*/api/v1/master-data/warehouses/list/', () => {
    return HttpResponse.json([
      { id: 'KHO_01', code: 'KHO_01', name: 'Kho 1' },
      { id: '55555555-5555-5555-5555-555555555555', code: 'KHO_02', name: 'Kho 2' }
    ]);
  }),
  http.get('*/api/v1/manufacturing/bom/list/', () => {
    return HttpResponse.json({
      results: [
        { id: '1', name: 'BOM-01', item_id: 'SP001', item_code: 'SP001' }
      ]
    });
  }),

  // CRM & Procurement mocks
  http.get('*/api/v1/crm/customers/', () => {
    return HttpResponse.json([
      { id: '44444444-4444-4444-4444-444444444444', name: 'CUS-001', customer_name: 'Công ty Cổ phần Alpha' }
    ]);
  }),
  http.get('*/api/v1/procurement/suppliers/', () => {
    return HttpResponse.json([
      { id: '33333333-3333-3333-3333-333333333333', name: 'SUP-001', supplier_name: 'Nhà cung cấp Tech Component' }
    ]);
  }),

  // Purchasing & Sales transaction mocks
  http.post('*/api/v1/purchasing/orders/', async ({ request }) => {
    const data = await request.json();
    return HttpResponse.json({ id: 'new-po-123', ...data as any }, { status: 201 });
  }),
  http.post('*/api/v1/purchasing/orders/:id/receive/', () => {
    return HttpResponse.json({ id: 'rec-123' }, { status: 200 });
  }),
  http.post('*/api/v1/sales/orders/', async ({ request }) => {
    const data = await request.json();
    return HttpResponse.json({ id: 'new-so-123', ...data as any }, { status: 201 });
  }),
  http.post('*/api/v1/sales/orders/:id/deliver/', () => {
    return HttpResponse.json({ id: 'del-123' }, { status: 200 });
  }),

  // Sales & Purchasing Invoices mocks
  http.get('*/api/v1/sales/invoices/', () => {
    return HttpResponse.json([
      { id: '66666666-6666-6666-6666-666666666666', order: '99999999-9999-9999-9999-999999999999', customer: '44444444-4444-4444-4444-444444444444', customer_name: 'Alpha', total_amount: 5000000, paid_amount: 0, status: 'unpaid', created_at: '2026-05-20', updated_at: '2026-05-20', lines: [] }
    ]);
  }),
  http.get('*/api/v1/purchasing/invoices/', () => {
    return HttpResponse.json([
      { id: '77777777-7777-7777-7777-777777777777', order: '88888888-8888-8888-8888-888888888888', vendor: '33333333-3333-3333-3333-333333333333', vendor_name: 'Tech Component', total_amount: 10000000, paid_amount: 0, status: 'unpaid', created_at: '2026-05-20', updated_at: '2026-05-20', lines: [] }
    ]);
  }),

  // Finance mocks
  http.post('*/api/v1/finance/cash-flows/', async ({ request }) => {
    const data = await request.json();
    return HttpResponse.json({ id: 'new-cf-123', ...data as any }, { status: 201 });
  }),
];

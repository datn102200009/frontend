

// --- MOCK IDS ---
export const MOCK_IDS = {
  ITEM_1: '11111111-1111-1111-1111-111111111111',
  ITEM_2: '22222222-2222-2222-2222-222222222222',
  VENDOR_1: '33333333-3333-3333-3333-333333333333',
  CUSTOMER_1: '44444444-4444-4444-4444-444444444444',
  WAREHOUSE_1: '55555555-5555-5555-5555-555555555555',
  PO_1: '66666666-6666-6666-6666-666666666666',
  PI_1: '77777777-7777-7777-7777-777777777777',
  SO_1: '88888888-8888-8888-8888-888888888888',
  SI_1: '99999999-9999-9999-9999-999999999999',
  CF_1: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
};

// --- PURCHASING MOCKS ---
export const mockPurchaseOrders = [
  {
    id: MOCK_IDS.PO_1,
    vendor: MOCK_IDS.VENDOR_1,
    vendor_name: 'Nhà cung cấp Tech Component',
    status: 'pending',
    total_amount: 15000000,
    advance_paid_amount: 5000000,
    created_at: '2026-05-18T10:00:00Z',
    updated_at: '2026-05-18T10:30:00Z',
    lines: [
      {
        id: crypto.randomUUID(),
        item: MOCK_IDS.ITEM_1,
        item_name: 'Vi điều khiển STM32',
        item_code: 'STM32F4',
        quantity: 100,
        unit_price: 150000,
        line_total: 15000000,
      },
    ],
  },
  {
    id: crypto.randomUUID(),
    vendor: MOCK_IDS.VENDOR_1,
    vendor_name: 'Nhà cung cấp Tech Component',
    status: 'draft',
    total_amount: 5000000,
    advance_paid_amount: 0,
    created_at: '2026-05-19T08:00:00Z',
    updated_at: '2026-05-19T08:00:00Z',
    lines: [
      {
        id: crypto.randomUUID(),
        item: MOCK_IDS.ITEM_2,
        item_name: 'Màn hình LCD 16x2',
        item_code: 'LCD1602',
        quantity: 50,
        unit_price: 100000,
        line_total: 5000000,
      },
    ],
  },
];

export const mockPurchaseInvoices = [
  {
    id: MOCK_IDS.PI_1,
    order: MOCK_IDS.PO_1,
    vendor: MOCK_IDS.VENDOR_1,
    vendor_name: 'Nhà cung cấp Tech Component',
    status: 'partial',
    total_amount: 16500000, // + 10% VAT
    paid_amount: 5000000,
    created_at: '2026-05-18T11:00:00Z',
    updated_at: '2026-05-18T11:00:00Z',
    lines: [
      {
        id: crypto.randomUUID(),
        item: MOCK_IDS.ITEM_1,
        item_name: 'Vi điều khiển STM32',
        item_code: 'STM32F4',
        quantity: 100,
        unit_price: 150000,
        import_tax: 0,
        vat_tax: 15000,
        line_total: 16500000,
      },
    ],
  },
];

// --- SALES MOCKS ---
export const mockSalesOrders = [
  {
    id: MOCK_IDS.SO_1,
    customer: MOCK_IDS.CUSTOMER_1,
    customer_name: 'Công ty Cổ phần Alpha',
    status: 'pending',
    total_amount: 25000000,
    advance_paid_amount: 10000000,
    created_at: '2026-05-17T09:00:00Z',
    updated_at: '2026-05-17T09:15:00Z',
    lines: [
      {
        id: crypto.randomUUID(),
        item: MOCK_IDS.ITEM_1,
        item_name: 'Bo mạch điều khiển trung tâm',
        item_code: 'PCB-MAIN',
        quantity: 10,
        unit_price: 2500000,
        line_total: 25000000,
      },
    ],
  },
];

export const mockSalesInvoices = [
  {
    id: MOCK_IDS.SI_1,
    order: MOCK_IDS.SO_1,
    customer: MOCK_IDS.CUSTOMER_1,
    customer_name: 'Công ty Cổ phần Alpha',
    status: 'partial',
    total_amount: 27500000, // + 10% VAT
    paid_amount: 10000000,
    created_at: '2026-05-17T14:00:00Z',
    updated_at: '2026-05-17T14:00:00Z',
    lines: [
      {
        id: crypto.randomUUID(),
        item: MOCK_IDS.ITEM_1,
        item_name: 'Bo mạch điều khiển trung tâm',
        item_code: 'PCB-MAIN',
        quantity: 10,
        unit_price: 2500000,
        vat_tax: 250000,
        line_total: 27500000,
      },
    ],
  },
];

// --- FINANCE MOCKS ---
export const mockCashFlows = [
  {
    id: MOCK_IDS.CF_1,
    name: 'Nhận tiền cọc từ Alpha',
    payment_type: 'receive',
    category: 'deposit',
    amount: 10000000,
    payment_date: '2026-05-17T09:10:00Z',
    remarks: 'CK cọc đơn hàng PCB',
    purchase_order: null,
    sales_order: MOCK_IDS.SO_1,
    purchase_invoice: null,
    sales_invoice: null,
    created_at: '2026-05-17T09:10:00Z',
    updated_at: '2026-05-17T09:10:00Z',
  },
];

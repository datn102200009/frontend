import type { Product, StockEntry, StockLedgerEntry, Warehouse } from './types';

export const MOCK_WAREHOUSES: Warehouse[] = [
  { id: 'wh-01', name: 'Kho Nguyên Liệu' },
  { id: 'wh-02', name: 'Kho Thành Phẩm' },
  { id: 'wh-03', name: 'Kho Phụ Tùng' },
];

export const MOCK_PRODUCTS: Product[] = [
  { id: 'p-001', item_code: 'TO-D25', item_name: 'Thép ống D25', unit: 'cái', category: 'Nguyên liệu', min_stock: 100, is_active: true },
  { id: 'p-002', item_code: 'GV-01', item_name: 'Gỗ ván MDF 18mm', unit: 'tấm', category: 'Nguyên liệu', min_stock: 50, is_active: true },
  { id: 'p-003', item_code: 'OV-M6', item_name: 'Ốc vít M6', unit: 'cái', category: 'Phụ tùng', min_stock: 500, is_active: true },
  { id: 'p-004', item_code: 'SN-01', item_name: 'Sơn tĩnh điện xanh', unit: 'kg', category: 'Nguyên liệu', min_stock: 20, is_active: true },
  { id: 'p-005', item_code: 'KG-01', item_name: 'Khung ghế thép', unit: 'bộ', category: 'Bán thành phẩm', min_stock: 30, is_active: true },
  { id: 'p-006', item_code: 'DM-02', item_name: 'Đệm mút D40', unit: 'tấm', category: 'Nguyên liệu', min_stock: 40, is_active: true },
  { id: 'p-007', item_code: 'BX-01', item_name: 'Bánh xe ghế', unit: 'cái', category: 'Phụ tùng', min_stock: 100, is_active: true },
  { id: 'p-008', item_code: 'BHS-001', item_name: 'Bàn học sinh', unit: 'cái', category: 'Thành phẩm', min_stock: 10, is_active: true },
  { id: 'p-009', item_code: 'GX-101', item_name: 'Ghế xoay văn phòng', unit: 'cái', category: 'Thành phẩm', min_stock: 10, is_active: true },
  { id: 'p-010', item_code: 'TH-08', item_name: 'Thép tấm 0.8mm', unit: 'tấm', category: 'Nguyên liệu', min_stock: 30, is_active: true },
];

export const MOCK_STOCK_ENTRIES: StockEntry[] = [
  {
    id: 'se-001', code: 'NK-2026-001', type: 'stock_in', status: 'approved',
    target_warehouse: 'Kho Nguyên Liệu', notes: 'Nhập hàng NCC Hoà Phát',
    created_at: '2026-05-10', approved_at: '2026-05-10',
    items: [
      { id: 'si-001', item_code: 'TO-D25', item_name: 'Thép ống D25', quantity: 500, unit: 'cái' },
      { id: 'si-002', item_code: 'TH-08', item_name: 'Thép tấm 0.8mm', quantity: 100, unit: 'tấm' },
    ],
  },
  {
    id: 'se-002', code: 'XK-2026-001', type: 'stock_issue', status: 'approved',
    source_warehouse: 'Kho Nguyên Liệu', notes: 'Xuất cho WO-2026-001',
    created_at: '2026-05-12', approved_at: '2026-05-12',
    items: [
      { id: 'si-003', item_code: 'TO-D25', item_name: 'Thép ống D25', quantity: 400, unit: 'cái' },
      { id: 'si-004', item_code: 'OV-M6', item_name: 'Ốc vít M6', quantity: 1600, unit: 'cái' },
    ],
  },
  {
    id: 'se-003', code: 'CK-2026-001', type: 'internal_transfer', status: 'draft',
    source_warehouse: 'Kho Nguyên Liệu', target_warehouse: 'Kho Phụ Tùng',
    notes: 'Chuyển phụ tùng sang kho phụ',
    created_at: '2026-05-14',
    items: [
      { id: 'si-005', item_code: 'BX-01', item_name: 'Bánh xe ghế', quantity: 50, unit: 'cái' },
    ],
  },
];

export const MOCK_STOCK_LEDGER: StockLedgerEntry[] = [
  { id: 'sl-001', item_code: 'TO-D25', item_name: 'Thép ống D25', warehouse: 'Kho Nguyên Liệu', quantity: 100, unit: 'cái' },
  { id: 'sl-002', item_code: 'GV-01', item_name: 'Gỗ ván MDF 18mm', warehouse: 'Kho Nguyên Liệu', quantity: 45, unit: 'tấm' },
  { id: 'sl-003', item_code: 'OV-M6', item_name: 'Ốc vít M6', warehouse: 'Kho Nguyên Liệu', quantity: 380, unit: 'cái' },
  { id: 'sl-004', item_code: 'SN-01', item_name: 'Sơn tĩnh điện xanh', warehouse: 'Kho Nguyên Liệu', quantity: 15, unit: 'kg' },
  { id: 'sl-005', item_code: 'BHS-001', item_name: 'Bàn học sinh', warehouse: 'Kho Thành Phẩm', quantity: 100, unit: 'cái' },
  { id: 'sl-006', item_code: 'GX-101', item_name: 'Ghế xoay văn phòng', warehouse: 'Kho Thành Phẩm', quantity: 20, unit: 'cái' },
  { id: 'sl-007', item_code: 'BX-01', item_name: 'Bánh xe ghế', warehouse: 'Kho Phụ Tùng', quantity: 200, unit: 'cái' },
  { id: 'sl-008', item_code: 'TH-08', item_name: 'Thép tấm 0.8mm', warehouse: 'Kho Nguyên Liệu', quantity: 85, unit: 'tấm' },
];

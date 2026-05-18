export interface Product {
  id: string;
  item_code: string;
  item_name: string;
  unit: string;
  category: string;
  min_stock: number;
  is_active: boolean;
}

export type StockEntryType = 'stock_in' | 'stock_issue' | 'internal_transfer';
export type StockEntryStatus = 'draft' | 'approved';

export interface StockEntryItem {
  id: string;
  item_code: string;
  item_name: string;
  quantity: number;
  unit: string;
}

export interface StockEntry {
  id: string;
  code: string;
  type: StockEntryType;
  status: StockEntryStatus;
  source_warehouse?: string;
  target_warehouse?: string;
  items: StockEntryItem[];
  notes: string;
  created_at: string;
  approved_at?: string;
}

export interface StockLedgerEntry {
  id: string;
  item_code: string;
  item_name: string;
  warehouse: string;
  quantity: number;
  unit: string;
}

export interface Warehouse {
  id: string;
  name: string;
}

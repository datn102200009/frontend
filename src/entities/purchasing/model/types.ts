import type {
  PurchaseOrder as GenPurchaseOrder,
  PurchaseOrderLine as GenPurchaseOrderLine,
  PurchaseOrderInput as GenPurchaseOrderInput,
  PurchaseOrderLineInput as GenPurchaseOrderLineInput,
} from '../api/purchasingApi';
import type {
  PurchaseInvoice as GenPurchaseInvoice,
  PurchaseInvoiceLine as GenPurchaseInvoiceLine,
} from '../../finance/api/financeApi';

export type PurchaseOrderLine = GenPurchaseOrderLine & {
  id: string;
  item: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

export type PurchaseOrder = GenPurchaseOrder & {
  id: string;
  vendor: string;
  status: 'draft' | 'pending' | 'paid_unshipped' | 'shipped_unpaid' | 'completed' | 'cancelled';
  total_amount: number;
  advance_paid_amount: number;
  created_at: string;
  updated_at: string;
  lines: PurchaseOrderLine[];
};

export type PurchaseOrderLineInput = GenPurchaseOrderLineInput;
export type PurchaseOrderInput = GenPurchaseOrderInput;

export type PurchaseInvoiceLine = GenPurchaseInvoiceLine & {
  id: string;
  item: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  qty_fulfillment_rate?: number | null;
};

export type PurchaseInvoice = GenPurchaseInvoice & {
  id: string;
  order: string;
  vendor: string;
  status: 'unpaid' | 'partial' | 'paid' | 'blocked_for_payment' | 'cancelled';
  total_amount: number;
  paid_amount: number;
  block_reason?: string | null;
  due_date?: string | null;
  qty_fulfillment_rate?: number | null;
  created_at: string;
  updated_at: string;
  lines: PurchaseInvoiceLine[];
};

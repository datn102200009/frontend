import type {
  SalesOrder as GenSalesOrder,
  SalesOrderLine as GenSalesOrderLine,
  SalesOrderInput as GenSalesOrderInput,
  SalesOrderLineInput as GenSalesOrderLineInput,
  SalesInvoice as GenSalesInvoice,
  SalesInvoiceLine as GenSalesInvoiceLine,
} from '../api/salesApi';

export type SalesOrderLine = GenSalesOrderLine & {
  id: string;
  item: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

export type SalesOrder = GenSalesOrder & {
  id: string;
  customer: string;
  status: 'draft' | 'pending' | 'paid_unshipped' | 'shipped_unpaid' | 'completed' | 'cancelled';
  total_amount: number;
  advance_paid_amount: number;
  created_at: string;
  updated_at: string;
  lines: SalesOrderLine[];
};

export type SalesOrderLineInput = GenSalesOrderLineInput;
export type SalesOrderInput = GenSalesOrderInput;

export type SalesInvoiceLine = GenSalesInvoiceLine & {
  id: string;
  item: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

export type SalesInvoice = GenSalesInvoice & {
  id: string;
  order: string;
  customer: string;
  status: 'unpaid' | 'partial' | 'paid' | 'cancelled';
  total_amount: number;
  paid_amount: number;
  created_at: string;
  updated_at: string;
  lines: SalesInvoiceLine[];
};

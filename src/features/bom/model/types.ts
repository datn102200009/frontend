export interface BOMItem {
  id: string;
  item_code: string;
  item_name: string;
  quantity: number;
  unit: string;
}

export interface BOM {
  id: string;
  product_code: string;
  product_name: string;
  version: string;
  items: BOMItem[];
  notes: string;
  created_at: string;
  is_active: boolean;
}

export type WorkOrderStatus = 'not_started' | 'in_progress' | 'completed';

export interface WorkOrder {
  id: string;
  code: string;
  product_name: string;
  bom_id: string;
  bom_version: string;
  quantity_required: number;
  quantity_completed: number;
  status: WorkOrderStatus;
  planned_start: string;
  planned_end: string;
  actual_end?: string;
  created_at: string;
}

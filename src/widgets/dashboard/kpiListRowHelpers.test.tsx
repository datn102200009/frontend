import { describe, it, expect } from 'vitest';
import { buildItemLink, shortId } from './kpiListRowHelpers';

describe('kpiListRowHelpers', () => {
  const mockItem = {
    id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    item_code: 'ITM-001',
    item_name: 'Test Item',
    contract_no: 'HD-001',
    employee_id: 'emp-999',
    employee_name: 'Nguyen Van A',
    name: 'WO-APP-01',
  };

  const sid = shortId(mockItem.id);

  it('removes SO- prefix from sales_pending_fulfillment link display', () => {
    const res = buildItemLink(mockItem, 'sales_pending_fulfillment');
    expect(res.display).toBe(sid);
    expect(res.display).not.toContain('SO-');
  });

  it('removes PO- prefix from purchasing_draft_orders link display', () => {
    const res = buildItemLink(mockItem, 'purchasing_draft_orders');
    expect(res.display).toBe(sid);
    expect(res.display).not.toContain('PO-');
  });

  it('keeps raw name for manufacturing active work orders', () => {
    const res = buildItemLink(mockItem, 'manufacturing_active_wos');
    expect(res.display).toBe(mockItem.name);
  });

  it('displays contract_no for hrm_expiring_contracts', () => {
    const res = buildItemLink(mockItem, 'hrm_expiring_contracts');
    expect(res.display).toBe('HD-001');
  });

  it('links to employeeId for hrm_expiring_contracts', () => {
    const res = buildItemLink(mockItem, 'hrm_expiring_contracts');
    expect(res.to).toBe(`/hrm?tab=employees&id=emp-999`);
  });
});

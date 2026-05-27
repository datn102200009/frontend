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


  // Roles mock
  http.get('*/api/v1/accounts/roles/', () => {
    return HttpResponse.json([
      { id: '3fa85f64-5717-4562-b3fc-2c963f66afa6', name: 'Quản trị viên (Admin)', description: 'Quản trị viên hệ thống với toàn quyền truy cập.' },
      { id: 'c73a6473-8b74-4b53-a5c9-95ad3e1bcf4d', name: 'Nhân viên (Employee)', description: 'Standard employee role' },
    ]);
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
    const data = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ id: 'new-po-123', ...data }, { status: 201 });
  }),
  http.post('*/api/v1/purchasing/orders/:id/receive/', () => {
    return HttpResponse.json({ id: 'rec-123' }, { status: 200 });
  }),
  http.post('*/api/v1/sales/orders/', async ({ request }) => {
    const data = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ id: 'new-so-123', ...data }, { status: 201 });
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
    const data = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ id: 'new-cf-123', ...data }, { status: 201 });
  }),

  // HRM mocks
  http.get('*/api/v1/hrm/employees/', () => {
    return HttpResponse.json({
      count: 2,
      results: [
        { id: 'emp-1', employee_id: 'NV001', full_name: 'Nguyễn Văn An', department: 'Hành chính', position_title: 'Nhân viên', salary_base: '10000000', is_union_member: true, email: 'an.nv@company.com', phone: '0901234567', gender: 'male', date_of_birth: '1995-01-01', join_date: '2026-01-01', employment_status: 'active' },
        { id: 'emp-2', employee_id: 'NV002', full_name: 'Trần Thị Bình', department: 'Kinh doanh', position_title: 'Trưởng nhóm', salary_base: '15000000', is_union_member: false, email: 'binh.tt@company.com', phone: '0907654321', gender: 'female', date_of_birth: '1992-05-15', join_date: '2025-06-01', employment_status: 'active' }
      ]
    });
  }),

  http.post('*/api/v1/hrm/employees/create/', async ({ request }) => {
    const data = await request.json() as { employee_id: string };
    if (data.employee_id === 'NV_EXISTS') {
      return HttpResponse.json({ detail: 'Mã nhân viên đã tồn tại' }, { status: 400 });
    }
    return HttpResponse.json({ id: 'new-emp-123', ...data }, { status: 201 });
  }),

  http.get('*/api/v1/hrm/employees/:id/', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      employee_id: 'NV001',
      full_name: 'Nguyễn Văn An',
      department: 'Hành chính',
      position_title: 'Nhân viên',
      salary_base: '10000000',
      is_union_member: true,
      email: 'an.nv@company.com',
      phone: '0901234567',
      gender: 'male',
      date_of_birth: '1995-01-01',
      join_date: '2026-01-01',
      employment_status: 'active',
      contracts: [
        { id: 'contract-1', contract_no: 'HDLD-2026-001', contract_type: 'definite_term', start_date: '2026-01-01', end_date: '2027-01-01', status: 'active', note: 'Hợp đồng 1 năm' }
      ],
      employment_histories: [
        { id: 'history-1', change_type: 'salary_change', old_salary_base: '8000000', new_salary_base: '10000000', effective_date: '2026-05-01', reason: 'Tăng lương định kỳ' }
      ],
      documents: [
        { id: 'doc-1', doc_type: 'contract_scan', title: 'Scan HĐLĐ lần 1', file_url: 'https://storage.com/hdld.pdf' }
      ],
      rewards: [
        { id: 'reward-1', reward_date: '2026-04-30', reward_type: 'performance_bonus', amount: '1000000', description: 'Thành tích xuất sắc quý 1' }
      ],
      disciplines: [
        { id: 'discipline-1', incident_date: '2026-03-10', discipline_date: '2026-03-12', discipline_type: 'warning', penalty_amount: '200000', description: 'Đi muộn nhiều lần' }
      ]
    });
  }),

  http.patch('*/api/v1/hrm/employees/:id/update/', async ({ params, request }) => {
    const data = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ id: params.id, ...data });
  }),

  http.post('*/api/v1/hrm/employees/:id/update-salary-title/', async ({ params, request }) => {
    const data = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ id: params.id, ...data });
  }),

  http.post('*/api/v1/hrm/contracts/', async ({ request }) => {
    const data = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ id: 'new-contract-123', ...data }, { status: 201 });
  }),

  http.post('*/api/v1/hrm/contracts/:id/terminate/', async ({ params, request }) => {
    const data = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ id: params.id, status: 'terminated', ...data });
  }),

  http.get('*/api/v1/hrm/attendances/', () => {
    return HttpResponse.json([
      { id: 'att-1', employee_id: 'emp-1', employee_code: 'NV001', employee_name: 'Nguyễn Văn An', date: '2026-05-23', status: 'working', work_hours: '8.00', overtime_hours: '0.00' },
      { id: 'att-2', employee_id: 'emp-2', employee_code: 'NV002', employee_name: 'Trần Thị Bình', date: '2026-05-23', status: 'paid_leave', work_hours: '0.00', overtime_hours: '0.00' }
    ]);
  }),

  http.post('*/api/v1/hrm/attendances/batch/', async ({ request }) => {
    interface AttendanceRecord {
      employee_id: string;
      status: 'working' | 'paid_leave' | 'unpaid_leave' | 'holiday';
      work_hours?: number | string;
      overtime_hours?: number | string;
      remarks?: string;
    }
    interface BatchAttendanceRequest {
      date: string;
      records: AttendanceRecord[];
    }
    const data = await request.json() as BatchAttendanceRequest;
    return HttpResponse.json(
      data.records.map((r) => ({
        id: `att-${Math.random()}`,
        employee_id: r.employee_id,
        date: data.date,
        status: r.status,
        work_hours: r.work_hours?.toString() || '8.00',
        overtime_hours: r.overtime_hours?.toString() || '0.00',
        remarks: r.remarks
      })),
      { status: 201 }
    );
  }),

  http.get('*/api/v1/hrm/leave-requests/', () => {
    return HttpResponse.json([
      { id: 'lr-1', employee_id: 'emp-1', employee_code: 'NV001', employee_name: 'Nguyễn Văn An', leave_type: 'paid', start_date: '2026-06-10', end_date: '2026-06-11', days: '2.0', reason: 'Có việc gia đình', status: 'pending', created_at: '2026-05-22' }
    ]);
  }),

  http.post('*/api/v1/hrm/leave-requests/create/', async ({ request }) => {
    const data = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ id: 'new-lr-123', status: 'pending', ...data }, { status: 201 });
  }),

  http.post('*/api/v1/hrm/leave-requests/:id/approve/', async ({ params, request }) => {
    const data = await request.json() as { action: 'approve' | 'reject' };
    return HttpResponse.json({ id: params.id, status: data.action === 'approve' ? 'approved' : 'rejected' });
  }),

  http.get('*/api/v1/hrm/salary-slips/', () => {
    return HttpResponse.json([
      { id: 'slip-1', name: 'SAL-2026-05-NV001', employee_id: 'emp-1', employee_code: 'NV001', employee_name: 'Nguyễn Văn An', salary_period: '2026-05', base_salary: '10000000', overtime_amount: '500000', allowance_amount: '0', reward_amount_total: '1000000', discipline_deduction_total: '200000', union_fee_2pct: '200000', gross_pay: '10500000', deductions: '400000', net_pay: '11100000', status: 'draft' }
    ]);
  }),

  http.post('*/api/v1/hrm/salary-slips/initialize/', async ({ request }) => {
    const data = await request.json() as { salary_period: string };
    return HttpResponse.json([
      { id: 'slip-1', name: `SAL-${data.salary_period}-NV001',`, employee_id: 'emp-1', employee_code: 'NV001', employee_name: 'Nguyễn Văn An', salary_period: data.salary_period, base_salary: '10000000', overtime_amount: '0', allowance_amount: '0', reward_amount_total: '0', discipline_deduction_total: '0', union_fee_2pct: '200000', gross_pay: '10000000', deductions: '200000', net_pay: '9800000', status: 'draft' }
    ], { status: 201 });
  }),

  http.post('*/api/v1/hrm/salary-slips/:id/calculate/', () => {
    return HttpResponse.json({ id: 'slip-1', name: 'SAL-2026-05-NV001', employee_id: 'emp-1', employee_code: 'NV001', employee_name: 'Nguyễn Văn An', salary_period: '2026-05', base_salary: '10000000', overtime_amount: '500000', allowance_amount: '0', reward_amount_total: '1000000', discipline_deduction_total: '200000', union_fee_2pct: '200000', gross_pay: '10500000', deductions: '400000', net_pay: '11100000', status: 'draft' });
  }),

  http.post('*/api/v1/hrm/rewards/', async ({ request }) => {
    const data = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ id: 'reward-123', ...data }, { status: 201 });
  }),

  http.get('*/api/v1/hrm/rewards/', () => {
    return HttpResponse.json([
      { id: 'reward-1', employee_id: 'emp-1', employee_code: 'NV001', employee_name: 'Nguyễn Văn An', reward_date: '2026-04-30', reward_type: 'performance_bonus', amount: '1000000', description: 'Thành tích xuất sắc quý 1' }
    ]);
  }),

  http.post('*/api/v1/hrm/disciplines/', async ({ request }) => {
    const data = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ id: 'discipline-123', ...data }, { status: 201 });
  }),

  http.get('*/api/v1/hrm/disciplines/', () => {
    return HttpResponse.json([
      { id: 'discipline-1', employee_id: 'emp-1', employee_code: 'NV001', employee_name: 'Nguyễn Văn An', incident_date: '2026-03-10', discipline_date: '2026-03-12', discipline_type: 'warning', penalty_amount: '200000', description: 'Đi muộn nhiều lần' }
    ]);
  }),

  http.post('*/api/v1/hrm/salary-slips/bulk-confirm-pay/', async ({ request }) => {
    const data = await request.json() as { salary_period: string };
    return HttpResponse.json([
      { id: 'slip-1', name: 'SAL-2026-05-NV001', employee_id: 'emp-1', employee_code: 'NV001', employee_name: 'Nguyễn Văn An', salary_period: data.salary_period, base_salary: '10000000', overtime_amount: '500000', allowance_amount: '0', reward_amount_total: '1000000', discipline_deduction_total: '200000', union_fee_2pct: '200000', gross_pay: '10500000', deductions: '400000', net_pay: '11100000', status: 'paid' }
    ], { status: 200 });
  }),

  // Public Holidays mocks
  http.get('*/api/v1/hrm/public-holidays/', () => {
    return HttpResponse.json([
      { id: 'holiday-1', name: 'Tết Âm Lịch', start_date: '2026-02-17', days: 5, description: 'Nghỉ Tết Âm Lịch' },
      { id: 'holiday-2', name: 'Ngày Chiến thắng', start_date: '2026-04-30', days: 1, description: 'Giải phóng miền Nam' }
    ]);
  }),

  http.post('*/api/v1/hrm/public-holidays/', async ({ request }) => {
    const data = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ id: 'new-holiday-123', ...data }, { status: 201 });
  }),

  http.put('*/api/v1/hrm/public-holidays/:id/', async ({ params, request }) => {
    const data = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ id: params.id, ...data });
  }),

  http.delete('*/api/v1/hrm/public-holidays/:id/', () => {
    return new HttpResponse(null, { status: 204 });
  }),
];


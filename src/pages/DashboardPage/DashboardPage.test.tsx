import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, it, expect, beforeEach } from 'vitest';
import { server } from '../../shared/lib/test/server';
import { renderWithProviders } from '../../shared/lib/test/test-utils';
import DashboardPage from './DashboardPage';

describe('DashboardPage', () => {
  const mockWidgetsMetadata = [
    // Sales & CRM
    { code: 'sales_today_revenue', title: 'Đơn bán hàng hôm nay', type: 'list_summary', size: '1x2', quick_links: ['/sales/orders'] },
    { code: 'sales_draft_orders', title: 'Đơn bán nháp chờ xử lý', type: 'list_summary', size: '1x2', quick_links: ['/sales/orders?status=draft'] },
    { code: 'sales_pending_credit_bypass', title: 'Đơn bán chờ đặc cách nợ', type: 'list_summary', size: '1x2', quick_links: ['/sales/orders?status=pending_credit_approval'] },
    { code: 'sales_pending_fulfillment', title: 'Đơn bán chờ xử lý kho/tiền', type: 'list_summary', size: '1x2', quick_links: ['/sales/orders?status=pending'] },

    // Purchasing & QC
    { code: 'purchasing_active_po_count', title: 'Đơn mua hàng hoạt động', type: 'list_summary', size: '1x2', quick_links: ['/purchasing/orders?status=pending'] },
    { code: 'purchasing_draft_orders', title: 'Đơn mua nháp chờ xử lý', type: 'list_summary', size: '1x2', quick_links: ['/purchasing/orders?status=draft'] },
    { code: 'purchasing_pending_delivery', title: 'Đơn mua hàng chờ nhận hàng', type: 'list_summary', size: '1x2', quick_links: ['/purchasing/orders?status=pending'] },
    { code: 'purchasing_pending_qc', title: 'Lô hàng cập bến chờ QC', type: 'list_summary', size: '1x2', quick_links: ['/purchasing/certifications'] },
    { code: 'purchasing_pending_logistic_fees', title: 'Chi phí logistics chờ phân bổ', type: 'list_summary', size: '1x2', quick_links: ['/purchasing/shipments'] },
    { code: 'purchasing_blocked_invoices', title: 'Hóa đơn bị chặn thanh toán', type: 'list_summary', size: '1x2', quick_links: ['/purchasing/invoices?status=blocked'] },

    // Inventory
    { code: 'inventory_pending_entry_count', title: 'Phiếu nhập kho chờ duyệt', type: 'list_summary', size: '1x2', quick_links: ['/inventory/stock-balances'] },
    { code: 'inventory_low_stock', title: 'Cảnh báo tồn kho thấp', type: 'list_summary', size: '1x2', quick_links: ['/inventory/stock-balances'] },
    { code: 'inventory_pending_entries', title: 'Phiếu kho nháp chờ ghi sổ', type: 'list_summary', size: '2x2', quick_links: ['/inventory/transfers'] },

    // Finance
    { code: 'finance_cashflow_chart', title: 'Dòng tiền Thu - Chi', type: 'mini_chart', size: '2x2', quick_links: ['/finance/cashflow'] },
    { code: 'finance_cashflow_summary', title: 'Giao dịch dòng tiền tháng', type: 'list_summary', size: '1x2', quick_links: ['/finance/cashflow'] },
    { code: 'finance_unpaid_purchase_invoices', title: 'Hóa đơn mua chưa trả tiền (AP)', type: 'list_summary', size: '1x2', quick_links: ['/purchasing/invoices?status=unpaid'] },
    { code: 'finance_unpaid_sales_invoices', title: 'Hóa đơn bán chưa thu tiền (AR)', type: 'list_summary', size: '1x2', quick_links: ['/sales/invoices?status=unpaid'] },
    { code: 'finance_depreciation_status', title: 'Khấu hao tài sản cố định', type: 'list_summary', size: '1x2', quick_links: ['/finance/fixed-assets'] },

    // HRM
    { code: 'hrm_payroll_lifecycle_status', title: 'Bảng lương chờ duyệt & thanh toán', type: 'list_summary', size: '1x2', quick_links: ['/hrm/salary-slips'] },
    { code: 'hrm_pending_leave_requests', title: 'Đơn xin nghỉ phép chờ duyệt', type: 'list_summary', size: '1x2', quick_links: ['/hrm/leave-requests'] },
    { code: 'hrm_expiring_contracts', title: 'Hợp đồng sắp hết hạn', type: 'list_summary', size: '1x2', quick_links: ['/hrm/contracts'] },
    { code: 'hrm_today_attendance_rate', title: 'Nhân viên vắng mặt hôm nay', type: 'list_summary', size: '1x2', quick_links: ['/hrm/attendance'] },

    // Manufacturing
    { code: 'manufacturing_pending_wo_approval', title: 'Lệnh sản xuất chờ duyệt', type: 'list_summary', size: '1x2', quick_links: ['/manufacturing/work-orders'] },
    { code: 'manufacturing_active_wos', title: 'Lệnh sản xuất đang chạy', type: 'list_summary', size: '1x2', quick_links: ['/manufacturing/work-orders'] },
    { code: 'manufacturing_pending_declarations', title: 'Lệnh sản xuất sắp trễ hạn', type: 'list_summary', size: '1x2', quick_links: ['/manufacturing/work-orders'] },
    { code: 'manufacturing_pending_completion', title: 'Lệnh sản xuất chờ hoàn thành', type: 'list_summary', size: '1x2', quick_links: ['/manufacturing/work-orders'] },
  ];

  const mockBatchData = {
    // Sales & CRM
    sales_today_revenue: {
      success: true,
      data: [
        { id: 'today-1', customer_name: 'Khách hàng A', total_amount: 150000000, created_at: '2026-06-07T10:00:00Z' },
      ],
    },
    sales_draft_orders: {
      success: true,
      data: [
        { id: 'draft-1', customer_name: 'Khách hàng D', total_amount: 50000000, created_at: '2026-06-07T10:00:00Z' },
      ],
    },
    sales_pending_credit_bypass: {
      success: true,
      data: [
        { id: 'credit-1', customer_name: 'Khách hàng C', total_amount: 115200000, reason: 'Vượt hạn mức 15.2M', created_at: '2026-06-07T10:00:00Z' },
      ],
    },
    sales_pending_fulfillment: {
      success: true,
      data: [
        { id: 'ful-1', customer_name: 'Khách hàng B', total_amount: 60000000, created_at: '2026-06-07T10:00:00Z' },
      ],
    },

    // Purchasing & QC
    purchasing_active_po_count: {
      success: true,
      data: [
        { id: 'active-1', supplier_name: 'Nhà cung cấp K', total_amount: 50000000, created_at: '2026-06-07T10:00:00Z' },
      ],
    },
    purchasing_draft_orders: {
      success: true,
      data: [
        { id: 'draft-1', supplier_name: 'Nhà cung cấp X', total_amount: 45000000, created_at: '2026-06-07T10:00:00Z' },
      ],
    },
    purchasing_pending_delivery: {
      success: true,
      data: [
        { id: 'del-1', supplier_name: 'Nhà cung cấp Y', total_amount: 120000000, expected_delivery_date: '2026-06-15T00:00:00Z', receipt_fulfillment_rate: 85.0, payment_fulfillment_rate: 60.0 },
      ],
    },
    purchasing_pending_qc: {
      success: true,
      data: [
        { id: 'ship-qc-1', shipment_num: 'SHIP-01', name: 'Lô hàng 1', created_at: '2026-06-07T10:00:00Z' },
      ],
    },
    purchasing_pending_logistic_fees: {
      success: true,
      data: [
        { id: 'ship-fee-1', shipment_num: 'SHIP-02', name: 'Lô hàng 2', created_at: '2026-06-07T10:00:00Z' },
      ],
    },
    purchasing_blocked_invoices: {
      success: true,
      data: [
        { id: 'block-1', supplier_name: 'Nhà cung cấp Z', total_amount: 88000000, block_reason: 'Lệch giá đơn PO (+5%)', created_at: '2026-06-07T10:00:00Z' },
      ],
    },

    // Inventory
    inventory_pending_entry_count: {
      success: true,
      data: [
        { id: 'se-rec-mock', name: 'SE-REC-MOCK', purpose: 'receipt', route_desc: 'Từ PO: PO-001', item_count: 8, posting_date: '2026-06-07T10:00:00Z', created_at: '2026-06-07T10:00:00Z' },
      ],
    },
    inventory_low_stock: {
      success: true,
      data: [
        { item_code: 'STEEL-01', item_name: 'Thép hình H150', balance: 5, uom: 'cái', status: 'critical', reason: 'Dưới ngưỡng tối thiểu' },
      ],
    },
    inventory_pending_entries: {
      success: true,
      data: [
        { id: 'se-trf-1', name: 'SE-001', purpose: 'transfer', route_desc: 'Kho A → Kho B', item_count: 5, posting_date: '2026-06-07T10:00:00Z', created_at: '2026-06-07T10:00:00Z' },
        { id: 'se-rec-1', name: 'SE-002', purpose: 'receipt', route_desc: 'Từ PO: PO-001', item_count: 2, posting_date: '2026-06-07T10:00:00Z', created_at: '2026-06-07T10:00:00Z' },
      ],
    },

    // Finance
    finance_cashflow_chart: {
      success: true,
      data: {
        weeks: [
          { week_label: 'Tuần 01', receive: 120000000, pay: 85000000 },
        ],
      },
    },
    finance_cashflow_summary: {
      success: true,
      data: [
        { id: 'cf-1', name: 'Nhận tiền hàng A', category: 'Thu bán hàng', payment_type: 'receive', amount: 350000000, payment_date: '2026-06-07T10:00:00Z' },
      ],
    },
    finance_unpaid_purchase_invoices: {
      success: true,
      data: [
        { id: 'ap-1', supplier_name: 'Nhà cung cấp H', total_amount: 50000000, remaining_amount: 20000000, due_date: '2026-05-22T00:00:00Z' },
      ],
    },
    finance_unpaid_sales_invoices: {
      success: true,
      data: [
        { id: 'ar-1', customer_name: 'Khách hàng J', total_amount: 40000000, remaining_amount: 30000000, created_at: '2026-06-07T10:00:00Z' },
      ],
    },
    finance_depreciation_status: {
      success: true,
      data: [
        { asset_code: 'FA-01', asset_name: 'Máy ép nhựa', depreciation_amount: 85000000, status: 'đã trích' },
      ],
    },

    // HRM
    hrm_payroll_lifecycle_status: {
      success: true,
      data: [
        { id: 'pay-1', employee_name: 'Nguyễn Văn A', salary_period: '2026-06', net_pay: 4500000, status: 'Đã thanh toán' },
      ],
    },
    hrm_pending_leave_requests: {
      success: true,
      data: [
        { id: 'leave-1', employee_name: 'Employee 2', leave_type: 'Phép năm', start_date: '2026-06-08T00:00:00Z', end_date: '2026-06-10T00:00:00Z', days: 3 },
      ],
    },
    hrm_expiring_contracts: {
      success: true,
      data: [
        { id: 'contract-1', employee_name: 'Employee 3', contract_no: 'CON-01', contract_type: 'Xác định thời hạn', end_date: '2026-06-22T00:00:00Z' },
      ],
    },
    hrm_today_attendance_rate: {
      success: true,
      data: [
        { id: 'emp-1', employee_id: 'E-01', full_name: 'Nguyễn Văn B', department: 'Sản xuất', status: 'Vắng mặt' },
      ],
    },

    // Manufacturing
    manufacturing_pending_wo_approval: {
      success: true,
      data: [
        { id: 'wo-1', name: 'WO-001', production_item_name: 'Sản phẩm A', quantity: 200, planned_start_date: '2026-06-07T00:00:00Z' },
      ],
    },
    manufacturing_active_wos: {
      success: true,
      data: [
        { id: 'wo-2', name: 'WO-002', production_item_name: 'Sản phẩm B', quantity: 200, produced_qty: 150, planned_start_date: '2026-06-07T00:00:00Z' },
      ],
    },
    manufacturing_pending_declarations: {
      success: true,
      data: [
        { id: 'wo-3', name: 'WO-003', production_item_name: 'Sản phẩm C', quantity: 200, produced_qty: 120, planned_start_date: '2026-06-07T00:00:00Z', planned_end_date: '2026-06-05T00:00:00Z', status: 'in_progress', days_left: -2, created_at: '2026-06-07T00:00:00Z' },
      ],
    },
    manufacturing_pending_completion: {
      success: true,
      data: [
        { id: 'wo-4', name: 'WO-004', production_item_name: 'Sản phẩm D', quantity: 200, produced_qty: 200, target_warehouse_name: 'Kho Thành Phẩm A', planned_start_date: '2026-06-07T00:00:00Z' },
      ],
    },
  };

  beforeEach(() => {
    server.use(
      http.get('*/api/v1/dashboard/widgets/', () => {
        return HttpResponse.json(mockWidgetsMetadata);
      }),
      http.get('*/api/v1/dashboard/widgets/batch-data/', () => {
        return HttpResponse.json(mockBatchData);
      })
    );
  });

  it('renders loading state initially', async () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/Đang tải thông tin trang tổng quan/i)).toBeInTheDocument();
  });

  it('renders all 26 dashboard widgets and their specific data elements correctly', async () => {
    renderWithProviders(<DashboardPage />);

    // Wait for the widgets data to be rendered
    await waitFor(() => {
      expect(screen.getByText('Đơn bán hàng hôm nay')).toBeInTheDocument();
    });

    // 1. Sales & CRM (4 widgets)
    expect(screen.getByText('Đơn bán hàng hôm nay')).toBeInTheDocument();
    expect(screen.getByText(/SO-TODAY-1/)).toBeInTheDocument();

    expect(screen.getByText('Đơn bán nháp chờ xử lý')).toBeInTheDocument();
    expect(screen.getByText(/SO-DRAFT-1/)).toBeInTheDocument();
    expect(screen.getByText('Khách hàng D')).toBeInTheDocument();

    expect(screen.getByText('Đơn bán chờ đặc cách nợ')).toBeInTheDocument();
    expect(screen.getByText(/SO-CREDIT-1/)).toBeInTheDocument();
    expect(screen.getByText('Vượt hạn mức 15.2M')).toBeInTheDocument();

    expect(screen.getByText('Đơn bán chờ xử lý kho/tiền')).toBeInTheDocument();
    expect(screen.getByText(/SO-FUL-1/)).toBeInTheDocument();
    expect(screen.getByText('Khách hàng B')).toBeInTheDocument();

    // 2. Purchasing & QC (6 widgets)
    expect(screen.getByText('Đơn mua hàng hoạt động')).toBeInTheDocument();
    expect(screen.getByText(/PO-ACTIVE-1/)).toBeInTheDocument();
    expect(screen.getByText('Nhà cung cấp K')).toBeInTheDocument();

    expect(screen.getByText('Đơn mua nháp chờ xử lý')).toBeInTheDocument();
    expect(screen.getByText(/PO-DRAFT-1/)).toBeInTheDocument();
    expect(screen.getByText('Nhà cung cấp X')).toBeInTheDocument();

    expect(screen.getByText('Đơn mua hàng chờ nhận hàng')).toBeInTheDocument();
    expect(screen.getByText(/PO-DEL-1/)).toBeInTheDocument();
    expect(screen.getByText('Nhà cung cấp Y')).toBeInTheDocument();
    expect(screen.getByText('📥 85%')).toBeInTheDocument();
    expect(screen.getByText('💳 60%')).toBeInTheDocument();

    expect(screen.getByText('Lô hàng cập bến chờ QC')).toBeInTheDocument();
    expect(screen.getByText('SHIP-01')).toBeInTheDocument();
    expect(screen.getByText('Lô hàng 1')).toBeInTheDocument();

    expect(screen.getByText('Chi phí logistics chờ phân bổ')).toBeInTheDocument();
    expect(screen.getByText('SHIP-02')).toBeInTheDocument();

    expect(screen.getByText('Hóa đơn bị chặn thanh toán')).toBeInTheDocument();
    expect(screen.getByText(/INV-BLOCK-1/)).toBeInTheDocument();
    expect(screen.getByText('Lệch giá đơn PO (+5%)')).toBeInTheDocument();

    // 3. Inventory (3 widgets)
    expect(screen.getByText('Phiếu nhập kho chờ duyệt')).toBeInTheDocument();
    expect(screen.getByText('SE-REC-MOCK')).toBeInTheDocument();

    expect(screen.getByText('Cảnh báo tồn kho thấp')).toBeInTheDocument();
    expect(screen.getByText('Thép hình H150')).toBeInTheDocument();

    expect(screen.getByText('Phiếu kho nháp chờ ghi sổ')).toBeInTheDocument();
    expect(screen.getByText('SE-001')).toBeInTheDocument();
    expect(screen.getByText('Kho A → Kho B')).toBeInTheDocument();

    // 4. Finance (5 widgets)
    expect(screen.getByText('Dòng tiền Thu - Chi')).toBeInTheDocument();
    expect(screen.getByText('Giao dịch dòng tiền tháng')).toBeInTheDocument();
    expect(screen.getByText(/TX-CF-1/)).toBeInTheDocument();
    expect(screen.getByText('Nhận tiền hàng A')).toBeInTheDocument();

    expect(screen.getByText('Hóa đơn mua chưa trả tiền (AP)')).toBeInTheDocument();
    expect(screen.getByText(/INV-AP-1/)).toBeInTheDocument();
    expect(screen.getByText('Nhà cung cấp H')).toBeInTheDocument();

    expect(screen.getByText('Hóa đơn bán chưa thu tiền (AR)')).toBeInTheDocument();
    expect(screen.getByText(/INV-AR-1/)).toBeInTheDocument();
    expect(screen.getByText('Khách hàng J')).toBeInTheDocument();

    expect(screen.getByText('Khấu hao tài sản cố định')).toBeInTheDocument();
    expect(screen.getByText('Máy ép nhựa')).toBeInTheDocument();

    // 5. HRM (4 widgets)
    expect(screen.getByText('Bảng lương chờ duyệt & thanh toán')).toBeInTheDocument();
    expect(screen.getByText(/SLIP-PAY-1/)).toBeInTheDocument();
    expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();

    expect(screen.getByText('Đơn xin nghỉ phép chờ duyệt')).toBeInTheDocument();
    expect(screen.getByText('Employee 2')).toBeInTheDocument();

    expect(screen.getByText('Hợp đồng sắp hết hạn')).toBeInTheDocument();
    expect(screen.getByText('Employee 3')).toBeInTheDocument();
    expect(screen.getByText('CON-01')).toBeInTheDocument();

    expect(screen.queryByText('Nhân viên mới chưa có hợp đồng')).not.toBeInTheDocument();

    expect(screen.getByText('Nhân viên vắng mặt hôm nay')).toBeInTheDocument();
    expect(screen.getByText('Nguyễn Văn B')).toBeInTheDocument();

    // 6. Manufacturing (4 widgets)
    expect(screen.getByText('Lệnh sản xuất chờ duyệt')).toBeInTheDocument();
    expect(screen.getByText('WO-001')).toBeInTheDocument();
    expect(screen.getByText('Sản phẩm A')).toBeInTheDocument();

    expect(screen.getByText('Lệnh sản xuất đang chạy')).toBeInTheDocument();
    expect(screen.getByText('WO-002')).toBeInTheDocument();
    expect(screen.getByText('Sản phẩm B')).toBeInTheDocument();

    expect(screen.getByText('Lệnh sản xuất sắp trễ hạn')).toBeInTheDocument();
    expect(screen.getByText('WO-003')).toBeInTheDocument();
    expect(screen.getByText('Trễ 2 ngày')).toBeInTheDocument();

    expect(screen.getByText('Lệnh sản xuất chờ hoàn thành')).toBeInTheDocument();
    expect(screen.getByText('WO-004')).toBeInTheDocument();
    expect(screen.getByText(/Kho Thành Phẩm A/)).toBeInTheDocument();
  });

  it('filters stock entries based on tab select', async () => {
    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Phiếu kho nháp chờ ghi sổ')).toBeInTheDocument();
    });

    // Locate tab buttons inside the Inventory Stock Entry Card
    const tabReceipt = screen.getByRole('button', { name: /Nhập/i });
    const tabTransfer = screen.getByRole('button', { name: /Chuyển/i });

    // Originally both entries are in DOM (SE-001 is transfer, SE-002 is receipt)
    expect(screen.getByText('SE-001')).toBeInTheDocument();
    expect(screen.getByText('SE-002')).toBeInTheDocument();

    // Click "Nhập" tab
    await userEvent.click(tabReceipt);

    // Only SE-002 remains, SE-001 is hidden
    expect(screen.queryByText('SE-001')).not.toBeInTheDocument();
    expect(screen.getByText('SE-002')).toBeInTheDocument();

    // Click "Chuyển" tab
    await userEvent.click(tabTransfer);

    // Only SE-001 remains, SE-002 is hidden
    expect(screen.getByText('SE-001')).toBeInTheDocument();
    expect(screen.queryByText('SE-002')).not.toBeInTheDocument();
  });
});

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { server } from '../../shared/lib/test/server';
import { renderWithProviders } from '../../shared/lib/test/test-utils';
import DashboardPage from './DashboardPage';

describe('DashboardPage', () => {
  // New metadata format: type values include kpi, donut_chart, aging_bar, gauge,
  // stacked_progress, mini_chart, list_mini. 27 widgets in total.
  const mockWidgetsMetadata = [
    { code: 'sales_today_revenue', title: 'Doanh thu hôm nay', type: 'line_chart', size: '2x2', quick_links: ['/sales?tab=orders'] },
    { code: 'sales_draft_orders', title: 'Đơn bán hàng nháp', type: 'kpi_list', size: '1x2', quick_links: ['/sales?tab=orders&status=draft'] },
    { code: 'sales_pending_credit_bypass', title: 'Đơn bán chờ duyệt vượt hạn mức', type: 'kpi_list', size: '1x2', quick_links: ['/sales?tab=orders&status=pending_credit_approval'] },
    { code: 'sales_pending_fulfillment', title: 'Đơn bán chờ giao hàng', type: 'kpi_list', size: '1x2', quick_links: ['/inventory?tab=entries&status=draft'] },

    { code: 'purchasing_active_po_count', title: 'Đơn mua hàng hoạt động', type: 'kpi_list', size: '1x2', quick_links: ['/purchasing?tab=orders&status=pending'] },
    { code: 'purchasing_draft_orders', title: 'Đơn mua hàng nháp', type: 'kpi_list', size: '1x2', quick_links: ['/purchasing?tab=orders&status=draft'] },
    { code: 'purchasing_pending_delivery', title: 'Đơn mua chờ nhận hàng', type: 'kpi_list', size: '1x2', quick_links: ['/inventory?tab=entries&status=draft'] },
    { code: 'purchasing_pending_qc', title: 'Lô hàng chờ QC', type: 'kpi_list', size: '1x2', quick_links: ['/purchasing?tab=shipment'] },
    { code: 'purchasing_pending_logistic_fees', title: 'Lô hàng chờ phân bổ chi phí', type: 'kpi_list', size: '1x2', quick_links: ['/purchasing?tab=shipment'] },
    { code: 'purchasing_blocked_invoices', title: 'Hóa đơn mua bị chặn', type: 'kpi_list', size: '1x2', quick_links: ['/purchasing?tab=invoices&status=blocked'] },

    { code: 'inventory_pending_entry_count', title: 'Phiếu nhập kho chờ duyệt', type: 'kpi_list', size: '1x2', quick_links: ['/inventory?tab=entries&status=draft'] },
    { code: 'inventory_low_stock', title: 'Theo dõi linh kiện', type: 'donut_chart', size: '2x2', quick_links: ['/inventory?tab=ledger'] },
    { code: 'inventory_pending_entries', title: 'Yêu cầu chuyển kho chờ thực hiện', type: 'kpi_list', size: '2x2', quick_links: ['/inventory?tab=entries&status=draft'] },

    { code: 'finance_cashflow_overview', title: 'Tổng quan dòng tiền', type: 'cashflow_overview', size: '2x2', quick_links: ['/finance'] },
    { code: 'finance_unpaid_purchase_invoices', title: 'AP - Hóa đơn mua chưa thanh toán', type: 'donut_chart', size: '1x2', quick_links: ['/finance/invoices?tab=purchase_invoices&status=unpaid,partial'] },
    { code: 'finance_unpaid_sales_invoices', title: 'AR - Hóa đơn bán chưa thanh toán', type: 'donut_chart', size: '1x2', quick_links: ['/finance/invoices?tab=sales_invoices&status=unpaid,partial'] },
    { code: 'finance_depreciation_status', title: 'Khấu hao tài sản cố định', type: 'kpi_list', size: '1x2', quick_links: ['/finance/fixed-assets'] },

    { code: 'hrm_payroll_lifecycle_status', title: 'Bảng lương chờ duyệt & thanh toán', type: 'kpi_list', size: '1x2', quick_links: ['/hrm/payroll'] },
    { code: 'hrm_pending_leave_requests', title: 'Yêu cầu nghỉ phép chờ duyệt', type: 'kpi_list', size: '1x2', quick_links: ['/hrm/attendance-leave?tab=leave'] },
    { code: 'hrm_expiring_contracts', title: 'Hợp đồng lao động sắp hết hạn', type: 'kpi_list', size: '1x2', quick_links: ['/hrm/employees'] },
    { code: 'hrm_today_attendance_rate', title: 'Theo dõi vắng mặt', type: 'gauge', size: '1x2', quick_links: ['/hrm/attendance-leave?tab=attendance'] },

    { code: 'manufacturing_pending_wo_approval', title: 'Lệnh sản xuất chờ duyệt', type: 'kpi_list', size: '1x2', quick_links: ['/work-orders?status=pending_approval'] },
    { code: 'manufacturing_active_wos', title: 'Lệnh sản xuất đang thực hiện', type: 'stacked_progress', size: '2x2', quick_links: ['/work-orders?status=in_progress'] },
    { code: 'manufacturing_pending_completion', title: 'Lệnh sản xuất chờ nghiệm thu', type: 'kpi_list', size: '1x2', quick_links: ['/work-orders?status=pending_production_complete'] },
  ];

  // Mock batch data with the new payload shapes (dict for KPI/donut/aging/gauge, list for stacked_progress/list_mini).
  const mockBatchData: Record<string, { success: boolean; data: unknown; total_count?: number }> = {
    // line chart
    sales_today_revenue: {
      success: true,
      data: {
        points: [
          { date: '2026-06-07', revenue: '100000000.00' },
          { date: '2026-06-08', revenue: '120000000.00' },
          { date: '2026-06-09', revenue: '80000000.00' },
          { date: '2026-06-10', revenue: '150000000.00' },
          { date: '2026-06-11', revenue: '90000000.00' },
          { date: '2026-06-12', revenue: '110000000.00' },
          { date: '2026-06-13', revenue: '150000000.00' }
        ]
      }
    },
    purchasing_active_po_count: {
      success: true,
      data: {
        total_count: 5,
        top_items: []
      },
      total_count: 5,
    },
    inventory_pending_entry_count: {
      success: true,
      data: {
        total_count: 2,
        top_items: []
      },
      total_count: 2,
    },
    finance_cashflow_overview: {
      success: true,
      data: {
        summary: {
          receive_total: '350000000.00',
          pay_total: '180000000.00',
          net_cashflow: '170000000.00',
          tx_count: 23,
          period_label: '4 tuần gần nhất'
        },
        weeks: [
          { week_label: 'Tuần 1', receive: 100000000, pay: 50000000 }
        ]
      }
    },
    finance_depreciation_status: {
      success: true,
      data: {
        total_count: 5,
        top_items: [],
        depreciated_assets_count: 5,
        pending_assets_count: 0,
        total_depreciation_amount: '85000000.00',
        is_done: true
      },
      total_count: 5,
    },
    hrm_payroll_lifecycle_status: {
      success: true,
      data: {
        total_count: 23,
        top_items: [],
        salary_period: '2026-06',
        status: 'calculated',
        calculated_slips_count: 23,
        approved_slips_count: 0,
        paid_slips_count: 0,
        net_pay_total: '45000000.00'
      },
      total_count: 23,
    },
    hrm_expiring_contracts: {
      success: true,
      data: {
        total_count: 3,
        top_items: [
          { id: 'c1', employee_name: 'Nguyễn Văn A', contract_no: 'HDLD-001', contract_type: 'Xác định thời hạn', end_date: '2026-06-25', days_left: 13 }
        ],
        expiring_count: 3,
        critical_count: 1
      },
      total_count: 3,
    },
    manufacturing_pending_wo_approval: {
      success: true,
      data: {
        total_count: 4,
        top_items: [
          { id: 'wo-p1', name: 'WO-2026-001', code: 'WO-2026-001', product_name: 'Bàn ghế học sinh', production_item_name: 'Bàn ghế học sinh', quantity: '50.00', planned_start_date: '2026-06-15', days_to_start: 2 }
        ]
      }
    },
    manufacturing_pending_completion: {
      success: true,
      data: {
        total_count: 2,
        top_items: [],
        pending_completion_count: 2,
        total_produced_qty: '400.00'
      },
      total_count: 2,
    },

    // Donut widget
    inventory_low_stock: {
      success: true,
      data: {
        items: [
          {
            id: 'p1',
            item_code: 'STEEL-01',
            item_name: 'Thép hình H150',
            uom: 'cái',
            status: 'critical',
            reason: 'Dưới ngưỡng tối thiểu tại Kho A',
            alerts: [
              { category: 'below_threshold' as const, level: 'critical' as const, reason: 'Dưới ngưỡng tối thiểu: tổng tồn kho 5/200 cái trên toàn bộ hệ thống' }
            ],
          }
        ],
        product_distribution: {
          p1: { wh1: '5' }
        },
        warehouses: [
          { id: 'wh1', name: 'Kho A' }
        ],
        total_count: 1
      },
      total_count: 1,
    },

    // Mini chart
    finance_cashflow_chart: {
      success: true,
      data: { weeks: [{ week_label: 'Tuần 1', receive: 100000000, pay: 50000000 }] },
    },

    // Aging bars
    finance_unpaid_purchase_invoices: {
      success: true,
      data: {
        buckets: [
          { label: '0-30 ngày', value: '120000000.00', count: 8, color_key: 'fresh' },
          { label: '31-60 ngày', value: '60000000.00', count: 3, color_key: 'aging' },
          { label: '61-90 ngày', value: '0.00', count: 0, color_key: 'overdue' },
          { label: '> 90 ngày', value: '0.00', count: 0, color_key: 'critical' },
        ],
        total_outstanding: '180000000.00',
        total_count: 11,
        top_overdue: [
          { id: 'inv-1', supplier_name: 'NCC A', overdue_days: 45, remaining_amount: '5000000.00' }
        ],
      },
    },
    finance_unpaid_sales_invoices: {
      success: true,
      data: {
        buckets: [
          { label: '0-30 ngày', value: '120000000.00', count: 8, color_key: 'fresh' },
          { label: '31-60 ngày', value: '60000000.00', count: 3, color_key: 'aging' },
          { label: '61-90 ngày', value: '0.00', count: 0, color_key: 'overdue' },
          { label: '> 90 ngày', value: '0.00', count: 0, color_key: 'critical' },
        ],
        total_outstanding: '180000000.00',
        total_count: 11,
        top_overdue: [],
      },
    },

    // Gauge widget
    hrm_today_attendance_rate: {
      success: true,
      data: { attendance_rate: 92.5, present_count: 37, absent_count: 3, total_active_employees: 40 },
    },

    // Stacked progress
    manufacturing_active_wos: {
      success: true,
      data: [
        { id: 'wo-1', name: 'WO-001', production_item_name: 'Sản phẩm A', quantity: '200', produced_qty: '150', progress_pct: 75, planned_start_date: '2026-06-01', planned_end_date: '2026-06-30', days_left: 16, target_warehouse_name: 'Kho TP A' },
        { id: 'wo-2', name: 'WO-002', production_item_name: 'Sản phẩm B', quantity: '100', produced_qty: '40', progress_pct: 40, planned_start_date: '2026-06-05', planned_end_date: '2026-06-25', days_left: 11, target_warehouse_name: 'Kho TP B' },
      ],
      total_count: 2,
    },

    // List mini widgets (most are 1-row lists, e.g. sales_draft_orders)
    sales_draft_orders: {
      success: true,
      data: {
        total_count: 1,
        top_items: [{ id: 'draft-1', customer_name: 'KH D', total_amount: '50000000.00', created_at: '2026-06-07T10:00:00Z' }]
      },
      total_count: 1,
    },
    sales_pending_credit_bypass: {
      success: true,
      data: {
        total_count: 1,
        top_items: [{ id: 'credit-1', customer_name: 'KH C', total_amount: '115200000.00', reason: 'Vượt hạn mức 15.2M', created_at: '2026-06-07T10:00:00Z' }]
      },
      total_count: 1,
    },
    sales_pending_fulfillment: {
      success: true,
      data: {
        total_count: 1,
        top_items: [{ id: 'ful-1', customer_name: 'KH B', total_amount: '60000000.00', created_at: '2026-06-07T10:00:00Z' }]
      },
      total_count: 1,
    },
    purchasing_draft_orders: {
      success: true,
      data: {
        total_count: 1,
        top_items: [{ id: 'p-draft-1', supplier_name: 'NCC X', total_amount: '45000000.00', created_at: '2026-06-07T10:00:00Z' }]
      },
      total_count: 1,
    },
    purchasing_pending_delivery: {
      success: true,
      data: {
        total_count: 1,
        top_items: [{ id: 'p-del-1', supplier_name: 'NCC Y', total_amount: '120000000.00', expected_delivery_date: '2026-06-15T00:00:00Z', receipt_fulfillment_rate: '85.00', payment_fulfillment_rate: '60.00', created_at: '2026-06-07T10:00:00Z' }]
      },
      total_count: 1,
    },
    purchasing_pending_qc: {
      success: true,
      data: {
        total_count: 1,
        top_items: [{ id: 'qc-1', shipment_num: 'SHIP-01', name: 'Lô hàng 1', created_at: '2026-06-07T10:00:00Z' }]
      },
      total_count: 1,
    },
    purchasing_pending_logistic_fees: {
      success: true,
      data: {
        total_count: 1,
        top_items: [{ id: 'fee-1', shipment_num: 'SHIP-02', name: 'Lô hàng 2', created_at: '2026-06-04T10:00:00Z' }]
      },
      total_count: 1,
    },
    purchasing_blocked_invoices: {
      success: true,
      data: {
        total_count: 1,
        top_items: [{ id: 'block-1', supplier_name: 'NCC Z', total_amount: '88000000.00', block_reason: 'Lệch giá đơn PO (+5%)', created_at: '2026-06-07T10:00:00Z' }]
      },
      total_count: 1,
    },
    inventory_pending_entries: {
      success: true,
      data: {
        total_count: 2,
        top_items: [
          { id: 'se-trf-1', name: 'SE-001', purpose: 'transfer', route_desc: 'Kho A → Kho B', item_count: 5, posting_date: '2026-06-07T10:00:00Z', created_at: '2026-06-07T10:00:00Z' },
          { id: 'se-rec-1', name: 'SE-002', purpose: 'receipt', route_desc: 'Từ PO: PO-001', item_count: 2, posting_date: '2026-06-07T10:00:00Z', created_at: '2026-06-07T10:00:00Z' }
        ]
      },
      total_count: 2,
    },
    hrm_pending_leave_requests: {
      success: true,
      data: {
        total_count: 1,
        top_items: [{ id: 'lv-1', employee_name: 'NV B', leave_type: 'Phép năm', start_date: '2026-06-08', end_date: '2026-06-10', days: '3.0', created_at: '2026-06-07T10:00:00Z' }]
      },
      total_count: 1,
    },

  };

  beforeEach(() => {
    server.use(
      http.get('*/api/v1/dashboard/widgets/', () => {
        return HttpResponse.json(mockWidgetsMetadata);
      }),
      http.get('*/api/v1/dashboard/widgets/batch-data/', () => {
        return HttpResponse.json(mockBatchData);
      }),
      http.get('*/api/v1/dashboard/widgets/:widget_code/', ({ params, request }) => {
        const widgetCode = params.widget_code as string;
        const url = new URL(request.url);
        const purpose = url.searchParams.get('purpose');

        const widgetResult = mockBatchData[widgetCode];
        if (!widgetResult) {
          return new HttpResponse(null, { status: 404 });
        }

        let filteredData = widgetResult.data;
        let totalCount = widgetResult.total_count ?? 0;

        if (widgetCode === 'inventory_pending_entries' && purpose && filteredData && typeof filteredData === 'object' && 'top_items' in filteredData) {
          const items = (filteredData as any).top_items || [];
          const filteredItems = items.filter((item: any) => item.purpose === purpose);
          filteredData = {
            total_count: filteredItems.length,
            top_items: filteredItems,
          };
          totalCount = filteredItems.length;
        }

        return HttpResponse.json({
          success: true,
          data: filteredData,
          total_count: totalCount,
        });
      })
    );
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it('renders loading state initially', async () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/Đang tải thông tin trang tổng quan/i)).toBeInTheDocument();
  });

  it('renders all 26 dashboard widgets across visual types', async () => {
    renderWithProviders(<DashboardPage />);

    // Wait for at least one KPI to render
    await waitFor(() => {
      expect(screen.getByText('Doanh thu hôm nay')).toBeInTheDocument();
    });

    // Line Chart (1)
    expect(screen.getByText('Doanh thu hôm nay')).toBeInTheDocument();

    // KPI cards (7)
    expect(screen.getByText('Đơn mua hàng hoạt động')).toBeInTheDocument();
    expect(screen.getByText('Phiếu nhập kho chờ duyệt')).toBeInTheDocument();
    expect(screen.getByText('Khấu hao tài sản cố định')).toBeInTheDocument();
    expect(screen.getByText('Bảng lương chờ duyệt & thanh toán')).toBeInTheDocument();
    expect(screen.getByText('Hợp đồng lao động sắp hết hạn')).toBeInTheDocument();
    // Lệnh sản xuất chờ duyệt appears in the card title; use getAllByText to allow multiple matches
    expect(screen.getAllByText('Lệnh sản xuất chờ duyệt').length).toBeGreaterThan(0);
    expect(screen.getByText('Lệnh sản xuất chờ nghiệm thu')).toBeInTheDocument();

    // Donut
    expect(screen.getByText('Theo dõi linh kiện')).toBeInTheDocument();
    expect(screen.getAllByTestId('donut-svg').length).toBe(3);

    // Gauge
    expect(screen.getByText('Theo dõi vắng mặt')).toBeInTheDocument();
    expect(screen.getByTestId('gauge-svg')).toBeInTheDocument();

    // Stacked progress
    expect(screen.getByText('Lệnh sản xuất đang thực hiện')).toBeInTheDocument();

    // Cashflow Overview (replaces mini chart and kpi summary)
    expect(screen.getByText('Tổng quan dòng tiền')).toBeInTheDocument();

    // Aging donut cards (routed to AgingBarChartCard)
    expect(screen.getByText('AP - Hóa đơn mua chưa thanh toán')).toBeInTheDocument();
    expect(screen.getByText('AR - Hóa đơn bán chưa thanh toán')).toBeInTheDocument();

    // List mini widgets
    expect(screen.getByText('Đơn bán hàng nháp')).toBeInTheDocument();
    expect(screen.getByText('Đơn bán chờ duyệt vượt hạn mức')).toBeInTheDocument();
    expect(screen.getByText('Đơn bán chờ giao hàng')).toBeInTheDocument();
    expect(screen.getByText('Đơn mua hàng nháp')).toBeInTheDocument();
    expect(screen.getByText('Đơn mua chờ nhận hàng')).toBeInTheDocument();
    expect(screen.getByText('Lô hàng chờ QC')).toBeInTheDocument();
    expect(screen.getByText('Lô hàng chờ phân bổ chi phí')).toBeInTheDocument();
    expect(screen.getByText('Hóa đơn mua bị chặn')).toBeInTheDocument();
    expect(screen.getByText('Yêu cầu chuyển kho chờ thực hiện')).toBeInTheDocument();
    expect(screen.getByText('Yêu cầu nghỉ phép chờ duyệt')).toBeInTheDocument();
  });

  it('renders CashflowOverviewCard with net cashflow total', async () => {
    renderWithProviders(<DashboardPage />);
    await waitFor(() => {
      // "+170.000.000 ₫" appears in CashflowOverviewCard. Use getAllByText.
      expect(screen.getAllByText(/\+170\.000\.000/).length).toBeGreaterThan(0);
    });
  });

  it('renders DonutChartCard with SVG for inventory_low_stock', async () => {
    renderWithProviders(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getAllByTestId('donut-svg').length).toBeGreaterThan(0);
    });
  });

  it('renders GaugeCard with SVG for hrm_today_attendance_rate', async () => {
    renderWithProviders(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByTestId('gauge-svg')).toBeInTheDocument();
    });
    // Verify the rate is displayed
    expect(screen.getByText(/92\.5%/)).toBeInTheDocument();
  });

  it('renders AgingBarChartCard with 4 buckets for finance_unpaid_purchase_invoices', async () => {
    renderWithProviders(<DashboardPage />);
    await waitFor(() => {
      // "0-30 ngày" appears in both AP and AR aging bars. Use getAllByText.
      expect(screen.getAllByText(/0-30 ngày/).length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText(/31-60 ngày/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/61-90 ngày/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/> 90 ngày/).length).toBeGreaterThan(0);
  });

  it('renders StackedProgressCard with progress for manufacturing_active_wos', async () => {
    renderWithProviders(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('WO-001')).toBeInTheDocument();
    });
    // Progress percent should be displayed
    expect(screen.getByText(/75%/)).toBeInTheDocument();
  });

  it('does not show total_count badge for KPI widgets (purchasing_active_po_count)', async () => {
    renderWithProviders(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('Đơn mua hàng hoạt động')).toBeInTheDocument();
    });
    // The KPI card should not contain a "shared-badge" count
    const kpiCard = screen.getByText('Đơn mua hàng hoạt động').closest('div');
    expect(kpiCard).not.toHaveTextContent(/^\d+$/);
  });

  it('skips widgets the user has no permission for (no errors)', async () => {
    server.use(
      http.get('*/api/v1/dashboard/widgets/', () => {
        // Return only line chart widget (user has only sales.view_order permission)
        return HttpResponse.json([mockWidgetsMetadata[0]]);
      }),
      http.get('*/api/v1/dashboard/widgets/batch-data/', () => {
        return HttpResponse.json({
          sales_today_revenue: mockBatchData.sales_today_revenue,
        });
      })
    );

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Doanh thu hôm nay')).toBeInTheDocument();
    });
    // Other widgets should NOT be rendered
    expect(screen.queryByText('Tổng quan dòng tiền')).not.toBeInTheDocument();
    expect(screen.queryByText('Theo dõi linh kiện')).not.toBeInTheDocument();
  });

  it('filters stock entries based on tab select', async () => {
    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Yêu cầu chuyển kho chờ thực hiện')).toBeInTheDocument();
    });

    const tabReceipt = screen.getByRole('button', { name: /Nhập/i });
    const tabTransfer = screen.getByRole('button', { name: /Chuyển/i });

    // SE-001 is a transfer; the link text is "🔄 SE-001" wrapped in a span.
    // Use a function matcher to find the element by partial text.
    expect(screen.getAllByText(/SE-001/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/SE-002/).length).toBeGreaterThan(0);

    await userEvent.click(tabReceipt);
    // After clicking Nhập, transfer entries are hidden
    await waitFor(() => {
      expect(screen.queryByText(/SE-001/)).not.toBeInTheDocument();
    });
    expect(screen.getAllByText(/SE-002/).length).toBeGreaterThan(0);

    await userEvent.click(tabTransfer);
    // After clicking Chuyển, receipt entries are hidden and transfer is visible
    await waitFor(() => {
      expect(screen.getAllByText(/SE-001/).length).toBeGreaterThan(0);
    });
    expect(screen.queryByText(/SE-002/)).not.toBeInTheDocument();
  });

  it('renders empty state when no widgets are returned', async () => {
    server.use(
      http.get('*/api/v1/dashboard/widgets/', () => {
        return HttpResponse.json([]);
      }),
      http.get('*/api/v1/dashboard/widgets/batch-data/', () => {
        return HttpResponse.json({});
      })
    );

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Không có dữ liệu hiển thị')).toBeInTheDocument();
    });
  });

  it('shows error state when batch-data API fails', async () => {
    server.use(
      http.get('*/api/v1/dashboard/widgets/', () => {
        return HttpResponse.json(mockWidgetsMetadata);
      }),
      http.get('*/api/v1/dashboard/widgets/batch-data/', () => {
        return HttpResponse.error();
      })
    );

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Trang Tổng Quan')).toBeInTheDocument();
      expect(screen.getAllByText('Lỗi nạp dữ liệu').length).toBeGreaterThan(0);
    });
  });

  it('renders modified widget layouts and verifies correct elements and styling', async () => {
    renderWithProviders(<DashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText('WO-2026-001')).toBeInTheDocument();
    });

    // 1. renders manufacturing pending WO list and product name
    expect(screen.getByText(/Bàn ghế học sinh/)).toBeInTheDocument();

    // 2. renders cashflow with period label
    expect(screen.getByText(/4 tuần gần nhất/)).toBeInTheDocument();

    // 3. renders hrm expiring contracts without gap text
    expect(screen.queryByText(/gấp/)).toBeNull();

    // 4. renders gauge as full circle (2 circle elements)
    const gaugeWrapper = screen.getByTestId('gauge-svg');
    const gaugeSvg = gaugeWrapper.querySelector('svg');
    expect(gaugeSvg).toBeInTheDocument();
    const circles = gaugeSvg?.querySelectorAll('circle');
    expect(circles?.length).toBe(2);

    // 5. renders aging top list with remaining amount
    expect(screen.getByText(/^5\.000\.000\s*₫$/)).toBeInTheDocument();

    // 6. aging top list uses var(--fs-sm) font size (13px)
    const nameEl = screen.getByText('NCC A');
    expect(nameEl.style.fontSize).toBe('var(--fs-sm)');
  });
});

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, it, expect } from 'vitest';
import { server } from '../../../shared/lib/test/server';
import { renderWithProviders } from '../../../shared/lib/test/test-utils';
import { KpiListCard } from '../KpiListCard';

describe('KpiListCard', () => {
  const mockData = {
    total_count: 12,
    top_items: [
      { id: '1', customer_name: 'Khách A', total_amount: '1000000', created_at: '2026-06-13T00:00:00Z' },
      { id: '2', customer_name: 'Khách B', total_amount: '2000000', created_at: '2026-06-12T00:00:00Z' }
    ]
  };

  it('renders hero metric from total_count', () => {
    renderWithProviders(
      <KpiListCard
        title="Đơn hàng nháp"
        code="sales_draft_orders"
        data={mockData}
      />
    );

    expect(screen.getAllByText('12').length).toBeGreaterThan(0);
  });

  it('renders list items from top_items', () => {
    renderWithProviders(
      <KpiListCard
        title="Đơn hàng nháp"
        code="sales_draft_orders"
        data={mockData}
      />
    );

    expect(screen.getByText('Khách A')).toBeInTheDocument();
    expect(screen.getByText('Khách B')).toBeInTheDocument();
  });

  it('shows tab filter only for inventory_pending_entries', () => {
    renderWithProviders(
      <KpiListCard
        title="Đơn hàng nháp"
        code="sales_draft_orders"
        data={mockData}
      />
    );

    expect(screen.queryByText('Tất cả')).not.toBeInTheDocument();

    renderWithProviders(
      <KpiListCard
        title="Phiếu kho nháp"
        code="inventory_pending_entries"
        data={mockData}
      />
    );

    expect(screen.getByText('Tất cả')).toBeInTheDocument();
    expect(screen.getByText('Nhập 📥')).toBeInTheDocument();
  });

  it('triggers refetch on tab change for inventory_pending_entries', async () => {
    let purposeRequested: string | null = null;

    server.use(
      http.get('*/api/v1/dashboard/widgets/inventory_pending_entries/', ({ request }) => {
        const url = new URL(request.url);
        purposeRequested = url.searchParams.get('purpose');
        return HttpResponse.json({
          success: true,
          total_count: 5,
          data: {
            total_count: 5,
            top_items: [
              { id: '3', name: 'Phiếu Nhập 1', purpose: 'receipt', route_desc: 'Kho Nguồn → Kho Đích', remarks: 'Phiếu nháp', item_count: 2, created_at: '2026-06-13T00:00:00Z' }
            ]
          }
        });
      })
    );

    renderWithProviders(
      <KpiListCard
        title="Yêu cầu chuyển kho"
        code="inventory_pending_entries"
        data={mockData}
      />
    );

    const receiptTab = screen.getByText('Nhập 📥');
    await userEvent.click(receiptTab);

    await waitFor(() => {
      expect(purposeRequested).toBe('receipt');
    });

    expect(screen.getAllByText('5').length).toBeGreaterThan(0);
    expect(screen.getByText('Kho Nguồn → Kho Đích')).toBeInTheDocument();
  });

  it('displays items_summary and hides total_amount for warehouse roles', () => {
    const warehouseMockData = {
      total_count: 5,
      top_items: [
        { id: '1', customer_name: 'Khách A', total_amount: '1000000', items_summary: 'Thép ống: 10, Thép tấm: 5', created_at: '2026-06-13T00:00:00Z' }
      ]
    };

    renderWithProviders(
      <KpiListCard
        title="Đơn hàng chờ giao"
        code="sales_pending_fulfillment"
        data={warehouseMockData}
      />
    );

    expect(screen.getByText('Thép ống: 10, Thép tấm: 5')).toBeInTheDocument();
    expect(screen.queryByText('1.000.000 ₫')).not.toBeInTheDocument();
  });

  it('hides hero count for hrm_payroll_lifecycle_status', () => {
    renderWithProviders(
      <KpiListCard
        title="Bảng lương chờ duyệt"
        code="hrm_payroll_lifecycle_status"
        data={mockData}
      />
    );

    expect(screen.queryByText('12')).not.toBeInTheDocument();
  });

  it('displays custom empty state for hrm_payroll_lifecycle_status', () => {
    renderWithProviders(
      <KpiListCard
        title="Bảng lương chờ duyệt"
        code="hrm_payroll_lifecycle_status"
        data={{ total_count: 0, top_items: [] }}
      />
    );

    expect(screen.getByText('Không có kỳ lương nào đang chờ xử lý')).toBeInTheDocument();
  });
});

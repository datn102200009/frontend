import { screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '../../../shared/lib/test/test-utils';
import { DashboardWidgetWrapper } from '../DashboardWidgetWrapper';

describe('DashboardWidgetWrapper', () => {
  const mockWidget = {
    code: 'purchasing_active_po_count',
    title: 'Đơn mua hàng đang hoạt động',
    type: 'kpi',
    size: '1x1',
    quick_links: []
  };

  it('resets hasRetried when batchLoading transitions to true', () => {
    const { rerender } = renderWithProviders(
      <DashboardWidgetWrapper
        widget={mockWidget}
        batchData={{}}
        batchLoading={false}
        batchError={null}
      />
    );

    // Initial load: shows empty state or data if provided. Since batchData is empty and not loading, shows empty state
    expect(screen.getByText('Chưa có dữ liệu')).toBeInTheDocument();

    // Rerender with batchLoading = true
    rerender(
      <DashboardWidgetWrapper
        widget={mockWidget}
        batchData={{}}
        batchLoading={true}
        batchError={null}
      />
    );

    // Should show skeleton loading
    expect(screen.queryByText('Chưa có dữ liệu')).not.toBeInTheDocument();
  });
});

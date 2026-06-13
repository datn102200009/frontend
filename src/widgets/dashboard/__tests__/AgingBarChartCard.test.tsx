import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '../../../shared/lib/test/test-utils';
import { AgingBarChartCard } from '../AgingBarChartCard';

describe('AgingBarChartCard', () => {
  const mockData = {
    total_outstanding: '1000000',
    total_count: 1,
    buckets: [
      { label: '0-30 ngày', count: 1, value: 1000000, color_key: 'warning' }
    ],
    top_overdue: []
  };

  it('renders legend labels and values without hardcoded 11px font size', () => {
    const { container } = renderWithProviders(
      <AgingBarChartCard
        title="Dư nợ"
        code="finance_unpaid_sales_invoices"
        data={mockData}
      />
    );

    const labelElement = container.querySelector('[class*="donutLegendLabel"]') as HTMLElement;
    expect(labelElement).toBeInTheDocument();
    expect(labelElement.style.fontSize).not.toBe('11px');

    const valueElement = container.querySelector('[class*="donutLegendValue"]') as HTMLElement;
    expect(valueElement).toBeInTheDocument();
    expect(valueElement.style.fontSize).not.toBe('11px');
  });
});

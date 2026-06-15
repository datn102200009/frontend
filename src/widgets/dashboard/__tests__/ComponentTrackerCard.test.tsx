import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '../../../shared/lib/test/test-utils';
import { ComponentTrackerCard } from '../ComponentTrackerCard';

describe('ComponentTrackerCard', () => {
  const mockData = {
    items: [
      { id: 'p1', item_code: 'LK-001', item_name: 'Linh kiện A', uom: 'Cái', status: 'critical', reason: 'Tồn kho thấp tại Kho A', alerts: [] },
      { id: 'p2', item_code: 'LK-002', item_name: 'Linh kiện B', uom: 'Cái', status: 'normal', reason: '', alerts: [] }
    ],
    product_distribution: {
      p1: { wh1: '10', wh2: '20' },
      p2: { wh1: '50', wh2: '0' }
    },
    warehouses: [
      { id: 'wh1', name: 'Kho A' },
      { id: 'wh2', name: 'Kho B' }
    ],
    total_count: 1
  };

  it('renders select box with all items', async () => {
    renderWithProviders(
      <ComponentTrackerCard
        title="Theo dõi linh kiện"
        code="inventory_low_stock"
        data={mockData}
      />
    );
    const user = userEvent.setup();

    const select = screen.getByRole('combobox', { name: 'Chọn sản phẩm theo dõi' });
    expect(select).toBeInTheDocument();

    await user.click(select);
    expect(screen.getByRole('option', { name: 'Linh kiện A' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Linh kiện B' })).toBeInTheDocument();
  });

  it('shows donut and legend for first item by default', () => {
    renderWithProviders(
      <ComponentTrackerCard
        title="Theo dõi linh kiện"
        code="inventory_low_stock"
        data={mockData}
      />
    );

    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('Kho A')).toBeInTheDocument();
    expect(screen.getByText('Kho B')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  it('updates donut when product changes', async () => {
    renderWithProviders(
      <ComponentTrackerCard
        title="Theo dõi linh kiện"
        code="inventory_low_stock"
        data={mockData}
      />
    );
    const user = userEvent.setup();

    expect(screen.getByText('30')).toBeInTheDocument();

    const select = screen.getByRole('combobox', { name: 'Chọn sản phẩm theo dõi' });
    await user.click(select);

    const optionB = screen.getByRole('option', { name: 'Linh kiện B' });
    await user.click(optionB);

    expect(screen.getAllByText('50').length).toBeGreaterThan(0);
    expect(screen.getByText('Kho A')).toBeInTheDocument();
    expect(screen.getByText('Kho B')).toBeInTheDocument();
  });

  it('shows warning banner for critical items', () => {
    const dataWithAlert = {
      ...mockData,
      items: [
        {
          ...mockData.items[0],
          alerts: [
            { category: 'below_threshold' as const, level: 'critical' as const, reason: 'Tồn kho thấp tại Kho A' }
          ]
        },
        mockData.items[1]
      ]
    };
    renderWithProviders(
      <ComponentTrackerCard
        title="Theo dõi linh kiện"
        code="inventory_low_stock"
        data={dataWithAlert}
      />
    );

    expect(screen.getByText('Tồn kho thấp tại Kho A')).toBeInTheDocument();
  });

  it('renders both alerts independently when both are active', () => {
    const dataWithBoth = {
      ...mockData,
      items: [
        {
          id: 'p1',
          item_code: 'LK-001',
          item_name: 'Linh kiện A',
          uom: 'Cái',
          status: 'critical',
          reason: 'DOS alert',
          alerts: [
            { category: 'below_threshold' as const, level: 'critical' as const, reason: 'Dưới ngưỡng tối thiểu: 50/200' },
            { category: 'projected_shortage' as const, level: 'warning' as const, reason: 'Sẽ thiếu ~100' }
          ]
        }
      ]
    };
    renderWithProviders(
      <ComponentTrackerCard
        title="Theo dõi linh kiện"
        code="inventory_low_stock"
        data={dataWithBoth}
      />
    );

    expect(screen.getByText('Dưới ngưỡng tối thiểu: 50/200')).toBeInTheDocument();
    expect(screen.getByText('Sẽ thiếu ~100')).toBeInTheDocument();
  });

  it('renders only below_threshold alert when projected shortage is inactive', () => {
    const dataWithBelowOnly = {
      ...mockData,
      items: [
        {
          id: 'p1',
          item_code: 'LK-001',
          item_name: 'Linh kiện A',
          uom: 'Cái',
          status: 'critical',
          reason: 'DOS alert',
          alerts: [
            { category: 'below_threshold' as const, level: 'critical' as const, reason: 'Dưới ngưỡng tối thiểu: 50/200' }
          ]
        }
      ]
    };
    renderWithProviders(
      <ComponentTrackerCard
        title="Theo dõi linh kiện"
        code="inventory_low_stock"
        data={dataWithBelowOnly}
      />
    );

    expect(screen.getByText('Dưới ngưỡng tối thiểu: 50/200')).toBeInTheDocument();
    expect(screen.queryByText('Sẽ thiếu ~100')).not.toBeInTheDocument();
  });

  it('renders only projected shortage alert when below_threshold is inactive', () => {
    const dataWithProjOnly = {
      ...mockData,
      items: [
        {
          id: 'p1',
          item_code: 'LK-001',
          item_name: 'Linh kiện A',
          uom: 'Cái',
          status: 'warning',
          reason: 'DOS alert',
          alerts: [
            { category: 'projected_shortage' as const, level: 'warning' as const, reason: 'Sẽ thiếu ~100' }
          ]
        }
      ]
    };
    renderWithProviders(
      <ComponentTrackerCard
        title="Theo dõi linh kiện"
        code="inventory_low_stock"
        data={dataWithProjOnly}
      />
    );

    expect(screen.queryByText('Dưới ngưỡng tối thiểu: 50/200')).not.toBeInTheDocument();
    expect(screen.getByText('Sẽ thiếu ~100')).toBeInTheDocument();
  });

  it('no alert rendered when both are inactive', () => {
    const dataWithNone = {
      ...mockData,
      items: [
        {
          id: 'p1',
          item_code: 'LK-001',
          item_name: 'Linh kiện A',
          uom: 'Cái',
          status: 'normal',
          reason: '',
          alerts: []
        }
      ]
    };
    renderWithProviders(
      <ComponentTrackerCard
        title="Theo dõi linh kiện"
        code="inventory_low_stock"
        data={dataWithNone}
      />
    );

    expect(screen.queryByText('Dưới ngưỡng tối thiểu: 50/200')).not.toBeInTheDocument();
    expect(screen.queryByText('Sẽ thiếu ~100')).not.toBeInTheDocument();
  });

  it('below_threshold critical level uses Critical class', () => {
    const dataCritical = {
      ...mockData,
      items: [
        {
          id: 'p1',
          item_code: 'LK-001',
          item_name: 'Linh kiện A',
          uom: 'Cái',
          status: 'critical',
          reason: '',
          alerts: [
            { category: 'below_threshold' as const, level: 'critical' as const, reason: 'Dưới ngưỡng tối thiểu: 50/200' }
          ]
        }
      ]
    };
    renderWithProviders(
      <ComponentTrackerCard
        title="Theo dõi linh kiện"
        code="inventory_low_stock"
        data={dataCritical}
      />
    );

    const alertEl = screen.getByText('Dưới ngưỡng tối thiểu: 50/200').parentElement;
    expect(alertEl?.className).toContain('componentTrackerAlertCritical');
  });

  it('below_threshold warning level uses Below class (cam đậm)', () => {
    const dataWarning = {
      ...mockData,
      items: [
        {
          id: 'p1',
          item_code: 'LK-001',
          item_name: 'Linh kiện A',
          uom: 'Cái',
          status: 'warning',
          reason: '',
          alerts: [
            { category: 'below_threshold' as const, level: 'warning' as const, reason: 'Dưới ngưỡng tối thiểu: 150/200' }
          ]
        }
      ]
    };
    renderWithProviders(
      <ComponentTrackerCard
        title="Theo dõi linh kiện"
        code="inventory_low_stock"
        data={dataWarning}
      />
    );

    const alertEl = screen.getByText('Dưới ngưỡng tối thiểu: 150/200').parentElement;
    expect(alertEl?.className).toContain('componentTrackerAlertBelow');
  });

  it('projected_shortage warning level uses Projected class (vàng chanh)', () => {
    const dataProjected = {
      ...mockData,
      items: [
        {
          id: 'p1',
          item_code: 'LK-001',
          item_name: 'Linh kiện A',
          uom: 'Cái',
          status: 'warning',
          reason: '',
          alerts: [
            { category: 'projected_shortage' as const, level: 'warning' as const, reason: 'Sẽ thiếu ~100' }
          ]
        }
      ]
    };
    renderWithProviders(
      <ComponentTrackerCard
        title="Theo dõi linh kiện"
        code="inventory_low_stock"
        data={dataProjected}
      />
    );

    const alertEl = screen.getByText('Sẽ thiếu ~100').parentElement;
    expect(alertEl?.className).toContain('componentTrackerAlertProjected');
  });

  it('renders both alert icons in select options when both alerts are active', async () => {
    const dataWithBoth = {
      ...mockData,
      items: [
        {
          id: 'p1',
          item_code: 'LK-001',
          item_name: 'Linh kiện A',
          uom: 'Cái',
          status: 'critical',
          reason: 'DOS alert',
          alerts: [
            { category: 'below_threshold' as const, level: 'critical' as const, reason: 'Dưới ngưỡng' },
            { category: 'projected_shortage' as const, level: 'warning' as const, reason: 'Sẽ thiếu' }
          ]
        }
      ]
    };
    renderWithProviders(
      <ComponentTrackerCard
        title="Theo dõi linh kiện"
        code="inventory_low_stock"
        data={dataWithBoth}
      />
    );
    const user = userEvent.setup();

    const select = screen.getByRole('combobox', { name: 'Chọn sản phẩm theo dõi' });
    await user.click(select);

    const option = screen.getByRole('option', { name: 'Linh kiện A' });
    const triangles = option.querySelectorAll('svg');
    // 2 icon AlertTriangle (below + projected) + 1 caret icon của SearchableSelect
    expect(triangles.length).toBe(3);
  });
});

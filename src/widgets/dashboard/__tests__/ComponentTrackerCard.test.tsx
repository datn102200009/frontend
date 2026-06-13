import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '../../../shared/lib/test/test-utils';
import { ComponentTrackerCard } from '../ComponentTrackerCard';

describe('ComponentTrackerCard', () => {
  const mockData = {
    items: [
      { id: 'p1', item_code: 'LK-001', item_name: 'Linh kiện A', uom: 'Cái', status: 'critical', reason: 'Tồn kho thấp tại Kho A' },
      { id: 'p2', item_code: 'LK-002', item_name: 'Linh kiện B', uom: 'Cái', status: 'normal', reason: '' }
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

  it('renders select box with all items', () => {
    renderWithProviders(
      <ComponentTrackerCard
        title="Theo dõi linh kiện"
        code="inventory_low_stock"
        data={mockData}
      />
    );

    expect(screen.getByLabelText('Chọn sản phẩm theo dõi')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'LK-001 - Linh kiện A' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'LK-002 - Linh kiện B' })).toBeInTheDocument();
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

    expect(screen.getByText('30')).toBeInTheDocument();

    const select = screen.getByLabelText('Chọn sản phẩm theo dõi');
    await userEvent.selectOptions(select, 'p2');

    expect(screen.getAllByText('50').length).toBeGreaterThan(0);
    expect(screen.getByText('Kho A')).toBeInTheDocument();
    expect(screen.queryByText('Kho B')).not.toBeInTheDocument();
  });

  it('shows warning banner for critical items', () => {
    renderWithProviders(
      <ComponentTrackerCard
        title="Theo dõi linh kiện"
        code="inventory_low_stock"
        data={mockData}
      />
    );

    expect(screen.getByText('Tồn kho thấp tại Kho A')).toBeInTheDocument();
  });
});

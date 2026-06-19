import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '../../../shared/lib/test/test-utils';
import { StackedProgressCard, type StackedProgressLine } from '../StackedProgressCard';

describe('StackedProgressCard', () => {
  const mockData: StackedProgressLine[] = [
    {
      id: 'wo-1',
      name: 'WO-001',
      production_item_name: 'Sản phẩm A',
      quantity: '200',
      produced_qty: '150',
      progress_pct: 75,
      planned_start_date: '2026-06-01',
      planned_end_date: '2026-06-30',
      days_left: 16,
      target_warehouse_name: 'Kho TP A',
    },
    {
      id: 'wo-2',
      name: 'WO-002',
      production_item_name: 'Sản phẩm B',
      quantity: '100',
      produced_qty: '90',
      progress_pct: 90,
      planned_start_date: '2026-06-05',
      planned_end_date: '2026-06-25',
      days_left: 11,
      target_warehouse_name: 'Kho TP B',
    },
    {
      id: 'wo-3',
      name: 'WO-003',
      production_item_name: 'Sản phẩm C',
      quantity: '150',
      produced_qty: '30',
      progress_pct: 20,
      planned_start_date: '2026-06-05',
      planned_end_date: '2026-06-12',
      days_left: -2,
      target_warehouse_name: 'Kho TP C',
    },
  ];

  it('renders all work orders correctly', () => {
    renderWithProviders(
      <StackedProgressCard
        title="Lệnh sản xuất đang thực hiện"
        code="manufacturing_active_wos"
        data={mockData}
      />
    );

    expect(screen.getByText('WO-001')).toBeInTheDocument();
    expect(screen.getByText('Sản phẩm A')).toBeInTheDocument();
    expect(screen.getByText('150/200')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('Kho TP A')).toBeInTheDocument();

    expect(screen.getByText('WO-002')).toBeInTheDocument();
    expect(screen.getByText('Sản phẩm B')).toBeInTheDocument();
    expect(screen.getByText('90/100')).toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument();

    expect(screen.getByText('WO-003')).toBeInTheDocument();
    expect(screen.getByText('Trễ 2 ngày')).toBeInTheDocument();
  });

  it('sorts items by deadline by default and allows sorting by progress', async () => {
    renderWithProviders(
      <StackedProgressCard
        title="Lệnh sản xuất đang thực hiện"
        code="manufacturing_active_wos"
        data={mockData}
        enableSort={true}
      />
    );
    const user = userEvent.setup();

    // Default: sorts by deadline ASC -> WO-003 (-2 days) first, then WO-002 (11 days), then WO-001 (16 days).
    const itemsBefore = screen.getAllByText(/WO-00[1-3]/);
    expect(itemsBefore[0].textContent).toBe('WO-003');
    expect(itemsBefore[1].textContent).toBe('WO-002');
    expect(itemsBefore[2].textContent).toBe('WO-001');

    // Click sorting by progress
    const progressBtn = screen.getByRole('radio', { name: 'Theo % hoàn thành' });
    await user.click(progressBtn);

    // Sorts by progress DESC -> WO-002 (90%) first, then WO-001 (75%), then WO-003 (20%).
    const itemsAfter = screen.getAllByText(/WO-00[1-3]/);
    expect(itemsAfter[0].textContent).toBe('WO-002');
    expect(itemsAfter[1].textContent).toBe('WO-001');
    expect(itemsAfter[2].textContent).toBe('WO-003');
  });

  it('displays correct deadline texts for various days_left values', () => {
    const dataWithVariedDeadlines: StackedProgressLine[] = [
      { id: 'wo-1', name: 'WO-1', quantity: '10', produced_qty: '5', progress_pct: 50, days_left: null },
      { id: 'wo-2', name: 'WO-2', quantity: '10', produced_qty: '5', progress_pct: 50, days_left: -1 },
      { id: 'wo-3', name: 'WO-3', quantity: '10', produced_qty: '5', progress_pct: 50, days_left: 0 },
      { id: 'wo-4', name: 'WO-4', quantity: '10', produced_qty: '5', progress_pct: 50, days_left: 2 },
      { id: 'wo-5', name: 'WO-5', quantity: '10', produced_qty: '5', progress_pct: 50, days_left: 5 },
    ];

    renderWithProviders(
      <StackedProgressCard
        title="Lệnh sản xuất đang thực hiện"
        code="manufacturing_active_wos"
        data={dataWithVariedDeadlines}
      />
    );

    expect(screen.getByText('Chưa có hạn')).toBeInTheDocument();
    expect(screen.getByText('Trễ 1 ngày')).toBeInTheDocument();
    expect(screen.getByText('Hạn hôm nay')).toBeInTheDocument();
    expect(screen.getByText('Còn 2 ngày')).toBeInTheDocument();
    expect(screen.getByText('Còn 5 ngày')).toBeInTheDocument();
  });
});

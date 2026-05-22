import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StockLedgerView } from './StockLedgerView';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import { http, HttpResponse } from 'msw';
import { server } from '@shared/lib/test/server';

const mockBalances = [
  { item_code: 'TO-D25', item_name: 'Thép ống', warehouse_name: 'Kho 1', total_quantity: 100, uom: 'cái' },
  { item_code: 'GV-01', item_name: 'Gỗ ván', warehouse_name: 'Kho 2', total_quantity: 50, uom: 'tấm' },
];

describe('StockLedgerView', () => {
  beforeEach(() => {
    server.use(
      http.get('*/api/v1/inventory/stock-ledger/balance/', ({ request }) => {
        const url = new URL(request.url);
        const warehouseId = url.searchParams.get('warehouse_id');
        let data = mockBalances;
        if (warehouseId === 'KHO_01') {
          data = mockBalances.filter(b => b.warehouse_name === 'Kho 1');
        }
        return HttpResponse.json(data);
      })
    );
  });

  it('renders stock ledger view and displays balances from api', async () => {
    renderWithProviders(<StockLedgerView />);
    
    // Wait for data to load and heading to appear
    expect(await screen.findByRole('heading', { name: 'Tồn Kho' })).toBeInTheDocument();
    
    // Wait for data to load by looking for one of our mocked values
    const item1 = await screen.findByText('TO-D25');
    expect(item1).toBeInTheDocument();
    
    // We should have data from both warehouses initially
    const cells = screen.getAllByRole('cell', { name: /Kho/ });
    expect(cells.some(c => c.textContent === 'Kho 1')).toBe(true);
    expect(cells.some(c => c.textContent === 'Kho 2')).toBe(true);
  });

  it('filters by warehouse correctly', async () => {
    renderWithProviders(<StockLedgerView />);
    
    // Wait for data to load
    await screen.findByText('TO-D25');
    
    // Select dropdown using accessible query
    const user = userEvent.setup();
    const select = screen.getByRole('combobox', { name: /lọc theo kho/i });
    
    await user.selectOptions(select, 'Kho 1');
    
    // Check that Kho 2 is not displayed anymore in the table cells
    await waitFor(() => {
      expect(screen.queryByRole('cell', { name: 'Kho 2' })).not.toBeInTheDocument();
    });
    // But Kho 1 should still be there
    expect(screen.getByRole('cell', { name: 'Kho 1' })).toBeInTheDocument();
  });
});

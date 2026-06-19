import { screen } from '@testing-library/react';
import WorkOrdersPage from './WorkOrdersPage';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import { http, HttpResponse } from 'msw';
import { server } from '@shared/lib/test/server';

vi.mock('@shared/hooks/usePermission', () => ({
  usePermission: () => true,
}));

const mockWorkOrders = [
  {
    id: 'wo-1',
    name: 'WO-PENDING',
    bom: { name: 'BOM-1' },
    quantity: 100,
    status: 'pending_approval'
  }
];

describe('WorkOrdersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    server.use(
      http.get('*/api/v1/manufacturing/work-order/list/', () => {
        return HttpResponse.json({ results: mockWorkOrders });
      })
    );
  });

  it('renders page and loads WorkOrderList', async () => {
    renderWithProviders(<WorkOrdersPage />);

    // Wait for data to load
    expect(await screen.findByText('WO-PENDING')).toBeInTheDocument();
  });
});

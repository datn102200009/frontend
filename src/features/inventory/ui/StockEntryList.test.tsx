/* eslint-disable @typescript-eslint/no-explicit-any */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StockEntryList } from './StockEntryList';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import { http, HttpResponse } from 'msw';
import { server } from '@shared/lib/test/server';

const mockEntries = [
  { id: '1', name: 'ENTRY-001', purpose: 'receipt', status: 'draft', details: [{ item_id: 'VT001', item_name: 'Item A', uom_name: 'PCS', quantity: 10, source_warehouse_id: null, target_warehouse_id: 'KHO_01' }] },
  { id: '2', name: 'ENTRY-002', purpose: 'issue', status: 'posted', details: [{ item_id: 'VT001', item_name: 'Item B', uom_name: 'KG', quantity: 5, source_warehouse_id: 'KHO_01', target_warehouse_id: null }] },
  { id: '3', name: 'ENTRY-003', purpose: 'issue', status: 'draft', details: [{ item_id: 'VT001', item_name: 'Item C', uom_name: 'PCS', quantity: 100, source_warehouse_id: null, target_warehouse_id: null }] },
];

describe('StockEntryList', () => {
  beforeEach(() => {
    server.use(
      http.get('*/api/v1/inventory/stock-entry/list/', ({ request }) => {
        const url = new URL(request.url);
        const status = url.searchParams.get('status');
        const data = (!status || status === 'all') ? mockEntries : mockEntries.filter(e => e.status === status);
        return HttpResponse.json({ results: data });
      })
    );
  });

  it('renders correctly and loads all entries by default', async () => {
    renderWithProviders(<StockEntryList />);
    
    expect(screen.getByRole('heading', { name: 'Phiếu Kho' })).toBeInTheDocument();
    
    // Default filter is 'all', so we expect both ENTRY-001 and ENTRY-002
    expect(await screen.findByText('ENTRY-001')).toBeInTheDocument();
    expect(screen.getByText('ENTRY-002')).toBeInTheDocument();
  });

  it('switches to posted entries when tab is clicked', async () => {
    renderWithProviders(<StockEntryList />);
    const user = userEvent.setup();

    // Wait for initial load
    await screen.findByText('ENTRY-001');

    const statusSelect = screen.getByRole('combobox', { name: /Lọc trạng thái phiếu kho/i });
    await user.selectOptions(statusSelect, 'posted');

    // Wait for changes
    await waitFor(() => {
      expect(screen.queryByText('ENTRY-001')).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // Expect ENTRY-002 to appear and ENTRY-001 to disappear
    expect(await screen.findByText('ENTRY-002')).toBeInTheDocument();
  });

  it('opens approve modal and approves successfully', async () => {
    let approvedId = '';
    server.use(
      http.post('*/api/v1/inventory/stock-in/:id/approve/', ({ params }) => {
        approvedId = params.id as string;
        return HttpResponse.json({}, { status: 200 });
      })
    );

    renderWithProviders(<StockEntryList />);
    const user = userEvent.setup();

    // Wait for ENTRY-001 (draft)
    await screen.findByText('ENTRY-001');

    // Click Duyệt button
    const row = screen.getByText('ENTRY-001').closest('tr');
    const approveBtn = within(row!).getByRole('button', { name: 'Duyệt' });
    await user.click(approveBtn);

    // Confirm modal opens
    expect(await screen.findByText('Xác Nhận Phê Duyệt')).toBeInTheDocument();

    // Click approve inside modal
    const confirmBtn = screen.getByRole('button', { name: 'Phê duyệt' });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(approvedId).toBe('1');
    });
  });

  it('opens correct create modals', async () => {
    renderWithProviders(<StockEntryList />);
    const user = userEvent.setup();

    // Stock in
    await user.click(screen.getByRole('button', { name: 'Nhập Kho' }));
    expect(await screen.findByRole('heading', { name: 'Tạo Phiếu Nhập Kho' })).toBeInTheDocument();
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Hủy' }));

    // Stock issue
    await user.click(screen.getByRole('button', { name: 'Xuất Kho' }));
    expect(await screen.findByRole('heading', { name: 'Tạo Phiếu Xuất Kho' })).toBeInTheDocument();
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Hủy' }));
  });

  it('allows cancelling (deleting) a draft stock entry', async () => {
    let deletedId = '';
    server.use(
      http.post('*/api/v1/inventory/stock-entry/:id/delete/', ({ params }) => {
        deletedId = params.id as string;
        return HttpResponse.json({}, { status: 204 });
      })
    );

    renderWithProviders(<StockEntryList />);
    const user = userEvent.setup();

    await screen.findByText('ENTRY-001');
    const row = screen.getByText('ENTRY-001').closest('tr');
    const cancelBtn = within(row!).getByRole('button', { name: 'Hủy' });
    await user.click(cancelBtn);

    expect(await screen.findByText('Xác Nhận Hủy Phiếu')).toBeInTheDocument();

    const confirmCancelBtn = screen.getByRole('button', { name: 'Xác nhận Hủy' });
    await user.click(confirmCancelBtn);

    await waitFor(() => {
      expect(deletedId).toBe('1');
    });
  });

  it('opens detail modal', async () => {
    renderWithProviders(<StockEntryList />);
    const user = userEvent.setup();

    expect(await screen.findByText('ENTRY-001')).toBeInTheDocument();

    const detailButtons = screen.getAllByRole('button', { name: /chi tiết/i });
    await user.click(detailButtons[0]);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Chi Tiết Phiếu Kho/i)).toBeInTheDocument();
    expect(screen.getByText('Item A')).toBeInTheDocument();
    expect(screen.getByText('10 PCS')).toBeInTheDocument();
  });

  it('blocks approval of issue entry when warehouse has insufficient stock', async () => {
    server.use(
      http.get('*/api/v1/inventory/stock-ledger/balance/', () => {
        return HttpResponse.json([
          { item_id: 'VT001', total_quantity: 50, warehouse_id: 'KHO_01' }
        ]);
      })
    );

    renderWithProviders(<StockEntryList />);
    const user = userEvent.setup();

    // Find ENTRY-003 row and click Duyệt
    await screen.findByText('ENTRY-003');
    const row = screen.getByText('ENTRY-003').closest('tr');
    const approveBtn = within(row!).getByRole('button', { name: 'Duyệt' });
    await user.click(approveBtn);

    // Confirm modal opens
    expect(await screen.findByText('Xác Nhận Phê Duyệt')).toBeInTheDocument();

    // Select warehouse
    const selectElement = screen.getByRole('combobox', { name: /Kho xuất hàng/i });
    await user.selectOptions(selectElement, 'KHO_01');

    // Wait for stock balance warning
    expect(await screen.findByText(/Thiếu 50/i)).toBeInTheDocument();

    // Approve button should be disabled
    const confirmBtn = screen.getByRole('button', { name: 'Phê duyệt' });
    expect(confirmBtn).toBeDisabled();
  });

  it('allows approval of issue entry when warehouse has sufficient stock', async () => {
    let updatePayload: any = null;
    let approvedId = '';

    server.use(
      http.get('*/api/v1/inventory/stock-ledger/balance/', () => {
        return HttpResponse.json([
          { item_id: 'VT001', total_quantity: 150, warehouse_id: 'KHO_01' }
        ]);
      }),
      http.post('*/api/v1/inventory/stock-entry/:id/update/', async ({ params, request }) => {
        updatePayload = await request.json();
        return HttpResponse.json({ id: params.id }, { status: 200 });
      }),
      http.post('*/api/v1/inventory/stock-issue/:id/approve/', ({ params }) => {
        approvedId = params.id as string;
        return HttpResponse.json({}, { status: 200 });
      })
    );

    renderWithProviders(<StockEntryList />);
    const user = userEvent.setup();

    // Find ENTRY-003 row and click Duyệt
    await screen.findByText('ENTRY-003');
    const row = screen.getByText('ENTRY-003').closest('tr');
    const approveBtn = within(row!).getByRole('button', { name: 'Duyệt' });
    await user.click(approveBtn);

    // Select warehouse
    const selectElement = screen.getByRole('combobox', { name: /Kho xuất hàng/i });
    await user.selectOptions(selectElement, 'KHO_01');

    // Wait for sufficient stock message
    expect(await screen.findByText(/Đủ hàng/i)).toBeInTheDocument();

    // Approve button should be enabled
    const confirmBtn = screen.getByRole('button', { name: 'Phê duyệt' });
    expect(confirmBtn).toBeEnabled();

    // Click Phê duyệt
    await user.click(confirmBtn);

    // Verify both update and approve APIs were called correctly
    await waitFor(() => {
      expect(updatePayload).not.toBeNull();
      expect(updatePayload.details[0].source_warehouse_id).toBe('KHO_01');
      expect(approvedId).toBe('3');
    });
  });
});

import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkOrderList } from './WorkOrderList';
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
  },
  {
    id: 'wo-2',
    name: 'WO-PROGRESS',
    bom: { name: 'BOM-2' },
    quantity: 200,
    produced_qty: 100,
    status: 'in_progress'
  },
  {
    id: 'wo-2-complete',
    name: 'WO-PROGRESS-COMPLETE',
    bom: { name: 'BOM-2' },
    quantity: 200,
    produced_qty: 200,
    status: 'in_progress'
  },
  {
    id: 'wo-3',
    name: 'WO-COMPLETED',
    bom: { name: 'BOM-3' },
    quantity: 300,
    status: 'completed'
  }
];

describe('WorkOrderList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    server.use(
      http.get('*/api/v1/manufacturing/work-order/list/', () => {
        return HttpResponse.json({ results: mockWorkOrders });
      })
    );
    // Mock window.confirm to always return true
    window.confirm = vi.fn().mockReturnValue(true);
  });

  it('renders list with correct status badges', async () => {
    renderWithProviders(<WorkOrderList />);

    // Wait for data to load
    expect(await screen.findByText('WO-PENDING')).toBeInTheDocument();

    expect(screen.getAllByText('Nháp').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Đang sản xuất').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Hoàn tất').length).toBeGreaterThan(0);
  });

  it('handles approve action', async () => {
    renderWithProviders(<WorkOrderList />);
    const user = userEvent.setup();

    expect(await screen.findByText('WO-PENDING')).toBeInTheDocument();

    const approveButton = screen.getByRole('button', { name: /phê duyệt/i });
    await user.click(approveButton);

    const confirmButton = screen.getByRole('button', { name: 'Xác nhận' });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText(/phê duyệt lệnh wo-pending thành công/i)).toBeInTheDocument();
    });
  });

  it('handles declare production action', async () => {
    renderWithProviders(<WorkOrderList />);
    const user = userEvent.setup();

    expect(await screen.findByText('WO-PROGRESS')).toBeInTheDocument();

    const progressRow = screen.getByText('WO-PROGRESS').closest('tr');
    expect(within(progressRow!).queryByRole('button', { name: /hoàn thành/i })).not.toBeInTheDocument();

    const declareButton = within(progressRow!).getByRole('button', { name: /nhập liệu/i });
    await user.click(declareButton);

    // Dialog should open
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(/Mã lệnh:/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/WO-PROGRESS/i)).toBeInTheDocument();

    const input = within(dialog).getByRole('spinbutton');
    await user.type(input, '50');

    const submitBtn = within(dialog).getByRole('button', { name: 'Xác nhận' });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/nhập liệu 50 sản phẩm cho lệnh WO-PROGRESS thành công/i)).toBeInTheDocument();
    });
  });

  it('handles complete action', async () => {
    renderWithProviders(<WorkOrderList />);
    const user = userEvent.setup();

    expect(await screen.findByText('WO-PROGRESS-COMPLETE')).toBeInTheDocument();

    const completeRow = screen.getByText('WO-PROGRESS-COMPLETE').closest('tr');
    expect(within(completeRow!).queryByRole('button', { name: /nhập liệu/i })).not.toBeInTheDocument();

    const completeButton = within(completeRow!).getByRole('button', { name: /hoàn thành/i });
    await user.click(completeButton);

    const confirmButton = screen.getByRole('button', { name: 'Xác nhận' });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText(/hoàn thành lệnh wo-progress-complete thành công/i)).toBeInTheDocument();
    });
  });

  it('handles cancel action', async () => {
    server.use(
      http.delete('*/api/v1/manufacturing/work-order/:id/pending-delete/', () => {
        return HttpResponse.json(null, { status: 204 });
      })
    );

    renderWithProviders(<WorkOrderList />);
    const user = userEvent.setup();

    expect(await screen.findByText('WO-PENDING')).toBeInTheDocument();

    const cancelButton = screen.getByRole('button', { name: /hủy/i });
    await user.click(cancelButton);

    const confirmButton = screen.getByRole('button', { name: 'Xác nhận' });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText(/xóa lệnh wo-pending thành công/i)).toBeInTheDocument();
    });
  });

  it('opens detail modal', async () => {
    renderWithProviders(<WorkOrderList />);
    const user = userEvent.setup();

    expect(await screen.findByText('WO-PENDING')).toBeInTheDocument();

    const detailButtons = screen.getAllByRole('button', { name: /chi tiết/i });
    await user.click(detailButtons[0]);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Chi Tiết Lệnh Sản Xuất/i)).toBeInTheDocument();
  });

  it('automatically opens work order detail modal when id is in search params', async () => {
    renderWithProviders(<WorkOrderList />, {
      initialEntries: ['/work-orders?status=pending_approval&id=wo-1']
    });

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Chi Tiết Lệnh Sản Xuất/i)).toBeInTheDocument();
  });

  it('handles approve failure and displays custom error message', async () => {
    server.use(
      http.post('*/api/v1/manufacturing/work-order/:id/approve/', () => {
        return HttpResponse.json({ error: 'Không đủ tồn kho nguyên liệu' }, { status: 400 });
      })
    );

    renderWithProviders(<WorkOrderList />);
    const user = userEvent.setup();

    expect(await screen.findByText('WO-PENDING')).toBeInTheDocument();

    const approveButton = screen.getByRole('button', { name: /phê duyệt/i });
    await user.click(approveButton);

    const confirmButton = screen.getByRole('button', { name: 'Xác nhận' });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText(/không đủ tồn kho nguyên liệu/i)).toBeInTheDocument();
    });
  });

  it('handles declare production max validation', async () => {
    renderWithProviders(<WorkOrderList />);
    const user = userEvent.setup();

    expect(await screen.findByText('WO-PROGRESS')).toBeInTheDocument();

    const progressRow = screen.getByText('WO-PROGRESS').closest('tr');
    const declareButton = within(progressRow!).getByRole('button', { name: /nhập liệu/i });
    await user.click(declareButton);

    const dialog = screen.getByRole('dialog');
    const input = within(dialog).getByRole('spinbutton');
    
    // Remaining is 200 - 100 = 100. Let's type 150.
    await user.type(input, '150');

    expect(await screen.findByText(/Số lượng vượt quá số còn lại cần sản xuất/i)).toBeInTheDocument();
    
    const submitBtn = within(dialog).getByRole('button', { name: 'Xác nhận' });
    expect(submitBtn).toBeDisabled();
  });

  it('renders material preview table and warning banner in declare modal', async () => {
    server.use(
      http.post('*/api/v1/manufacturing/work-order/:id/declare-preview/', () => {
        return HttpResponse.json({
          results: [
            {
              item_id: 'item-1',
              item_code: 'RES-01',
              item_name: 'Resistor',
              uom: 'Cái',
              required_qty: 10,
              available_qty: 5,
              missing_qty: 5,
              is_sufficient: false,
            },
            {
              item_id: 'item-2',
              item_code: 'CAP-01',
              item_name: 'Capacitor',
              uom: 'Cái',
              required_qty: 20,
              available_qty: 30,
              missing_qty: 0,
              is_sufficient: true,
            }
          ]
        });
      })
    );

    renderWithProviders(<WorkOrderList />);
    const user = userEvent.setup();

    expect(await screen.findByText('WO-PROGRESS')).toBeInTheDocument();

    const progressRow = screen.getByText('WO-PROGRESS').closest('tr');
    const declareButton = within(progressRow!).getByRole('button', { name: /nhập liệu/i });
    await user.click(declareButton);

    const dialog = screen.getByRole('dialog');
    const input = within(dialog).getByRole('spinbutton');
    
    await user.type(input, '50');

    // Wait for debounced preview calling
    expect(await screen.findByText(/Nguyên liệu tại Kho Bán Thành Phẩm cần dùng/i)).toBeInTheDocument();
    expect(screen.getByText(/Có nguyên liệu không đủ tồn kho tại Kho Bán Thành Phẩm/i)).toBeInTheDocument();
    
    // Check table content
    expect(screen.getByText('RES-01')).toBeInTheDocument();
    expect(screen.getByText('CAP-01')).toBeInTheDocument();
  });
});

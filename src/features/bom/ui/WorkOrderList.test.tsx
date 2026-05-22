import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkOrderList } from './WorkOrderList';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import { http, HttpResponse } from 'msw';
import { server } from '@shared/lib/test/server';

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

    expect(screen.getAllByText('Chờ duyệt').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Đang thực hiện').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Hoàn thành').length).toBeGreaterThan(0);
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
    expect(within(dialog).getByText(/nhập số lượng sản phẩm hoàn thành cho lệnh/i)).toBeInTheDocument();

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
    renderWithProviders(<WorkOrderList />);
    const user = userEvent.setup();

    expect(await screen.findByText('WO-PENDING')).toBeInTheDocument();

    const cancelButton = screen.getByRole('button', { name: /hủy/i });
    await user.click(cancelButton);

    const confirmButton = screen.getByRole('button', { name: 'Xác nhận' });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText(/hủy lệnh wo-pending thành công/i)).toBeInTheDocument();
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
});

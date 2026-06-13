import { screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LandedCostPage } from './LandedCostPage';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import { server } from '@shared/lib/test/server';
import { http, HttpResponse } from 'msw';

describe('LandedCostPage - Centralized Shipment Workflow', () => {
  const mockWarehouses = [
    { id: 'WH01', name: 'Kho Nguyên Liệu A' },
    { id: 'WH02', name: 'Kho Thành Phẩm B' }
  ];

  const mockPurchaseOrders = [
    {
      id: 'PO-001',
      vendor_name: 'Tech Component Supplier',
      status: 'pending',
      total_amount: 5000000,
      lines: [
        {
          id: 'POL-001',
          item_id: 'ITEM-001',
          item_code: 'BONG_DEN',
          item_name: 'Bóng đèn halogen',
          quantity: 100,
          unit: 'Cái',
          unit_price: 50000
        }
      ]
    }
  ];

  const mockShipments = [
    {
      id: 'SHIP-001',
      shipment_num: 'LH-20260604-001',
      name: 'Lô hàng Tech Component - 04/06/2026',
      status: 'draft',
      remarks: 'Lô hàng thử nghiệm',
      total_logistic_fees: 0,
      purchase_order: 'PO-001',
      purchase_order_lines: [
        {
          id: 'POL-001',
          item_id: 'ITEM-001',
          item_code: 'BONG_DEN',
          item_name: 'Bóng đèn halogen',
          quantity: 100,
          unit: 'Cái'
        }
      ],
      stock_entries: [],
      stock_entries_details: []
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    server.use(
      http.get('*/api/v1/purchasing/orders/*', () => {
        return HttpResponse.json(mockPurchaseOrders);
      }),
      http.get('*/api/v1/master-data/warehouses/*', () => {
        return HttpResponse.json(mockWarehouses);
      }),
      http.get('*/api/v1/purchasing/shipments/*', () => {
        return HttpResponse.json(mockShipments);
      })
    );
  });

  it('renders shipments list and detail placeholders correctly', async () => {
    renderWithProviders(<LandedCostPage />);

    expect(await screen.findByText('LH-20260604-001')).toBeInTheDocument();
    expect(screen.getByText('Chọn một lô hàng để làm việc')).toBeInTheDocument();
  });

  it('automatically selects shipment when id query param is present in URL', async () => {
    renderWithProviders(<LandedCostPage />, {
      initialEntries: ['/purchasing?tab=shipment&id=SHIP-001']
    });

    expect(await screen.findByText('Mã lô hàng: LH-20260604-001')).toBeInTheDocument();
  });

  it('handles state transitions: Draft state (allows confirming arrival)', async () => {
    renderWithProviders(<LandedCostPage />);

    const user = userEvent.setup();
    const card = await screen.findByText('LH-20260604-001');
    await user.click(card);

    expect(await screen.findByText('Mã lô hàng: LH-20260604-001')).toBeInTheDocument();
    
    // Draft state: Show Confirm Arrival transition button
    expect(screen.getByRole('button', { name: /Xác nhận hàng về \(Bắt đầu tiếp nhận\)/i })).toBeInTheDocument();
  });

  it('handles state transitions: Inspecting state (shows complete button and allows opening complete modal)', async () => {
    const inspectingShipment = {
      ...mockShipments[0],
      status: 'inspecting'
    };

    server.use(
      http.get('*/api/v1/purchasing/shipments/*', () => {
        return HttpResponse.json([inspectingShipment]);
      })
    );

    renderWithProviders(<LandedCostPage />);

    const user = userEvent.setup();
    const card = await screen.findByText('LH-20260604-001');
    await user.click(card);

    expect(await screen.findByText('Mã lô hàng: LH-20260604-001')).toBeInTheDocument();
    
    // Inspecting state: Show complete button
    const completeBtn = screen.getByRole('button', { name: /Xác Nhận Hoàn Tất/i });
    expect(completeBtn).toBeInTheDocument();

    // Select warehouse inline to pass validation
    const select = await screen.findByRole('combobox');
    await user.selectOptions(select, 'WH01');

    // Click complete button opens modal
    await user.click(completeBtn);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Tiếp Nhận & Hoàn Tất Lô Hàng')).toBeInTheDocument();
  });

  it('validates warehouse required when quantity > 0 (triggers inline validation)', async () => {
    const inspectingShipment = {
      ...mockShipments[0],
      status: 'inspecting'
    };

    server.use(
      http.get('*/api/v1/purchasing/shipments/*', () => {
        return HttpResponse.json([inspectingShipment]);
      })
    );

    renderWithProviders(<LandedCostPage />);

    const user = userEvent.setup();
    const card = await screen.findByText('LH-20260604-001');
    await user.click(card);

    const completeBtn = screen.getByRole('button', { name: /Xác Nhận Hoàn Tất/i });
    await user.click(completeBtn);

    // Should display validation error on the main page because warehouse is empty and quantity > 0
    expect(await screen.findByText('Bắt buộc chọn kho khi số lượng nhận lớn hơn 0')).toBeInTheDocument();
  });

  it('successfully completes shipment when valid inputs are provided', async () => {
    const inspectingShipment = {
      ...mockShipments[0],
      status: 'inspecting'
    };

    let completePayload: any = null;
    server.use(
      http.get('*/api/v1/purchasing/shipments/*', () => {
        return HttpResponse.json([inspectingShipment]);
      }),
      http.post('*/api/v1/purchasing/shipments/:pk/complete/', async ({ request }) => {
        completePayload = await request.json();
        return HttpResponse.json({ ...inspectingShipment, status: 'completed' });
      })
    );

    renderWithProviders(<LandedCostPage />);

    const user = userEvent.setup();
    const card = await screen.findByText('LH-20260604-001');
    await user.click(card);

    // Select warehouse inline (main page)
    const select = await screen.findByRole('combobox');
    await user.selectOptions(select, 'WH01');

    // Click "Xác Nhận Hoàn Tất" on main page
    const completeBtn = screen.getByRole('button', { name: /Xác Nhận Hoàn Tất/i });
    await user.click(completeBtn);

    // Modal opens
    const modal = screen.getByRole('dialog');
    
    // Click submit in modal
    const submitBtn = within(modal).getByRole('button', { name: /Xác nhận Hoàn Tất/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(completePayload).not.toBeNull();
    });

    expect(completePayload.total_logistic_fees).toBe(0);
    expect(completePayload.details[0].quantity).toBe(100);
    expect(completePayload.details[0].target_warehouse_id).toBe('WH01');
  });
});

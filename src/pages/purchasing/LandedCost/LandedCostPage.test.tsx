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
          remaining_quantity: 100,
          received_quantity: 0,
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

  describe('Confirm zero-all Modal', () => {
    it('opens confirm modal when all quantities are 0', async () => {
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

      // Set quantity to 0 in input field
      const qtyInput = document.querySelector('input[name="details.0.quantity"]') as HTMLInputElement;
      await user.clear(qtyInput);
      await user.type(qtyInput, '0');

      // Click complete button opens modal
      const completeBtn = screen.getByRole('button', { name: /Xác Nhận Hoàn Tất/i });
      await user.click(completeBtn);

      const modal = screen.getByRole('dialog', { name: 'Tiếp Nhận & Hoàn Tất Lô Hàng' });
      expect(modal).toBeInTheDocument();

      // Click submit in modal
      const submitBtn = within(modal).getByRole('button', { name: /Xác nhận Hoàn Tất/i });
      await user.click(submitBtn);

      // Confirm modal should open
      const confirmDialog = await screen.findByRole('dialog', { name: 'Xác nhận từ chối nhận toàn bộ' });
      expect(confirmDialog).toBeInTheDocument();
      expect(within(confirmDialog).getByText(/Hệ thống sẽ ghi nhận lô hàng này là/i)).toBeInTheDocument();
    });

    it('does not call completeShipment when user cancels confirm modal', async () => {
      const inspectingShipment = {
        ...mockShipments[0],
        status: 'inspecting'
      };

      let completeCalled = false;
      server.use(
        http.get('*/api/v1/purchasing/shipments/*', () => {
          return HttpResponse.json([inspectingShipment]);
        }),
        http.post('*/api/v1/purchasing/shipments/:pk/complete/', () => {
          completeCalled = true;
          return HttpResponse.json({ ...inspectingShipment, status: 'completed' });
        })
      );

      renderWithProviders(<LandedCostPage />);

      const user = userEvent.setup();
      const card = await screen.findByText('LH-20260604-001');
      await user.click(card);

      const qtyInput = document.querySelector('input[name="details.0.quantity"]') as HTMLInputElement;
      await user.clear(qtyInput);
      await user.type(qtyInput, '0');

      const completeBtn = screen.getByRole('button', { name: /Xác Nhận Hoàn Tất/i });
      await user.click(completeBtn);

      const modal = screen.getByRole('dialog', { name: 'Tiếp Nhận & Hoàn Tất Lô Hàng' });
      const submitBtn = within(modal).getByRole('button', { name: /Xác nhận Hoàn Tất/i });
      await user.click(submitBtn);

      const confirmDialog = await screen.findByRole('dialog', { name: 'Xác nhận từ chối nhận toàn bộ' });
      const cancelBtn = within(confirmDialog).getByRole('button', { name: /Hủy bỏ/i });
      await user.click(cancelBtn);

      // Confirm modal should close
      expect(confirmDialog).not.toBeInTheDocument();
      expect(completeCalled).toBe(false);
    });

    it('calls completeShipment when user confirms', async () => {
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

      const qtyInput = document.querySelector('input[name="details.0.quantity"]') as HTMLInputElement;
      await user.clear(qtyInput);
      await user.type(qtyInput, '0');

      const completeBtn = screen.getByRole('button', { name: /Xác Nhận Hoàn Tất/i });
      await user.click(completeBtn);

      const modal = screen.getByRole('dialog', { name: 'Tiếp Nhận & Hoàn Tất Lô Hàng' });
      const submitBtn = within(modal).getByRole('button', { name: /Xác nhận Hoàn Tất/i });
      await user.click(submitBtn);

      const confirmDialog = await screen.findByRole('dialog', { name: 'Xác nhận từ chối nhận toàn bộ' });
      const confirmBtn = within(confirmDialog).getByRole('button', { name: /Xác nhận từ chối/i });
      await user.click(confirmBtn);

      await waitFor(() => {
        expect(completePayload).not.toBeNull();
      });

      expect(completePayload.details[0].quantity).toBe(0);
      expect(completePayload.details[0].target_warehouse_id).toBeNull();
    });
  });

  describe('Enforce remaining quantities and shipping cost fixes', () => {
    it('hiển thị SL Có Thể Nhập = 200 + cột phụ "Đã nhận trước" = 400 khi PO đã có shipment trước nhập 400/600', async () => {
      const shipment2 = {
        id: 'SHIP-002',
        shipment_num: 'LH-002',
        name: 'Lô 2',
        status: 'inspecting',
        purchase_order: 'PO-001',
        remarks: '',
        total_logistic_fees: 0,
        purchase_order_lines: [{
          id: 'POL-001',
          item_id: 'ITEM-001',
          item_code: 'BONG_DEN',
          item_name: 'Bóng đèn halogen',
          quantity: 600,
          remaining_quantity: 200,
          received_quantity: 400,
          unit: 'Cái'
        }],
        stock_entries: [],
        stock_entries_details: []
      };

      server.use(
        http.get('*/api/v1/purchasing/shipments/*', () => {
          return HttpResponse.json([shipment2]);
        })
      );

      renderWithProviders(<LandedCostPage />);

      const user = userEvent.setup();
      const card = await screen.findByText('LH-002');
      await user.click(card);

      // SL Có Thể Nhập column showing remaining quantity
      expect(screen.getByText('200 Cái')).toBeInTheDocument();
      // Đã nhận trước column showing already received quantity
      expect(screen.getByText('400 Cái')).toBeInTheDocument();
    });

    it('ẩn cột "Đã nhận trước" khi received_quantity = 0 (lô đầu tiên)', async () => {
      const firstShipment = {
        id: 'SHIP-001',
        shipment_num: 'LH-001',
        name: 'Lô 1',
        status: 'inspecting',
        purchase_order: 'PO-001',
        remarks: '',
        total_logistic_fees: 0,
        purchase_order_lines: [{
          id: 'POL-001',
          item_id: 'ITEM-001',
          item_code: 'BONG_DEN',
          item_name: 'Bóng đèn halogen',
          quantity: 600,
          remaining_quantity: 600,
          received_quantity: 0,
          unit: 'Cái'
        }],
        stock_entries: [],
        stock_entries_details: []
      };

      server.use(
        http.get('*/api/v1/purchasing/shipments/*', () => {
          return HttpResponse.json([firstShipment]);
        })
      );

      renderWithProviders(<LandedCostPage />);

      const user = userEvent.setup();
      const card = await screen.findByText('LH-001');
      await user.click(card);

      // --- placeholder should be shown instead of received_quantity badge since received_quantity is 0
      expect(screen.getByText('---')).toBeInTheDocument();
    });

    it('Modal hoàn tất hiển thị chi phí vận chuyển dạng plain text', async () => {
      const inspectingShipment = {
        id: 'SHIP-001',
        shipment_num: 'LH-001',
        name: 'Lô 1',
        status: 'inspecting',
        purchase_order: 'PO-001',
        remarks: '',
        total_logistic_fees: 0,
        purchase_order_lines: [{
          id: 'POL-001',
          item_id: 'ITEM-001',
          item_code: 'BONG_DEN',
          item_name: 'Bóng đèn halogen',
          quantity: 100,
          remaining_quantity: 100,
          received_quantity: 0,
          unit: 'Cái'
        }],
        stock_entries: [],
        stock_entries_details: []
      };

      server.use(
        http.get('*/api/v1/purchasing/shipments/*', () => {
          return HttpResponse.json([inspectingShipment]);
        })
      );

      renderWithProviders(<LandedCostPage />);

      const user = userEvent.setup();
      const card = await screen.findByText('LH-001');
      await user.click(card);

      // Enter logistic fees on the main page
      const feeInput = screen.getByPlaceholderText('Nhập chi phí vận chuyển ước tính...');
      await user.clear(feeInput);
      await user.type(feeInput, '500000');

      // Select warehouse inline
      const select = await screen.findByRole('combobox');
      await user.selectOptions(select, 'WH01');

      // Click "Xác Nhận Hoàn Tất" on main page
      const completeBtn = screen.getByRole('button', { name: /Xác Nhận Hoàn Tất/i });
      await user.click(completeBtn);

      // Modal opens
      const modal = screen.getByRole('dialog', { name: 'Tiếp Nhận & Hoàn Tất Lô Hàng' });
      
      // The shipping cost input should not be editable input number, instead it should render formatted text 500.000 ₫
      expect(within(modal).queryByRole('spinbutton', { name: /Chi phí vận chuyển thực tế/i })).toBeNull();
      expect(within(modal).getByText(/500.000/)).toBeInTheDocument();
    });

    it('validate không cho nhập vượt remaining_quantity (200) ở frontend', async () => {
      const shipment2 = {
        id: 'SHIP-002',
        shipment_num: 'LH-002',
        name: 'Lô 2',
        status: 'inspecting',
        purchase_order: 'PO-001',
        remarks: '',
        total_logistic_fees: 0,
        purchase_order_lines: [{
          id: 'POL-001',
          item_id: 'ITEM-001',
          item_code: 'BONG_DEN',
          item_name: 'Bóng đèn halogen',
          quantity: 600,
          remaining_quantity: 200,
          received_quantity: 400,
          unit: 'Cái'
        }],
        stock_entries: [],
        stock_entries_details: []
      };

      server.use(
        http.get('*/api/v1/purchasing/shipments/*', () => {
          return HttpResponse.json([shipment2]);
        })
      );

      renderWithProviders(<LandedCostPage />);

      const user = userEvent.setup();
      const card = await screen.findByText('LH-002');
      await user.click(card);

      // Type 250 in the input quantity (exceeds remaining_quantity 200)
      const qtyInput = document.querySelector('input[name="details.0.quantity"]') as HTMLInputElement;
      await user.clear(qtyInput);
      await user.type(qtyInput, '250');

      const completeBtn = screen.getByRole('button', { name: /Xác Nhận Hoàn Tất/i });
      await user.click(completeBtn);

      // Inline validation error should trigger
      expect(await screen.findByText('Số lượng nhận không được vượt quá số lượng còn lại')).toBeInTheDocument();
    });
  });
});

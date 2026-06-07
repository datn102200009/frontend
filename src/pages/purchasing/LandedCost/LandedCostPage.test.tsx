import { screen } from '@testing-library/react';
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

  const mockStockEntriesResponse = {
    results: [
      {
        id: 'SE-001',
        name: 'PX001',
        purpose: 'receipt',
        posting_date: '2026-06-04T12:00:00Z',
        vendor_name: 'Tech Component Supplier',
        status: 'draft'
      }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    server.use(
      http.get('*/api/v1/inventory/stock-entry/list/*', () => {
        return HttpResponse.json(mockStockEntriesResponse);
      }),
      http.get('*/api/v1/master-data/warehouses/*', () => {
        return HttpResponse.json(mockWarehouses);
      })
    );
  });

  const mockShipments = [
    {
      id: 'SHIP-001',
      shipment_num: 'LH-20260604-001',
      name: 'Lô hàng Tech Component - 04/06/2026',
      status: 'draft',
      remarks: 'Lô hàng thử nghiệm',
      total_logistic_fees: 0,
      stock_entries: [
        { id: 'SE-001', name: 'PX001', status: 'draft' }
      ],
      stock_entries_details: [
        {
          id: 'SED-001',
          stock_entry_id: 'SE-001',
          stock_entry_name: 'PX001',
          stock_entry_status: 'draft',
          item_id: 'ITEM-001',
          item_code: 'BONG_DEN',
          item_name: 'Bóng đèn halogen',
          quantity: 100,
          target_warehouse_id: null,
          target_warehouse_name: null,
          qc_status: 'PENDING',
          latest_cert: null
        }
      ]
    }
  ];

  const setupDefaultMocks = () => {
    server.use(
      http.get('*/api/v1/purchasing/shipments/', () => {
        return HttpResponse.json(mockShipments);
      })
    );
  };

  it('renders shipments list and detail placeholders correctly', async () => {
    setupDefaultMocks();
    renderWithProviders(<LandedCostPage />);

    expect(await screen.findByText('LH-20260604-001')).toBeInTheDocument();
    expect(screen.getByText('Chọn một lô hàng để làm việc')).toBeInTheDocument();
  });

  it('automatically selects shipment when id query param is present in URL', async () => {
    setupDefaultMocks();
    renderWithProviders(<LandedCostPage />, {
      initialEntries: ['/purchasing?tab=shipment&id=SHIP-001']
    });

    expect(await screen.findByText('Mã lô hàng: LH-20260604-001')).toBeInTheDocument();
  });

  it('handles state transitions: Draft state (inputs and QC button are locked)', async () => {
    setupDefaultMocks();
    renderWithProviders(<LandedCostPage />);

    const user = userEvent.setup();
    const card = await screen.findByText('LH-20260604-001');
    await user.click(card);

    expect(await screen.findByText('Mã lô hàng: LH-20260604-001')).toBeInTheDocument();
    
    // Draft state: Show Arrived transition button
    expect(screen.getByRole('button', { name: /Xác nhận hàng về \(Arrived\)/i })).toBeInTheDocument();

    // QC action is locked (showing label instead of button)
    expect(screen.getByText('Chờ hàng đến')).toBeInTheDocument();

    // Storekeeper controls are read-only (displays static warehouse name/placeholder instead of select)
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('handles state transitions: Arrived state (QC action is open, storekeeper controls locked)', async () => {
    const arrivedShipment = {
      ...mockShipments[0],
      status: 'arrived'
    };

    server.use(
      http.get('*/api/v1/purchasing/shipments/', () => {
        return HttpResponse.json([arrivedShipment]);
      })
    );

    renderWithProviders(<LandedCostPage />);

    const user = userEvent.setup();
    const card = await screen.findByText('LH-20260604-001');
    await user.click(card);

    expect(await screen.findByText('Mã lô hàng: LH-20260604-001')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Hoàn tất Kiểm định QC/i })).toBeInTheDocument();

    // QC action button is active
    const qcBtn = screen.getByRole('button', { name: /Đánh giá QC/i });
    expect(qcBtn).toBeInTheDocument();

    // Storekeeper controls are still locked
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('handles state transitions: Inspected state (QC is locked, storekeeper input is open for PASSED, locked for FAILED)', async () => {
    const inspectedShipment = {
      ...mockShipments[0],
      status: 'inspected',
      stock_entries_details: [
        {
          ...mockShipments[0].stock_entries_details[0],
          id: 'SED-001',
          item_code: 'PASSED-001',
          item_name: 'Bóng đèn PASSED',
          qc_status: 'PASSED'
        },
        {
          ...mockShipments[0].stock_entries_details[0],
          id: 'SED-002',
          item_code: 'FAILED-002',
          item_name: 'Bóng đèn FAILED',
          qc_status: 'FAILED'
        }
      ]
    };

    server.use(
      http.get('*/api/v1/purchasing/shipments/', () => {
        return HttpResponse.json([inspectedShipment]);
      }),
      http.get('*/api/v1/master-data/warehouses/', () => {
        return HttpResponse.json(mockWarehouses);
      })
    );

    renderWithProviders(<LandedCostPage />);

    const user = userEvent.setup();
    const card = await screen.findByText('LH-20260604-001');
    await user.click(card);

    expect(await screen.findByText('Mã lô hàng: LH-20260604-001')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Nhập chi phí vận chuyển/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Xác nhận nhận hàng & Hoàn tất Lô hàng/i })).toBeInTheDocument();

    // QC button is locked (displays "Đã khóa QC")
    expect(screen.getAllByText('Đã khóa QC').length).toBe(2);

    // PASSED item allows warehouse assignment and quantity update
    const whSelect = screen.getByRole('combobox');
    expect(whSelect).toBeInTheDocument();
    expect(whSelect).toHaveValue('');

    const spinbuttons = screen.getAllByRole('spinbutton');
    const feeInput = spinbuttons[0];
    expect(feeInput).toHaveValue(0);

    const qtyInput = spinbuttons[1];
    expect(qtyInput).toHaveValue(100);

    // FAILED item displays "Từ chối nhận" and quantity is read-only (not a spinbutton input)
    expect(screen.getByText('Từ chối nhận')).toBeInTheDocument();
    expect(screen.getByText('Bị loại bỏ (QC Hỏng)')).toBeInTheDocument();
  });
});

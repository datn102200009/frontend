import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PurchaseOrderFormModal } from './PurchaseOrderFormModal';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import { server } from '@shared/lib/test/server';
import { http, HttpResponse } from 'msw';

describe('PurchaseOrderFormModal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders create form correctly', async () => {
    renderWithProviders(<PurchaseOrderFormModal {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'Thêm Đơn Mua Hàng Mới' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /^Nhà Cung Cấp/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tạo Đơn Hàng' })).toBeInTheDocument();
  });

  it('validates required fields on submit with empty lines', async () => {
    renderWithProviders(<PurchaseOrderFormModal {...defaultProps} />);
    const user = userEvent.setup();
    
    // Wait for suppliers to load
    await waitFor(() => {
      expect(screen.queryByRole('option', { name: /Tech Component/i })).toBeInTheDocument();
    });
    
    // Default value is set, but let's clear a required number input
    const quantityInput = screen.getAllByRole('spinbutton')[0];
    await user.clear(quantityInput);
    
    await user.click(screen.getByRole('button', { name: 'Tạo Đơn Hàng' }));
    
    // We should expect an error or the onSuccess NOT to be called immediately
    // Wait for the UI to update, if any validation message appears.
    // React Hook Form will focus the empty field if it's required.
    expect(defaultProps.onSuccess).not.toHaveBeenCalled();
  });

  it('adds and removes item lines', async () => {
    renderWithProviders(<PurchaseOrderFormModal {...defaultProps} />);
    const user = userEvent.setup();
    
    // Default has 1 item row
    let removeBtns = screen.getAllByRole('button', { name: 'Xóa linh kiện' });
    expect(removeBtns).toHaveLength(1);
    expect(removeBtns[0]).toBeDisabled(); // Disabled when only 1 item
    
    // Add item
    await user.click(screen.getByRole('button', { name: 'Thêm' }));
    removeBtns = screen.getAllByRole('button', { name: 'Xóa linh kiện' });
    expect(removeBtns).toHaveLength(2);
    expect(removeBtns[0]).not.toBeDisabled();
    
    // Remove item
    await user.click(removeBtns[1]);
    expect(screen.getAllByRole('button', { name: 'Xóa linh kiện' })).toHaveLength(1);
  });

  it('submits valid new purchase order successfully', async () => {
    renderWithProviders(<PurchaseOrderFormModal {...defaultProps} />);
    const user = userEvent.setup();
    
    // Wait for suppliers to load
    await waitFor(() => {
      expect(screen.queryByRole('option', { name: /Tech Component/i })).toBeInTheDocument();
    });
    
    // Select vendor
    const vendorSelect = screen.getByRole('combobox', { name: /^Nhà Cung Cấp/i });
    await user.selectOptions(vendorSelect, '33333333-3333-3333-3333-333333333333');
    
    const quantityInput = screen.getAllByRole('spinbutton')[0]; // First number input is quantity
    await user.clear(quantityInput);
    await user.type(quantityInput, '5');
    
    await user.click(screen.getByRole('button', { name: 'Tạo Đơn Hàng' }));
    
    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    }, { timeout: 2000 }); // Wait for the 800ms mock delay
  });

  it('renders deposit input enabled in Draft state', async () => {
    server.use(
      http.get('*/api/v1/purchasing/orders/PO-DRAFT/', () => {
        return HttpResponse.json({
          id: 'PO-DRAFT',
          vendor: '33333333-3333-3333-3333-333333333333',
          vendor_name: 'Tech Component Inc',
          status: 'draft',
          advance_paid_amount: '1000000.00',
          lines: [
            { id: '1', item: 'VT001', item_name: 'Vật tư 1', item_code: 'VT001', quantity: 5, unit_price: 2000000 }
          ]
        });
      })
    );

    renderWithProviders(<PurchaseOrderFormModal {...defaultProps} orderId="PO-DRAFT" />);
    const depositInput = await screen.findByLabelText(/Số tiền đặt cọc/i);
    expect(depositInput).toBeInTheDocument();
    expect(depositInput).toBeEnabled();
    expect(depositInput).toHaveValue(1000000);
  });

  it('disables deposit input in Pending state', async () => {
    server.use(
      http.get('*/api/v1/purchasing/orders/PO-PENDING/', () => {
        return HttpResponse.json({
          id: 'PO-PENDING',
          vendor: '33333333-3333-3333-3333-333333333333',
          vendor_name: 'Tech Component Inc',
          status: 'pending',
          advance_paid_amount: '1000000.00',
          lines: [
            { id: '1', item: 'VT001', item_name: 'Vật tư 1', item_code: 'VT001', quantity: 5, unit_price: 2000000 }
          ]
        });
      })
    );

    renderWithProviders(<PurchaseOrderFormModal {...defaultProps} orderId="PO-PENDING" />);
    
    // Deposit input should not be in the document
    expect(screen.queryByRole('spinbutton', { name: /Số tiền đặt cọc/i })).not.toBeInTheDocument();
    
    // Check that the formatted deposit value is displayed as static text
    expect(await screen.findByText(/1\.000\.000/)).toBeInTheDocument();
  });

  it('renders Cancel Order button when user has purchasing.cancel_order permission', async () => {
    server.use(
      http.get('*/api/v1/purchasing/orders/PO-PENDING/', () => {
        return HttpResponse.json({
          id: 'PO-PENDING',
          vendor: '33333333-3333-3333-3333-333333333333',
          vendor_name: 'Tech Component Inc',
          status: 'pending',
          advance_paid_amount: '1000000.00',
          lines: [
            { id: '1', item: 'VT001', item_name: 'Vật tư 1', item_code: 'VT001', quantity: 5, unit_price: 2000000 }
          ]
        });
      })
    );

    const preloadedState = {
      auth: {
        user: {
          id: '1',
          username: 'admin',
          full_name: 'Admin User',
          role: 'admin' as const,
          permissions: ['purchasing.cancel_order'],
        },
        token: 'test_token',
        isAuthenticated: true,
      },
    };

    renderWithProviders(
      <PurchaseOrderFormModal {...defaultProps} orderId="PO-PENDING" />,
      { preloadedState }
    );

    const cancelBtn = await screen.findByRole('button', { name: /Hủy Đơn/i });
    expect(cancelBtn).toBeInTheDocument();
  });

  it('does not render Cancel Order button when user lacks permission', async () => {
    server.use(
      http.get('*/api/v1/purchasing/orders/PO-PENDING/', () => {
        return HttpResponse.json({
          id: 'PO-PENDING',
          vendor: '33333333-3333-3333-3333-333333333333',
          vendor_name: 'Tech Component Inc',
          status: 'pending',
          advance_paid_amount: '1000000.00',
          lines: [
            { id: '1', item: 'VT001', item_name: 'Vật tư 1', item_code: 'VT001', quantity: 5, unit_price: 2000000 }
          ]
        });
      })
    );

    const preloadedState = {
      auth: {
        user: {
          id: '1',
          username: 'staff',
          full_name: 'Staff User',
          role: 'staff' as const,
          permissions: [],
        },
        token: 'test_token',
        isAuthenticated: true,
      },
    };

    renderWithProviders(
      <PurchaseOrderFormModal {...defaultProps} orderId="PO-PENDING" />,
      { preloadedState }
    );

    // Wait for the modal contents to render by checking static vendor
    await screen.findByTestId('static-vendor');
    expect(screen.queryByRole('button', { name: /Hủy Đơn/i })).not.toBeInTheDocument();
  });

  it('does not render Cancel Order button when order is completed', async () => {
    server.use(
      http.get('*/api/v1/purchasing/orders/PO-COMPLETED/', () => {
        return HttpResponse.json({
          id: 'PO-COMPLETED',
          vendor: '33333333-3333-3333-3333-333333333333',
          vendor_name: 'Tech Component Inc',
          status: 'completed',
          advance_paid_amount: '1000000.00',
          lines: [
            { id: '1', item: 'VT001', item_name: 'Vật tư 1', item_code: 'VT001', quantity: 5, unit_price: 2000000 }
          ]
        });
      })
    );

    const preloadedState = {
      auth: {
        user: {
          id: '1',
          username: 'admin',
          full_name: 'Admin User',
          role: 'admin' as const,
          permissions: ['purchasing.cancel_order'],
        },
        token: 'test_token',
        isAuthenticated: true,
      },
    };

    renderWithProviders(
      <PurchaseOrderFormModal {...defaultProps} orderId="PO-COMPLETED" />,
      { preloadedState }
    );

    // Wait for the modal contents to render by checking static vendor
    await screen.findByTestId('static-vendor');
    expect(screen.queryByRole('button', { name: /Hủy Đơn/i })).not.toBeInTheDocument();
  });

  it('handles cancellation flow when no goods received but deposit exists', async () => {
    let cancelPayload: unknown = null;
    server.use(
      http.get('*/api/v1/purchasing/orders/PO-PENDING-DEPOSIT/', () => {
        return HttpResponse.json({
          id: 'PO-PENDING-DEPOSIT',
          vendor: '33333333-3333-3333-3333-333333333333',
          vendor_name: 'Tech Component Inc',
          status: 'pending',
          advance_paid_amount: '1000000.00',
          lines: [
            { id: '1', item: 'VT001', item_name: 'Vật tư 1', item_code: 'VT001', quantity: 5, unit_price: 2000000 }
          ],
          stock_entries: []
        });
      }),
      http.post('*/api/v1/purchasing/orders/PO-PENDING-DEPOSIT/cancel/', async ({ request }) => {
        cancelPayload = await request.json();
        return HttpResponse.json({ status: 'success' });
      })
    );

    const preloadedState = {
      auth: {
        user: {
          id: '1',
          username: 'admin',
          full_name: 'Admin User',
          role: 'admin' as const,
          permissions: ['purchasing.cancel_order'],
        },
        token: 'test_token',
        isAuthenticated: true,
      },
    };

    renderWithProviders(
      <PurchaseOrderFormModal {...defaultProps} orderId="PO-PENDING-DEPOSIT" />,
      { preloadedState }
    );

    const user = userEvent.setup();

    // Open cancellation modal
    const cancelBtn = await screen.findByRole('button', { name: /Hủy Đơn/i });
    await user.click(cancelBtn);

    expect(screen.getByRole('heading', { name: 'Xác Nhận Hủy Đơn Mua Hàng' })).toBeInTheDocument();
    
    // Checkbox refund_deposit is shown and is checked by default
    const refundCheckbox = screen.getByRole('checkbox', { name: /Nhận lại tiền đặt cọc/i });
    expect(refundCheckbox).toBeChecked();
    expect(screen.queryByText(/⚠️ Cảnh báo: Tiền cọc sẽ không được hoàn lại/i)).not.toBeInTheDocument();

    // Uncheck to see warning
    await user.click(refundCheckbox);
    expect(refundCheckbox).not.toBeChecked();
    expect(screen.getByText(/⚠️ Cảnh báo: Tiền cọc sẽ không được hoàn lại/i)).toBeInTheDocument();

    // Recheck and submit
    await user.click(refundCheckbox);
    await user.click(screen.getByRole('button', { name: 'Xác nhận hủy' }));

    await waitFor(() => {
      expect(cancelPayload).toEqual({
        refund_deposit: true,
        keep_goods: true
      });
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });

  it('handles cancellation flow when goods are received', async () => {
    let cancelPayload: unknown = null;
    server.use(
      http.get('*/api/v1/purchasing/orders/PO-SHIPPED/', () => {
        return HttpResponse.json({
          id: 'PO-SHIPPED',
          vendor: '33333333-3333-3333-3333-333333333333',
          vendor_name: 'Tech Component Inc',
          status: 'pending',
          advance_paid_amount: '1000000.00',
          lines: [
            { id: '1', item: 'VT001', item_name: 'Vật tư 1', item_code: 'VT001', quantity: 5, unit_price: 2000000 }
          ],
          stock_entries: [
            { id: 'SE-001', name: 'IN-001', status: 'posted', purpose: 'receipt' }
          ]
        });
      }),
      http.post('*/api/v1/purchasing/orders/PO-SHIPPED/cancel/', async ({ request }) => {
        cancelPayload = await request.json();
        return HttpResponse.json({ status: 'success' });
      })
    );

    const preloadedState = {
      auth: {
        user: {
          id: '1',
          username: 'admin',
          full_name: 'Admin User',
          role: 'admin' as const,
          permissions: ['purchasing.cancel_order'],
        },
        token: 'test_token',
        isAuthenticated: true,
      },
    };

    renderWithProviders(
      <PurchaseOrderFormModal {...defaultProps} orderId="PO-SHIPPED" />,
      { preloadedState }
    );

    const user = userEvent.setup();

    // Open cancellation modal
    const cancelBtn = await screen.findByRole('button', { name: /Hủy Đơn/i });
    await user.click(cancelBtn);

    expect(screen.getByRole('heading', { name: 'Xác Nhận Hủy Đơn Mua Hàng' })).toBeInTheDocument();
    
    // Checkbox keep_goods is shown and checked by default
    const keepGoodsCheckbox = screen.getByRole('checkbox', { name: /Giữ lại phần hàng đã nhận/i });
    expect(keepGoodsCheckbox).toBeChecked();
    expect(screen.queryByText(/🚨 Cảnh báo: Trả hàng toàn bộ!/i)).not.toBeInTheDocument();

    // Uncheck to see warning
    await user.click(keepGoodsCheckbox);
    expect(keepGoodsCheckbox).not.toBeChecked();
    expect(screen.getByText(/🚨 Cảnh báo: Trả hàng toàn bộ!/i)).toBeInTheDocument();

    // Recheck and submit
    await user.click(keepGoodsCheckbox);
    await user.click(screen.getByRole('button', { name: 'Xác nhận hủy' }));

    await waitFor(() => {
      expect(cancelPayload).toEqual({
        refund_deposit: true,
        keep_goods: true
      });
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });
});

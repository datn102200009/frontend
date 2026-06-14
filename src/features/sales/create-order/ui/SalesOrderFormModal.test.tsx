import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SalesOrderFormModal } from './SalesOrderFormModal';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import { server } from '@shared/lib/test/server';
import { http, HttpResponse } from 'msw';

describe('SalesOrderFormModal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders create form correctly', async () => {
    renderWithProviders(<SalesOrderFormModal {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'Thêm Đơn Bán Hàng Mới' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /^Khách Hàng/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tạo Đơn Hàng' })).toBeInTheDocument();
  });

  it('adds and removes item lines', async () => {
    renderWithProviders(<SalesOrderFormModal {...defaultProps} />);
    const user = userEvent.setup();
    
    // Default has 1 item row
    let removeBtns = screen.getAllByRole('button', { name: 'Xóa sản phẩm' });
    expect(removeBtns).toHaveLength(1);
    expect(removeBtns[0]).toBeDisabled(); // Disabled when only 1 item
    
    // Add item
    await user.click(screen.getByRole('button', { name: 'Thêm' }));
    removeBtns = screen.getAllByRole('button', { name: 'Xóa sản phẩm' });
    expect(removeBtns).toHaveLength(2);
    expect(removeBtns[0]).not.toBeDisabled();
    
    // Remove item
    await user.click(removeBtns[1]);
    expect(screen.getAllByRole('button', { name: 'Xóa sản phẩm' })).toHaveLength(1);
  });

  it('submits valid new sales order successfully', async () => {
    renderWithProviders(<SalesOrderFormModal {...defaultProps} />);
    const user = userEvent.setup();
    
    // Wait for customers to load
    await waitFor(() => {
      expect(screen.queryByRole('option', { name: /Alpha/i })).toBeInTheDocument();
    });
    
    // Select customer
    const customerSelect = screen.getByRole('combobox', { name: /^Khách Hàng/i });
    await user.selectOptions(customerSelect, '44444444-4444-4444-4444-444444444444');
    
    const quantityInput = screen.getAllByRole('spinbutton')[0]; // First number input is quantity
    await user.clear(quantityInput);
    await user.type(quantityInput, '2');
    
    await user.click(screen.getByRole('button', { name: 'Tạo Đơn Hàng' }));
    
    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    }, { timeout: 2000 }); // Wait for the mock delay
  });

  it('renders credit approval state and approves credit bypass successfully', async () => {
    let bypassCalled = false;
    server.use(
      http.get('*/api/v1/sales/orders/SO-BLOCKED/', () => {
        return HttpResponse.json({
          id: 'SO-BLOCKED',
          customer: '44444444-4444-4444-4444-444444444444',
          customer_name: 'Công ty Cổ phần Alpha',
          total_amount: 5000000,
          status: 'pending_credit_approval',
          lines: [
            { id: '1', item: 'VT001', item_name: 'Vật tư 1', item_code: 'VT001', quantity: 10, unit_price: 500000, line_total: 5000000 }
          ]
        });
      }),
      http.post('*/api/v1/sales/orders/SO-BLOCKED/approve-credit-bypass/', () => {
        bypassCalled = true;
        return HttpResponse.json({ id: 'SO-BLOCKED', status: 'pending' });
      })
    );

    // Render with orderId to trigger loading the blocked order
    renderWithProviders(<SalesOrderFormModal {...defaultProps} orderId="SO-BLOCKED" />, {
      preloadedState: {
        auth: {
          user: { id: '1', username: 'admin', full_name: 'Administrator', role: 'admin', permissions: ['sales.approve_credit_bypass'] },
          token: 'mock-token',
          isAuthenticated: true
        }
      }
    });
    
    // Wait for the modal content to load and display warning
    expect(await screen.findByText(/Đơn hàng bị Khóa Tín Dụng/i)).toBeInTheDocument();
    
    // The credit bypass approval button should be present
    const bypassBtn = screen.getByRole('button', { name: /Duyệt tín dụng đặc cách/i });
    expect(bypassBtn).toBeInTheDocument();
    
    const user = userEvent.setup();
    await user.click(bypassBtn);
    
    await waitFor(() => {
      expect(bypassCalled).toBe(true);
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });

  it('renders deposit input enabled in Draft state', async () => {
    server.use(
      http.get('*/api/v1/sales/orders/SO-DRAFT/', () => {
        return HttpResponse.json({
          id: 'SO-DRAFT',
          customer: '44444444-4444-4444-4444-444444444444',
          customer_name: 'Công ty Cổ phần Alpha',
          status: 'draft',
          advance_paid_amount: '1000000.00',
          lines: [
            { id: '1', item: 'VT001', item_name: 'Vật tư 1', item_code: 'VT001', quantity: 10, unit_price: 15000000 }
          ]
        });
      })
    );

    renderWithProviders(<SalesOrderFormModal {...defaultProps} orderId="SO-DRAFT" />);
    const depositInput = await screen.findByLabelText(/Số tiền đặt cọc/i);
    expect(depositInput).toBeInTheDocument();
    expect(depositInput).toBeEnabled();
    await waitFor(() => {
      expect(depositInput).toHaveValue(1000000);
    });
  });

  it('disables deposit input in Pending state', async () => {
    server.use(
      http.get('*/api/v1/sales/orders/SO-PENDING/', () => {
        return HttpResponse.json({
          id: 'SO-PENDING',
          customer: '44444444-4444-4444-4444-444444444444',
          customer_name: 'Công ty Cổ phần Alpha',
          status: 'pending',
          advance_paid_amount: '1000000.00',
          lines: [
            { id: '1', item: 'VT001', item_name: 'Vật tư 1', item_code: 'VT001', quantity: 10, unit_price: 15000000 }
          ]
        });
      })
    );

    renderWithProviders(<SalesOrderFormModal {...defaultProps} orderId="SO-PENDING" />);
    
    // Deposit input should not be in the document
    expect(screen.queryByRole('spinbutton', { name: /Số tiền đặt cọc/i })).not.toBeInTheDocument();
    
    // Check that the formatted deposit value is displayed as static text
    expect(await screen.findByText(/1\.000\.000/)).toBeInTheDocument();
  });

  it('renders Cancel Order button when user has sales.cancel_order permission', async () => {
    server.use(
      http.get('*/api/v1/sales/orders/SO-PENDING/', () => {
        return HttpResponse.json({
          id: 'SO-PENDING',
          customer: '44444444-4444-4444-4444-444444444444',
          customer_name: 'Công ty Cổ phần Alpha',
          status: 'pending',
          advance_paid_amount: '1000000.00',
          lines: [
            { id: '1', item: 'VT001', item_name: 'Vật tư 1', item_code: 'VT001', quantity: 10, unit_price: 15000000 }
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
          permissions: ['sales.cancel_order'],
        },
        token: 'test_token',
        isAuthenticated: true,
      },
    };

    renderWithProviders(
      <SalesOrderFormModal {...defaultProps} orderId="SO-PENDING" />,
      { preloadedState }
    );

    const cancelBtn = await screen.findByRole('button', { name: /Hủy Đơn/i });
    expect(cancelBtn).toBeInTheDocument();
  });

  it('does not render Cancel Order button when user lacks permission', async () => {
    server.use(
      http.get('*/api/v1/sales/orders/SO-PENDING/', () => {
        return HttpResponse.json({
          id: 'SO-PENDING',
          customer: '44444444-4444-4444-4444-444444444444',
          customer_name: 'Công ty Cổ phần Alpha',
          status: 'pending',
          advance_paid_amount: '1000000.00',
          lines: [
            { id: '1', item: 'VT001', item_name: 'Vật tư 1', item_code: 'VT001', quantity: 10, unit_price: 15000000 }
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
      <SalesOrderFormModal {...defaultProps} orderId="SO-PENDING" />,
      { preloadedState }
    );

    // Wait for the modal contents to render by checking static customer
    await screen.findByTestId('static-customer');
    expect(screen.queryByRole('button', { name: /Hủy Đơn/i })).not.toBeInTheDocument();
  });

  it('does not render Cancel Order button when order is completed', async () => {
    server.use(
      http.get('*/api/v1/sales/orders/SO-COMPLETED/', () => {
        return HttpResponse.json({
          id: 'SO-COMPLETED',
          customer: '44444444-4444-4444-4444-444444444444',
          customer_name: 'Công ty Cổ phần Alpha',
          status: 'completed',
          advance_paid_amount: '1000000.00',
          lines: [
            { id: '1', item: 'VT001', item_name: 'Vật tư 1', item_code: 'VT001', quantity: 10, unit_price: 15000000 }
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
          permissions: ['sales.cancel_order'],
        },
        token: 'test_token',
        isAuthenticated: true,
      },
    };

    renderWithProviders(
      <SalesOrderFormModal {...defaultProps} orderId="SO-COMPLETED" />,
      { preloadedState }
    );

    // Wait for the modal contents to render by checking static customer
    await screen.findByTestId('static-customer');
    expect(screen.queryByRole('button', { name: /Hủy Đơn/i })).not.toBeInTheDocument();
  });
});

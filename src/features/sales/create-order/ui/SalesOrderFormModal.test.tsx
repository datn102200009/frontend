import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SalesOrderFormModal } from './SalesOrderFormModal';
import { renderWithProviders } from '@shared/lib/test/test-utils';

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
});

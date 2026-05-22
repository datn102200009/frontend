import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PurchaseOrderFormModal } from './PurchaseOrderFormModal';
import { renderWithProviders } from '@shared/lib/test/test-utils';

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
});

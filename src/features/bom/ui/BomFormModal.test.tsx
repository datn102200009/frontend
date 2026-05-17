import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BomFormModal } from './BomFormModal';
import { renderWithProviders } from '../../../shared/lib/test/test-utils';

describe('BomFormModal', () => {
  const defaultProps = {
    open: true,
    bomId: null,
    onClose: vi.fn(),
    onSave: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders create form correctly', async () => {
    renderWithProviders(<BomFormModal {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'Thêm Định Mức Mới' })).toBeInTheDocument();
    expect(await screen.findByRole('combobox', { name: /^Sản phẩm/i })).toBeInTheDocument();
    expect(await screen.findByRole('textbox', { name: /^Tên định mức/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tạo mới' })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderWithProviders(<BomFormModal {...defaultProps} />);
    const user = userEvent.setup();
    
    // Clear pre-filled version if any, but let's just submit
    await user.click(screen.getByRole('button', { name: 'Tạo mới' }));
    
    const errors = await screen.findAllByText('Bắt buộc');
    expect(errors.length).toBeGreaterThanOrEqual(1);
  });

  it('adds and removes BOM items', async () => {
    renderWithProviders(<BomFormModal {...defaultProps} />);
    const user = userEvent.setup();
    
    // Default has 1 item
    expect(await screen.findAllByRole('combobox', { name: /^Mã linh kiện/i })).toHaveLength(1);
    
    // Add item
    await user.click(screen.getByRole('button', { name: 'Thêm' }));
    expect(await screen.findAllByRole('combobox', { name: /^Mã linh kiện/i })).toHaveLength(2);
    
    // Remove item
    const removeBtns = screen.getAllByRole('button', { name: 'Xóa linh kiện' });
    await user.click(removeBtns[1]);
    expect(await screen.findAllByRole('combobox', { name: /^Mã linh kiện/i })).toHaveLength(1);
  });

  it('submits valid new BOM successfully', async () => {
    renderWithProviders(<BomFormModal {...defaultProps} />);
    const user = userEvent.setup();
    
    await screen.findAllByRole('option', { name: /SP001/i });
    await user.selectOptions(await screen.findByRole('combobox', { name: /^Sản phẩm/i }), 'SP001');
    await user.type(screen.getByLabelText(/^Tên định mức/i), 'New BOM Name');
    
    const itemsComboboxes = await screen.findAllByRole('combobox', { name: /^Mã linh kiện/i });
    await user.selectOptions(itemsComboboxes[0], 'LK001');
    
    await user.click(screen.getByRole('button', { name: 'Tạo mới' }));
    
    await waitFor(() => {
      expect(screen.getByText('Thêm định mức thành công')).toBeInTheDocument();
      expect(defaultProps.onSave).toHaveBeenCalled();
    });
  });

  it('handles API error when product already has BOM', async () => {
    renderWithProviders(<BomFormModal {...defaultProps} />);
    const user = userEvent.setup();
    
    await screen.findAllByRole('option', { name: /EXISTING/i });
    await user.selectOptions(await screen.findByRole('combobox', { name: /^Sản phẩm/i }), 'EXISTING');
    await user.type(screen.getByLabelText(/^Tên định mức/i), 'Existing BOM Name');
    
    const itemsComboboxes = await screen.findAllByRole('combobox', { name: /^Mã linh kiện/i });
    await user.selectOptions(itemsComboboxes[0], 'LK001');
    
    await user.click(screen.getByRole('button', { name: 'Tạo mới' }));
    
    await waitFor(() => {
      expect(screen.getByText('Sản phẩm này đã có định mức')).toBeInTheDocument();
      expect(defaultProps.onSave).not.toHaveBeenCalled();
    });
  });
});

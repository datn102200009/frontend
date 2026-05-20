import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StockEntryForm } from './StockEntryForm';
import { renderWithProviders } from '@shared/lib/test/test-utils';

describe('StockEntryForm', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders stock_in form correctly', async () => {
    renderWithProviders(<StockEntryForm {...defaultProps} type="stock_in" />);
    expect(screen.getByRole('heading', { name: 'Tạo Phiếu Nhập Kho' })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Tên phiếu/i)).toBeInTheDocument();
    
    expect(await screen.findByRole('combobox', { name: /^Kho đích/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/^Kho nguồn/i)).not.toBeInTheDocument();
  });

  it('renders stock_issue form correctly', async () => {
    renderWithProviders(<StockEntryForm {...defaultProps} type="stock_issue" />);
    expect(screen.getByRole('heading', { name: 'Tạo Phiếu Xuất Kho' })).toBeInTheDocument();
    expect(await screen.findByRole('combobox', { name: /^Kho nguồn/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/^Lệnh sản xuất/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: /^Kho đích/i })).not.toBeInTheDocument();
    expect(screen.getByText('Danh sách vật tư')).toBeInTheDocument();
  });

  it('renders internal_transfer form correctly', async () => {
    renderWithProviders(<StockEntryForm {...defaultProps} type="internal_transfer" />);
    expect(screen.getByRole('heading', { name: 'Tạo Phiếu Chuyển Kho' })).toBeInTheDocument();
    expect(await screen.findByRole('combobox', { name: /^Kho nguồn/i })).toBeInTheDocument();
    expect(await screen.findByRole('combobox', { name: /^Kho đích/i })).toBeInTheDocument();
  });

  it('submits stock_in form successfully', async () => {
    renderWithProviders(<StockEntryForm {...defaultProps} type="stock_in" />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/^Tên phiếu/i), 'PN001');
    await screen.findByRole('option', { name: /Kho 1/i });
    await user.selectOptions(await screen.findByRole('combobox', { name: /^Kho đích/i }), 'KHO_01');
    
    await waitFor(async () => {
      const itemSelects = await screen.findAllByRole('combobox', { name: /^Mã vật tư/i });
      expect(itemSelects.length).toBeGreaterThan(0);
      const options = within(itemSelects[0]).queryAllByRole('option');
      expect(options.length).toBeGreaterThan(1); // more than just the placeholder
    }, { timeout: 3000 });

    const itemSelects = await screen.findAllByRole('combobox', { name: /^Mã vật tư/i });
    await user.selectOptions(itemSelects[0], 'VT001');

    await user.click(screen.getByRole('button', { name: 'Tạo mới' }));

    await waitFor(() => {
      expect(screen.getByText('Tạo phiếu thành công')).toBeInTheDocument();
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });

  it('shows error when stock issue lacks inventory', async () => {
    renderWithProviders(<StockEntryForm {...defaultProps} type="stock_issue" />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/^Tên phiếu/i), 'PX001');
    await screen.findByRole('option', { name: /Kho 1/i });
    await user.selectOptions(await screen.findByRole('combobox', { name: /^Kho nguồn/i }), 'KHO_01');
    
    await waitFor(async () => {
      const itemSelects = await screen.findAllByRole('combobox', { name: /^Mã vật tư/i });
      expect(itemSelects.length).toBeGreaterThan(0);
      const options = within(itemSelects[0]).queryAllByRole('option');
      expect(options.length).toBeGreaterThan(1);
    }, { timeout: 3000 });
    
    const itemSelects = await screen.findAllByRole('combobox', { name: /^Mã vật tư/i });
    await user.selectOptions(itemSelects[0], 'VT001');
    
    // The quantity inputs don't have aria-labels, we might have to select by role or placeholder.
    // The input is type="number" with min="1".
    const qtyInputs = screen.getAllByRole('spinbutton');
    await user.type(qtyInputs[0], '0000'); 

    await user.click(screen.getByRole('button', { name: 'Tạo mới' }));

    await waitFor(() => {
      expect(screen.getByText('Không đủ tồn kho')).toBeInTheDocument();
      expect(defaultProps.onSuccess).not.toHaveBeenCalled();
    });
  });
});

import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkOrderFormModal } from './WorkOrderFormModal';
import { renderWithProviders } from '@shared/lib/test/test-utils';

describe('WorkOrderFormModal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
  });

  const selectOption = async (user: ReturnType<typeof userEvent.setup>, label: RegExp, optionText: RegExp) => {
    const labelEl = await screen.findByText(label);
    const container = labelEl.closest('.select-container');
    await waitFor(() => {
      expect(container).not.toHaveClass('disabled');
    }, { timeout: 3000 });
    
    const trigger = container?.querySelector('.select-trigger');
    if (!trigger) throw new Error('Select trigger not found');
    
    await user.click(trigger);
    const option = await within(container as HTMLElement).findByRole('option', { name: optionText });
    await user.click(option);
  };

  it('renders correctly', async () => {
    renderWithProviders(<WorkOrderFormModal {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'Tạo Lệnh Sản Xuất' })).toBeInTheDocument();
    expect(await screen.findByText(/Chọn định mức/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Số lượng yêu cầu/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderWithProviders(<WorkOrderFormModal {...defaultProps} />);
    const user = userEvent.setup();
    
    // Clear the default value of quantity
    const qtyInput = screen.getByLabelText(/^Số lượng yêu cầu/i);
    await user.clear(qtyInput);

    await user.click(screen.getByRole('button', { name: 'Tạo lệnh' }));
    
    const errors = await screen.findAllByText(/Bắt buộc|Tối thiểu/i);
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });

  it('submits valid form data', async () => {
    renderWithProviders(<WorkOrderFormModal {...defaultProps} />);
    const user = userEvent.setup();
    
    await user.type(screen.getByLabelText(/^Mã Lệnh Sản Xuất/i), 'WO-123');
    
    await selectOption(user, /^Chọn định mức/i, /BOM-01/i);
    await selectOption(user, /^Kho nguồn/i, /Kho 1/i);
    await selectOption(user, /^Kho sản xuất/i, /Kho 1/i);
    await selectOption(user, /^Kho đích/i, /Kho 1/i);

    const qtyInput = screen.getByLabelText(/^Số lượng yêu cầu/i);
    await user.clear(qtyInput);
    await user.type(qtyInput, '10');

    // Wait for preview to load
    expect(await screen.findByText('LK001')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Tạo lệnh' }));
    
    // Click confirm on the custom ConfirmModal since materials are missing in mock response
    const confirmDialog = await screen.findByRole('dialog', { name: 'Cảnh báo thiếu hụt nguyên liệu' });
    const confirmBtn = within(confirmDialog).getByRole('button', { name: 'Xác nhận' });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });

  it('submits form data with selected fixed assets', async () => {
    renderWithProviders(<WorkOrderFormModal {...defaultProps} />);
    const user = userEvent.setup();
    
    await user.type(screen.getByLabelText(/^Mã Lệnh Sản Xuất/i), 'WO-123');
    
    await selectOption(user, /^Chọn định mức/i, /BOM-01/i);
    await selectOption(user, /^Kho nguồn/i, /Kho 1/i);
    await selectOption(user, /^Kho sản xuất/i, /Kho 1/i);
    await selectOption(user, /^Kho đích/i, /Kho 1/i);

    const assetSelect = await screen.findByRole('combobox', { name: '' });
    await user.click(assetSelect);
    const assetOption = await screen.findByText('MOLD-001 - Khuôn mẫu 01');
    await user.click(assetOption);

    const addButton = screen.getByRole('button', { name: 'Thêm' });
    await user.click(addButton);

    expect(await screen.findByText('Khuôn mẫu 01')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Tạo lệnh' }));
    
    // Click confirm on the custom ConfirmModal since materials are missing in mock response
    const confirmDialog = await screen.findByRole('dialog', { name: 'Cảnh báo thiếu hụt nguyên liệu' });
    const confirmBtn = within(confirmDialog).getByRole('button', { name: 'Xác nhận' });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });

  it('fetches and displays material preview', async () => {
    renderWithProviders(<WorkOrderFormModal {...defaultProps} />);
    const user = userEvent.setup();
    
    // Fill required fields to trigger preview
    await selectOption(user, /^Chọn định mức/i, /BOM-01/i);
    await selectOption(user, /^Kho nguồn/i, /Kho 1/i);
    
    const qtyInput = screen.getByLabelText(/^Số lượng yêu cầu/i);
    await user.clear(qtyInput);
    await user.type(qtyInput, '10');

    // Wait for the preview table to render
    expect(await screen.findByText('Dự trù nguyên liệu')).toBeInTheDocument();
    
    // Check if the items from the mock handler are rendered by their item_code
    expect(await screen.findByText('LK001')).toBeInTheDocument();
    expect(await screen.findByText('LK002')).toBeInTheDocument();
    
    // Linh kiện 2 should have a missing quantity of 15 (formatted as 15,00)
    const missingQty = await screen.findByText(/15/);
    expect(missingQty).toBeInTheDocument();
    expect(missingQty).toHaveStyle({ color: 'var(--clr-error)' }); // Check for the error styling
  });

  it('shows ConfirmModal and submits when materials are missing', async () => {
    renderWithProviders(<WorkOrderFormModal {...defaultProps} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/^Mã Lệnh Sản Xuất/i), 'WO-123');
    
    await selectOption(user, /^Chọn định mức/i, /BOM-01/i);
    await selectOption(user, /^Kho nguồn/i, /Kho 1/i);
    await selectOption(user, /^Kho sản xuất/i, /Kho 1/i);
    await selectOption(user, /^Kho đích/i, /Kho 1/i);

    const qtyInput = screen.getByLabelText(/^Số lượng yêu cầu/i);
    await user.clear(qtyInput);
    await user.type(qtyInput, '10');

    // Wait for preview to load
    expect(await screen.findByText('Dự trù nguyên liệu')).toBeInTheDocument();
    expect(await screen.findByText('LK002')).toBeInTheDocument();

    // Now click submit
    await user.click(screen.getByRole('button', { name: 'Tạo lệnh' }));

    // ConfirmModal should be shown
    const confirmDialog = await screen.findByRole('dialog', { name: 'Cảnh báo thiếu hụt nguyên liệu' });
    expect(confirmDialog).toBeInTheDocument();

    const confirmBtn = within(confirmDialog).getByRole('button', { name: 'Xác nhận' });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });
});

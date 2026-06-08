import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CashFlowFormModal } from './CashFlowFormModal';
import { renderWithProviders } from '@shared/lib/test/test-utils';

describe('CashFlowFormModal', () => {
  const defaultPropsIn = {
    open: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    defaultValues: {
      payment_type: 'receive' as const,
      sales_invoice_id: '66666666-6666-6666-6666-666666666666',
    },
  };

  const defaultPropsOut = {
    ...defaultPropsIn,
    defaultValues: {
      payment_type: 'pay' as const,
      purchase_invoice_id: '77777777-7777-7777-7777-777777777777',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders income form correctly', async () => {
    renderWithProviders(<CashFlowFormModal {...defaultPropsIn} />);
    expect(screen.getByRole('heading', { name: 'Ghi Nhận Thu Tiền' })).toBeInTheDocument();
    
    const targetSelect = screen.getByRole('combobox', { name: /Mã Chứng Từ/i });
    expect(targetSelect).toBeInTheDocument();
    
    // Wait for sales invoice options to load
    await waitFor(() => {
      expect(screen.queryByRole('option', { name: /66666666/i })).toBeInTheDocument();
    });
  });

  it('renders expense form correctly', async () => {
    renderWithProviders(<CashFlowFormModal {...defaultPropsOut} />);
    expect(screen.getByRole('heading', { name: 'Ghi Nhận Chi Tiền' })).toBeInTheDocument();
    
    // Wait for purchase invoice options to load
    await waitFor(() => {
      expect(screen.queryByRole('option', { name: /77777777/i })).toBeInTheDocument();
    });
  });

  it('submits valid transaction successfully', async () => {
    renderWithProviders(<CashFlowFormModal {...defaultPropsIn} />);
    const user = userEvent.setup();
    
    // Wait for options to load and initialize form
    await waitFor(() => {
      expect(screen.queryByRole('option', { name: /66666666/i })).toBeInTheDocument();
    });
    
    const amountInput = screen.getByRole('spinbutton', { name: /^Số Tiền/i });
    await user.clear(amountInput);
    await user.type(amountInput, '1000000');
    
    await user.click(screen.getByRole('button', { name: 'Xác nhận' }));
    
    await waitFor(() => {
      expect(defaultPropsIn.onSuccess).toHaveBeenCalled();
    }, { timeout: 2000 }); // Wait for the mock delay
  });
});

import { screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BulkConfirmSalarySlipModal } from './BulkConfirmSalarySlipModal';
import { renderWithProviders } from '@shared/lib/test/test-utils';

describe('BulkConfirmSalarySlipModal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    salaryPeriod: '2026-05',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders bulk pay confirm modal correctly with salary period details', () => {
    renderWithProviders(<BulkConfirmSalarySlipModal {...defaultProps} />);
    expect(screen.getByRole('heading', { name: /Thanh Toán Lương Nhanh/i })).toBeInTheDocument();
    expect(screen.getByText('Kỳ lương thanh toán:')).toBeInTheDocument();
    expect(screen.getAllByText('Tháng 05/2026')[0]).toBeInTheDocument();
    expect(screen.getByLabelText(/Chuyển khoản ngân hàng/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tiền mặt/i)).toBeInTheDocument();
  });

  it('allows choosing payment method and submits bulk confirmation', async () => {
    renderWithProviders(<BulkConfirmSalarySlipModal {...defaultProps} />);
    const user = userEvent.setup();

    // Click Cash payment card
    const cashCard = screen.getByText('Tiền mặt');
    await user.click(cashCard);

    // Confirm that the radio button for cash is checked
    const cashRadio = screen.getByLabelText(/Tiền mặt/i) as HTMLInputElement;
    expect(cashRadio.checked).toBe(true);

    // Input confirmation text
    const confirmInput = screen.getByLabelText(/Nhập chữ/i);
    await user.type(confirmInput, 'XÁC NHẬN');

    // Wait 3.1 seconds to clear the button cooldown
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 3100));
    });

    // Submit payment
    await user.click(screen.getByRole('button', { name: 'Xác nhận thanh toán' }));

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  }, 10000);
});



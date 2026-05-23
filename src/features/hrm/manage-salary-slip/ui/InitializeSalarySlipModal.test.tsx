import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InitializeSalarySlipModal } from './InitializeSalarySlipModal';
import { renderWithProviders } from '@shared/lib/test/test-utils';

describe('InitializeSalarySlipModal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders initialization form correctly', () => {
    renderWithProviders(<InitializeSalarySlipModal {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'Khởi Tạo Phiếu Lương Hàng Loạt' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Chọn kỳ lương/i)).toBeInTheDocument();
  });

  it('submits salary period successfully', async () => {
    renderWithProviders(<InitializeSalarySlipModal {...defaultProps} />);
    const user = userEvent.setup();

    const periodInput = screen.getByLabelText(/Chọn kỳ lương/i);
    await user.clear(periodInput);
    await user.type(periodInput, '2026-06');

    await user.click(screen.getByRole('button', { name: 'Khởi tạo' }));

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });
});

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
    expect(screen.getByLabelText(/Chọn tháng/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Chọn năm/i)).toBeInTheDocument();
  });

  it('submits salary period successfully', async () => {
    renderWithProviders(<InitializeSalarySlipModal {...defaultProps} />);
    const user = userEvent.setup();

    // Select month and year
    await user.selectOptions(screen.getByLabelText(/Chọn tháng/i), '06');
    await user.selectOptions(screen.getByLabelText(/Chọn năm/i), '2026');

    await user.click(screen.getByRole('button', { name: 'Khởi tạo' }));

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });
});

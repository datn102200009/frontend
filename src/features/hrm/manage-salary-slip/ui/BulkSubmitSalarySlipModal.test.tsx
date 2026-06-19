import { screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BulkSubmitSalarySlipModal } from './BulkSubmitSalarySlipModal';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import { vi, describe, beforeEach, it, expect } from 'vitest';

describe('BulkSubmitSalarySlipModal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    salaryPeriod: '2026-05',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders bulk submit confirm modal correctly with period details', () => {
    renderWithProviders(<BulkSubmitSalarySlipModal {...defaultProps} />);
    expect(screen.getByRole('heading', { name: /Gửi Duyệt Bảng Lương Hàng Loạt/i })).toBeInTheDocument();
    expect(screen.getByText('Kỳ lương gửi duyệt:')).toBeInTheDocument();
    expect(screen.getAllByText('Tháng 05/2026')[0]).toBeInTheDocument();
    expect(screen.getByLabelText(/Nhập chữ/i)).toBeInTheDocument();
  });

  it('submits bulk sending after typing XÁC NHẬN and clearing cooldown', async () => {
    renderWithProviders(<BulkSubmitSalarySlipModal {...defaultProps} />);
    const user = userEvent.setup();

    // Input confirmation text
    const confirmInput = screen.getByLabelText(/Nhập chữ/i);
    await user.type(confirmInput, 'XÁC NHẬN');

    // Wait 1.6 seconds to clear the button cooldown
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1600));
    });

    // Click submit
    await user.click(screen.getByRole('button', { name: 'Xác nhận gửi duyệt' }));

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  }, 10000);
});

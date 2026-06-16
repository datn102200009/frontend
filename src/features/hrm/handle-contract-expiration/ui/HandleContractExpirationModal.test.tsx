import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HandleContractExpirationModal } from './HandleContractExpirationModal';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import { vi, describe, beforeEach, it, expect } from 'vitest';

describe('HandleContractExpirationModal', () => {
  const mockContract = {
    id: 'contract-uuid-123',
    contract_no: 'HĐLD-2025-001',
    start_date: '2025-06-01',
    end_date: '2026-05-31',
  };

  const mockEmployee = {
    id: 'employee-uuid-123',
    full_name: 'Nguyễn Văn A',
    employee_id: 'NV001',
    salary_base: 15000000,
    position_title: 'Developer',
  };

  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    contract: mockContract,
    employee: mockEmployee,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with employee and contract info and 4 action options', () => {
    renderWithProviders(<HandleContractExpirationModal {...defaultProps} />);

    expect(screen.getByRole('heading', { name: 'Xử Lý Hợp Đồng Lao Động Hết Hạn' })).toBeInTheDocument();
    expect(screen.getByText(/Nguyễn Văn A/)).toBeInTheDocument();
    expect(screen.getByText(/HĐLD-2025-001/)).toBeInTheDocument();

    expect(screen.getByText('Gia hạn hợp đồng')).toBeInTheDocument();
    expect(screen.getByText('Gia hạn kèm điều chỉnh (Lương & Chức danh)')).toBeInTheDocument();
    expect(screen.getByText('Chấm dứt hợp đồng lao động')).toBeInTheDocument();
    expect(screen.getByText('Trì hoãn xử lý')).toBeInTheDocument();
  });

  it('shows salary and title fields only when renew_with_salary_change is selected', async () => {
    renderWithProviders(<HandleContractExpirationModal {...defaultProps} />);
    const user = userEvent.setup();

    expect(screen.queryByLabelText(/Lương cơ bản mới/i)).not.toBeInTheDocument();

    // Click on renew_with_salary_change option
    await user.click(screen.getByText('Gia hạn kèm điều chỉnh (Lương & Chức danh)'));

    expect(screen.getByLabelText(/Lương cơ bản mới/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Chức danh mới/i)).toBeInTheDocument();
  });

  it('shows reason textarea and validates minimum length when terminate is selected', async () => {
    renderWithProviders(<HandleContractExpirationModal {...defaultProps} />);
    const user = userEvent.setup();

    expect(screen.queryByLabelText(/Lý do chấm dứt hợp đồng/i)).not.toBeInTheDocument();

    await user.click(screen.getByText('Chấm dứt hợp đồng lao động'));

    expect(screen.getByLabelText(/Lý do chấm dứt hợp đồng/i)).toBeInTheDocument();

    // Submit without reason or short reason
    await user.click(screen.getByRole('button', { name: 'Xác nhận' }));
    expect(await screen.findByText('Lý do chấm dứt hợp đồng phải dài ít nhất 10 ký tự')).toBeInTheDocument();
  });

  it('submits successfully for renew action', async () => {
    renderWithProviders(<HandleContractExpirationModal {...defaultProps} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Xác nhận' }));

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });
});

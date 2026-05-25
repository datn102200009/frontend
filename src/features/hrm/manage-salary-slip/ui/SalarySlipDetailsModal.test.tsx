import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SalarySlipDetailsModal } from './SalarySlipDetailsModal';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import type { SalarySlip } from '@entities/hrm/model/types';

describe('SalarySlipDetailsModal', () => {
  const mockDraftSalarySlip: SalarySlip = {
    id: 'slip-123',
    employee_id: 'emp-123',
    salary_period: '2026-05',
    status: 'draft',
    employee_code: 'NV001',
    employee_name: 'Nguyễn Văn An',
    salary_base: '10000000',
    work_days: 26,
    actual_work_salary: '10000000',
    ot_hours: 4,
    ot_salary: '500000',
    allowance: '1000000',
    bonus: '200000',
    deduction: '0',
    union_fee: '100000',
    net_salary: '11600000',
  } as any;

  const mockPaidSalarySlip: SalarySlip = {
    ...mockDraftSalarySlip,
    status: 'paid',
  };

  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    salarySlip: mockDraftSalarySlip,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders draft salary slip details and action forms correctly', () => {
    renderWithProviders(<SalarySlipDetailsModal {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'Chi Tiết Phiếu Lương' })).toBeInTheDocument();
    expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
    expect(screen.getByText('Mã NV: NV001 | Kỳ lương: 2026-05')).toBeInTheDocument();
    expect(screen.getByText('Bản nháp')).toBeInTheDocument();
    
    // Check button
    expect(screen.getByRole('button', { name: 'Thanh Toán Lương' })).toBeInTheDocument();
  });

  it('renders paid salary slip correctly and hides draft forms', () => {
    renderWithProviders(
      <SalarySlipDetailsModal {...defaultProps} salarySlip={mockPaidSalarySlip} />
    );
    expect(screen.getByText('Đã thanh toán')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tính Toán Lương' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Thanh Toán Lương' })).not.toBeInTheDocument();
  });

  it('renders standard days input as read-only with a fixed value of 26', () => {
    renderWithProviders(<SalarySlipDetailsModal {...defaultProps} />);
    const standardDaysInput = screen.getByLabelText(/Số ngày công tiêu chuẩn tháng:/i);
    expect(standardDaysInput).toHaveValue(26);
    expect(standardDaysInput).toHaveAttribute('readonly');
  });

  it('handles confirm payment action successfully', async () => {
    renderWithProviders(<SalarySlipDetailsModal {...defaultProps} />);
    const user = userEvent.setup();

    const paymentSelect = screen.getByLabelText(/Hình thức chi trả:/i);
    await user.selectOptions(paymentSelect, 'cash');

    await user.click(screen.getByRole('button', { name: 'Thanh Toán Lương' }));

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });
});

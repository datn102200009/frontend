import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, beforeEach, it, expect } from 'vitest';
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
  } as unknown as SalarySlip;

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
    expect(screen.getByText('Mã nhân viên: NV001 | Kỳ lương: 2026-05')).toBeInTheDocument();
    expect(screen.getByText('Bản nháp')).toBeInTheDocument();
  });

  it('renders paid salary slip correctly and hides draft forms', () => {
    renderWithProviders(
      <SalarySlipDetailsModal {...defaultProps} salarySlip={mockPaidSalarySlip} />
    );
    expect(screen.getByText('Đã thanh toán')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tính Toán Lương' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Thanh Toán Lương' })).not.toBeInTheDocument();
  });

  it('renders standard days input as read-only with a value of 26 by default', () => {
    renderWithProviders(<SalarySlipDetailsModal {...defaultProps} />);
    const standardDaysInput = screen.getByLabelText(/Số ngày công tiêu chuẩn tháng:/i);
    expect(standardDaysInput).toHaveValue(26);
    expect(standardDaysInput).toHaveAttribute('readonly');
  });

  it('renders standard days input as read-only with dynamic standard working days from breakdown', () => {
    const customSlip: SalarySlip = {
      ...mockDraftSalarySlip,
      breakdown: {
        standard_working_days: 24,
        incomes: [],
        deductions: [],
      },
    } as unknown as SalarySlip;
    renderWithProviders(
      <SalarySlipDetailsModal {...defaultProps} salarySlip={customSlip} />
    );
    const standardDaysInput = screen.getByLabelText(/Số ngày công tiêu chuẩn tháng:/i);
    expect(standardDaysInput).toHaveValue(24);
    expect(standardDaysInput).toHaveAttribute('readonly');
  });

  it('renders "Gửi Finance Duyệt" button when status is calculated and hrm.payroll_submit permission is present', () => {
    const calculatedSlip: SalarySlip = {
      ...mockDraftSalarySlip,
      status: 'calculated',
    };
    renderWithProviders(
      <SalarySlipDetailsModal {...defaultProps} salarySlip={calculatedSlip} />,
      {
        preloadedState: {
          auth: {
            user: {
              id: 'user-123',
              username: 'admin',
              full_name: 'Admin User',
              role: 'admin',
              permissions: ['hrm.payroll_submit'],
            },
            token: 'mock-token',
            isAuthenticated: true,
          },
        },
      }
    );
    expect(screen.getByRole('button', { name: 'Gửi Finance Duyệt' })).toBeInTheDocument();
  });

  it('renders prorated segments collapsible button and content when segments > 1', async () => {
    const proratedSlip: SalarySlip = {
      ...mockDraftSalarySlip,
      breakdown: {
        standard_working_days: 26,
        incomes: [],
        deductions: [],
        salary_segments: [
          { start_date: '2026-05-01', end_date: '2026-05-15', salary_base: 10000000, work_days: 13, earned: 5000000 },
          { start_date: '2026-05-16', end_date: '2026-05-31', salary_base: 12000000, work_days: 13, earned: 6000000 },
        ],
      },
    } as unknown as SalarySlip;

    renderWithProviders(
      <SalarySlipDetailsModal {...defaultProps} salarySlip={proratedSlip} />
    );

    const toggleButton = screen.getByRole('button', { name: /Xem chi tiết chặng lương \(Prorated\)/i });
    expect(toggleButton).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(toggleButton);

    expect(screen.getByText(/Chặng 1: 2026-05-01 ~ 2026-05-15/i)).toBeInTheDocument();
    expect(screen.getByText(/Chặng 2: 2026-05-16 ~ 2026-05-31/i)).toBeInTheDocument();
  });
});

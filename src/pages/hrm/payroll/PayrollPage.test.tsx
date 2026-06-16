import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PayrollPage from './PayrollPage';
import { renderWithProviders } from '@shared/lib/test/test-utils';

describe('PayrollPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly and shows action buttons based on permissions', async () => {
    renderWithProviders(<PayrollPage />, {
      preloadedState: {
        auth: {
          user: {
            id: 'admin-id',
            username: 'admin',
            full_name: 'Admin User',
            role: 'admin',
            permissions: ['finance.change_salaryslip', 'hrm.payroll_submit', 'finance.add_salaryslip'],
          },
          token: 'token',
          isAuthenticated: true,
        },
      },
    });

    expect(screen.getByText('Bảng Lương & Tính Lương')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tính Toán Nhanh' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Phê Duyệt Nhanh' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Khởi Tạo Kỳ Lương' })).toBeInTheDocument();
  });

  it('bulk submit button is disabled initially and enabled after successful calculate', async () => {
    renderWithProviders(<PayrollPage />, {
      preloadedState: {
        auth: {
          user: {
            id: 'admin-id',
            username: 'admin',
            full_name: 'Admin User',
            role: 'admin',
            permissions: ['finance.change_salaryslip', 'hrm.payroll_submit', 'finance.add_salaryslip'],
          },
          token: 'token',
          isAuthenticated: true,
        },
      },
    });

    const calculateBtn = screen.getByRole('button', { name: 'Tính Toán Nhanh' });
    const submitBtn = screen.getByRole('button', { name: 'Phê Duyệt Nhanh' });

    // Initially disabled (no calculation done yet in session)
    expect(submitBtn).toBeDisabled();

    // Click Calculate
    fireEvent.click(calculateBtn);

    // Wait for the submit button to become enabled after mock calculate endpoint resolves
    await waitFor(() => {
      expect(submitBtn).toBeEnabled();
    });
  });
});

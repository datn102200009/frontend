import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FinanceSalaryApprovalTable } from './FinanceSalaryApprovalTable';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import { server } from '@shared/lib/test/server';
import { http, HttpResponse } from 'msw';

describe('FinanceSalaryApprovalTable', () => {
  const mockSlips = [
    {
      id: 'slip-pending',
      name: 'SAL-2026-05-NV001',
      employee_id: 'emp-1',
      employee_code: 'NV001',
      employee_name: 'Nguyễn Văn An',
      salary_period: '2026-05',
      net_pay: '11300000',
      status: 'pending_finance_review',
    },
    {
      id: 'slip-approved',
      name: 'SAL-2026-05-NV002',
      employee_id: 'emp-2',
      employee_code: 'NV002',
      employee_name: 'Trần Thị Bình',
      salary_period: '2026-05',
      net_pay: '15000000',
      status: 'approved',
    },
  ];

  const testState = {
    auth: {
      user: {
        id: '1',
        username: 'admin',
        full_name: 'Administrator',
        role: 'admin' as const,
        permissions: ['finance.payroll_approve', 'finance.change_salaryslip'],
      },
      token: 'mock-token',
      isAuthenticated: true,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock implementation for test endpoints
    server.use(
      http.get('*/api/v1/hrm/salary-slips/', ({ request }) => {
        const url = new URL(request.url);
        const status = url.searchParams.get('status');
        if (status === 'pending_finance_review') {
          return HttpResponse.json([mockSlips[0]]);
        }
        if (status === 'approved') {
          return HttpResponse.json([mockSlips[1]]);
        }
        return HttpResponse.json(mockSlips);
      }),
      // Mock salary periods endpoint
      http.get('*/api/v1/hrm/salary-periods/', () => {
        return HttpResponse.json(['2026-05', '2026-04']);
      }),
      // Mock auth/me to return the correct permissions
      http.get('*/api/v1/accounts/auth/me/', () => {
        return HttpResponse.json({
          id: '1',
          username: 'admin',
          role: 'admin',
          permissions: ['finance.payroll_approve', 'finance.change_salaryslip'],
        });
      })
    );
  });

  it('renders pending and approved salary slips', async () => {
    renderWithProviders(<FinanceSalaryApprovalTable />, {
      preloadedState: testState,
      initialEntries: ['/finance?tab=payroll&period=2026-05'],
    });

    // Wait for elements to load
    expect(await screen.findByText('Nguyễn Văn An')).toBeInTheDocument();
    expect(screen.getByText('Trần Thị Bình')).toBeInTheDocument();

    // Verify status badges
    expect(screen.getByText('Chờ duyệt')).toBeInTheDocument();
    expect(screen.getByText('Đã duyệt')).toBeInTheDocument();

    // Verify currency formatting
    expect(screen.getByText(/11\.300\.000/)).toBeInTheDocument();
    expect(screen.getByText(/15\.000\.000/)).toBeInTheDocument();
  });

  it('calls approve API when clicking Phê Duyệt button', async () => {
    let approvedId = '';
    server.use(
      http.post('*/api/v1/finance/salary-slips/:id/approve/', ({ params }) => {
        approvedId = params.id as string;
        return HttpResponse.json({ status: 'approved' });
      })
    );

    renderWithProviders(<FinanceSalaryApprovalTable />, {
      preloadedState: testState,
      initialEntries: ['/finance?tab=payroll&period=2026-05'],
    });
    const user = userEvent.setup();

    const approveBtn = await screen.findByRole('button', { name: 'Phê Duyệt' });
    await user.click(approveBtn);

    await waitFor(() => {
      expect(approvedId).toBe('slip-pending');
    });
  });

  it('opens reject modal and calls reject API with reason', async () => {
    let rejectedId = '';
    let rejectReason = '';
    server.use(
      http.post('*/api/v1/finance/salary-slips/:id/reject/', async ({ params, request }) => {
        rejectedId = params.id as string;
        const body = (await request.json()) as any;
        rejectReason = body.reason;
        return HttpResponse.json({ status: 'calculated' });
      })
    );

    renderWithProviders(<FinanceSalaryApprovalTable />, {
      preloadedState: testState,
      initialEntries: ['/finance?tab=payroll&period=2026-05'],
    });
    const user = userEvent.setup();

    const rejectBtn = await screen.findByRole('button', { name: 'Từ Chiếu' });
    await user.click(rejectBtn);

    // Verify modal elements
    expect(screen.getByText('Từ chối phiếu lương')).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(/lý do từ chối/i);
    await user.type(textarea, 'Lý do từ chối mẫu dài hơn 10 ký tự');

    const confirmBtn = screen.getByRole('button', { name: 'Từ chối' });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(rejectedId).toBe('slip-pending');
      expect(rejectReason).toBe('Lý do từ chối mẫu dài hơn 10 ký tự');
    });
  });

  it('opens pay modal, selects payment method, and calls pay API', async () => {
    let paidId = '';
    let paymentMethod = '';
    server.use(
      http.post('*/api/v1/finance/salary-slips/:id/pay/', async ({ params, request }) => {
        paidId = params.id as string;
        const body = (await request.json()) as any;
        paymentMethod = body.payment_method;
        return HttpResponse.json({ status: 'paid' });
      })
    );

    renderWithProviders(<FinanceSalaryApprovalTable />, {
      preloadedState: testState,
      initialEntries: ['/finance?tab=payroll&period=2026-05'],
    });
    const user = userEvent.setup();

    const payBtn = await screen.findByRole('button', { name: 'Chi Trả' });
    await user.click(payBtn);

    expect(screen.getByText('Xác nhận chi trả lương')).toBeInTheDocument();

    // In the single pay modal, select option
    const select = screen.getAllByRole('combobox')[2]; // index 2 because first two are month/year dropdowns
    await user.selectOptions(select, 'cash');

    const confirmBtn = screen.getByRole('button', { name: 'Xác nhận chi trả' });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(paidId).toBe('slip-approved');
      expect(paymentMethod).toBe('cash');
    });
  });

  it('opens bulk approve modal and calls bulk approve API', async () => {
    let approvedPeriod = '';
    server.use(
      http.post('*/api/v1/finance/salary-slips/bulk-approve/', async ({ request }) => {
        const body = (await request.json()) as any;
        approvedPeriod = body.salary_period;
        return HttpResponse.json([mockSlips[0]]);
      })
    );

    renderWithProviders(<FinanceSalaryApprovalTable />, {
      preloadedState: testState,
      initialEntries: ['/finance?tab=payroll&period=2026-05'],
    });
    const user = userEvent.setup();

    const bulkApproveBtn = await screen.findByRole('button', { name: 'Phê Duyệt Toàn Bộ' });
    await waitFor(() => {
      expect(bulkApproveBtn).not.toBeDisabled();
    });
    await user.click(bulkApproveBtn);

    expect(screen.getByText(/Bạn có chắc chắn muốn phê duyệt/)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: 'Phê duyệt toàn bộ' });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(approvedPeriod).toBe('2026-05');
    });
  });

  it('opens bulk pay modal, selects payment method, and calls bulk pay API', async () => {
    let paidPeriod = '';
    let paidMethod = '';
    server.use(
      http.post('*/api/v1/finance/salary-slips/bulk-pay/', async ({ request }) => {
        const body = (await request.json()) as any;
        paidPeriod = body.salary_period;
        paidMethod = body.payment_method;
        return HttpResponse.json([mockSlips[1]]);
      })
    );

    renderWithProviders(<FinanceSalaryApprovalTable />, {
      preloadedState: testState,
      initialEntries: ['/finance?tab=payroll&period=2026-05'],
    });
    const user = userEvent.setup();

    const bulkPayBtn = await screen.findByRole('button', { name: 'Chi Trả Toàn Bộ' });
    await waitFor(() => {
      expect(bulkPayBtn).not.toBeDisabled();
    });
    await user.click(bulkPayBtn);

    expect(screen.getByText(/Chi trả toàn bộ bảng lương kỳ/)).toBeInTheDocument();

    const select = screen.getAllByRole('combobox')[2]; // third combobox in total
    await user.selectOptions(select, 'cash');

    const confirmBtn = screen.getByRole('button', { name: 'Xác nhận chi trả toàn bộ' });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(paidPeriod).toBe('2026-05');
      expect(paidMethod).toBe('cash');
    });
  });
});


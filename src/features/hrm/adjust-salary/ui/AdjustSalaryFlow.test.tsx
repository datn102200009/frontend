import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdjustSalaryFlow } from './AdjustSalaryFlow';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import type { Employee } from '@entities/hrm/model/types';
import { server } from '@shared/lib/test/server';
import { http, HttpResponse } from 'msw';

describe('AdjustSalaryFlow', () => {
  const mockEmployee: Employee = {
    id: 'emp-1',
    employee_id: 'NV001',
    full_name: 'Nguyễn Văn An',
    current_salary_base: '10000000',
    employment_status: 'active',
  };

  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    employee: mockEmployee,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form modal first with salary input and reason input', () => {
    renderWithProviders(<AdjustSalaryFlow {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'Điều Chỉnh Lương - NV001' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Mức lương cơ bản mới/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Lý do điều chỉnh/i)).toBeInTheDocument();
    
    // Day of effect text should be visible
    expect(screen.getByText(/Lương mới sẽ có hiệu lực từ hôm nay/i)).toBeInTheDocument();
  });

  it('transitions to confirm modal on continue', async () => {
    renderWithProviders(<AdjustSalaryFlow {...defaultProps} />);
    const user = userEvent.setup();

    const salaryInput = screen.getByLabelText(/Mức lương cơ bản mới/i);
    await user.clear(salaryInput);
    await user.type(salaryInput, '12000000');

    const reasonInput = screen.getByLabelText(/Lý do điều chỉnh/i);
    await user.type(reasonInput, 'Tăng lương định kỳ');

    await user.click(screen.getByRole('button', { name: 'Tiếp tục' }));

    // Heading should change to confirm modal
    expect(await screen.findByRole('heading', { name: 'Xác nhận điều chỉnh lương' })).toBeInTheDocument();
    
    // Check diff table values
    expect(screen.getByText(/10\.000\.000/)).toBeInTheDocument();
    expect(screen.getByText(/12\.000\.000/)).toBeInTheDocument();
    expect(screen.getByText(/\+2\.000\.000/)).toBeInTheDocument();

    // Check confirmation text fields
    expect(screen.getByText(/Tăng lương định kỳ/i)).toBeInTheDocument();
  });

  it('returns to form modal on back button', async () => {
    renderWithProviders(<AdjustSalaryFlow {...defaultProps} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Tiếp tục' }));
    
    // In confirm modal, click Back
    const backBtn = await screen.findByRole('button', { name: /Quay lại/i });
    await user.click(backBtn);

    // Form modal should render again
    expect(await screen.findByRole('heading', { name: 'Điều Chỉnh Lương - NV001' })).toBeInTheDocument();
  });

  it('calls adjust salary API and triggers onSuccess on confirm', async () => {
    let apiCalled = false;
    let payloadReceived: any = null;

    server.use(
      http.post('*/api/v1/hrm/employees/:id/adjust-salary/', async ({ request }) => {
        apiCalled = true;
        payloadReceived = await request.json();
        return HttpResponse.json({
          contract: { id: 'contract-123', salary_base: '12000000' },
          affected_payslips: [],
        });
      })
    );

    renderWithProviders(<AdjustSalaryFlow {...defaultProps} />);
    const user = userEvent.setup();

    const salaryInput = screen.getByLabelText(/Mức lương cơ bản mới/i);
    await user.clear(salaryInput);
    await user.type(salaryInput, '12000000');

    await user.click(screen.getByRole('button', { name: 'Tiếp tục' }));
    
    const confirmBtn = await screen.findByRole('button', { name: 'Xác nhận' });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(apiCalled).toBe(true);
      expect(payloadReceived).toEqual({
        new_salary_base: 12000000,
      });
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });

  it('displays API error message when mutation fails', async () => {
    server.use(
      http.post('*/api/v1/hrm/employees/:id/adjust-salary/', () => {
        return HttpResponse.json(
          { detail: 'Mức lương mới không hợp lệ' },
          { status: 400 }
        );
      })
    );

    renderWithProviders(<AdjustSalaryFlow {...defaultProps} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Tiếp tục' }));
    
    const confirmBtn = await screen.findByRole('button', { name: 'Xác nhận' });
    await user.click(confirmBtn);

    expect(await screen.findByText('Mức lương mới không hợp lệ')).toBeInTheDocument();
  });
});

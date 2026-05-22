/* eslint-disable @typescript-eslint/no-explicit-any */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FinancePage from './FinancePage';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import { server } from '@shared/lib/test/server';
import { http, HttpResponse } from 'msw';

describe('FinancePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders FinancePage and loads cash flow transactions list', async () => {
    server.use(
      http.get('*/api/v1/finance/cash-flows/', () => {
        return HttpResponse.json([
          {
            id: 'TX-001',
            name: 'Phiếu thu Alpha',
            payment_type: 'receive',
            category: 'bank_transfer',
            amount: 5000000,
            payment_date: '2026-05-20',
            remarks: 'Thu tiền hóa đơn'
          }
        ]);
      })
    );

    renderWithProviders(<FinancePage />);

    // Title should be present
    expect(screen.getByRole('heading', { name: /Quản Lý Dòng Tiền/i })).toBeInTheDocument();

    // Check loaded transaction
    expect(await screen.findByText('TX-001')).toBeInTheDocument();
    expect(screen.getByText('Thu tiền hóa đơn')).toBeInTheDocument();
    expect(screen.getByText('Thu Tiền')).toBeInTheDocument();
  });

  it('opens cash flow form modal, records a new transaction successfully', async () => {
    let postPayload: any = null;

    server.use(
      http.get('*/api/v1/finance/cash-flows/', () => {
        return HttpResponse.json([]);
      }),
      http.get('*/api/v1/sales/invoices/', () => {
        return HttpResponse.json([
          {
            id: 'SI-001',
            order: 'SO-001',
            customer: 'CUS01',
            customer_name: 'Công ty Alpha',
            total_amount: 8000000,
            paid_amount: 0,
            status: 'unpaid',
            created_at: '2026-05-20',
            lines: []
          }
        ]);
      }),
      http.post('*/api/v1/finance/cash-flows/', async ({ request }) => {
        postPayload = await request.json();
        return HttpResponse.json({ id: 'TX-NEW', ...postPayload }, { status: 201 });
      })
    );

    renderWithProviders(<FinancePage />);
    const user = userEvent.setup();

    // Click Record Transaction
    await user.click(screen.getByRole('button', { name: /Ghi Nhận Giao Dịch/i }));

    // Wait for modal to render
    expect(await screen.findByRole('heading', { name: /Ghi Nhận Thu Tiền/i })).toBeInTheDocument();

    // Modal elements are loaded
    const modal = screen.getByRole('dialog');
    const targetSelect = within(modal).getByLabelText(/Mã Chứng Từ/i);
    await user.selectOptions(targetSelect, 'SI-001');

    const methodSelect = within(modal).getByLabelText(/Phương Thức/i);
    await user.selectOptions(methodSelect, 'bank_transfer');

    const amountInput = within(modal).getByLabelText(/Số Tiền/i);
    await user.clear(amountInput);
    await user.type(amountInput, '3000000');

    const remarksInput = within(modal).getByLabelText(/Ghi Chú/i);
    await user.type(remarksInput, 'Ghi nhận thu cọc đơn hàng');

    // Submit
    const confirmBtn = within(modal).getByRole('button', { name: /Xác nhận/i });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(postPayload).toEqual({
        payment_type: 'receive',
        sales_invoice_id: 'SI-001',
        purchase_invoice_id: null,
        sales_order_id: null,
        purchase_order_id: null,
        category: 'bank_transfer',
        amount: 3000000,
        remarks: 'Ghi nhận thu cọc đơn hàng',
        payment_date: new Date().toISOString().split('T')[0]
      });
      expect(screen.queryByRole('heading', { name: /Ghi Nhận Thu Tiền/i })).not.toBeInTheDocument();
    });
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CustomersPage } from './CustomersPage';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import { server } from '@shared/lib/test/server';
import { http, HttpResponse } from 'msw';

describe('CustomersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders CustomersPage title, button and loaded customers', async () => {
    server.use(
      http.get('*/api/v1/crm/customers/', () => {
        return HttpResponse.json([
          {
            id: 'CUS01',
            name: 'CUS-001',
            customer_name: 'Công ty Alpha',
            customer_group: 'Commercial',
            contact_email: 'alpha@test.com',
            contact_phone: '0123456789',
            address: 'Hà Nội'
          }
        ]);
      })
    );

    renderWithProviders(<CustomersPage />);

    expect(screen.getByRole('heading', { name: /Quản Lý Khách Hàng/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Thêm Khách Hàng/i })).toBeInTheDocument();

    // Check customer loaded and displayed in the table
    expect(await screen.findByText('CUS-001')).toBeInTheDocument();
    expect(screen.getByText('Công ty Alpha')).toBeInTheDocument();
    expect(screen.getByText('Doanh Nghiệp')).toBeInTheDocument();
  });

  it('opens create modal, validates required fields, and submits successfully', async () => {
    let postPayload: any = null;
    server.use(
      http.get('*/api/v1/crm/customers/', () => {
        return HttpResponse.json([]);
      }),
      http.post('*/api/v1/crm/customers/', async ({ request }) => {
        postPayload = await request.json();
        return HttpResponse.json({ id: 'new-cus-id', ...postPayload }, { status: 201 });
      })
    );

    renderWithProviders(<CustomersPage />);
    const user = userEvent.setup();

    // Open Modal
    const addBtn = screen.getByRole('button', { name: /Thêm Khách Hàng/i });
    await user.click(addBtn);

    expect(screen.getByRole('heading', { name: /Thêm Khách Hàng Mới/i })).toBeInTheDocument();

    // Trigger validation errors
    const submitBtn = screen.getByRole('button', { name: /Lưu Lại/i });
    await user.click(submitBtn);

    expect(await screen.findByText(/Mã khách hàng là bắt buộc/i)).toBeInTheDocument();
    expect(screen.getByText(/Tên khách hàng là bắt buộc/i)).toBeInTheDocument();

    // Fill form fields
    await user.type(screen.getByLabelText(/Mã Khách Hàng/i), 'CUS-002');
    await user.type(screen.getByLabelText(/Tên Khách Hàng/i), 'Công ty Beta');
    await user.selectOptions(screen.getByLabelText(/Nhóm Khách Hàng/i), 'Individual');
    await user.type(screen.getByLabelText(/Email Liên Hệ/i), 'beta@test.com');
    await user.type(screen.getByLabelText(/Số Điện Thoại/i), '0987654321');
    await user.type(screen.getByLabelText(/Địa Chỉ/i), 'TP.HCM');
    await user.type(screen.getByLabelText(/Hạn Mức Tín Dụng/i), '150000000');
    await user.selectOptions(screen.getByLabelText(/Điều Khoản Thanh Toán/i), 'NET45');
    await user.click(screen.getByLabelText(/Khóa tín dụng/i));

    // Submit successfully
    await user.click(submitBtn);

    await waitFor(() => {
      expect(postPayload).toEqual({
        name: 'CUS-002',
        customer_name: 'Công ty Beta',
        customer_group: 'Individual',
        contact_email: 'beta@test.com',
        contact_phone: '0987654321',
        address: 'TP.HCM',
        credit_limit: 150000000,
        payment_terms: 'NET45',
        is_credit_locked: true,
      });
      // Modal should be closed
      expect(screen.queryByRole('heading', { name: /Thêm Khách Hàng Mới/i })).not.toBeInTheDocument();
    });
  });

  it('loads customer details for editing and updates successfully', async () => {
    let putPayload: any = null;

    server.use(
      http.get('*/api/v1/crm/customers/', () => {
        return HttpResponse.json([
          {
            id: 'CUS01',
            name: 'CUS-001',
            customer_name: 'Công ty Alpha',
            customer_group: 'Commercial',
            contact_email: 'alpha@test.com',
            contact_phone: '0123456789',
            address: 'Hà Nội'
          }
        ]);
      }),
      http.get('*/api/v1/crm/customers/CUS01/', () => {
        return HttpResponse.json({
          id: 'CUS01',
          name: 'CUS-001',
          customer_name: 'Công ty Alpha',
          customer_group: 'Commercial',
          contact_email: 'alpha@test.com',
          contact_phone: '0123456789',
          address: 'Hà Nội',
          credit_limit: 50000000,
          payment_terms: 'NET30',
          is_credit_locked: false
        });
      }),
      http.put('*/api/v1/crm/customers/CUS01/', async ({ request }) => {
        putPayload = await request.json();
        return HttpResponse.json({ id: 'CUS01', ...putPayload });
      })
    );

    renderWithProviders(<CustomersPage />);
    const user = userEvent.setup();

    // Edit button click
    const row = await screen.findByText('CUS-001');
    const actionButtons = within(row.closest('tr')!).getAllByRole('button');
    const editBtn = actionButtons[0]; // index 0 is "Chỉnh sửa"
    await user.click(editBtn);

    // Edit modal should open
    expect(await screen.findByRole('heading', { name: /Chỉnh Sửa Thông Tin Khách Hàng/i })).toBeInTheDocument();
    
    // Check that values are loaded into inputs
    const nameInput = await screen.findByLabelText(/Mã Khách Hàng/i);
    expect(nameInput).toHaveValue('CUS-001');
    expect(nameInput).toBeDisabled(); // Cannot edit code name

    const customerNameInput = screen.getByLabelText(/Tên Khách Hàng/i);
    expect(customerNameInput).toHaveValue('Công ty Alpha');

    const creditLimitInput = screen.getByLabelText(/Hạn Mức Tín Dụng/i);
    expect(creditLimitInput).toHaveValue(50000000);

    const paymentTermsSelect = screen.getByLabelText(/Điều Khoản Thanh Toán/i);
    expect(paymentTermsSelect).toHaveValue('NET30');

    const isCreditLockedCheckbox = screen.getByLabelText(/Khóa tín dụng/i);
    expect(isCreditLockedCheckbox).not.toBeChecked();

    // Perform edits
    await user.clear(customerNameInput);
    await user.type(customerNameInput, 'Công ty Alpha Updated');
    await user.clear(creditLimitInput);
    await user.type(creditLimitInput, '75000000');
    await user.selectOptions(paymentTermsSelect, 'NET60');
    await user.click(isCreditLockedCheckbox);

    await user.click(screen.getByRole('button', { name: /Cập Nhật/i }));

    await waitFor(() => {
      expect(putPayload).toEqual({
        name: 'CUS-001',
        customer_name: 'Công ty Alpha Updated',
        customer_group: 'Commercial',
        contact_email: 'alpha@test.com',
        contact_phone: '0123456789',
        address: 'Hà Nội',
        credit_limit: 75000000,
        payment_terms: 'NET60',
        is_credit_locked: true,
      });
    });
  });

  it('allows deleting a customer', async () => {
    let deleteId = '';

    server.use(
      http.get('*/api/v1/crm/customers/', () => {
        return HttpResponse.json([
          {
            id: 'CUS01',
            name: 'CUS-001',
            customer_name: 'Công ty Alpha',
            customer_group: 'Commercial',
            contact_email: 'alpha@test.com',
            contact_phone: '0123456789',
            address: 'Hà Nội'
          }
        ]);
      }),
      http.get('*/api/v1/crm/customers/CUS01/', () => {
        return HttpResponse.json({
          id: 'CUS01',
          name: 'CUS-001',
          customer_name: 'Công ty Alpha',
          customer_group: 'Commercial',
          contact_email: 'alpha@test.com',
          contact_phone: '0123456789',
          address: 'Hà Nội'
        });
      }),
      http.delete('*/api/v1/crm/customers/CUS01/', () => {
        deleteId = 'CUS01';
        return HttpResponse.json({ success: true });
      })
    );

    renderWithProviders(<CustomersPage />);
    const user = userEvent.setup();

    // Edit button click
    const row = await screen.findByText('CUS-001');
    const actionButtons = within(row.closest('tr')!).getAllByRole('button');
    const editBtn = actionButtons[0]; // index 0 is "Chỉnh sửa"
    await user.click(editBtn);

    // Edit modal opens
    expect(await screen.findByRole('heading', { name: /Chỉnh Sửa Thông Tin Khách Hàng/i })).toBeInTheDocument();

    const deleteBtn = screen.getByRole('button', { name: /Xóa/i });
    await user.click(deleteBtn);

    // Confirm dialog opens
    expect(screen.getByText(/Xác nhận xóa khách hàng/i)).toBeInTheDocument();
    const confirmBtn = screen.getByRole('button', { name: 'Xác nhận' });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(deleteId).toBe('CUS01');
      expect(screen.queryByRole('heading', { name: /Chỉnh Sửa Thông Tin Khách Hàng/i })).not.toBeInTheDocument();
    });
  });
});

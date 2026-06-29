/* eslint-disable @typescript-eslint/no-explicit-any */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SuppliersPage } from './SuppliersPage';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import { server } from '@shared/lib/test/server';
import { http, HttpResponse } from 'msw';

describe('SuppliersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders SuppliersPage title, button and loaded suppliers', async () => {
    server.use(
      http.get('*/api/v1/procurement/suppliers/', () => {
        return HttpResponse.json([
          {
            id: 'SUP01',
            name: 'SUP-001',
            supplier_name: 'Nhà cung cấp Tech Component',
            supplier_group: 'Manufacturer',
            contact_email: 'tech@test.com',
            contact_phone: '0123456789',
            address: 'Hà Nội'
          }
        ]);
      })
    );

    renderWithProviders(<SuppliersPage />);

    expect(screen.getByRole('heading', { name: /Quản Lý Nhà Cung Cấp/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Thêm Nhà Cung Cấp/i })).toBeInTheDocument();

    // Check supplier loaded and displayed in the table
    expect(await screen.findByText('SUP-001')).toBeInTheDocument();
    expect(screen.getByText('Nhà cung cấp Tech Component')).toBeInTheDocument();
    expect(screen.getByText('Nhà Sản Xuất')).toBeInTheDocument();
  });

  it('opens create modal, validates required fields, and submits successfully', async () => {
    let postPayload: any = null;
    server.use(
      http.get('*/api/v1/procurement/suppliers/', () => {
        return HttpResponse.json([]);
      }),
      http.post('*/api/v1/procurement/suppliers/', async ({ request }) => {
        postPayload = await request.json();
        return HttpResponse.json({ id: 'new-sup-id', ...postPayload }, { status: 201 });
      })
    );

    renderWithProviders(<SuppliersPage />);
    const user = userEvent.setup();

    // Open Modal
    const addBtn = screen.getByRole('button', { name: /Thêm Nhà Cung Cấp/i });
    await user.click(addBtn);

    expect(screen.getByRole('heading', { name: /Thêm Nhà Cung Cấp Mới/i })).toBeInTheDocument();

    // Trigger validation errors
    const submitBtn = screen.getByRole('button', { name: /Lưu Lại/i });
    await user.click(submitBtn);

    expect(await screen.findByText(/Mã nhà cung cấp là bắt buộc/i)).toBeInTheDocument();
    expect(screen.getByText(/Tên nhà cung cấp là bắt buộc/i)).toBeInTheDocument();

    // Fill form fields
    await user.type(screen.getByLabelText(/Mã Nhà Cung Cấp/i), 'SUP-002');
    await user.type(screen.getByLabelText(/Tên Nhà Cung Cấp/i), 'Nhà cung cấp Tech Component 2');
    await user.selectOptions(screen.getByLabelText(/Nhóm Nhà Cung Cấp/i), 'Service');
    await user.type(screen.getByLabelText(/Email Liên Hệ/i), 'tech2@test.com');
    await user.type(screen.getByLabelText(/Số Điện Thoại/i), '0987654321');
    await user.type(screen.getByLabelText(/Địa Chỉ/i), 'Bình Dương');

    // Submit successfully
    await user.click(submitBtn);

    await waitFor(() => {
      expect(postPayload).toEqual({
        name: 'SUP-002',
        supplier_name: 'Nhà cung cấp Tech Component 2',
        supplier_group: 'Service',
        contact_email: 'tech2@test.com',
        contact_phone: '0987654321',
        address: 'Bình Dương'
      });
      // Modal should be closed
      expect(screen.queryByRole('heading', { name: /Thêm Nhà Cung Cấp Mới/i })).not.toBeInTheDocument();
    });
  });

  it('loads supplier details for editing and updates successfully', async () => {
    let putPayload: any = null;

    server.use(
      http.get('*/api/v1/procurement/suppliers/', () => {
        return HttpResponse.json([
          {
            id: 'SUP01',
            name: 'SUP-001',
            supplier_name: 'Nhà cung cấp Tech Component',
            supplier_group: 'Manufacturer',
            contact_email: 'tech@test.com',
            contact_phone: '0123456789',
            address: 'Hà Nội'
          }
        ]);
      }),
      http.get('*/api/v1/procurement/suppliers/SUP01/', () => {
        return HttpResponse.json({
          id: 'SUP01',
          name: 'SUP-001',
          supplier_name: 'Nhà cung cấp Tech Component',
          supplier_group: 'Manufacturer',
          contact_email: 'tech@test.com',
          contact_phone: '0123456789',
          address: 'Hà Nội'
        });
      }),
      http.put('*/api/v1/procurement/suppliers/SUP01/', async ({ request }) => {
        putPayload = await request.json();
        return HttpResponse.json({ id: 'SUP01', ...putPayload });
      })
    );

    renderWithProviders(<SuppliersPage />);
    const user = userEvent.setup();

    // Edit button click
    const row = await screen.findByText('SUP-001');
    const actionButtons = within(row.closest('tr')!).getAllByRole('button');
    const editBtn = actionButtons[0]; // index 0 is "Chỉnh sửa"
    await user.click(editBtn);

    // Edit modal should open
    expect(await screen.findByRole('heading', { name: /Chỉnh Sửa Thông Tin Nhà Cung Cấp/i })).toBeInTheDocument();
    
    // Check that values are loaded into inputs
    const nameInput = await screen.findByLabelText(/Mã Nhà Cung Cấp/i);
    expect(nameInput).toHaveValue('SUP-001');
    expect(nameInput).toBeDisabled(); // Cannot edit code name

    const supplierNameInput = screen.getByLabelText(/Tên Nhà Cung Cấp/i);
    expect(supplierNameInput).toHaveValue('Nhà cung cấp Tech Component');

    // Perform an edit
    await user.clear(supplierNameInput);
    await user.type(supplierNameInput, 'Nhà cung cấp Tech Component Updated');
    await user.click(screen.getByRole('button', { name: /Cập Nhật/i }));

    await waitFor(() => {
      expect(putPayload).toEqual({
        name: 'SUP-001',
        supplier_name: 'Nhà cung cấp Tech Component Updated',
        supplier_group: 'Manufacturer',
        contact_email: 'tech@test.com',
        contact_phone: '0123456789',
        address: 'Hà Nội'
      });
    });
  });

  it('allows deleting a supplier', async () => {
    let deleteId = '';

    server.use(
      http.get('*/api/v1/procurement/suppliers/', () => {
        return HttpResponse.json([
          {
            id: 'SUP01',
            name: 'SUP-001',
            supplier_name: 'Nhà cung cấp Tech Component',
            supplier_group: 'Manufacturer',
            contact_email: 'tech@test.com',
            contact_phone: '0123456789',
            address: 'Hà Nội'
          }
        ]);
      }),
      http.get('*/api/v1/procurement/suppliers/SUP01/', () => {
        return HttpResponse.json({
          id: 'SUP01',
          name: 'SUP-001',
          supplier_name: 'Nhà cung cấp Tech Component',
          supplier_group: 'Manufacturer',
          contact_email: 'tech@test.com',
          contact_phone: '0123456789',
          address: 'Hà Nội'
        });
      }),
      http.delete('*/api/v1/procurement/suppliers/SUP01/', () => {
        deleteId = 'SUP01';
        return HttpResponse.json({ success: true });
      })
    );

    renderWithProviders(<SuppliersPage />);
    const user = userEvent.setup();

    // Edit button click
    const row = await screen.findByText('SUP-001');
    const actionButtons = within(row.closest('tr')!).getAllByRole('button');
    const editBtn = actionButtons[0]; // index 0 is "Chỉnh sửa"
    await user.click(editBtn);

    // Edit modal opens
    expect(await screen.findByRole('heading', { name: /Chỉnh Sửa Thông Tin Nhà Cung Cấp/i })).toBeInTheDocument();

    const deleteBtn = screen.getByRole('button', { name: /Xóa/i });
    await user.click(deleteBtn);

    // Confirm dialog opens
    expect(screen.getByText(/Xác nhận xóa nhà cung cấp/i)).toBeInTheDocument();
    const confirmBtn = screen.getByRole('button', { name: 'Xác nhận' });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(deleteId).toBe('SUP01');
      expect(screen.queryByRole('heading', { name: /Chỉnh Sửa Thông Tin Nhà Cung Cấp/i })).not.toBeInTheDocument();
    });
  });
});

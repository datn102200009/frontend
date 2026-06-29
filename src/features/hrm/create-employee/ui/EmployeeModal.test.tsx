import { screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@shared/lib/test/server';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import { EmployeeFormModal } from './EmployeeFormModal';
import { EmployeeUpdateModal } from './EmployeeUpdateModal';
import { EmployeeDetailsModal } from './EmployeeDetailsModal';
import type { Employee } from '@entities/hrm/model/types';

describe('Employee Modals', () => {
  const mockEmployee: Employee = {
    id: 'emp-123',
    employee_id: 'NV001',
    full_name: 'Nguyễn Văn An',
    email: 'an.nv@example.com',
    phone: '0901234567',
    gender: 'male',
    date_of_birth: '1998-05-15',
    address: 'Hà Nội',
    join_date: '2026-05-01',
    employment_status: 'active',
    current_salary_base: '10000000',
    contracts: [],
    employment_histories: [],
    documents: [],
    rewards: [],
    disciplines: [],
  } as unknown as Employee;

  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  describe('EmployeeFormModal', () => {
    const getProps = () => ({
      open: true,
      onClose: vi.fn(),
      onSuccess: vi.fn(),
    });

    it('renders form fields correctly', () => {
      renderWithProviders(<EmployeeFormModal {...getProps()} />);

      expect(screen.getByText('Thêm Nhân Viên Mới')).toBeInTheDocument();
      expect(screen.getByLabelText(/Mã nhân viên/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Họ và tên/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Số điện thoại/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Giới tính/i)).toBeInTheDocument();
    });

    it('submits employee data successfully and calls onSuccess', async () => {
      server.use(
        http.post('*/api/v1/hrm/employees/create/', () => {
          return HttpResponse.json({ ...mockEmployee, id: 'emp-new' });
        })
      );

      const props = getProps();
      const { container } = renderWithProviders(<EmployeeFormModal {...props} />);

      const employeeIdInput = container.querySelector('#employee_id') as HTMLInputElement;
      const fullNameInput = container.querySelector('#full_name') as HTMLInputElement;
      const contractNoInput = container.querySelector('#contract_no') as HTMLInputElement;
      const contractTypeSelect = container.querySelector('#contract_type') as HTMLSelectElement;

      // Fill required fields using fireEvent
      fireEvent.change(employeeIdInput, { target: { value: 'NV002' } });
      fireEvent.change(fullNameInput, { target: { value: 'Trần Văn Bình' } });
      fireEvent.change(contractNoInput, { target: { value: 'HĐLD-2026-002' } });
      fireEvent.change(contractTypeSelect, { target: { value: 'indefinite_term' } });

      // Submit
      const submitBtn = screen.getByRole('button', { name: 'Lưu nhân sự' });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(props.onSuccess).toHaveBeenCalled();
      });
    });

    it('shows API error message when submit fails', async () => {
      server.use(
        http.post('*/api/v1/hrm/employees/create/', () => {
          return HttpResponse.json(
            { detail: 'Mã nhân viên đã tồn tại trong hệ thống.' },
            { status: 400 }
          );
        })
      );

      const props = getProps();
      const { container } = renderWithProviders(<EmployeeFormModal {...props} />);

      const employeeIdInput = container.querySelector('#employee_id') as HTMLInputElement;
      const fullNameInput = container.querySelector('#full_name') as HTMLInputElement;
      const contractNoInput = container.querySelector('#contract_no') as HTMLInputElement;
      const contractTypeSelect = container.querySelector('#contract_type') as HTMLSelectElement;

      // Fill required fields using fireEvent
      fireEvent.change(employeeIdInput, { target: { value: 'NV001' } });
      fireEvent.change(fullNameInput, { target: { value: 'Nguyễn Văn An' } });
      fireEvent.change(contractNoInput, { target: { value: 'HĐLD-2026-001' } });
      fireEvent.change(contractTypeSelect, { target: { value: 'indefinite_term' } });

      const submitBtn = screen.getByRole('button', { name: 'Lưu nhân sự' });
      fireEvent.click(submitBtn);

      expect(await screen.findByText('Mã nhân viên đã tồn tại trong hệ thống.')).toBeInTheDocument();
      expect(props.onSuccess).not.toHaveBeenCalled();
    });
  });

  describe('EmployeeUpdateModal', () => {
    const getProps = () => ({
      open: true,
      onClose: vi.fn(),
      onSuccess: vi.fn(),
      employee: mockEmployee,
    });

    it('renders with existing employee data populated', () => {
      renderWithProviders(<EmployeeUpdateModal {...getProps()} />);

      expect(screen.getByText(`Chỉnh Sửa Hồ Sơ - ${mockEmployee.employee_id}`)).toBeInTheDocument();
      expect(screen.getByLabelText(/Họ và tên/i)).toHaveValue(mockEmployee.full_name);
      expect(screen.getByLabelText(/Email/i)).toHaveValue(mockEmployee.email);
      expect(screen.getByLabelText(/Số điện thoại/i)).toHaveValue(mockEmployee.phone);
      expect(screen.getByLabelText(/Địa chỉ/i)).toHaveValue(mockEmployee.address);
      expect(screen.getByLabelText(/Trạng thái làm việc/i)).toHaveValue(mockEmployee.employment_status);
    });

    it('updates employee data successfully and calls onSuccess', async () => {
      server.use(
        http.patch(`*/api/v1/hrm/employees/${mockEmployee.id}/update/`, () => {
          return HttpResponse.json({ ...mockEmployee, full_name: 'Nguyễn Văn An Cập Nhật' });
        })
      );

      const props = getProps();
      const { container } = renderWithProviders(<EmployeeUpdateModal {...props} />);

      const nameInput = container.querySelector('#update_full_name') as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'Nguyễn Văn An Cập Nhật' } });

      const updateBtn = screen.getByRole('button', { name: 'Cập Nhật' });
      fireEvent.click(updateBtn);

      await waitFor(() => {
        expect(props.onSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('EmployeeDetailsModal', () => {
    const getProps = () => ({
      open: true,
      onClose: vi.fn(),
      employee: mockEmployee,
      onTerminateContract: vi.fn(),
    });

    it('renders employee profile details correctly and switches tabs', async () => {
      server.use(
        http.get(`*/api/v1/hrm/employees/${mockEmployee.id}/`, () => {
          return HttpResponse.json({
            ...mockEmployee,
            contracts: [
              {
                id: 'contract-1',
                contract_no: 'HDLD-001',
                contract_type: 'definite_term',
                start_date: '2026-05-01',
                end_date: '2027-05-01',
                status: 'active',
                salary_base: '10000000',
              },
            ],
          });
        })
      );

      renderWithProviders(<EmployeeDetailsModal {...getProps()} />);

      // Profile header check
      expect(screen.getByText('Hồ Sơ Nhân Sự Chi Tiết')).toBeInTheDocument();
      expect(screen.getByText(mockEmployee.full_name)).toBeInTheDocument();
      expect(screen.getByText(new RegExp(`Mã NV: ${mockEmployee.employee_id}`, 'i'))).toBeInTheDocument();

      // Loading state finishes
      expect(await screen.findByText('an.nv@example.com')).toBeInTheDocument();
      expect(screen.getByText('0901234567')).toBeInTheDocument();
      expect(screen.getByText('Hà Nội')).toBeInTheDocument();

      const user = userEvent.setup();

      // Switch to Contracts Tab
      const contractTab = screen.getByRole('button', { name: /Hợp đồng/i });
      await user.click(contractTab);

      expect(screen.getByText(/HDLD-001/)).toBeInTheDocument();
      expect(screen.getByText(/Xác định thời hạn/)).toBeInTheDocument();
      expect(screen.getByText(/Đang hiệu lực/)).toBeInTheDocument();

      // Switch to Rewards Tab
      const rewardsTab = screen.getByRole('button', { name: /Thưởng & Kỷ luật/i });
      await user.click(rewardsTab);

      expect(screen.getByRole('heading', { name: /Khen Thưởng/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Kỷ Luật/i })).toBeInTheDocument();
    });
  });
});

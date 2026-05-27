import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UpdateSalaryTitleModal } from './UpdateSalaryTitleModal';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import type { Employee } from '@entities/hrm/model/types';

describe('UpdateSalaryTitleModal', () => {
  const mockEmployee: Employee = {
    id: 'emp-1',
    employee_id: 'NV001',
    full_name: 'Nguyễn Văn An',
    salary_base: '10000000',
    position_title: 'Nhân viên',
    department: 'Hành chính',
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

  it('renders update salary form by default', () => {
    renderWithProviders(<UpdateSalaryTitleModal {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'Điều Chỉnh Lương & Chức Danh - NV001' })).toBeInTheDocument();
    
    // Select should default to salary_change
    const select = screen.getByRole('combobox', { name: /Loại điều chỉnh/i }) as HTMLSelectElement;
    expect(select.value).toBe('salary_change');

    expect(screen.getByLabelText(/Mức lương cơ bản mới/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Chức danh mới/i)).not.toBeInTheDocument();
  });

  it('renders fields conditionally when select changes', async () => {
    renderWithProviders(<UpdateSalaryTitleModal {...defaultProps} />);
    const user = userEvent.setup();

    const select = screen.getByRole('combobox', { name: /Loại điều chỉnh/i });

    // Change to title_change
    await user.selectOptions(select, 'title_change');
    expect(screen.queryByLabelText(/Mức lương cơ bản mới/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Chức danh mới/i)).toBeInTheDocument();

    // Change to department_transfer
    await user.selectOptions(select, 'department_transfer');
    expect(screen.queryByLabelText(/Chức danh mới/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Phòng ban mới/i)).toBeInTheDocument();

    // Change to other
    await user.selectOptions(select, 'other');
    expect(screen.getByLabelText(/Mức lương cơ bản mới/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Chức danh mới/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phòng ban mới/i)).toBeInTheDocument();
  });

  it('validates fields and submits successfully', async () => {
    renderWithProviders(<UpdateSalaryTitleModal {...defaultProps} />);
    const user = userEvent.setup();

    const salaryInput = screen.getByLabelText(/Mức lương cơ bản mới/i);
    await user.clear(salaryInput);

    await user.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));
    expect(await screen.findByText('Lương cơ bản mới là bắt buộc')).toBeInTheDocument();

    await user.type(salaryInput, '12000000');
    await user.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });
});

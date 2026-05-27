import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmployeeDetailsModal } from './EmployeeDetailsModal';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import type { Employee } from '@entities/hrm/model/types';

describe('EmployeeDetailsModal', () => {
  const mockEmployee: Employee = {
    id: 'emp-1',
    employee_id: 'NV001',
    full_name: 'Nguyễn Văn An',
    employment_status: 'active',
  };

  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    employee: mockEmployee,
    onTerminateContract: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders employee details modal correctly and displays general info tab', async () => {
    renderWithProviders(<EmployeeDetailsModal {...defaultProps} />);

    expect(screen.getByRole('heading', { name: 'Hồ Sơ Nhân Sự Chi Tiết' })).toBeInTheDocument();
    expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();

    // Wait for mock details to load
    expect(await screen.findByText('an.nv@company.com')).toBeInTheDocument();
    expect(screen.getByText('0901234567')).toBeInTheDocument();
  });

  it('switches tabs and displays contract detail lists', async () => {
    renderWithProviders(<EmployeeDetailsModal {...defaultProps} />);
    const user = userEvent.setup();

    // Wait for load
    await screen.findByText('an.nv@company.com');

    // Click on Contracts tab
    await user.click(screen.getByRole('button', { name: 'Hợp đồng' }));

    // Mock response contains contracts under employee NV001. Let's make sure it rendered.
    expect(await screen.findByText(/Số: HDLD-2026-001/i)).toBeInTheDocument();
    expect(screen.getByText(/Đang hiệu lực/i)).toBeInTheDocument();
  });
});

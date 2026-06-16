import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DisciplineEditModal } from './DisciplineEditModal';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import type { DisciplineRecord } from '@entities/hrm/model/types';

describe('DisciplineEditModal', () => {
  const mockRecord: DisciplineRecord = {
    id: 'disc-123',
    employee_id: 'emp-123',
    employee_code: 'NV001',
    employee_name: 'Nguyễn Văn An',
    incident_date: '2026-06-08',
    discipline_date: '2026-06-10',
    discipline_type: 'warning',
    penalty_amount: '0.00',
    description: 'Đi muộn nhiều lần',
    file_url: 'http://example.com/decision.pdf',
    status: 'pending_approval',
  };

  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    record: mockRecord,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders edit form with pre-populated values', () => {
    renderWithProviders(<DisciplineEditModal {...defaultProps} />);
    expect(screen.getByRole('heading', { name: /Sửa Quyết Định Kỷ Luật - Nguyễn Văn An/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Ngày xảy ra vi phạm/i)).toHaveValue('2026-06-08');
    expect(screen.getByLabelText(/Ngày quyết định/i)).toHaveValue('2026-06-10');
    expect(screen.getByLabelText(/Hình thức kỷ luật/i)).toHaveValue('warning');
    expect(screen.getByLabelText(/Số tiền phạt/i)).toHaveValue(0);
    expect(screen.getByLabelText(/Nội dung vi phạm/i)).toHaveValue('Đi muộn nhiều lần');
    expect(screen.getByLabelText(/Link đính kèm tài liệu/i)).toHaveValue('http://example.com/decision.pdf');
  });

  it('validates description is required', async () => {
    renderWithProviders(<DisciplineEditModal {...defaultProps} />);
    const user = userEvent.setup();

    const descInput = screen.getByLabelText(/Nội dung vi phạm/i);
    await user.clear(descInput);

    await user.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));

    expect(await screen.findByText('Nội dung vi phạm là bắt buộc')).toBeInTheDocument();
  });

  it('submits updated discipline data successfully', async () => {
    renderWithProviders(<DisciplineEditModal {...defaultProps} />);
    const user = userEvent.setup();

    const descInput = screen.getByLabelText(/Nội dung vi phạm/i);
    await user.clear(descInput);
    await user.type(descInput, 'Nghỉ không phép nhiều ngày');

    await user.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });
});

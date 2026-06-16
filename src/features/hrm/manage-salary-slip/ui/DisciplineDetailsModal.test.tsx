import { screen } from '@testing-library/react';
import { DisciplineDetailsModal } from './DisciplineDetailsModal';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import type { DisciplineRecord } from '@entities/hrm/model/types';

describe('DisciplineDetailsModal', () => {
  const mockRecord: DisciplineRecord = {
    id: 'disc-123',
    employee_code: 'NV001',
    employee_name: 'Nguyễn Văn An',
    incident_date: '2026-06-08',
    discipline_date: '2026-06-10',
    discipline_type: 'salary_deduction',
    penalty_amount: '500000.00',
    description: 'Đi muộn nhiều lần',
    file_url: 'http://example.com/decision.pdf',
    status: 'approved',
    approved_by_username: 'director1',
  };

  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    record: mockRecord,
  };

  it('renders discipline record details correctly', () => {
    renderWithProviders(<DisciplineDetailsModal {...defaultProps} />);
    expect(screen.getByRole('heading', { name: /Chi Tiết Quyết Định Kỷ Luật/i })).toBeInTheDocument();
    expect(screen.getByText('NV001')).toBeInTheDocument();
    expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
    expect(screen.getByText('2026-06-08')).toBeInTheDocument();
    expect(screen.getByText('2026-06-10')).toBeInTheDocument();
    expect(screen.getByText('Khấu trừ lương')).toBeInTheDocument();
    expect(screen.getByText(/500.000/)).toBeInTheDocument();
    expect(screen.getByText('Đi muộn nhiều lần')).toBeInTheDocument();
    expect(screen.getByText('Đã duyệt')).toBeInTheDocument();
    expect(screen.getByText('@director1')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Xem quyết định/i })).toHaveAttribute('href', 'http://example.com/decision.pdf');
  });
});

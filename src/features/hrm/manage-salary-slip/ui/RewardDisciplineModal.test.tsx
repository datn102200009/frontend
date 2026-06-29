import { screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@shared/lib/test/server';
import { renderWithProviders } from '@shared/lib/test/test-utils';

import { RewardFormModal } from './RewardFormModal';
import { RewardEditModal } from './RewardEditModal';
import { RewardDetailsModal } from './RewardDetailsModal';
import { DisciplineFormModal } from './DisciplineFormModal';
import { DisciplineEditModal } from './DisciplineEditModal';
import { DisciplineDetailsModal } from './DisciplineDetailsModal';

import type { Employee, RewardRecord, DisciplineRecord } from '@entities/hrm/model/types';

describe('Reward & Discipline Modals', () => {
  const mockEmployee: Employee = {
    id: 'emp-123',
    employee_id: 'NV001',
    full_name: 'Nguyễn Văn An',
    employment_status: 'active',
  } as unknown as Employee;

  const mockRewardRecord: RewardRecord = {
    id: 'rew-123',
    employee_id: 'emp-123',
    employee_code: 'NV001',
    employee_name: 'Nguyễn Văn An',
    reward_date: '2026-06-10',
    reward_type: 'performance_bonus',
    amount: '1500000.00',
    description: 'Thưởng quý 2',
    status: 'pending_approval',
  } as unknown as RewardRecord;

  const mockRewardCancelledRecord: RewardRecord = {
    ...mockRewardRecord,
    status: 'cancelled',
    cancelled_by_username: 'manager1',
    cancelled_at: '2026-06-12T10:00:00Z',
  } as unknown as RewardRecord;

  const mockDisciplineRecord: DisciplineRecord = {
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
  } as unknown as DisciplineRecord;

  const mockDisciplineApprovedRecord: DisciplineRecord = {
    ...mockDisciplineRecord,
    discipline_type: 'salary_deduction',
    penalty_amount: '500000.00',
    status: 'approved',
    approved_by_username: 'director1',
  } as unknown as DisciplineRecord;

  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  describe('RewardFormModal', () => {
    const getProps = () => ({
      open: true,
      onClose: vi.fn(),
      onSuccess: vi.fn(),
      employee: mockEmployee,
    });

    it('renders reward form correctly with employee', () => {
      renderWithProviders(<RewardFormModal {...getProps()} />);
      expect(screen.getByRole('heading', { name: /Khen Thưởng Nhân Viên - Nguyễn Văn An/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/Ngày quyết định/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Loại khen thưởng/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Số tiền thưởng/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Lý do\/Mô tả thành tích/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/^Nhân viên$/i)).not.toBeInTheDocument();
    });

    it('renders employee selection dropdown when employee is not provided', () => {
      const propsWithoutEmployee = {
        ...getProps(),
        employee: undefined,
      };
      renderWithProviders(<RewardFormModal {...propsWithoutEmployee} />);
      expect(screen.getByRole('heading', { name: /Ghi Nhận Khen Thưởng/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/Nhân viên/i)).toBeInTheDocument();
    });

    it('validates required fields', async () => {
      renderWithProviders(<RewardFormModal {...getProps()} />);

      const descInput = screen.getByLabelText(/Lý do\/Mô tả thành tích/i);
      fireEvent.change(descInput, { target: { value: '' } });

      fireEvent.click(screen.getByRole('button', { name: 'Ghi nhận thưởng' }));

      expect(await screen.findByText('Mô tả khen thưởng là bắt buộc')).toBeInTheDocument();
    });

    it('submits reward data successfully', async () => {
      const props = getProps();
      renderWithProviders(<RewardFormModal {...props} />);

      const descInput = screen.getByLabelText(/Lý do\/Mô tả thành tích/i);
      fireEvent.change(descInput, { target: { value: 'Có sáng kiến cải tiến quy trình' } });

      fireEvent.click(screen.getByRole('button', { name: 'Ghi nhận thưởng' }));

      await waitFor(() => {
        expect(props.onSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('RewardEditModal', () => {
    const getProps = () => ({
      open: true,
      onClose: vi.fn(),
      onSuccess: vi.fn(),
      record: mockRewardRecord,
    });

    it('renders edit form with pre-populated values', () => {
      renderWithProviders(<RewardEditModal {...getProps()} />);
      expect(screen.getByRole('heading', { name: /Sửa Quyết Định Khen Thưởng - Nguyễn Văn An/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/Ngày quyết định/i)).toHaveValue('10-06-2026');
      expect(screen.getByLabelText(/Loại khen thưởng/i)).toHaveValue('performance_bonus');
      expect(screen.getByLabelText(/Số tiền thưởng/i)).toHaveValue(1500000);
      expect(screen.getByLabelText(/Lý do\/Mô tả thành tích/i)).toHaveValue('Thưởng quý 2');
    });

    it('validates description is required', async () => {
      renderWithProviders(<RewardEditModal {...getProps()} />);

      const descInput = screen.getByLabelText(/Lý do\/Mô tả thành tích/i);
      fireEvent.change(descInput, { target: { value: '' } });

      fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));

      expect(await screen.findByText('Mô tả khen thưởng là bắt buộc')).toBeInTheDocument();
    });

    it('submits updated reward data successfully', async () => {
      const props = getProps();
      renderWithProviders(<RewardEditModal {...props} />);

      const descInput = screen.getByLabelText(/Lý do\/Mô tả thành tích/i);
      fireEvent.change(descInput, { target: { value: 'Thưởng dự án xuất sắc' } });

      fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));

      await waitFor(() => {
        expect(props.onSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('RewardDetailsModal', () => {
    const getProps = () => ({
      open: true,
      onClose: vi.fn(),
      record: mockRewardCancelledRecord,
    });

    it('renders reward record details correctly', () => {
      renderWithProviders(<RewardDetailsModal {...getProps()} />);
      expect(screen.getByRole('heading', { name: /Chi Tiết Quyết Định Khen Thưởng/i })).toBeInTheDocument();
      expect(screen.getByText('NV001')).toBeInTheDocument();
      expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
      expect(screen.getByText('2026-06-10')).toBeInTheDocument();
      expect(screen.getByText('Thưởng hiệu quả công việc')).toBeInTheDocument();
      expect(screen.getByText(/1.500.000/)).toBeInTheDocument();
      expect(screen.getByText('Thưởng quý 2')).toBeInTheDocument();
      expect(screen.getByText('Đã hủy')).toBeInTheDocument();
      expect(screen.getByText('@manager1')).toBeInTheDocument();
    });
  });

  describe('DisciplineFormModal', () => {
    const getProps = () => ({
      open: true,
      onClose: vi.fn(),
      onSuccess: vi.fn(),
      employee: mockEmployee,
    });

    it('renders discipline form correctly with employee', () => {
      renderWithProviders(<DisciplineFormModal {...getProps()} />);
      expect(screen.getByRole('heading', { name: /Ghi Nhận Kỷ Luật - Nguyễn Văn An/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/Ngày xảy ra sự việc/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Ngày quyết định/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Hình thức kỷ luật/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/Số tiền khấu trừ/i)).not.toBeInTheDocument();
      expect(screen.getByLabelText(/Nội dung vi phạm/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/Nhân viên/i)).not.toBeInTheDocument();
    });

    it('renders employee selection dropdown when employee is not provided', () => {
      const propsWithoutEmployee = {
        ...getProps(),
        employee: undefined,
      };
      renderWithProviders(<DisciplineFormModal {...propsWithoutEmployee} />);
      expect(screen.getByRole('heading', { name: /Ghi Nhận Kỷ Luật/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/Nhân viên/i)).toBeInTheDocument();
    });

    it('shows penalty amount field only when discipline type is salary_deduction', () => {
      renderWithProviders(<DisciplineFormModal {...getProps()} />);

      const typeSelect = screen.getByLabelText(/Hình thức kỷ luật/i);
      fireEvent.change(typeSelect, { target: { value: 'salary_deduction' } });

      expect(screen.getByLabelText(/Số tiền khấu trừ/i)).toBeInTheDocument();
    });

    it('validates required fields', async () => {
      renderWithProviders(<DisciplineFormModal {...getProps()} />);

      const descInput = screen.getByLabelText(/Nội dung vi phạm/i);
      fireEvent.change(descInput, { target: { value: '' } });

      fireEvent.click(screen.getByRole('button', { name: 'Ghi nhận kỷ luật' }));

      expect(await screen.findByText('Nội dung vi phạm là bắt buộc')).toBeInTheDocument();
    });

    it('submits discipline data successfully', async () => {
      const props = getProps();
      renderWithProviders(<DisciplineFormModal {...props} />);

      const descInput = screen.getByLabelText(/Nội dung vi phạm/i);
      fireEvent.change(descInput, { target: { value: 'Đi muộn nhiều lần' } });

      fireEvent.click(screen.getByRole('button', { name: 'Ghi nhận kỷ luật' }));

      await waitFor(() => {
        expect(props.onSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('DisciplineEditModal', () => {
    const getProps = () => ({
      open: true,
      onClose: vi.fn(),
      onSuccess: vi.fn(),
      record: mockDisciplineRecord,
    });

    it('renders edit form with pre-populated values', () => {
      renderWithProviders(<DisciplineEditModal {...getProps()} />);
      expect(screen.getByRole('heading', { name: /Sửa Quyết Định Kỷ Luật - Nguyễn Văn An/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/Ngày xảy ra vi phạm/i)).toHaveValue('08-06-2026');
      expect(screen.getByLabelText(/Ngày quyết định/i)).toHaveValue('10-06-2026');
      expect(screen.getByLabelText(/Hình thức kỷ luật/i)).toHaveValue('warning');
      expect(screen.getByLabelText(/Số tiền phạt/i)).toHaveValue(0);
      expect(screen.getByLabelText(/Nội dung vi phạm/i)).toHaveValue('Đi muộn nhiều lần');
      expect(screen.getByLabelText(/Link đính kèm tài liệu/i)).toHaveValue('http://example.com/decision.pdf');
    });

    it('validates description is required', async () => {
      renderWithProviders(<DisciplineEditModal {...getProps()} />);

      const descInput = screen.getByLabelText(/Nội dung vi phạm/i);
      fireEvent.change(descInput, { target: { value: '' } });

      fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));

      expect(await screen.findByText('Nội dung vi phạm là bắt buộc')).toBeInTheDocument();
    });

    it('submits updated discipline data successfully', async () => {
      const props = getProps();
      renderWithProviders(<DisciplineEditModal {...props} />);

      const descInput = screen.getByLabelText(/Nội dung vi phạm/i);
      fireEvent.change(descInput, { target: { value: 'Nghỉ không phép nhiều ngày' } });

      fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));

      await waitFor(() => {
        expect(props.onSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('DisciplineDetailsModal', () => {
    const getProps = () => ({
      open: true,
      onClose: vi.fn(),
      record: mockDisciplineApprovedRecord,
    });

    it('renders discipline record details correctly', () => {
      renderWithProviders(<DisciplineDetailsModal {...getProps()} />);
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
});

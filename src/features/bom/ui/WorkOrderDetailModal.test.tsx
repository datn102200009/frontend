import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WorkOrderDetailModal } from './WorkOrderDetailModal';

describe('WorkOrderDetailModal', () => {
  const defaultProps = {
    open: true,
    workOrder: {
      id: 'wo-123',
      name: 'WO-2026-001',
      status: 'pending_approval',
      quantity: 100,
      produced_qty: 0,
      remarks: 'Some remark',
      bom_name: 'BOM Test',
      planned_start_date: '2026-06-15',
      planned_end_date: '2026-06-20',
    },
    onClose: vi.fn(),
    onApprove: vi.fn(),
    onCancel: vi.fn(),
    onDeclare: vi.fn(),
    onComplete: vi.fn(),
    canApprove: true,
    canCancel: true,
    canDeclare: true,
    canComplete: true,
  };

  it('renders modal details correctly', () => {
    render(<WorkOrderDetailModal {...defaultProps} />);
    expect(screen.getByText('Chi Tiết Lệnh Sản Xuất: WO-2026-001')).toBeInTheDocument();
    expect(screen.getByText('BOM Test')).toBeInTheDocument();
    expect(screen.getByText('Nháp')).toBeInTheDocument();
    expect(screen.getByText('Some remark')).toBeInTheDocument();
  });

  it('renders conditional buttons for pending_approval status', () => {
    render(<WorkOrderDetailModal {...defaultProps} />);
    expect(screen.getByRole('button', { name: /Phê Duyệt/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Hủy/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Nhập Liệu/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Xác Nhận Hoàn Thành/i })).not.toBeInTheDocument();
  });

  it('triggers onApprove callback when clicking approve button', () => {
    render(<WorkOrderDetailModal {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /Phê Duyệt/i }));
    expect(defaultProps.onApprove).toHaveBeenCalledWith(defaultProps.workOrder);
  });

  it('renders Chờ nghiệm thu label and Complete button for pending_production_complete status', () => {
    const props = {
      ...defaultProps,
      workOrder: {
        ...defaultProps.workOrder,
        status: 'pending_production_complete',
        produced_qty: 100,
      },
    };
    render(<WorkOrderDetailModal {...props} />);
    expect(screen.getByText('Chờ nghiệm thu')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Xác Nhận Hoàn Thành/i })).toBeInTheDocument();
  });

  it('renders skeleton loading when isLoading is true', () => {
    render(<WorkOrderDetailModal {...defaultProps} isLoading={true} />);
    expect(screen.getByText('Chi Tiết Lệnh Sản Xuất')).toBeInTheDocument();
    expect(screen.queryByText('WO-2026-001')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Phê Duyệt/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Hủy/i })).not.toBeInTheDocument();

    const closeBtn = screen.getByText('Đóng');
    expect(closeBtn).toBeInTheDocument();
    fireEvent.click(closeBtn);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});

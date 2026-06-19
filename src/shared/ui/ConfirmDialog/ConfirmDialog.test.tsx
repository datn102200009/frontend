import { screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ConfirmDialog } from './ConfirmDialog';
import { renderWithProviders } from '@shared/lib/test/test-utils';

describe('ConfirmDialog Component', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Xác nhận xóa',
    message: 'Bạn có chắc chắn muốn xóa không?',
  };

  it('renders correctly when open', () => {
    renderWithProviders(<ConfirmDialog {...defaultProps} />);
    
    expect(screen.getByText('Xác nhận xóa')).toBeInTheDocument();
    expect(screen.getByText('Bạn có chắc chắn muốn xóa không?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hủy' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Xác nhận' })).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn();
    renderWithProviders(<ConfirmDialog {...defaultProps} onClose={onClose} />);
    
    fireEvent.click(screen.getByRole('button', { name: 'Hủy' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onConfirm when Confirm is clicked', () => {
    const onConfirm = vi.fn();
    renderWithProviders(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);
    
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận' }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('does not render when open is false', () => {
    renderWithProviders(<ConfirmDialog {...defaultProps} open={false} />);
    
    expect(screen.queryByText('Xác nhận xóa')).not.toBeInTheDocument();
  });
});

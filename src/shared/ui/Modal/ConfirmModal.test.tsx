import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmModal } from './ConfirmModal';
import { renderWithProviders } from '@shared/lib/test/test-utils';

describe('ConfirmModal', () => {
  const defaultProps = {
    open: true,
    title: 'Xác nhận xóa',
    message: 'Bạn có chắc chắn muốn xóa không?',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title and message correctly', () => {
    renderWithProviders(<ConfirmModal {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'Xác nhận xóa' })).toBeInTheDocument();
    expect(screen.getByText('Bạn có chắc chắn muốn xóa không?')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    renderWithProviders(<ConfirmModal {...defaultProps} />);
    const user = userEvent.setup();

    const confirmBtn = screen.getByRole('button', { name: 'Xác nhận' });
    await user.click(confirmBtn);

    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button is clicked', async () => {
    renderWithProviders(<ConfirmModal {...defaultProps} />);
    const user = userEvent.setup();

    const cancelBtn = screen.getByRole('button', { name: 'Hủy' });
    await user.click(cancelBtn);

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('renders default confirm button with primary variant class', () => {
    renderWithProviders(<ConfirmModal {...defaultProps} />);
    const confirmBtn = screen.getByRole('button', { name: 'Xác nhận' });
    expect(confirmBtn.className).toContain('primary');
  });

  it('renders confirm button with danger variant class when specified', () => {
    renderWithProviders(<ConfirmModal {...defaultProps} confirmVariant="danger" />);
    const confirmBtn = screen.getByRole('button', { name: 'Xác nhận' });
    expect(confirmBtn.className).toContain('danger');
  });
});

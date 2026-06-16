import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CancelRecordDialog } from './CancelRecordDialog';
import { renderWithProviders } from '@shared/lib/test/test-utils';

describe('CancelRecordDialog', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Hủy Quyết Định Khen Thưởng',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders cancel dialog correctly', () => {
    renderWithProviders(<CancelRecordDialog {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'Hủy Quyết Định Khen Thưởng' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Nhập lý do hủy quyết định này...')).toBeInTheDocument();
  });

  it('validates empty reason is not allowed', async () => {
    renderWithProviders(<CancelRecordDialog {...defaultProps} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Hủy quyết định' }));

    expect(screen.getByText('Vui lòng nhập lý do hủy bỏ.')).toBeInTheDocument();
    expect(defaultProps.onConfirm).not.toHaveBeenCalled();
  });

  it('submits successfully when reason is provided', async () => {
    renderWithProviders(<CancelRecordDialog {...defaultProps} />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('Nhập lý do hủy quyết định này...'), 'Bản ghi tạo sai');
    await user.click(screen.getByRole('button', { name: 'Hủy quyết định' }));

    expect(defaultProps.onConfirm).toHaveBeenCalledWith('Bản ghi tạo sai');
  });
});

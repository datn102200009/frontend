import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductFormModal } from './ProductFormModal';
import { renderWithProviders } from '@shared/lib/test/test-utils';
import { http, HttpResponse } from 'msw';
import { server } from '@shared/lib/test/server';

describe('ProductFormModal', () => {
  const defaultProps = {
    open: true,
    product: null,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders create form correctly with threshold field', async () => {
    renderWithProviders(<ProductFormModal {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'Thêm Sản Phẩm Mới' })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Ngưỡng tối thiểu tồn kho/i)).toBeInTheDocument();
  });

  it('validates minimum_threshold is non-negative', async () => {
    renderWithProviders(<ProductFormModal {...defaultProps} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/^Mã sản phẩm/i), 'NEW-ITEM');
    await user.type(screen.getByLabelText(/^Tên sản phẩm/i), 'New Product');
    await user.type(screen.getByLabelText(/^Ngưỡng tối thiểu tồn kho/i), '-5');

    await user.click(screen.getByRole('button', { name: 'Tạo mới' }));

    expect(await screen.findByText('Ngưỡng tối thiểu phải là số không âm')).toBeInTheDocument();
  });

  it('submits valid threshold value on creation', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let capturedPayload: any = null;
    server.use(
      http.post('*/api/v1/master-data/items/create/', async ({ request }) => {
        capturedPayload = await request.json();
        return HttpResponse.json({ id: 'new-id', ...capturedPayload }, { status: 201 });
      })
    );

    renderWithProviders(<ProductFormModal {...defaultProps} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/^Mã sản phẩm/i), 'NEW-ITEM');
    await user.type(screen.getByLabelText(/^Tên sản phẩm/i), 'New Product');
    await user.type(screen.getByLabelText(/^Ngưỡng tối thiểu tồn kho/i), '15.5');

    await user.click(screen.getByRole('button', { name: 'Tạo mới' }));

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled();
      expect(defaultProps.onClose).toHaveBeenCalled();
      expect(capturedPayload).toEqual(
        expect.objectContaining({
          item_code: 'NEW-ITEM',
          item_name: 'New Product',
          minimum_threshold: '15.5',
        })
      );
    });
  });

  it('pre-fills threshold and submits on update', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let capturedPayload: any = null;
    server.use(
      http.put('*/api/v1/master-data/items/:itemCode/update/', async ({ request }) => {
        capturedPayload = await request.json();
        return HttpResponse.json({ id: 'existing-id', ...capturedPayload }, { status: 200 });
      })
    );

    const productMock = {
      id: 'existing-id',
      item_code: 'EXISTING-ITEM',
      item_name: 'Existing Product',
      stock_uom_id: null,
      status: 'active' as const,
      is_import: false,
      minimum_threshold: '50.000',
    };

    renderWithProviders(<ProductFormModal {...defaultProps} product={productMock} />);
    const user = userEvent.setup();

    expect(screen.getByRole('heading', { name: 'Chỉnh Sửa Sản Phẩm' })).toBeInTheDocument();
    const thresholdInput = screen.getByLabelText(/^Ngưỡng tối thiểu tồn kho/i) as HTMLInputElement;
    expect(thresholdInput.value).toBe('50.000');

    await user.clear(thresholdInput);
    await user.type(thresholdInput, '75.25');

    await user.click(screen.getByRole('button', { name: 'Cập nhật' }));

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled();
      expect(defaultProps.onClose).toHaveBeenCalled();
      expect(capturedPayload).toEqual(
        expect.objectContaining({
          item_name: 'Existing Product',
          minimum_threshold: '75.25',
        })
      );
    });
  });
});

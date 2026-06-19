import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@shared/ui/Modal/Modal';
import { Input } from '@shared/ui/Input/Input';
import { Button } from '@shared/ui/Button/Button';
import {
  usePostMasterDataItemsCreateMutation,
  usePutMasterDataItemsByItemCodeUpdateMutation,
  useGetMasterDataUomsListQuery,
  type Item,
  type ItemCreateInput,
  type ItemUpdateInput,
} from '../api/masterDataApi';
import { useToast } from '@shared/ui/Toast/Toast';

const productSchema = z.object({
  item_code: z.string().min(1, 'Bắt buộc nhập mã sản phẩm'),
  item_name: z.string().min(1, 'Bắt buộc nhập tên sản phẩm'),
  stock_uom_id: z.string().nullable().optional(),
  status: z.enum(['active', 'inactive', 'discontinued']),
  is_import: z.boolean(),
  minimum_threshold: z
    .union([z.string(), z.number()])
    .refine(
      (v) => v !== '' && v !== null && v !== undefined && !isNaN(Number(v)) && Number(v) >= 0,
      'Ngưỡng tối thiểu phải là số không âm'
    ),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormModalProps {
  open: boolean;
  product: Item | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ProductFormModal({ open, product, onClose, onSuccess }: ProductFormModalProps) {
  const { toast } = useToast();
  const [createItem, { isLoading: isCreating }] = usePostMasterDataItemsCreateMutation();
  const [updateItem, { isLoading: isUpdating }] = usePutMasterDataItemsByItemCodeUpdateMutation();
  const { data: uomList } = useGetMasterDataUomsListQuery(undefined, { refetchOnMountOrArgChange: false });

  const isEdit = !!product;
  const isLoading = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      item_code: '',
      item_name: '',
      stock_uom_id: null,
      status: 'active',
      is_import: false,
      minimum_threshold: '',
    },
  });

  const watchIsImport = watch('is_import');

  useEffect(() => {
    if (open) {
      if (product) {
        reset({
          item_code: product.item_code || '',
          item_name: product.item_name || '',
          stock_uom_id: product.stock_uom_id || null,
          status: product.status || 'active',
          is_import: product.is_import || false,
          minimum_threshold: product.minimum_threshold != null ? String(product.minimum_threshold) : '',
        });
      } else {
        reset({
          item_code: '',
          item_name: '',
          stock_uom_id: null,
          status: 'active',
          is_import: false,
          minimum_threshold: '',
        });
      }
    }
  }, [open, product, reset]);

  const onSubmit = async (data: ProductFormValues) => {
    try {
      const thresholdVal = String(data.minimum_threshold);

      if (isEdit && product?.item_code) {
        const updatePayload: ItemUpdateInput = {
          item_name: data.item_name,
          stock_uom_id: data.stock_uom_id || null,
          status: data.status,
          is_import: data.is_import,
          minimum_threshold: thresholdVal,
        };
        await updateItem({ itemCode: product.item_code, itemUpdateInput: updatePayload }).unwrap();
        toast('success', 'Cập nhật sản phẩm thành công');
      } else {
        const createPayload: ItemCreateInput = {
          item_code: data.item_code,
          item_name: data.item_name,
          stock_uom_id: data.stock_uom_id || null,
          status: data.status,
          is_import: data.is_import,
          minimum_threshold: thresholdVal,
        };
        await createItem({ itemCreateInput: createPayload }).unwrap();
        toast('success', 'Thêm sản phẩm thành công');
      }
      onSuccess();
      onClose();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast('error', error?.data?.detail || 'Có lỗi xảy ra khi lưu sản phẩm');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Chỉnh Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới'}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={isLoading}>
            {isLoading ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </>
      }
    >
      <form
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}
        onSubmit={(e) => e.preventDefault()}
      >
        <Input
          label="Mã sản phẩm"
          required
          disabled={isEdit || isLoading}
          error={errors.item_code?.message}
          {...register('item_code')}
        />
        <Input
          label="Tên sản phẩm"
          required
          disabled={isLoading}
          error={errors.item_name?.message}
          {...register('item_name')}
        />
        <Input
          label="Ngưỡng tối thiểu tồn kho"
          type="number"
          step="0.001"
          min="0"
          required
          disabled={isLoading}
          error={errors.minimum_threshold?.message}
          {...register('minimum_threshold')}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
            <label style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--clr-text-secondary)' }}>
              Đơn vị tính
            </label>
            <select
              disabled={isLoading}
              style={{
                padding: '10px 14px',
                border: '1.5px solid var(--clr-border)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--fs-base)',
                background: 'var(--clr-surface)',
                color: 'var(--clr-text)',
              }}
              {...register('stock_uom_id')}
            >
              <option value="">-- Chọn đơn vị tính --</option>
              {uomList?.map((uom) => (
                <option key={uom.id} value={uom.id}>
                  {uom.name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
            <label style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--clr-text-secondary)' }}>
              Trạng thái
            </label>
            <select
              disabled={isLoading}
              style={{
                padding: '10px 14px',
                border: '1.5px solid var(--clr-border)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--fs-base)',
                background: 'var(--clr-surface)',
                color: 'var(--clr-text)',
              }}
              {...register('status')}
            >
              <option value="active">Hoạt động</option>
              <option value="inactive">Ngừng HĐ</option>
              <option value="discontinued">Ngừng kinh doanh</option>
            </select>
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: 'var(--fs-sm)' }}>
          <input
            type="checkbox"
            checked={watchIsImport}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onChange={(e: any) => setValue('is_import', e.target.checked)}
            disabled={isLoading}
          />
          Hàng nhập khẩu
        </label>
      </form>
    </Modal>
  );
}

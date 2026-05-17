import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { usePostManufacturingBomCreateMutation, usePutManufacturingBomByBomIdUpdateMutation, useGetManufacturingBomByBomIdQuery } from '../../manufacturing/api/manufacturingApi';
import { useGetMasterDataItemsListQuery } from '../../inventory/api/masterDataApi';
import { useToast } from '../../../shared/ui/Toast/Toast';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from '../../../shared/ui/Modal/Modal';
import { Input } from '../../../shared/ui/Input/Input';
import { Button } from '../../../shared/ui/Button/Button';
import styles from './BomFormModal.module.css';

interface BomFormData {
  name: string;
  product_code: string;
  notes: string;
  items: { item_code: string; quantity: number }[];
}

interface BomFormModalProps {
  open: boolean;
  bomId: string | null;
  onClose: () => void;
  onSave: () => void;
}

export function BomFormModal({ open, bomId, onClose, onSave }: BomFormModalProps) {
  const isEdit = !!bomId;
  const { toast } = useToast();
  const [createBom, { isLoading: isCreating }] = usePostManufacturingBomCreateMutation();
  const [updateBom, { isLoading: isUpdating }] = usePutManufacturingBomByBomIdUpdateMutation();
  const { data: itemsResponse, isSuccess: isItemsLoaded } = useGetMasterDataItemsListQuery({ limit: 1000 });
  const itemsList = itemsResponse?.results || [];

  const { data: bomDetails, isFetching: isFetchingBom } = useGetManufacturingBomByBomIdQuery(
    { bomId: bomId! },
    { skip: !bomId }
  );

  const { register, control, handleSubmit, formState: { errors }, watch, reset } = useForm<BomFormData>({
    defaultValues: { name: '', product_code: '', notes: '', items: [{ item_code: '', quantity: 1 }] },
  });

  useEffect(() => {
    if (isEdit && bomDetails && isItemsLoaded) {
      reset({
        name: bomDetails.name || '',
        product_code: bomDetails.item_code || '',
        notes: bomDetails.description || '',
        items: bomDetails.items?.map((i: any) => ({ item_code: i.item_code, quantity: i.quantity })) || []
      });
    } else if (!isEdit && open && isItemsLoaded) {
      reset({ name: '', product_code: '', notes: '', items: [{ item_code: '', quantity: 1 }] });
    }
  }, [isEdit, bomDetails, open, reset, isItemsLoaded]);

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchItems = watch('items');

  const onSubmit = async (data: BomFormData) => {
    try {
      if (isEdit) {
        await updateBom({
          bomId: bomId!,
          bomUpdateInput: {
            quantity: 1,
            description: data.notes,
            items: data.items.map(item => ({ item_id: itemsList.find(i => i.item_code === item.item_code)?.id || item.item_code, quantity: item.quantity }))
          }
        }).unwrap();
        toast('success', 'Cập nhật định mức thành công');
      } else {
        await createBom({
          bomInput: {
            name: data.name || itemsList.find(i => i.item_code === data.product_code)?.item_name || 'BOM',
            item_id: itemsList.find(i => i.item_code === data.product_code)?.id || data.product_code,
            quantity: 1,
            description: data.notes,
            items: data.items.map(item => ({ item_id: itemsList.find(i => i.item_code === item.item_code)?.id || item.item_code, quantity: item.quantity }))
          }
        }).unwrap();
        toast('success', 'Thêm định mức thành công');
      }
      onSave();
    } catch (error: any) {
      toast('error', error?.data?.detail || 'Có lỗi xảy ra');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Chỉnh Sửa Định Mức' : 'Thêm Định Mức Mới'} size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isCreating || isUpdating || isFetchingBom}>Hủy</Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={isCreating || isUpdating || isFetchingBom}>{isEdit ? 'Cập nhật' : 'Tạo mới'}</Button>
        </>
      }
    >
      <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
        <div className={styles.row}>
          <Input label="Tên định mức" required error={errors.name?.message} disabled={isCreating || isUpdating}
            {...register('name', { required: 'Bắt buộc' })} />
            
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)', flex: 1 }}>
            <label htmlFor="product_code" style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--clr-text-secondary)' }}>Sản phẩm <span style={{ color: 'var(--clr-danger)' }}>*</span></label>
            <select
              id="product_code"
              style={{ padding: '10px 14px', border: '1.5px solid var(--clr-border)', borderRadius: 'var(--radius-md)', fontSize: 'var(--fs-base)', background: 'var(--clr-surface)', color: 'var(--clr-text)' }}
              {...register('product_code', { required: 'Bắt buộc' })}
              disabled={isEdit || isCreating || isUpdating}
            >
              <option value="">-- Chọn sản phẩm --</option>
              {itemsList.map(item => (
                <option key={item.item_code} value={item.item_code}>{item.item_code} - {item.item_name}</option>
              ))}
            </select>
            {errors.product_code && <span style={{ color: 'var(--clr-error)', fontSize: 'var(--fs-sm)' }}>{errors.product_code.message}</span>}
          </div>
        </div>

        <Input label="Ghi chú" {...register('notes')} />

        <div className={styles.itemsSection}>
          <div className={styles.itemsHeader}>
            <h4 className={styles.itemsTitle}>Danh sách linh kiện</h4>
            <Button variant="outline" size="sm" icon={<Plus size={14} />}
              onClick={() => append({ item_code: '', quantity: 1 })}>
              Thêm
            </Button>
          </div>

          <div className={styles.itemsTable}>
            <div className={styles.itemRow} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 100px 32px', gap: '8px', padding: '8px 0', borderBottom: '1px solid var(--clr-border)', fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--clr-text-secondary)' }}>
              <span>Linh kiện</span>
              <span>ĐVT</span>
              <span>Số lượng</span>
              <span />
            </div>
            {fields.map((field, index) => {
              const selectedItemCode = watchItems?.[index]?.item_code;
              const selectedItem = itemsList.find((i) => i.item_code === selectedItemCode);
              return (
              <div key={field.id} className={styles.itemRow} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 100px 32px', gap: '8px', padding: '8px 0', alignItems: 'center' }}>
                <select
                  aria-label="Mã linh kiện"
                  className={styles.itemInput}
                  {...register(`items.${index}.item_code` as const, { required: true })}
                  disabled={isCreating || isUpdating}
                >
                  <option value="">-- Chọn linh kiện --</option>
                  {itemsList.map(item => (
                    <option key={item.item_code} value={item.item_code}>{item.item_code} - {item.item_name}</option>
                  ))}
                </select>
                <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text-secondary)' }}>{selectedItem?.stock_uom_name || '-'}</span>
                <input className={styles.itemInput} type="number" min={0.01} step={0.01} {...register(`items.${index}.quantity` as const, { valueAsNumber: true, required: true, min: 0.01 })} disabled={isCreating || isUpdating} />
                <button type="button" className={styles.removeBtn} onClick={() => remove(index)} aria-label="Xóa linh kiện"
                  disabled={fields.length <= 1 || isCreating || isUpdating} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-text-muted)' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            )})}
          </div>
        </div>
      </form>
    </Modal>
  );
}

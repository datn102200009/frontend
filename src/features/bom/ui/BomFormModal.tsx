import { useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { SearchableSelect } from '../../../shared/ui/Select/SearchableSelect';
import { usePostManufacturingBomCreateMutation, usePutManufacturingBomByBomIdUpdateMutation, useGetManufacturingBomByBomIdQuery } from '@features/manufacturing/api/manufacturingApi';
import { useGetMasterDataItemsListQuery } from '@features/inventory/api/masterDataApi';
import { useToast } from '@shared/ui/Toast/Toast';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from '@shared/ui/Modal/Modal';
import { Input } from '@shared/ui/Input/Input';
import { TextArea } from '@shared/ui/Input/TextArea';
import { Button } from '@shared/ui/Button/Button';
import { extractApiError } from '@shared/lib/extractApiError';
import { getDecimalsForUom } from '@shared/lib/uomDecimals';
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        items: bomDetails.items?.map((i: any) => ({ item_code: i.item_code, quantity: i.quantity })) || []
      });
    } else if (!isEdit && open && isItemsLoaded) {
      reset({ name: '', product_code: '', notes: '', items: [{ item_code: '', quantity: 1 }] });
    }
  }, [isEdit, bomDetails, open, reset, isItemsLoaded]);

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchItems = watch('items');

  const onSubmit = async (data: BomFormData) => {
    if (!data.items || data.items.length === 0) {
      toast('error', 'Định mức phải có ít nhất một linh kiện');
      return;
    }
    try {
      if (isEdit) {
        await updateBom({
          bomId: bomId!,
          bomUpdateInput: {
            name: data.name,
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast('error', extractApiError(error, 'Có lỗi xảy ra'));
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
        <Input label="Tên định mức" required error={errors.name?.message} disabled={isCreating || isUpdating}
          {...register('name', { required: 'Bắt buộc' })} />
            
        <Controller
          control={control}
          name="product_code"
          rules={{ required: 'Bắt buộc' }}
          render={({ field }) => (
            <SearchableSelect
              label="Sản phẩm"
              required
              placeholder="-- Chọn sản phẩm --"
              options={itemsList.map(item => ({
                label: `${item.item_name} - ${item.item_code}`,
                value: item.item_code || ''
              }))}
              value={field.value}
              onChange={field.onChange}
              error={errors.product_code?.message}
              disabled={isEdit || isCreating || isUpdating}
            />
          )}
        />

        <TextArea label="Ghi chú" disabled={isCreating || isUpdating} error={errors.notes?.message}
          {...register('notes')} />

        <div className={styles.itemsSection}>
          <div className={styles.itemsHeader}>
            <h4 className={styles.itemsTitle}>Danh sách linh kiện</h4>
            <Button variant="outline" size="sm" icon={<Plus size={14} />}
              onClick={() => append({ item_code: '', quantity: 1 })}>
              Thêm
            </Button>
          </div>

          <div className={styles.itemsTable}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 100px 1fr 32px', gap: '8px', padding: '8px 0', borderBottom: '1px solid var(--clr-border)', fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--clr-text-secondary)' }}>
              <span>Linh kiện</span>
              <span>Số lượng</span>
              <span>ĐVT</span>
              <span />
            </div>
            {fields.map((field, index) => {
              const selectedItemCode = watchItems?.[index]?.item_code;
              const selectedItem = itemsList.find((i) => i.item_code === selectedItemCode);

              const selectedCodes = watchItems
                ?.map((it, i) => (i !== index ? it.item_code : null))
                .filter((code): code is string => !!code) ?? [];
              
              const availableItems = itemsList.filter(
                (item) => item.item_code && !selectedCodes.includes(item.item_code)
              );

              return (
              <div key={field.id} style={{ display: 'grid', gridTemplateColumns: '2fr 100px 1fr 32px', gap: '8px', padding: '8px 0', alignItems: 'center' }}>
                <Controller
                  control={control}
                  name={`items.${index}.item_code` as const}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <SearchableSelect
                      placeholder="-- Chọn linh kiện --"
                      ariaLabel="Mã linh kiện"
                      options={availableItems.map(item => ({
                        label: `${item.item_name} - ${item.item_code}`,
                        value: item.item_code || ''
                      }))}
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isCreating || isUpdating}
                    />
                  )}
                />
                
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  size="sm"
                  decimals={getDecimalsForUom(selectedItem?.stock_uom_name)}
                  disabled={isCreating || isUpdating}
                  error={errors.items?.[index]?.quantity?.message}
                  {...register(`items.${index}.quantity` as const, {
                    valueAsNumber: true,
                    required: 'Bắt buộc',
                    validate: {
                      required: (v) => !isNaN(v) || 'Bắt buộc nhập số lượng',
                      positive: (v) => v > 0 || 'Số lượng phải lớn hơn 0',
                    },
                  })}
                />

                <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text-secondary)', paddingLeft: '4px' }}>{selectedItem?.stock_uom_name || '-'}</span>
                
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

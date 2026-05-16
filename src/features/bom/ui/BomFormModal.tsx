import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from '../../../shared/ui/Modal/Modal';
import { Input } from '../../../shared/ui/Input/Input';
import { Button } from '../../../shared/ui/Button/Button';
import type { BOM, BOMItem } from '../model/types';
import styles from './BomFormModal.module.css';

interface BomFormData {
  product_code: string;
  product_name: string;
  version: string;
  notes: string;
  items: BOMItem[];
}

interface BomFormModalProps {
  open: boolean;
  bom: BOM | null;
  onClose: () => void;
  onSave: (data: BOM) => void;
}

export function BomFormModal({ open, bom, onClose, onSave }: BomFormModalProps) {
  const isEdit = !!bom;

  const { register, control, handleSubmit, formState: { errors } } = useForm<BomFormData>({
    defaultValues: bom
      ? { product_code: bom.product_code, product_name: bom.product_name, version: bom.version, notes: bom.notes, items: bom.items }
      : { product_code: '', product_name: '', version: 'v1.0', notes: '', items: [{ id: '', item_code: '', item_name: '', quantity: 1, unit: 'cái' }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const onSubmit = (data: BomFormData) => {
    onSave({
      id: bom?.id ?? '',
      ...data,
      items: data.items.map((item, i) => ({ ...item, id: item.id || `bi-new-${i}` })),
      created_at: bom?.created_at ?? '',
      is_active: true,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Chỉnh Sửa Định Mức' : 'Thêm Định Mức Mới'} size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Hủy</Button>
          <Button onClick={handleSubmit(onSubmit)}>{isEdit ? 'Cập nhật' : 'Tạo mới'}</Button>
        </>
      }
    >
      <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
        <div className={styles.row}>
          <Input label="Mã sản phẩm" required error={errors.product_code?.message}
            {...register('product_code', { required: 'Bắt buộc' })} />
          <Input label="Tên sản phẩm" required error={errors.product_name?.message}
            {...register('product_name', { required: 'Bắt buộc' })} />
          <Input label="Phiên bản" required error={errors.version?.message}
            {...register('version', { required: 'Bắt buộc' })} />
        </div>

        <Input label="Ghi chú" {...register('notes')} />

        <div className={styles.itemsSection}>
          <div className={styles.itemsHeader}>
            <h4 className={styles.itemsTitle}>Danh sách linh kiện</h4>
            <Button variant="outline" size="sm" icon={<Plus size={14} />}
              onClick={() => append({ id: '', item_code: '', item_name: '', quantity: 1, unit: 'cái' })}>
              Thêm
            </Button>
          </div>

          <div className={styles.itemsTable}>
            <div className={styles.itemRow}>
              <span className={styles.itemLabel}>Mã LK</span>
              <span className={styles.itemLabel}>Tên linh kiện</span>
              <span className={styles.itemLabel}>SL</span>
              <span className={styles.itemLabel}>ĐVT</span>
              <span />
            </div>
            {fields.map((field, index) => (
              <div key={field.id} className={styles.itemRow}>
                <input className={styles.itemInput} placeholder="Mã LK" {...register(`items.${index}.item_code`)} />
                <input className={styles.itemInput} placeholder="Tên linh kiện" {...register(`items.${index}.item_name`)} />
                <input className={styles.itemInput} type="number" min={0} step={0.1} {...register(`items.${index}.quantity`, { valueAsNumber: true })} />
                <input className={styles.itemInput} placeholder="cái" {...register(`items.${index}.unit`)} />
                <button type="button" className={styles.removeBtn} onClick={() => remove(index)} aria-label="Xóa linh kiện"
                  disabled={fields.length <= 1}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
}

import { useForm } from 'react-hook-form';
import { Modal } from '../../../shared/ui/Modal/Modal';
import { Input } from '../../../shared/ui/Input/Input';
import { Button } from '../../../shared/ui/Button/Button';
import type { WorkOrder } from '../model/types';
import { MOCK_BOMS } from '../model/mockData';

interface WoFormData {
  product_name: string;
  bom_id: string;
  quantity_required: number;
  planned_start: string;
  planned_end: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (wo: WorkOrder) => void;
}

export function WorkOrderFormModal({ open, onClose, onSave }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<WoFormData>({
    defaultValues: { product_name: '', bom_id: '', quantity_required: 1, planned_start: '', planned_end: '' },
  });

  const onSubmit = (data: WoFormData) => {
    const bom = MOCK_BOMS.find((b) => b.id === data.bom_id);
    onSave({
      id: '',
      code: '',
      product_name: data.product_name,
      bom_id: data.bom_id,
      bom_version: bom?.version ?? '',
      quantity_required: data.quantity_required,
      quantity_completed: 0,
      status: 'not_started',
      planned_start: data.planned_start,
      planned_end: data.planned_end,
      created_at: new Date().toISOString().slice(0, 10),
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Tạo Lệnh Sản Xuất" size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Hủy</Button>
          <Button onClick={handleSubmit(onSubmit)}>Tạo lệnh</Button>
        </>
      }
    >
      <form style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }} onSubmit={(e) => e.preventDefault()}>
        <Input label="Tên sản phẩm" required error={errors.product_name?.message}
          {...register('product_name', { required: 'Bắt buộc' })} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
          <label style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--clr-text-secondary)' }}>
            Chọn BOM <span style={{ color: 'var(--clr-error)' }}>*</span>
          </label>
          <select
            style={{
              padding: '10px 14px',
              border: '1.5px solid var(--clr-border)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--fs-base)',
              background: 'var(--clr-surface)',
              color: 'var(--clr-text)',
            }}
            {...register('bom_id', { required: 'Bắt buộc' })}
          >
            <option value="">-- Chọn định mức --</option>
            {MOCK_BOMS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.product_code} — {b.product_name} ({b.version})
              </option>
            ))}
          </select>
        </div>

        <Input label="Số lượng yêu cầu" type="number" required
          error={errors.quantity_required?.message}
          {...register('quantity_required', { required: 'Bắt buộc', valueAsNumber: true, min: { value: 1, message: 'Tối thiểu 1' } })} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
          <Input label="Ngày bắt đầu" type="date" {...register('planned_start')} />
          <Input label="Ngày kết thúc" type="date" {...register('planned_end')} />
        </div>
      </form>
    </Modal>
  );
}

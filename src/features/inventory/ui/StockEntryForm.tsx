import { useForm, useFieldArray } from 'react-hook-form';
import { Trash2 } from 'lucide-react';
import { Modal } from '@shared/ui/Modal/Modal';
import { Input } from '@shared/ui/Input/Input';
import { Button } from '@shared/ui/Button/Button';
import { useToast } from '@shared/ui/Toast/Toast';
import { usePostInventoryStockInCreateMutation, usePostInventoryStockIssueCreateMutation, usePostInventoryStockTransferCreateMutation, useGetInventoryStockLedgerBalanceQuery } from '@features/inventory/api/inventoryApi';
import { useGetMasterDataItemsListQuery, useGetMasterDataWarehousesListQuery } from '@features/inventory/api/masterDataApi';


interface StockEntryFormData {
  name: string;
  posting_date: string;
  source_warehouse_id?: string;
  target_warehouse_id?: string;
  work_order_id?: string;
  remarks: string;
  details: { item_id: string; quantity: number }[];
}

interface Props {
  open: boolean;
  type: 'stock_in' | 'stock_issue' | 'internal_transfer';
  onClose: () => void;
  onSuccess: () => void;
}

export function StockEntryForm({ open, type, onClose, onSuccess }: Props) {
  const { toast } = useToast();
  const [createStockIn, { isLoading: isCreatingIn }] = usePostInventoryStockInCreateMutation();
  const [createStockIssue, { isLoading: isCreatingIssue }] = usePostInventoryStockIssueCreateMutation();
  const [createTransfer, { isLoading: isCreatingTransfer }] = usePostInventoryStockTransferCreateMutation();
  const { data: itemsResponse } = useGetMasterDataItemsListQuery({});
  const itemsList = itemsResponse?.results || [];
  const { data: warehouses } = useGetMasterDataWarehousesListQuery();
  
  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<StockEntryFormData>({
    defaultValues: {
      name: '',
      posting_date: new Date().toISOString().slice(0, 10),
      remarks: '',
      details: [{ item_id: '', quantity: 1 }]
    }
  });

  const sourceWarehouseId = watch('source_warehouse_id');
  const { data: stockBalances } = useGetInventoryStockLedgerBalanceQuery(
    { warehouseId: sourceWarehouseId },
    { skip: !sourceWarehouseId || type === 'stock_in' }
  );

  const isLoading = isCreatingIn || isCreatingIssue || isCreatingTransfer;
  
  const { fields, append, remove } = useFieldArray({ control, name: 'details' });
  const watchDetails = watch('details');

  const onSubmit = async (data: StockEntryFormData) => {
    try {
      const detailsWithUuid = data.details.map(d => ({
        ...d,
        item_id: itemsList.find(i => i.item_code === d.item_id)?.id || d.item_id
      }));

      if (type === 'stock_in') {
        await createStockIn({ stockInInput: { name: data.name, posting_date: data.posting_date, remarks: data.remarks, details: detailsWithUuid.map(d => ({ ...d, target_warehouse_id: data.target_warehouse_id! })) } }).unwrap();
      } else if (type === 'stock_issue') {
        await createStockIssue({ stockIssueInput: { name: data.name, posting_date: data.posting_date, remarks: data.remarks, source_warehouse_id: data.source_warehouse_id!, details: detailsWithUuid } }).unwrap();
      } else if (type === 'internal_transfer') {
        await createTransfer({ stockTransferInput: { name: data.name, posting_date: data.posting_date, remarks: data.remarks, source_warehouse_id: data.source_warehouse_id!, target_warehouse_id: data.target_warehouse_id!, details: detailsWithUuid } }).unwrap();
      }
      toast('success', 'Tạo phiếu thành công');
      onSuccess();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast('error', error?.data?.error || error?.data?.detail || 'Có lỗi xảy ra');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Tạo Phiếu ${type === 'stock_in' ? 'Nhập' : type === 'stock_issue' ? 'Xuất' : 'Chuyển'} Kho`} size="lg"
      footer={<><Button variant="ghost" onClick={onClose} disabled={isLoading}>Hủy</Button><Button onClick={handleSubmit(onSubmit, (errors) => console.log('Validation errors:', errors))} disabled={isLoading}>Tạo mới</Button></>}>
      <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input label="Tên phiếu" required error={errors.name?.message} {...register('name', { required: 'Bắt buộc' })} />
          <Input label="Ngày ghi sổ" type="date" required error={errors.posting_date?.message} {...register('posting_date', { required: 'Bắt buộc' })} />
        </div>
        {(type === 'stock_issue' || type === 'internal_transfer') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
            <label htmlFor="source_warehouse_id" style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--clr-text-secondary)' }}>Kho nguồn</label>
            <select
              id="source_warehouse_id"
              required
              disabled={isLoading}
              style={{ padding: '10px 14px', border: '1.5px solid var(--clr-border)', borderRadius: 'var(--radius-md)', fontSize: 'var(--fs-base)', background: 'var(--clr-surface)', color: 'var(--clr-text)' }}
              {...register('source_warehouse_id', { required: 'Bắt buộc' })}
            >
              <option value="">-- Chọn kho nguồn --</option>
              {warehouses?.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
            {errors.source_warehouse_id && <span style={{ color: 'var(--clr-error)', fontSize: 'var(--fs-sm)' }}>{errors.source_warehouse_id.message}</span>}
          </div>
        )}
        {(type === 'stock_in' || type === 'internal_transfer') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
            <label htmlFor="target_warehouse_id" style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--clr-text-secondary)' }}>Kho đích</label>
            <select
              id="target_warehouse_id"
              required
              disabled={isLoading}
              style={{ padding: '10px 14px', border: '1.5px solid var(--clr-border)', borderRadius: 'var(--radius-md)', fontSize: 'var(--fs-base)', background: 'var(--clr-surface)', color: 'var(--clr-text)' }}
              {...register('target_warehouse_id', { required: 'Bắt buộc' })}
            >
              <option value="">-- Chọn kho đích --</option>
              {warehouses?.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
            {errors.target_warehouse_id && <span style={{ color: 'var(--clr-error)', fontSize: 'var(--fs-sm)' }}>{errors.target_warehouse_id.message}</span>}
          </div>
        )}

        <Input label="Ghi chú" {...register('remarks')} />
        
        <div style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <h4>Danh sách vật tư</h4>
            <Button type="button" variant="outline" size="sm" onClick={() => append({ item_id: '', quantity: 1 })}>Thêm</Button>
          </div>
          {fields.map((field, index) => {
            const selectedItemCode = watchDetails?.[index]?.item_id;
            const selectedItem = itemsList.find((i) => i.item_code === selectedItemCode);
            const balanceItem = stockBalances?.find(b => b.item_code === selectedItemCode);
            const availableStock = balanceItem?.total_quantity || 0;
            return (
              <div key={field.id} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                <select 
                  aria-label="Mã vật tư"
                  style={{ flex: 1, padding: '0.5rem', border: '1.5px solid var(--clr-border)', borderRadius: 'var(--radius-md)', background: 'var(--clr-surface)', color: 'var(--clr-text)' }} 
                  {...register(`details.${index}.item_id` as const, { required: 'Bắt buộc' })}
                >
                  <option value="">-- Chọn vật tư --</option>
                  {itemsList.map(item => (
                    <option key={item.item_code} value={item.item_code}>
                      {item.item_code} - {item.item_name}
                    </option>
                  ))}
                </select>
                <input style={{ width: '100px', padding: '0.5rem', border: '1.5px solid var(--clr-border)', borderRadius: 'var(--radius-md)' }} type="number" min="1" {...register(`details.${index}.quantity` as const, { valueAsNumber: true, required: 'Bắt buộc', min: { value: 1, message: 'Số lượng tối thiểu là 1' }, validate: val => !isNaN(val) || 'Bắt buộc' })} />
                <span style={{ width: type === 'stock_issue' ? '120px' : '60px', fontSize: 'var(--fs-sm)', color: 'var(--clr-text-secondary)', textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
                  <span>{selectedItem?.stock_uom_name || '-'}</span>
                  {type === 'stock_issue' && selectedItemCode && (
                    <span style={{ fontSize: '11px', color: availableStock > 0 ? 'var(--clr-success)' : 'var(--clr-error)' }}>
                      Tồn: {availableStock}
                    </span>
                  )}
                </span>
                <Button type="button" variant="ghost" onClick={() => remove(index)}><Trash2 size={16}/></Button>
              </div>
            );
          })}
        </div>
      </form>
    </Modal>
  );
}

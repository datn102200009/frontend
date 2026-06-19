import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { Trash2, Plus } from 'lucide-react';
import { Modal } from '@shared/ui/Modal/Modal';
import { Input } from '@shared/ui/Input/Input';
import { TextArea } from '@shared/ui/Input/TextArea';
import { SearchableSelect } from '@shared/ui/Select/SearchableSelect';
import { Button } from '@shared/ui/Button/Button';
import { useToast } from '@shared/ui/Toast/Toast';
import { getDecimalsForUom } from '@shared/lib/uomDecimals';
import { usePostInventoryStockInCreateMutation, usePostInventoryStockIssueCreateMutation, usePostInventoryStockTransferCreateMutation, useGetInventoryStockLedgerBalanceQuery } from '@features/inventory/api/inventoryApi';
import { useGetMasterDataItemsListQuery, useGetMasterDataWarehousesListQuery } from '@features/inventory/api/masterDataApi';

interface StockEntryFormData {
  name: string;
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
    // Validate duplicate items
    const codes = data.details.map(d => d.item_id).filter(Boolean);
    if (new Set(codes).size !== codes.length) {
      toast('error', 'Không được chọn trùng vật tư trong cùng một phiếu');
      return;
    }

    // Validate available stock
    if ((type === 'stock_issue' || type === 'internal_transfer') && sourceWarehouseId) {
      const insufficient = data.details.find(d => {
        const balanceItem = stockBalances?.find(b => b.item_code === d.item_id);
        const availableStock = balanceItem?.total_quantity || 0;
        return d.quantity > availableStock;
      });
      if (insufficient) {
        toast('error', 'Số lượng vượt quá tồn kho khả dụng tại kho nguồn');
        return;
      }
    }

    try {
      const detailsWithUuid = data.details.map(d => ({
        ...d,
        item_id: itemsList.find(i => i.item_code === d.item_id)?.id || d.item_id
      }));

      if (type === 'stock_in') {
        await createStockIn({ stockInInput: { name: data.name, remarks: data.remarks, details: detailsWithUuid.map(d => ({ ...d, target_warehouse_id: data.target_warehouse_id! })) } }).unwrap();
      } else if (type === 'stock_issue') {
        await createStockIssue({ stockIssueInput: { name: data.name, remarks: data.remarks, source_warehouse_id: data.source_warehouse_id!, details: detailsWithUuid } }).unwrap();
      } else if (type === 'internal_transfer') {
        await createTransfer({ stockTransferInput: { name: data.name, remarks: data.remarks, source_warehouse_id: data.source_warehouse_id!, target_warehouse_id: data.target_warehouse_id!, details: detailsWithUuid } }).unwrap();
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
          <Input label="Tên phiếu" required error={errors.name?.message} {...register('name', { required: 'Bắt buộc' })} />
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

        <TextArea label="Ghi chú" rows={3} disabled={isLoading} error={errors.remarks?.message} {...register('remarks')} />
        
        <div style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
            <h4 style={{ margin: 0 }}>Danh sách vật tư</h4>
            <Button type="button" variant="outline" size="sm" icon={<Plus size={14} />} onClick={() => append({ item_id: '', quantity: 1 })}>Thêm</Button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 100px 1fr 32px', gap: '8px', padding: '8px 0', borderBottom: '1px solid var(--clr-border)', fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--clr-text-secondary)' }}>
            <span>Vật tư</span>
            <span>Số lượng</span>
            <span>ĐVT / Tồn</span>
            <span />
          </div>

          {fields.map((field, index) => {
            const selectedItemCode = watchDetails?.[index]?.item_id;
            const selectedItem = itemsList.find((i) => i.item_code === selectedItemCode);
            
            // Get already selected item codes from other rows
            const selectedCodes = watchDetails
              ?.map((it, i) => (i !== index ? it.item_id : null))
              .filter((code): code is string => !!code) ?? [];
            
            const availableItems = itemsList.filter(
              (item) => item.item_code && !selectedCodes.includes(item.item_code)
            );

            // Get balance for this item at source warehouse
            const balanceItem = (type === 'stock_issue' || type === 'internal_transfer')
              ? stockBalances?.find(b => b.item_code === selectedItemCode)
              : null;
            const availableStock = balanceItem?.total_quantity || 0;

            return (
              <div key={field.id} style={{ display: 'grid', gridTemplateColumns: '2fr 100px 1fr 32px', gap: '8px', padding: '8px 0', alignItems: 'center' }}>
                <Controller
                  control={control}
                  name={`details.${index}.item_id` as const}
                  rules={{ required: 'Bắt buộc' }}
                  render={({ field }) => (
                    <SearchableSelect
                      placeholder="-- Chọn vật tư --"
                      ariaLabel="Mã vật tư"
                      options={availableItems.map(item => ({
                        label: `${item.item_name} - ${item.item_code}`,
                        value: item.item_code || ''
                      }))}
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isLoading}
                      error={errors.details?.[index]?.item_id?.message}
                    />
                  )}
                />
                <Input 
                  type="number" 
                  min={0}
                  placeholder="0"
                  size="sm"
                  decimals={getDecimalsForUom(selectedItem?.stock_uom_name)}
                  disabled={isLoading}
                  error={errors.details?.[index]?.quantity?.message}
                  {...register(`details.${index}.quantity` as const, { 
                    valueAsNumber: true, 
                    required: 'Bắt buộc', 
                    validate: {
                      required: (v) => !isNaN(v) || 'Bắt buộc nhập số lượng',
                      positive: (v) => v > 0 || 'Số lượng phải lớn hơn 0',
                    }
                  })} 
                />
                
                <div style={{ display: 'flex', flexDirection: 'column', fontSize: 'var(--fs-sm)', color: 'var(--clr-text-secondary)', paddingLeft: '4px' }}>
                  <span>{selectedItem?.stock_uom_name || '-'}</span>
                  {(type === 'stock_issue' || type === 'internal_transfer') && selectedItemCode && (
                    <span style={{ fontSize: '11px', color: availableStock > 0 ? 'var(--clr-success)' : 'var(--clr-error)', fontWeight: 600 }}>
                      Tồn: {availableStock}
                    </span>
                  )}
                </div>

                <button 
                  type="button" 
                  onClick={() => remove(index)}
                  disabled={fields.length <= 1 || isLoading}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: fields.length <= 1 ? 'not-allowed' : 'pointer', color: 'var(--clr-text-muted)', opacity: fields.length <= 1 ? 0.4 : 1 }}
                  aria-label="Xóa vật tư"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      </form>
    </Modal>
  );
}

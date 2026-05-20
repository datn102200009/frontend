import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Button } from '@shared/ui/Button/Button';
import { Input } from '@shared/ui/Input/Input';
import { FormSelect as Select } from '@shared/ui/Select/FormSelect';
import { usePutPurchasingOrdersByPkMutation } from '@entities/purchasing/api/purchasingApi';
import type { PurchaseOrder, PurchaseOrderInput } from '@entities/purchasing/model/types';
import { MOCK_IDS } from '@shared/api/mockData';

interface UpdatePOFormProps {
  order: PurchaseOrder;
  onSuccess?: () => void;
}

export const UpdatePurchaseOrderForm: React.FC<UpdatePOFormProps> = ({ order, onSuccess }) => {
  const [updateOrder, { isLoading }] = usePutPurchasingOrdersByPkMutation();
  
  const { register, control, handleSubmit, formState: { errors } } = useForm<PurchaseOrderInput>({
    defaultValues: {
      vendor_id: order.vendor,
      status: order.status,
      lines: order.lines.map(l => ({ item_id: l.item, quantity: l.quantity, unit_price: l.unit_price })),
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines'
  });

  const onSubmit = async (data: PurchaseOrderInput) => {
    try {
      await updateOrder({ pk: order.id, purchaseOrderInput: data }).unwrap();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Failed to update order', err);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
      <div>
        <h3 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">Update Order: {order.id.slice(0,8)}</h3>
        <p className="text-sm text-slate-500 mb-6">Modify details of this draft order.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select 
            label="Vendor" 
            {...register('vendor_id', { required: 'Vendor is required' })}
            error={errors.vendor_id?.message}
            options={[
              { value: MOCK_IDS.VENDOR_1, label: 'Tech Component Supplier' },
            ]}
          />
          <Select 
            label="Status" 
            {...register('status', { required: 'Status is required' })}
            error={errors.status?.message}
            options={[
              { value: 'draft', label: 'Draft' },
              { value: 'pending', label: 'Pending (Ready to receive)' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />
        </div>
      </div>

      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200/60">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-base font-semibold text-slate-800">Order Lines</h4>
          <Button type="button" variant="outline" size="sm" onClick={() => append({ item_id: MOCK_IDS.ITEM_2, quantity: 1, unit_price: 0 })}>
            + Add Item
          </Button>
        </div>
        
        <div className="flex flex-col gap-4">
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-4 items-start bg-white p-4 rounded-lg shadow-sm border border-slate-100">
              <div className="flex-1">
                <Select 
                  label="Item" 
                  {...register(`lines.${index}.item_id` as const, { required: 'Item is required' })}
                  options={[
                    { value: MOCK_IDS.ITEM_1, label: 'STM32 Microcontroller' },
                    { value: MOCK_IDS.ITEM_2, label: '16x2 LCD Display' },
                  ]}
                />
              </div>
              <div className="w-32">
                <Input 
                  label="Quantity" 
                  type="number" 
                  min="0.01" step="0.01"
                  {...register(`lines.${index}.quantity` as const, { required: true, valueAsNumber: true, min: 0.01 })}
                />
              </div>
              <div className="w-48">
                <Input 
                  label="Unit Price" 
                  type="number" 
                  min="0"
                  {...register(`lines.${index}.unit_price` as const, { required: true, valueAsNumber: true, min: 0 })}
                />
              </div>
              <div className="pt-7">
                <Button type="button" variant="danger" onClick={() => remove(index)}>Remove</Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-100">
        <Button type="submit" loading={isLoading} className="min-w-[120px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md shadow-indigo-200">
          Save Changes
        </Button>
      </div>
    </form>
  );
};

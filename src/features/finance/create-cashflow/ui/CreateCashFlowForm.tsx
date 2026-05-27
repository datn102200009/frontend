import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@shared/ui/Button/Button';
import { Input } from '@shared/ui/Input/Input';
import { FormSelect as Select } from '@shared/ui/Select/FormSelect';
import { usePostFinanceCashFlowsMutation } from '@entities/finance/api/financeApi';
import type { CashFlowInput } from '@entities/finance/model/types';
import { useGetPurchasingOrdersQuery, useGetPurchasingInvoicesQuery } from '@entities/purchasing/api/purchasingApi';
import { useGetSalesOrdersQuery, useGetSalesInvoicesQuery } from '@entities/sales/api/salesApi';

export const CreateCashFlowForm: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const [createCashFlow, { isLoading }] = usePostFinanceCashFlowsMutation();
  const { data: purchaseOrders } = useGetPurchasingOrdersQuery();
  const { data: purchaseInvoices } = useGetPurchasingInvoicesQuery();
  const { data: salesOrders } = useGetSalesOrdersQuery();
  const { data: salesInvoices } = useGetSalesInvoicesQuery();
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<CashFlowInput>({
    defaultValues: {
      payment_type: 'receive',
      amount: 1000000,
      payment_date: new Date().toISOString().split('T')[0],
      category: 'payment',
    }
  });

  const paymentType = watch('payment_type');

  const onSubmit = async (data: CashFlowInput) => {
    try {
      await createCashFlow({ cashFlowInput: data }).unwrap();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Failed to record transaction', err);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
      <div>
        <h3 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">Record Cash Flow</h3>
        <p className="text-sm text-slate-500 mb-6">Record a new payment receipt or disbursement.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Select 
            label="Type" 
            {...register('payment_type')}
            options={[
              { value: 'receive', label: 'Cash In (Receive)' },
              { value: 'pay', label: 'Cash Out (Pay)' },
            ]}
          />
          <Input 
            label="Amount (VND)" 
            type="number" 
            min="0.01" step="0.01"
            {...register('amount', { required: 'Bắt buộc', valueAsNumber: true, min: { value: 0.01, message: 'Số tiền tối thiểu là 0.01' }, validate: val => !isNaN(val) || 'Bắt buộc' })}
            error={errors.amount?.message}
          />
          <Input 
            label="Date" 
            type="date" 
            {...register('payment_date', { required: 'Bắt buộc' })}
            error={errors.payment_date?.message}
          />
          <Select 
            label="Category" 
            {...register('category')}
            options={[
              { value: 'payment', label: 'Invoice Payment' },
              { value: 'deposit', label: 'Advance Deposit' },
              { value: 'operational', label: 'Operational Expense' },
            ]}
          />
        </div>
      </div>

      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200/60">
        <h4 className="text-base font-semibold text-slate-800 mb-4">Reference Document (Optional)</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {paymentType === 'pay' ? (
            <>
              <Select 
                label="Purchase Order (for deposit)" 
                {...register('purchase_order_id')}
                options={[
                  { value: '', label: 'None' },
                  ...(purchaseOrders?.map(po => ({
                    value: po.id || '',
                    label: `PO: ${po.id?.slice(0, 8).toUpperCase()} (${po.vendor_name || 'N/A'})`
                  })) || [])
                ]}
              />
              <Select 
                label="Purchase Invoice (for payment)" 
                {...register('purchase_invoice_id')}
                options={[
                  { value: '', label: 'None' },
                  ...(purchaseInvoices?.map(pi => ({
                    value: pi.id || '',
                    label: `PI: ${pi.id?.slice(0, 8).toUpperCase()} (${pi.vendor_name || 'N/A'})`
                  })) || [])
                ]}
              />
            </>
          ) : (
            <>
              <Select 
                label="Sales Order (for deposit)" 
                {...register('sales_order_id')}
                options={[
                  { value: '', label: 'None' },
                  ...(salesOrders?.map(so => ({
                    value: so.id || '',
                    label: `SO: ${so.id?.slice(0, 8).toUpperCase()} (${so.customer_name || 'N/A'})`
                  })) || [])
                ]}
              />
              <Select 
                label="Sales Invoice (for payment)" 
                {...register('sales_invoice_id')}
                options={[
                  { value: '', label: 'None' },
                  ...(salesInvoices?.map(si => ({
                    value: si.id || '',
                    label: `SI: ${si.id?.slice(0, 8).toUpperCase()} (${si.customer_name || 'N/A'})`
                  })) || [])
                ]}
              />
            </>
          )}
        </div>
      </div>
      
      <div>
        <Input 
          label="Remarks / Note" 
          {...register('remarks')}
          placeholder="E.g., Bank transfer for Inv #..."
        />
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-100">
        <Button type="submit" loading={isLoading} className="min-w-[150px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md shadow-indigo-200">
          Save Transaction
        </Button>
      </div>
    </form>
  );
};

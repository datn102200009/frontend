import React, { useMemo } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { DataTable } from '@shared/ui/DataTable/DataTable';
import { Badge } from '@shared/ui/Badge/Badge';
import { useGetFinanceCashFlowsQuery } from '@entities/finance/api/financeApi';
import type { CashFlowTransaction } from '@entities/finance/model/types';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export const CashFlowTable: React.FC = () => {
  const { data: flows = [], isLoading } = useGetFinanceCashFlowsQuery();

  const columns = useMemo(() => {
    const helper = createColumnHelper<CashFlowTransaction>();
    return [
      helper.accessor('id', {
        header: 'Mã Giao Dịch',
        cell: (info) => <span className="text-slate-500">{info.getValue().slice(0, 8).toUpperCase()}</span>,
      }),
      helper.accessor('payment_type', {
        header: 'Loại',
        cell: (info) => {
          const type = info.getValue();
          return type === 'receive' ? (
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <ArrowDownLeft size={16} /> Thu Tiền
            </span>
          ) : (
            <span className="flex items-center gap-1 text-rose-600 font-medium">
              <ArrowUpRight size={16} /> Chi Tiền
            </span>
          );
        },
      }),
      helper.accessor('amount', {
        header: 'Số Tiền',
        cell: (info) => {
          const type = info.row.original.payment_type;
          const formatted = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(info.getValue());
          return <span className={type === 'receive' ? 'text-emerald-700' : 'text-rose-700'}>{formatted}</span>;
        },
      }),
      helper.accessor('category', {
        header: 'Phương Thức',
        cell: (info) => <Badge variant="neutral">{info.getValue() || 'Khác'}</Badge>,
      }),
      helper.accessor('remarks', {
        header: 'Ghi Chú',
        cell: (info) => <span className="text-slate-600 max-w-xs truncate inline-block" title={info.getValue() || ''}>{info.getValue() || '-'}</span>,
      }),
      helper.accessor('payment_date', {
        header: 'Ngày',
        cell: (info) => new Date(info.getValue()).toLocaleDateString('vi-VN'),
      }),
    ];
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <DataTable 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        columns={columns as any} 
        data={flows} 
        loading={isLoading}
        searchPlaceholder="Tìm kiếm giao dịch..."
        emptyMessage="Không tìm thấy giao dịch dòng tiền nào"
      />
    </div>
  );
};

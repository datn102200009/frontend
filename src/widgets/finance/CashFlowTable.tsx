import React, { useMemo } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { DataTable } from '@shared/ui/DataTable/DataTable';
import { Badge } from '@shared/ui/Badge/Badge';
import { useGetFinanceCashFlowsQuery } from '@entities/finance/api/financeApi';
import type { CashFlowTransaction } from '@entities/finance/model/types';
import { formatVND } from '@shared/lib/formatVND';
import { shortId } from '@shared/lib/shortId';


export const CashFlowTable: React.FC = () => {
  const { data: flowsData, isLoading } = useGetFinanceCashFlowsQuery({});
  const flows = Array.isArray(flowsData) ? flowsData : (flowsData as { results?: CashFlowTransaction[] })?.results || [];

  const columns = useMemo(() => {
    const helper = createColumnHelper<CashFlowTransaction>();
    return [
      helper.accessor('id', {
        header: 'Mã Giao Dịch',
        cell: (info) => <span className="text-slate-500">{shortId(info.getValue())}</span>,
      }),
      helper.accessor('payment_type', {
        header: 'Loại',
        cell: (info) => {
          const type = info.getValue();
          return type === 'receive' ? (
            <Badge variant="success">Thu Tiền</Badge>
          ) : (
            <Badge variant="error">Chi Tiền</Badge>
          );
        },
      }),
      helper.accessor('amount', {
        header: 'Số Tiền',
        cell: (info) => {
          const type = info.row.original.payment_type;
          const formatted = formatVND(info.getValue());
          return <span className={type === 'receive' ? 'text-emerald-700' : 'text-rose-700'}>{formatted}</span>;
        },
      }),
      helper.accessor('category', {
        header: 'Phân Loại',
        cell: (info) => <Badge variant="neutral">{info.getValue() || 'Chưa phân loại'}</Badge>,
      }),
      helper.accessor('payment_method', {
        header: 'Phương Thức',
        cell: (info) => {
          const method = info.getValue();
          const labels: Record<string, string> = {
            cash: 'Tiền mặt',
            bank_transfer: 'Chuyển khoản',
            credit_card: 'Thẻ tín dụng',
            other: 'Khác',
          };
          return <span className="text-slate-600">{labels[method] || method || '-'}</span>;
        },
      }),
      helper.accessor('remarks', {
        header: 'Ghi Chú',
        cell: (info) => <span className="text-slate-600 max-w-xs truncate inline-block" title={info.getValue() || ''}>{info.getValue() || '-'}</span>,
      }),
      helper.accessor('payment_date', {
        header: 'Ngày',
        cell: (info) => {
          const val = info.getValue();
          return val ? new Date(val).toLocaleDateString('vi-VN') : '-';
        },
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

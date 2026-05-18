import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../../shared/ui/DataTable/DataTable';
import { Badge } from '../../../shared/ui/Badge/Badge';
import { useGetInventoryStockLedgerBalanceQuery } from '../api/inventoryApi';
import { useGetMasterDataWarehousesListQuery } from '../api/masterDataApi';

export function StockLedgerView() {
  const [filterWarehouse, setFilterWarehouse] = useState('');

  const { data: warehouses = [] } = useGetMasterDataWarehousesListQuery();
  const { data: stockBalances = [], isLoading, error } = useGetInventoryStockLedgerBalanceQuery(
    filterWarehouse ? { warehouseId: filterWarehouse } : {}
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = useMemo<ColumnDef<any, unknown>[]>(
    () => [
      { accessorKey: 'item_code', header: 'Mã SP', size: 120 },
      { accessorKey: 'item_name', header: 'Tên Sản Phẩm' },
      {
        accessorKey: 'warehouse_name',
        header: 'Kho',
        size: 160,
        cell: ({ getValue }) => <Badge variant="info">{getValue<string>() || 'Tất cả kho'}</Badge>,
      },
      {
        accessorKey: 'total_quantity',
        header: 'Tồn Kho',
        size: 100,
        cell: ({ row }) => {
          const qty = row.original.total_quantity || 0;
          return (
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              {qty}
            </span>
          );
        },
      },
      { accessorKey: 'uom', header: 'ĐVT', size: 80 },
    ],
    [],
  );

  if (isLoading) return <div>Đang tải dữ liệu tồn kho...</div>;
  if (error) return <div style={{ color: 'var(--clr-error)' }}>Lỗi khi tải dữ liệu tồn kho</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--sp-3)' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--fs-lg)', fontWeight: 600, margin: 0 }}>Tồn Kho</h2>
          <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)', marginTop: 2 }}>{stockBalances.length} bản ghi</p>
        </div>
        <select
          value={filterWarehouse}
          onChange={(e) => setFilterWarehouse(e.target.value)}
          aria-label="Lọc theo kho"
          style={{
            padding: '8px 14px',
            border: '1.5px solid var(--clr-border)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--fs-sm)',
            background: 'var(--clr-surface)',
            color: 'var(--clr-text)',
            minWidth: 180,
          }}
        >
          <option value="">Tất cả kho</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
      </div>
      <DataTable columns={columns} data={stockBalances} searchPlaceholder="Tìm theo mã hoặc tên sản phẩm..." />
    </div>
  );
}

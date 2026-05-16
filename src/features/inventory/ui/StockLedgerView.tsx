import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../../shared/ui/DataTable/DataTable';
import { Badge } from '../../../shared/ui/Badge/Badge';
import type { StockLedgerEntry } from '../model/types';
import { MOCK_STOCK_LEDGER, MOCK_WAREHOUSES, MOCK_PRODUCTS } from '../model/mockData';

export function StockLedgerView() {
  const [filterWarehouse, setFilterWarehouse] = useState('');

  const filtered = useMemo(() => {
    if (!filterWarehouse) return MOCK_STOCK_LEDGER;
    return MOCK_STOCK_LEDGER.filter((e) => e.warehouse === filterWarehouse);
  }, [filterWarehouse]);

  const columns = useMemo<ColumnDef<StockLedgerEntry, unknown>[]>(
    () => [
      { accessorKey: 'item_code', header: 'Mã SP', size: 120 },
      { accessorKey: 'item_name', header: 'Tên Sản Phẩm' },
      {
        accessorKey: 'warehouse',
        header: 'Kho',
        size: 160,
        cell: ({ getValue }) => <Badge variant="info">{getValue<string>()}</Badge>,
      },
      {
        accessorKey: 'quantity',
        header: 'Tồn Kho',
        size: 100,
        cell: ({ row }) => {
          const qty = row.original.quantity;
          const product = MOCK_PRODUCTS.find((p) => p.item_code === row.original.item_code);
          const isLow = product ? qty < product.min_stock : false;
          return (
            <span style={{ fontVariantNumeric: 'tabular-nums', color: isLow ? 'var(--clr-error)' : 'inherit', fontWeight: isLow ? 600 : 400 }}>
              {qty}
              {isLow && ' ⚠'}
            </span>
          );
        },
      },
      { accessorKey: 'unit', header: 'ĐVT', size: 80 },
    ],
    [],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--sp-3)' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--fs-lg)', fontWeight: 600, margin: 0 }}>Tồn Kho</h2>
          <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)', marginTop: 2 }}>{filtered.length} bản ghi</p>
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
          {MOCK_WAREHOUSES.map((w) => (
            <option key={w.id} value={w.name}>{w.name}</option>
          ))}
        </select>
      </div>
      <DataTable columns={columns} data={filtered} searchPlaceholder="Tìm theo mã hoặc tên sản phẩm..." />
    </div>
  );
}

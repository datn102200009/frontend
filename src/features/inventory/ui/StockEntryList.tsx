import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus, CheckCircle } from 'lucide-react';
import { DataTable } from '../../../shared/ui/DataTable/DataTable';
import { Button } from '../../../shared/ui/Button/Button';
import { Badge } from '../../../shared/ui/Badge/Badge';
import { Modal } from '../../../shared/ui/Modal/Modal';
import { useToast } from '../../../shared/ui/Toast/Toast';
import type { StockEntry, StockEntryType, StockEntryStatus } from '../model/types';
import { MOCK_STOCK_ENTRIES } from '../model/mockData';

const TYPE_LABELS: Record<StockEntryType, string> = {
  stock_in: 'Nhập kho',
  stock_issue: 'Xuất kho SX',
  internal_transfer: 'Chuyển kho',
};

const TYPE_VARIANTS: Record<StockEntryType, 'success' | 'warning' | 'info'> = {
  stock_in: 'success',
  stock_issue: 'warning',
  internal_transfer: 'info',
};

const STATUS_LABELS: Record<StockEntryStatus, { label: string; variant: 'neutral' | 'success' }> = {
  draft: { label: 'Nháp', variant: 'neutral' },
  approved: { label: 'Đã duyệt', variant: 'success' },
};

export function StockEntryList() {
  const [entries, setEntries] = useState<StockEntry[]>(MOCK_STOCK_ENTRIES);
  const [approving, setApproving] = useState<StockEntry | null>(null);
  const { toast } = useToast();

  const handleApprove = (entry: StockEntry) => {
    setApproving(entry);
  };

  const confirmApprove = () => {
    if (!approving) return;
    setEntries((prev) =>
      prev.map((e) =>
        e.id === approving.id ? { ...e, status: 'approved' as const, approved_at: new Date().toISOString().slice(0, 10) } : e,
      ),
    );
    toast('success', `Phê duyệt ${approving.code} thành công — đã ghi sổ cái`);
    setApproving(null);
  };

  const columns = useMemo<ColumnDef<StockEntry, unknown>[]>(
    () => [
      { accessorKey: 'code', header: 'Mã Phiếu', size: 140 },
      {
        accessorKey: 'type',
        header: 'Loại',
        size: 130,
        cell: ({ getValue }) => {
          const t = getValue<StockEntryType>();
          return <Badge variant={TYPE_VARIANTS[t]}>{TYPE_LABELS[t]}</Badge>;
        },
      },
      {
        id: 'warehouse',
        header: 'Kho',
        cell: ({ row }) => {
          const e = row.original;
          if (e.type === 'internal_transfer') return `${e.source_warehouse} → ${e.target_warehouse}`;
          return e.source_warehouse ?? e.target_warehouse ?? '—';
        },
      },
      {
        id: 'itemCount',
        header: 'Số mục',
        size: 80,
        cell: ({ row }) => row.original.items.length,
      },
      {
        accessorKey: 'status',
        header: 'Trạng Thái',
        size: 110,
        cell: ({ getValue }) => {
          const s = STATUS_LABELS[getValue<StockEntryStatus>()];
          return <Badge variant={s.variant}>{s.label}</Badge>;
        },
      },
      { accessorKey: 'created_at', header: 'Ngày Tạo', size: 110 },
      {
        id: 'actions',
        header: '',
        size: 120,
        enableSorting: false,
        cell: ({ row }) =>
          row.original.status === 'draft' ? (
            <Button variant="secondary" size="sm" icon={<CheckCircle size={14} />} onClick={() => handleApprove(row.original)}>
              Duyệt
            </Button>
          ) : null,
      },
    ],
    [],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--fs-lg)', fontWeight: 600, margin: 0 }}>Phiếu Kho</h2>
          <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)', marginTop: 2 }}>{entries.length} phiếu</p>
        </div>
        <Button icon={<Plus size={16} />}>Tạo phiếu</Button>
      </div>
      <DataTable columns={columns} data={entries} searchPlaceholder="Tìm mã phiếu..." />

      {approving && (
        <Modal
          open
          onClose={() => setApproving(null)}
          title="Xác Nhận Phê Duyệt"
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setApproving(null)}>Hủy</Button>
              <Button variant="primary" onClick={confirmApprove}>Phê duyệt</Button>
            </>
          }
        >
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text)' }}>
            Bạn có chắc chắn muốn phê duyệt phiếu <strong>"{approving.code}"</strong> không? Hành động này sẽ ghi sổ cái và không thể hoàn tác.
          </p>
        </Modal>
      )}
    </div>
  );
}

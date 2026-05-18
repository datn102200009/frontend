import { useMemo, useState } from 'react';
import { useGetInventoryStockEntryListQuery, usePostInventoryStockInByStockEntryIdApproveMutation, usePostInventoryStockIssueByStockEntryIdApproveMutation, usePostInventoryStockTransferByStockEntryIdApproveMutation } from '../api/inventoryApi';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus, CheckCircle, Eye } from 'lucide-react';
import { DataTable } from '../../../shared/ui/DataTable/DataTable';
import { Button } from '../../../shared/ui/Button/Button';
import { Badge } from '../../../shared/ui/Badge/Badge';
import { Modal } from '../../../shared/ui/Modal/Modal';
import { useToast } from '../../../shared/ui/Toast/Toast';
import { StockEntryForm } from './StockEntryForm';
import { StockEntryDetailModal } from './StockEntryDetailModal';
import { formatDateTime } from '../../../shared/lib/formatDate';
import type { StockEntry } from '../api/inventoryApi';


const PURPOSE_LABELS: Record<string, string> = {
  receipt: 'Nhập kho',
  issue: 'Xuất kho SX',
  transfer: 'Chuyển kho',
  manufacture: 'Sản xuất',
  adjustment: 'Điều chỉnh',
};

const PURPOSE_VARIANTS: Record<string, 'success' | 'warning' | 'info' | 'default'> = {
  receipt: 'success',
  issue: 'warning',
  transfer: 'info',
  manufacture: 'info',
  adjustment: 'default',
};

const STATUS_LABELS: Record<string, { label: string; variant: 'neutral' | 'success' | 'warning' }> = {
  draft: { label: 'Nháp', variant: 'neutral' },
  submitted: { label: 'Chờ duyệt', variant: 'warning' },
  posted: { label: 'Đã duyệt', variant: 'success' },
};

export function StockEntryList() {
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'posted'>('all');
  const { data: entriesData, isLoading, refetch } = useGetInventoryStockEntryListQuery({ status: statusFilter === 'all' ? 'all' : statusFilter });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entries = (entriesData as any)?.results || (Array.isArray(entriesData) ? entriesData : []);
  const [approveStockIn, { isLoading: isApprovingIn }] = usePostInventoryStockInByStockEntryIdApproveMutation();
  const [approveStockIssue, { isLoading: isApprovingIssue }] = usePostInventoryStockIssueByStockEntryIdApproveMutation();
  const [approveStockTransfer, { isLoading: isApprovingTransfer }] = usePostInventoryStockTransferByStockEntryIdApproveMutation();
  const [approving, setApproving] = useState<StockEntry | null>(null);
  const [viewingEntry, setViewingEntry] = useState<StockEntry | null>(null);
  const [showCreate, setShowCreate] = useState<'stock_in' | 'stock_issue' | 'internal_transfer' | null>(null);
  const { toast } = useToast();
  const isApproving = isApprovingIn || isApprovingIssue || isApprovingTransfer;

  const handleApprove = (entry: StockEntry) => {
    setApproving(entry);
  };

  const confirmApprove = async () => {
    if (!approving) return;
    try {
      if (approving.purpose === 'receipt') await approveStockIn({ stockEntryId: approving.id! }).unwrap();
      else if (approving.purpose === 'issue') await approveStockIssue({ stockEntryId: approving.id! }).unwrap();
      else if (approving.purpose === 'transfer') await approveStockTransfer({ stockEntryId: approving.id! }).unwrap();
      
      toast('success', `Phê duyệt ${approving.name} thành công — đã ghi sổ cái`);
      setApproving(null);
      refetch();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast('error', error?.data?.detail || 'Có lỗi xảy ra khi phê duyệt');
    }
  };

  const columns = useMemo<ColumnDef<StockEntry, unknown>[]>(
    () => [
      { accessorKey: 'name', header: 'Mã Phiếu', size: 140 },
      {
        accessorKey: 'purpose',
        header: 'Loại',
        size: 130,
        cell: ({ getValue }) => {
          const t = getValue<string>();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return <Badge variant={PURPOSE_VARIANTS[t] as any}>{PURPOSE_LABELS[t] || t}</Badge>;
        },
      },
      {
        accessorKey: 'remarks',
        header: 'Ghi Chú',
        cell: ({ getValue }) => <span style={{ color: 'var(--clr-text-secondary)', fontSize: 'var(--fs-sm)' }}>{getValue<string>() || '—'}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng Thái',
        size: 110,
        cell: ({ getValue }) => {
          const s = STATUS_LABELS[getValue<string>()] || { label: getValue<string>(), variant: 'neutral' };
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return <Badge variant={s.variant as any}>{s.label}</Badge>;
        },
      },
      {
        accessorKey: 'created_at',
        header: 'Ngày Tạo',
        size: 140,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cell: ({ row }) => formatDateTime((row.original as any).created_at),
      },
      {
        id: 'actions',
        header: '',
        size: 150,
        enableSorting: false,
        cell: ({ row }) => (
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button variant="ghost" size="sm" icon={<Eye size={14} />} onClick={() => setViewingEntry(row.original)}>
              Chi tiết
            </Button>
            {row.original.status === 'draft' ? (
              <Button variant="secondary" size="sm" icon={<CheckCircle size={14} />} onClick={() => handleApprove(row.original)}>
                Duyệt
              </Button>
            ) : null}
          </div>
        )
      },
    ],
    [],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--fs-lg)', fontWeight: 600, margin: 0 }}>Phiếu Kho</h2>
            <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)', marginTop: 2 }}>{entries.length} phiếu</p>
          </div>
          <div style={{ display: 'flex', background: 'var(--clr-surface)', padding: 4, borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-border)' }}>
            <button 
              onClick={() => setStatusFilter('all')}
              style={{ padding: '6px 12px', fontSize: 'var(--fs-sm)', borderRadius: 'var(--radius-sm)', border: 'none', background: statusFilter === 'all' ? 'var(--clr-bg)' : 'transparent', color: statusFilter === 'all' ? 'var(--clr-text)' : 'var(--clr-text-muted)', cursor: 'pointer', fontWeight: statusFilter === 'all' ? 600 : 400 }}
            >
              Tất cả
            </button>
            <button 
              onClick={() => setStatusFilter('draft')}
              style={{ padding: '6px 12px', fontSize: 'var(--fs-sm)', borderRadius: 'var(--radius-sm)', border: 'none', background: statusFilter === 'draft' ? 'var(--clr-bg)' : 'transparent', color: statusFilter === 'draft' ? 'var(--clr-text)' : 'var(--clr-text-muted)', cursor: 'pointer', fontWeight: statusFilter === 'draft' ? 600 : 400 }}
            >
              Chờ duyệt
            </button>
            <button 
              onClick={() => setStatusFilter('posted')}
              style={{ padding: '6px 12px', fontSize: 'var(--fs-sm)', borderRadius: 'var(--radius-sm)', border: 'none', background: statusFilter === 'posted' ? 'var(--clr-bg)' : 'transparent', color: statusFilter === 'posted' ? 'var(--clr-text)' : 'var(--clr-text-muted)', cursor: 'pointer', fontWeight: statusFilter === 'posted' ? 600 : 400 }}
            >
              Đã duyệt
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button icon={<Plus size={16} />} onClick={() => setShowCreate('stock_in')}>Nhập Kho</Button>
          <Button icon={<Plus size={16} />} variant="secondary" onClick={() => setShowCreate('stock_issue')}>Xuất Kho</Button>
          <Button icon={<Plus size={16} />} variant="outline" onClick={() => setShowCreate('internal_transfer')}>Chuyển Kho</Button>
        </div>
      </div>
      <DataTable columns={columns} data={entries} searchPlaceholder="Tìm mã phiếu..." loading={isLoading} />

      {approving && (
        <Modal
          open
          onClose={() => setApproving(null)}
          title="Xác Nhận Phê Duyệt"
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setApproving(null)}>Hủy</Button>
              <Button variant="primary" onClick={confirmApprove} disabled={isApproving}>Phê duyệt</Button>
            </>
          }
        >
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text)' }}>
            Bạn có chắc chắn muốn phê duyệt phiếu <strong>"{approving.name}"</strong> không? Hành động này sẽ ghi sổ cái và không thể hoàn tác.
          </p>
        </Modal>
      )}

      {showCreate && (
        <StockEntryForm
          open={true}
          type={showCreate}
          onClose={() => setShowCreate(null)}
          onSuccess={() => {
            setShowCreate(null);
            refetch();
          }}
        />
      )}

      {viewingEntry && (
        <StockEntryDetailModal
          open
          entry={viewingEntry}
          onClose={() => setViewingEntry(null)}
        />
      )}
    </div>
  );
}

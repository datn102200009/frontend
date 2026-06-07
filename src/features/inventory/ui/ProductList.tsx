import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { DataTable } from '@shared/ui/DataTable/DataTable';
import { TableActions, ActionButton } from '@shared/ui/TableActions/TableActions';
import { Button } from '@shared/ui/Button/Button';
import { Badge } from '@shared/ui/Badge/Badge';
import { Modal } from '@shared/ui/Modal/Modal';
import { useToast } from '@shared/ui/Toast/Toast';
import { ProductFormModal } from './ProductFormModal';
import {
  useGetMasterDataItemsListQuery,
  useDeleteMasterDataItemsByItemCodeDeleteMutation,
  type Item,
} from '../api/masterDataApi';

const STATUS_MAP: Record<string, { label: string; variant: 'neutral' | 'warning' | 'success' | 'error' }> = {
  active: { label: 'Hoạt động', variant: 'success' },
  inactive: { label: 'Ngừng HĐ', variant: 'neutral' },
  discontinued: { label: 'Ngừng KD', variant: 'error' },
};

export function ProductList() {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Item | null>(null);
  const [deleting, setDeleting] = useState<Item | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const { toast } = useToast();

  const { data, isLoading, isFetching, refetch } = useGetMasterDataItemsListQuery({
    search: search || undefined,
  });

  const [deleteItem, { isLoading: isDeleting }] = useDeleteMasterDataItemsByItemCodeDeleteMutation();

  const handleDelete = (p: Item) => {
    setDeleting(p);
  };

  const confirmDelete = async () => {
    if (!deleting?.item_code) return;
    try {
      await deleteItem({ itemCode: deleting.item_code }).unwrap();
      toast('success', `Đã xóa sản phẩm ${deleting.item_code}`);
      setDeleting(null);
      refetch();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast('error', error?.data?.error || error?.data?.detail || 'Lỗi: Không thể xóa sản phẩm này');
    }
  };

  const columns = useMemo<ColumnDef<Item, unknown>[]>(
    () => [
      { accessorKey: 'item_code', header: 'Mã SP', size: 120 },
      { accessorKey: 'item_name', header: 'Tên Sản Phẩm' },
      {
        accessorKey: 'stock_uom_name',
        header: 'Đơn vị tính',
        size: 140,
        cell: ({ getValue }) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{getValue<string>() ?? '-'}</span>,
      },
      {
        accessorKey: 'is_import',
        header: 'Nhập khẩu',
        size: 100,
        cell: ({ getValue }) => (getValue<boolean>() ? 'Có' : 'Không'),
      },
      {
        accessorKey: 'status',
        header: 'Trạng Thái',
        size: 120,
        cell: ({ getValue }) => {
          const val = getValue<string>() || 'active';
          const s = STATUS_MAP[val];
          return <Badge variant={s?.variant || 'neutral'}>{s?.label || val}</Badge>;
        },
      },
      {
        id: 'actions',
        header: 'Thao Tác',
        size: 100,
        enableSorting: false,
        cell: ({ row }) => (
          <TableActions>
            <ActionButton
              icon={<Pencil size={18} />}
              title="Chỉnh sửa"
              onClick={() => setEditing(row.original)}
            />
            <ActionButton
              icon={<Trash2 size={18} />}
              title="Xóa"
              variant="danger"
              onClick={() => handleDelete(row.original)}
            />
          </TableActions>
        ),
      },
    ],
    [],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--fs-lg)', fontWeight: 600, margin: 0 }}>Danh Sách Sản Phẩm</h2>
          <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)', marginTop: 2 }}>
            {data?.count ?? 0} sản phẩm
          </p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setShowCreate(true)}>Thêm SP</Button>
      </div>

      <DataTable
        columns={columns}
        data={data?.results || []}
        loading={isLoading || isFetching}
        searchPlaceholder="Tìm mã hoặc tên sản phẩm..."
        onSearch={setSearch}
      />

      {(showCreate || editing) && (
        <ProductFormModal
          open
          product={editing}
          onClose={() => { setShowCreate(false); setEditing(null); }}
          onSuccess={() => refetch()}
        />
      )}

      {deleting && (
        <Modal
          open
          onClose={() => setDeleting(null)}
          title="Xác Nhận Xóa"
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setDeleting(null)} disabled={isDeleting}>Hủy</Button>
              <Button variant="danger" onClick={confirmDelete} disabled={isDeleting}>
                {isDeleting ? 'Đang xóa...' : 'Xóa Sản Phẩm'}
              </Button>
            </>
          }
        >
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text)' }}>
            Bạn có chắc chắn muốn xóa sản phẩm <strong>"{deleting.item_name}"</strong> không? 
            Nếu sản phẩm đã phát sinh giao dịch, hệ thống sẽ từ chối thao tác này.
          </p>
        </Modal>
      )}
    </div>
  );
}

import { useMemo, useState } from 'react';
import { useGetManufacturingBomListQuery, useDeleteManufacturingBomByBomIdDeleteMutation } from '@features/manufacturing/api/manufacturingApi';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2, Eye, Plus } from 'lucide-react';
import { DataTable } from '@shared/ui/DataTable/DataTable';
import { Button } from '@shared/ui/Button/Button';
import { Badge } from '@shared/ui/Badge/Badge';
import { Modal } from '@shared/ui/Modal/Modal';
import { BomFormModal } from './BomFormModal';
import { useToast } from '@shared/ui/Toast/Toast';
import { type Bom } from '@features/manufacturing/api/manufacturingApi';
import { formatDateTime } from '@shared/lib/formatDate';
import styles from './BomList.module.css';

export function BomList() {
  const { data: bomsData, isLoading, refetch } = useGetManufacturingBomListQuery({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const boms = (bomsData as any)?.results || (Array.isArray(bomsData) ? bomsData : []);
  const [deleteBom, { isLoading: isDeleting }] = useDeleteManufacturingBomByBomIdDeleteMutation();
  const [editingBom, setEditingBom] = useState<Bom | null>(null);
  const [deletingBom, setDeletingBom] = useState<Bom | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const { toast } = useToast();

  const handleDelete = (bom: Bom) => {
    setDeletingBom(bom);
  };

  const confirmDelete = async () => {
    if (!deletingBom) return;
    try {
      await deleteBom({ bomId: deletingBom.id! }).unwrap();
      toast('success', `Đã xóa định mức ${deletingBom.name}`);
      setDeletingBom(null);
      refetch();
     
    } catch {
      toast('error', 'Có lỗi xảy ra khi xóa định mức');
    }
  };

  const handleSave = () => {
    setEditingBom(null);
    setShowCreate(false);
    refetch();
  };

  const columns = useMemo<ColumnDef<Bom, unknown>[]>(
    () => [
      { accessorKey: 'item_code', header: 'Mã SP', size: 120 },
      { accessorKey: 'name', header: 'Tên Định Mức' },
      { accessorKey: 'item_name', header: 'Tên Sản Phẩm' },
      {
        accessorKey: 'items_count',
        header: 'Linh Kiện',
        cell: ({ row }) => (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          <Badge variant="info">{(row.original as any).items_count || 0} mục</Badge>
        ),
        enableSorting: false,
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
        header: 'Thao Tác',
        size: 140,
        enableSorting: false,
        cell: ({ row }) => (
          <div className={styles.actions}>
            <button type="button" className={styles.actionBtn} title="Xem chi tiết" aria-label="Xem chi tiết">
              <Eye size={15} />
            </button>
            <button type="button" className={styles.actionBtn} title="Chỉnh sửa" aria-label="Chỉnh sửa"
              onClick={() => setEditingBom(row.original)}>
              <Pencil size={15} />
            </button>
            <button type="button" className={`${styles.actionBtn} ${styles.deleteBtn}`} title="Xóa" aria-label="Xóa"
              onClick={() => handleDelete(row.original)}>
              <Trash2 size={15} />
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Danh Sách Định Mức (BOM)</h2>
          <p className={styles.subtitle}>{boms.length} định mức</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setShowCreate(true)}>
          Thêm BOM
        </Button>
      </div>
      <DataTable columns={columns} data={boms} searchPlaceholder="Tìm theo mã hoặc tên sản phẩm..." loading={isLoading} />

      {(showCreate || editingBom) && (
        <BomFormModal
          open
          bomId={editingBom?.id || null}
          onClose={() => { setShowCreate(false); setEditingBom(null); }}
          onSave={handleSave}
        />
      )}

      {deletingBom && (
        <Modal
          open
          onClose={() => setDeletingBom(null)}
          title="Xác Nhận Xóa"
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setDeletingBom(null)}>Hủy</Button>
              <Button variant="danger" onClick={confirmDelete} disabled={isDeleting}>Xóa định mức</Button>
            </>
          }
        >
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text)' }}>
            Bạn có chắc chắn muốn xóa định mức <strong>"{deletingBom.name}"</strong> không? Hành động này không thể hoàn tác.
          </p>
        </Modal>
      )}
    </div>
  );
}

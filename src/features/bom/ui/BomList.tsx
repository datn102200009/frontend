import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2, Eye, Plus } from 'lucide-react';
import { DataTable } from '../../../shared/ui/DataTable/DataTable';
import { Button } from '../../../shared/ui/Button/Button';
import { Badge } from '../../../shared/ui/Badge/Badge';
import { Modal } from '../../../shared/ui/Modal/Modal';
import { BomFormModal } from './BomFormModal';
import { useToast } from '../../../shared/ui/Toast/Toast';
import type { BOM } from '../model/types';
import { MOCK_BOMS } from '../model/mockData';
import styles from './BomList.module.css';

export function BomList() {
  const [boms, setBoms] = useState<BOM[]>(MOCK_BOMS);
  const [editingBom, setEditingBom] = useState<BOM | null>(null);
  const [deletingBom, setDeletingBom] = useState<BOM | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const { toast } = useToast();

  const handleDelete = (bom: BOM) => {
    setDeletingBom(bom);
  };

  const confirmDelete = () => {
    if (!deletingBom) return;
    setBoms((prev) => prev.filter((b) => b.id !== deletingBom.id));
    toast('success', `Đã xóa định mức ${deletingBom.product_code}`);
    setDeletingBom(null);
  };

  const handleSave = (data: BOM) => {
    if (editingBom) {
      setBoms((prev) => prev.map((b) => (b.id === data.id ? data : b)));
      toast('success', 'Cập nhật định mức thành công');
    } else {
      setBoms((prev) => [...prev, { ...data, id: `bom-${Date.now()}`, created_at: new Date().toISOString().slice(0, 10) }]);
      toast('success', 'Thêm định mức thành công');
    }
    setEditingBom(null);
    setShowCreate(false);
  };

  const columns = useMemo<ColumnDef<BOM, unknown>[]>(
    () => [
      { accessorKey: 'product_code', header: 'Mã SP', size: 120 },
      { accessorKey: 'product_name', header: 'Tên Sản Phẩm' },
      { accessorKey: 'version', header: 'Phiên Bản', size: 100 },
      {
        accessorKey: 'items',
        header: 'Linh Kiện',
        cell: ({ row }) => (
          <Badge variant="info">{row.original.items.length} mục</Badge>
        ),
        enableSorting: false,
      },
      { accessorKey: 'created_at', header: 'Ngày Tạo', size: 120 },
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
      <DataTable columns={columns} data={boms} searchPlaceholder="Tìm theo mã hoặc tên sản phẩm..." />

      {(showCreate || editingBom) && (
        <BomFormModal
          open
          bom={editingBom}
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
              <Button variant="danger" onClick={confirmDelete}>Xóa định mức</Button>
            </>
          }
        >
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text)' }}>
            Bạn có chắc chắn muốn xóa định mức <strong>"{deletingBom.product_name}"</strong> không? Hành động này không thể hoàn tác.
          </p>
        </Modal>
      )}
    </div>
  );
}

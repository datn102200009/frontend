import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { DataTable } from '../../../shared/ui/DataTable/DataTable';
import { Button } from '../../../shared/ui/Button/Button';
import { Badge } from '../../../shared/ui/Badge/Badge';
import { Modal } from '../../../shared/ui/Modal/Modal';
import { Input } from '../../../shared/ui/Input/Input';
import { useToast } from '../../../shared/ui/Toast/Toast';
import { useForm } from 'react-hook-form';
import type { Product } from '../model/types';
import { MOCK_PRODUCTS } from '../model/mockData';

export function ProductList() {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const { toast } = useToast();

  const handleDelete = (p: Product) => {
    setDeleting(p);
  };

  const confirmDelete = () => {
    if (!deleting) return;
    setProducts((prev) => prev.filter((x) => x.id !== deleting.id));
    toast('success', `Đã xóa ${deleting.item_code}`);
    setDeleting(null);
  };

  const handleSave = (p: Product) => {
    if (editing) {
      setProducts((prev) => prev.map((x) => (x.id === p.id ? p : x)));
      toast('success', 'Cập nhật sản phẩm thành công');
    } else {
      setProducts((prev) => [...prev, { ...p, id: `p-${Date.now()}` }]);
      toast('success', 'Thêm sản phẩm thành công');
    }
    setEditing(null);
    setShowCreate(false);
  };

  const columns = useMemo<ColumnDef<Product, unknown>[]>(
    () => [
      { accessorKey: 'item_code', header: 'Mã SP', size: 120 },
      { accessorKey: 'item_name', header: 'Tên Sản Phẩm' },
      { accessorKey: 'unit', header: 'ĐVT', size: 80 },
      {
        accessorKey: 'category',
        header: 'Nhóm',
        size: 140,
        cell: ({ getValue }) => <Badge variant="info">{getValue<string>()}</Badge>,
      },
      {
        accessorKey: 'min_stock',
        header: 'Tồn Tối Thiểu',
        size: 120,
        cell: ({ getValue }) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{getValue<number>()}</span>,
      },
      {
        id: 'actions',
        header: '',
        size: 100,
        enableSorting: false,
        cell: ({ row }) => (
          <div style={{ display: 'flex', gap: '4px' }}>
            <button type="button" onClick={() => setEditing(row.original)}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, border: 'none', borderRadius: 4, background: 'transparent', color: 'var(--clr-text-muted)', cursor: 'pointer' }}
              aria-label="Sửa"><Pencil size={15} /></button>
            <button type="button" onClick={() => handleDelete(row.original)}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, border: 'none', borderRadius: 4, background: 'transparent', color: 'var(--clr-text-muted)', cursor: 'pointer' }}
              aria-label="Xóa"><Trash2 size={15} /></button>
          </div>
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
          <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)', marginTop: 2 }}>{products.length} sản phẩm</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setShowCreate(true)}>Thêm SP</Button>
      </div>
      <DataTable columns={columns} data={products} searchPlaceholder="Tìm mã hoặc tên sản phẩm..." />

      {(showCreate || editing) && (
        <ProductFormModal
          open
          product={editing}
          onClose={() => { setShowCreate(false); setEditing(null); }}
          onSave={handleSave}
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
              <Button variant="ghost" onClick={() => setDeleting(null)}>Hủy</Button>
              <Button variant="danger" onClick={confirmDelete}>Xóa Sản Phẩm</Button>
            </>
          }
        >
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text)' }}>
            Bạn có chắc chắn muốn xóa sản phẩm <strong>"{deleting.item_name}"</strong> không? Hành động này không thể hoàn tác.
          </p>
        </Modal>
      )}
    </div>
  );
}

/* ── Inline Form Modal ── */
function ProductFormModal({ open, product, onClose, onSave }: { open: boolean; product: Product | null; onClose: () => void; onSave: (p: Product) => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<Omit<Product, 'id' | 'is_active'>>({
    defaultValues: product
      ? { item_code: product.item_code, item_name: product.item_name, unit: product.unit, category: product.category, min_stock: product.min_stock }
      : { item_code: '', item_name: '', unit: 'cái', category: 'Nguyên liệu', min_stock: 0 },
  });

  const onSubmit = (data: Omit<Product, 'id' | 'is_active'>) => {
    onSave({ id: product?.id ?? '', ...data, is_active: true });
  };

  return (
    <Modal open={open} onClose={onClose} title={product ? 'Chỉnh Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới'} size="sm"
      footer={<><Button variant="ghost" onClick={onClose}>Hủy</Button><Button onClick={handleSubmit(onSubmit)}>{product ? 'Cập nhật' : 'Tạo mới'}</Button></>}>
      <form style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }} onSubmit={(e) => e.preventDefault()}>
        <Input label="Mã sản phẩm" required error={errors.item_code?.message} {...register('item_code', { required: 'Bắt buộc' })} />
        <Input label="Tên sản phẩm" required error={errors.item_name?.message} {...register('item_name', { required: 'Bắt buộc' })} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
          <Input label="Đơn vị tính" {...register('unit')} />
          <Input label="Nhóm hàng" {...register('category')} />
        </div>
        <Input label="Tồn kho tối thiểu" type="number" {...register('min_stock', { valueAsNumber: true })} />
      </form>
    </Modal>
  );
}

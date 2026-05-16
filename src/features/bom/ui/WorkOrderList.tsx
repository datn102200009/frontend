import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus, CheckCircle } from 'lucide-react';
import { DataTable } from '../../../shared/ui/DataTable/DataTable';
import { Button } from '../../../shared/ui/Button/Button';
import { Badge } from '../../../shared/ui/Badge/Badge';
import { Modal } from '../../../shared/ui/Modal/Modal';
import { Input } from '../../../shared/ui/Input/Input';
import { WorkOrderFormModal } from './WorkOrderFormModal';
import { useToast } from '../../../shared/ui/Toast/Toast';
import type { WorkOrder, WorkOrderStatus } from '../model/types';
import { MOCK_WORK_ORDERS } from '../model/mockData';
import styles from './BomList.module.css';

const STATUS_MAP: Record<WorkOrderStatus, { label: string; variant: 'neutral' | 'warning' | 'success' }> = {
  not_started: { label: 'Chưa bắt đầu', variant: 'neutral' },
  in_progress: { label: 'Đang chạy', variant: 'warning' },
  completed: { label: 'Hoàn thành', variant: 'success' },
};

export function WorkOrderList() {
  const [orders, setOrders] = useState<WorkOrder[]>(MOCK_WORK_ORDERS);
  const [completingWo, setCompletingWo] = useState<WorkOrder | null>(null);
  const [completedQty, setCompletedQty] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const { toast } = useToast();

  const handleCreate = (wo: WorkOrder) => {
    setOrders((prev) => [...prev, { ...wo, id: `wo-${Date.now()}`, code: `WO-2026-${String(prev.length + 1).padStart(3, '0')}` }]);
    toast('success', 'Tạo lệnh sản xuất thành công');
    setShowCreate(false);
  };

  const handleComplete = (wo: WorkOrder) => {
    setCompletingWo(wo);
    setCompletedQty(String(wo.quantity_required));
  };

  const confirmComplete = () => {
    if (!completingWo || !completedQty) return;
    const qty = Number(completedQty);
    setOrders((prev) =>
      prev.map((o) =>
        o.id === completingWo.id
          ? { ...o, status: 'completed' as const, quantity_completed: qty, actual_end: new Date().toISOString().slice(0, 10) }
          : o,
      ),
    );
    toast('success', `Hoàn thành lệnh ${completingWo.code} — đã nhập kho ${qty} sản phẩm`);
    setCompletingWo(null);
  };

  const columns = useMemo<ColumnDef<WorkOrder, unknown>[]>(
    () => [
      { accessorKey: 'code', header: 'Mã Lệnh', size: 140 },
      { accessorKey: 'product_name', header: 'Sản Phẩm' },
      { accessorKey: 'bom_version', header: 'BOM', size: 80 },
      {
        accessorKey: 'quantity_required',
        header: 'SL Yêu Cầu',
        size: 100,
        cell: ({ getValue }) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{getValue<number>()}</span>,
      },
      {
        accessorKey: 'quantity_completed',
        header: 'SL Thực Tế',
        size: 100,
        cell: ({ getValue }) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{getValue<number>()}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng Thái',
        size: 130,
        cell: ({ getValue }) => {
          const s = STATUS_MAP[getValue<WorkOrderStatus>()];
          return <Badge variant={s.variant}>{s.label}</Badge>;
        },
      },
      { accessorKey: 'planned_start', header: 'Bắt Đầu', size: 110 },
      {
        id: 'actions',
        header: '',
        size: 100,
        enableSorting: false,
        cell: ({ row }) =>
          row.original.status !== 'completed' ? (
            <Button variant="outline" size="sm" icon={<CheckCircle size={14} />} onClick={() => handleComplete(row.original)}>
              Hoàn thành
            </Button>
          ) : null,
      },
    ],
    [],
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Lệnh Sản Xuất</h2>
          <p className={styles.subtitle}>{orders.length} lệnh</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setShowCreate(true)}>
          Tạo lệnh
        </Button>
      </div>
      <DataTable columns={columns} data={orders} searchPlaceholder="Tìm theo mã lệnh hoặc sản phẩm..." />

      {showCreate && (
        <WorkOrderFormModal open onClose={() => setShowCreate(false)} onSave={handleCreate} />
      )}

      {completingWo && (
        <Modal
          open
          onClose={() => setCompletingWo(null)}
          title="Hoàn Thành Lệnh Sản Xuất"
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setCompletingWo(null)}>Hủy</Button>
              <Button variant="primary" onClick={confirmComplete} disabled={!completedQty}>Xác nhận hoàn thành</Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
            <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text)' }}>
              Vui lòng nhập số lượng thực tế hoàn thành cho lệnh <strong>"{completingWo.code}"</strong>.
            </p>
            <Input
              label="Số lượng hoàn thành"
              type="number"
              value={completedQty}
              onChange={(e) => setCompletedQty(e.target.value)}
              min={0}
              autoFocus
            />
          </div>
        </Modal>
      )}
    </div>
  );
}

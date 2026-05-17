import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus, CheckCircle, ArrowRightCircle, PlayCircle, Eye } from 'lucide-react';
import { DataTable } from '../../../shared/ui/DataTable/DataTable';
import { Button } from '../../../shared/ui/Button/Button';
import { Badge } from '../../../shared/ui/Badge/Badge';
import { Modal } from '../../../shared/ui/Modal/Modal';
import { Input } from '../../../shared/ui/Input/Input';
import { WorkOrderFormModal } from './WorkOrderFormModal';
import { WorkOrderDetailModal } from './WorkOrderDetailModal';
import { useToast } from '../../../shared/ui/Toast/Toast';
import { formatDateShort } from '../../../shared/lib/formatDate';
import {
  useGetManufacturingWorkOrderListQuery,
  usePostManufacturingWorkOrderByWorkOrderIdApproveMutation,
  usePostManufacturingWorkOrderByWorkOrderIdDeclareMutation,
  usePostManufacturingWorkOrderByWorkOrderIdCompleteMutation,
  usePostManufacturingWorkOrderByWorkOrderIdCancelMutation,
} from '../../manufacturing/api/manufacturingApi';
import styles from './BomList.module.css';

const STATUS_MAP: Record<string, { label: string; variant: 'neutral' | 'warning' | 'success' | 'error' }> = {
  pending_approval: { label: 'Chờ duyệt', variant: 'neutral' },
  in_progress: { label: 'Đang thực hiện', variant: 'warning' },
  completed: { label: 'Hoàn thành', variant: 'success' },
  cancelled: { label: 'Đã hủy', variant: 'error' },
};

export function WorkOrderList() {
  const [search, setSearch] = useState('');
  const [declaringWo, setDeclaringWo] = useState<any>(null);
  const [viewingWo, setViewingWo] = useState<any>(null);
  const [producedQty, setProducedQty] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const { toast } = useToast();

  const { data, isLoading, isFetching, refetch } = useGetManufacturingWorkOrderListQuery({
    search: search || undefined,
  });

  const [approveWo, { isLoading: isApproving }] = usePostManufacturingWorkOrderByWorkOrderIdApproveMutation();
  const [declareWo, { isLoading: isDeclaring }] = usePostManufacturingWorkOrderByWorkOrderIdDeclareMutation();
  const [completeWo, { isLoading: isCompleting }] = usePostManufacturingWorkOrderByWorkOrderIdCompleteMutation();
  const [cancelWo, { isLoading: isCanceling }] = usePostManufacturingWorkOrderByWorkOrderIdCancelMutation();

  const handleApprove = async (wo: any) => {
    if (window.confirm(`Bạn có chắc chắn muốn phê duyệt lệnh ${wo.name}? Quá trình này sẽ xuất nguyên liệu từ kho nguồn.`)) {
      try {
        await approveWo({ workOrderId: wo.id }).unwrap();
        toast('success', `Phê duyệt lệnh ${wo.name} thành công.`);
        refetch();
      } catch (error: any) {
        toast('error', error?.data?.detail || 'Lỗi khi phê duyệt lệnh sản xuất');
      }
    }
  };

  const handleComplete = async (wo: any) => {
    if (window.confirm(`Bạn có chắc chắn muốn hoàn thành lệnh ${wo.name}? Quá trình này sẽ nhập thành phẩm vào kho đích.`)) {
      try {
        await completeWo({ workOrderId: wo.id }).unwrap();
        toast('success', `Hoàn thành lệnh ${wo.name} thành công.`);
        refetch();
      } catch (error: any) {
        toast('error', error?.data?.detail || 'Lỗi khi hoàn thành lệnh sản xuất');
      }
    }
  };

  const handleCancel = async (wo: any) => {
    if (window.confirm(`Bạn có chắc chắn muốn hủy lệnh ${wo.name}? Lệnh đã hủy sẽ không thể tiếp tục.`)) {
      try {
        await cancelWo({ workOrderId: wo.id }).unwrap();
        toast('success', `Hủy lệnh ${wo.name} thành công.`);
        refetch();
      } catch (error: any) {
        toast('error', error?.data?.detail || 'Lỗi khi hủy lệnh sản xuất');
      }
    }
  };

  const confirmDeclare = async () => {
    if (!declaringWo || !producedQty) return;
    try {
      const qty = Number(producedQty);
      await declareWo({
        workOrderId: declaringWo.id,
        workOrderDeclareInput: {
          produced_qty: qty,
        },
      }).unwrap();
      
      toast('success', `Nhập liệu ${qty} sản phẩm cho lệnh ${declaringWo.name} thành công`);
      setDeclaringWo(null);
      setProducedQty('');
      refetch();
    } catch (error: any) {
      toast('error', error?.data?.detail || 'Có lỗi xảy ra khi nhập liệu');
    }
  };

  const columns = useMemo<ColumnDef<any, unknown>[]>(
    () => [
      { accessorKey: 'name', header: 'Mã Lệnh', size: 140 },
      { 
        accessorKey: 'bom_name', 
        header: 'Định mức (BOM)',
        cell: ({ row }) => row.original.bom?.name || row.original.bom_name || '-'
      },
      {
        accessorKey: 'quantity',
        header: 'SL Yêu Cầu',
        size: 100,
        cell: ({ getValue }) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{getValue<number>()}</span>,
      },
      {
        accessorKey: 'produced_qty',
        header: 'SL Đã SX',
        size: 100,
        cell: ({ getValue }) => <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: '500' }}>{getValue<number>() ?? 0}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng Thái',
        size: 130,
        cell: ({ getValue }) => {
          const val = getValue<string>();
          const s = STATUS_MAP[val] || { label: val, variant: 'neutral' };
          return <Badge variant={s.variant as any}>{s.label}</Badge>;
        },
      },
      {
        accessorKey: 'planned_start_date',
        header: 'Bắt Đầu',
        size: 110,
        cell: ({ row }) => formatDateShort(row.original.planned_start_date)
      },
      {
        id: 'actions',
        header: '',
        size: 250,
        enableSorting: false,
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="ghost" size="sm" icon={<Eye size={14} />} onClick={() => setViewingWo(row.original)}>
                Chi tiết
              </Button>
              {status === 'pending_approval' && (
                <>
                  <Button variant="outline" size="sm" icon={<PlayCircle size={14} />} onClick={() => handleApprove(row.original)} disabled={isApproving}>
                    Phê duyệt
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleCancel(row.original)} disabled={isCanceling}>
                    Hủy
                  </Button>
                </>
              )}
              {status === 'in_progress' && (
                <>
                  {(row.original.produced_qty || 0) < row.original.quantity && (
                    <Button variant="outline" size="sm" icon={<ArrowRightCircle size={14} />} onClick={() => {
                      setDeclaringWo(row.original);
                      setProducedQty('');
                    }}>
                      Nhập liệu
                    </Button>
                  )}
                  {(row.original.produced_qty || 0) >= row.original.quantity && (
                    <Button variant="primary" size="sm" icon={<CheckCircle size={14} />} onClick={() => handleComplete(row.original)} disabled={isCompleting}>
                      Hoàn thành
                    </Button>
                  )}
                </>
              )}
            </div>
          );
        }
      },
    ],
    [],
  );

  const workOrders = (data as any)?.results || [];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Lệnh Sản Xuất</h2>
          <p className={styles.subtitle}>{(data as any)?.count ?? 0} lệnh</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setShowCreate(true)}>
          Tạo lệnh
        </Button>
      </div>

      <DataTable 
        columns={columns} 
        data={workOrders} 
        loading={isLoading || isFetching}
        searchPlaceholder="Tìm theo mã lệnh..." 
        onSearch={setSearch}
      />

      {showCreate && (
        <WorkOrderFormModal 
          open 
          onClose={() => setShowCreate(false)} 
          onSuccess={() => {
            setShowCreate(false);
            refetch();
          }} 
        />
      )}

      {declaringWo && (
        <Modal
          open
          onClose={() => setDeclaringWo(null)}
          title="Nhập Liệu Sản Xuất"
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setDeclaringWo(null)} disabled={isDeclaring}>Hủy</Button>
              <Button variant="primary" onClick={confirmDeclare} disabled={isDeclaring || !producedQty}>
                {isDeclaring ? 'Đang xử lý...' : 'Xác nhận'}
              </Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
            <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text)' }}>
              Nhập số lượng sản phẩm hoàn thành cho lệnh <strong>"{declaringWo.name}"</strong>. 
              Thành phẩm sẽ được nhập vào kho đích.
              <br/>
              <em>Yêu cầu: {declaringWo.quantity} | Đã sản xuất: {declaringWo.produced_qty || 0} | Còn lại: {Math.max(0, declaringWo.quantity - (declaringWo.produced_qty || 0))}</em>
            </p>
            <Input
              label="Số lượng sản xuất đợt này"
              type="number"
              value={producedQty}
              onChange={(e) => setProducedQty(e.target.value)}
              min={1}
              max={Math.max(0, declaringWo.quantity - (declaringWo.produced_qty || 0))}
              disabled={isDeclaring}
              required
            />
          </div>
        </Modal>
      )}

      {viewingWo && (
        <WorkOrderDetailModal
          open
          workOrder={viewingWo}
          onClose={() => setViewingWo(null)}
        />
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../../shared/ui/Modal/Modal';
import { Input } from '../../../shared/ui/Input/Input';
import { Button } from '../../../shared/ui/Button/Button';
import { useToast } from '../../../shared/ui/Toast/Toast';
import { SearchableSelect } from '../../../shared/ui/Select/SearchableSelect';
import {
  useGetManufacturingBomListQuery,
  usePostManufacturingWorkOrderCreateMutation,
  usePostManufacturingMaterialPreviewMutation,
} from '../../manufacturing/api/manufacturingApi';
import { useGetMasterDataWarehousesListQuery } from '../../inventory/api/masterDataApi';

const woSchema = z.object({
  name: z.string().min(1, 'Bắt buộc nhập tên/mã lệnh'),
  bom_id: z.string().min(1, 'Bắt buộc chọn định mức (BOM)'),
  quantity: z.number().min(1, 'Số lượng tối thiểu là 1'),
  source_warehouse_id: z.string().min(1, 'Bắt buộc chọn kho nguồn'),
  target_warehouse_id: z.string().min(1, 'Bắt buộc chọn kho đích'),
  production_warehouse_id: z.string().min(1, 'Bắt buộc chọn kho sản xuất'),
  planned_start_date: z.string().min(1, 'Bắt buộc chọn ngày bắt đầu'),
  planned_end_date: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
});

type WoFormData = z.infer<typeof woSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function WorkOrderFormModal({ open, onClose, onSuccess }: Props) {
  const { toast } = useToast();
  
  const { data: bomListResp, isLoading: isLoadingBoms } = useGetManufacturingBomListQuery({ isActive: true });
  const boms = (bomListResp as any)?.results || [];
  const bomOptions = boms.map((b: any) => ({
    label: `${b.name} - ${b.item_code}`,
    value: b.id
  }));

  const { data: warehouseResp, isLoading: isLoadingWarehouses } = useGetMasterDataWarehousesListQuery();
  const warehouses = (warehouseResp as any) || [];
  const warehouseOptions = warehouses.map((w: any) => ({
    label: w.name,
    value: w.id
  }));

  const [createWo, { isLoading: isCreating }] = usePostManufacturingWorkOrderCreateMutation();
  const [getPreview, { isLoading: isPreviewing }] = usePostManufacturingMaterialPreviewMutation();
  const [previewData, setPreviewData] = useState<any[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm<WoFormData>({
    resolver: zodResolver(woSchema),
    defaultValues: {
      name: '',
      bom_id: '',
      quantity: 1,
      source_warehouse_id: '',
      target_warehouse_id: '',
      production_warehouse_id: '',
      planned_start_date: new Date().toISOString().slice(0, 10),
      planned_end_date: '',
      remarks: '',
    },
  });

  const watchBomId = watch('bom_id');
  const watchQty = watch('quantity');
  const watchSourceWH = watch('source_warehouse_id');

  useEffect(() => {
    if (open) {
      reset({
        name: '',
        bom_id: '',
        quantity: 1,
        source_warehouse_id: '',
        target_warehouse_id: '',
        production_warehouse_id: '',
        planned_start_date: new Date().toISOString().slice(0, 10),
        planned_end_date: '',
        remarks: '',
      });
      setPreviewData([]);
    }
  }, [open, reset]);

  useEffect(() => {
    const fetchPreview = async () => {
      if (watchBomId && watchQty > 0 && watchSourceWH) {
        try {
          const res = await getPreview({
            materialPreviewInput: {
              bom_id: watchBomId,
              quantity: watchQty,
              source_warehouse_id: watchSourceWH
            }
          }).unwrap();
          setPreviewData(res as any);
        } catch (e) {
          console.error("Preview failed", e);
          setPreviewData([]);
        }
      } else {
        setPreviewData([]);
      }
    };
    
    // Add small debounce logic if needed
    const timer = setTimeout(() => {
      fetchPreview();
    }, 500);
    return () => clearTimeout(timer);
  }, [watchBomId, watchQty, watchSourceWH, getPreview]);

  const onSubmit = async (data: WoFormData) => {
    // Check if there are missing materials
    const hasMissing = previewData.some(item => item.missing_qty > 0);
    if (hasMissing) {
      const confirmProceed = window.confirm("Cảnh báo: Có nguyên liệu bị thiếu hụt. Bạn có chắc chắn muốn tạo lệnh sản xuất?");
      if (!confirmProceed) return;
    }

    try {
      await createWo({
        workOrderInput: {
          name: data.name,
          bom_id: data.bom_id,
          quantity: data.quantity,
          source_warehouse_id: data.source_warehouse_id,
          target_warehouse_id: data.target_warehouse_id,
          production_warehouse_id: data.production_warehouse_id,
          planned_start_date: data.planned_start_date,
          planned_end_date: data.planned_end_date || undefined,
          remarks: data.remarks || undefined,
        },
      }).unwrap();
      
      toast('success', 'Tạo lệnh sản xuất thành công');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast('error', error?.data?.detail || 'Có lỗi xảy ra khi tạo lệnh sản xuất');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tạo Lệnh Sản Xuất"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isCreating}>
            Hủy
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={isCreating || isLoadingBoms || isLoadingWarehouses}>
            {isCreating ? 'Đang tạo...' : 'Tạo lệnh'}
          </Button>
        </>
      }
    >
      <form style={{ display: 'flex', gap: 'var(--sp-6)' }} onSubmit={(e) => e.preventDefault()}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
          <Input
            label="Mã Lệnh Sản Xuất"
            required
            disabled={isCreating}
            error={errors.name?.message}
            {...register('name')}
          />

          <Controller
            name="bom_id"
            control={control}
            render={({ field }) => (
              <SearchableSelect
                label="Chọn định mức (BOM)"
                required
                options={bomOptions}
                value={field.value}
                onChange={field.onChange}
                error={errors.bom_id?.message}
                disabled={isCreating || isLoadingBoms}
              />
            )}
          />

          <Input
            label="Số lượng yêu cầu"
            type="number"
            step="0.01"
            required
            disabled={isCreating}
            error={errors.quantity?.message}
            {...register('quantity', { valueAsNumber: true })}
          />

          <Controller
            name="source_warehouse_id"
            control={control}
            render={({ field }) => (
              <SearchableSelect
                label="Kho nguồn (Nguyên liệu)"
                required
                options={warehouseOptions}
                value={field.value}
                onChange={field.onChange}
                error={errors.source_warehouse_id?.message}
                disabled={isCreating || isLoadingWarehouses}
              />
            )}
          />

          <Controller
            name="production_warehouse_id"
            control={control}
            render={({ field }) => (
              <SearchableSelect
                label="Kho sản xuất (Tạm giữ)"
                required
                options={warehouseOptions}
                value={field.value}
                onChange={field.onChange}
                error={errors.production_warehouse_id?.message}
                disabled={isCreating || isLoadingWarehouses}
              />
            )}
          />

          <Controller
            name="target_warehouse_id"
            control={control}
            render={({ field }) => (
              <SearchableSelect
                label="Kho đích (Thành phẩm)"
                required
                options={warehouseOptions}
                value={field.value}
                onChange={field.onChange}
                error={errors.target_warehouse_id?.message}
                disabled={isCreating || isLoadingWarehouses}
              />
            )}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
            <Input
              label="Ngày bắt đầu (Dự kiến)"
              type="date"
              required
              disabled={isCreating}
              error={errors.planned_start_date?.message}
              {...register('planned_start_date')}
            />
            <Input
              label="Ngày kết thúc (Dự kiến)"
              type="date"
              disabled={isCreating}
              error={errors.planned_end_date?.message}
              {...register('planned_end_date')}
            />
          </div>
          
          <Input
            label="Ghi chú"
            disabled={isCreating}
            error={errors.remarks?.message}
            {...register('remarks')}
          />
        </div>

        <div style={{ flex: 1, borderLeft: '1px solid var(--clr-border)', paddingLeft: 'var(--sp-6)' }}>
          <h4 style={{ margin: '0 0 var(--sp-4) 0', fontSize: 'var(--fs-base)', color: 'var(--clr-text-secondary)' }}>
            Dự trù nguyên liệu
          </h4>
          
          {isPreviewing && <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text-muted)' }}>Đang tải...</div>}
          
          {!isPreviewing && previewData.length === 0 && (
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text-muted)', background: 'var(--clr-surface-alt)', padding: 'var(--sp-4)', borderRadius: 'var(--radius-md)' }}>
              Vui lòng chọn đầy đủ BOM, Số lượng và Kho nguồn để xem dự trù nguyên liệu.
            </div>
          )}

          {!isPreviewing && previewData.length > 0 && (
            <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-border)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--fs-sm)' }}>
                <thead style={{ background: 'var(--clr-surface-alt)', textAlign: 'left' }}>
                  <tr>
                    <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--clr-border)' }}>Mã</th>
                    <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--clr-border)' }}>Cần</th>
                    <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--clr-border)' }}>Có</th>
                    <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--clr-border)' }}>Thiếu</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--clr-border)' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 500 }} title={item.item_name}>{item.item_code}</td>
                      <td style={{ padding: '8px 12px' }}>{item.required_qty}</td>
                      <td style={{ padding: '8px 12px', color: item.available_qty < item.required_qty ? 'var(--clr-error)' : 'var(--clr-success)' }}>
                        {item.available_qty}
                      </td>
                      <td style={{ padding: '8px 12px', color: item.missing_qty > 0 ? 'var(--clr-error)' : 'inherit', fontWeight: item.missing_qty > 0 ? 600 : 400 }}>
                        {item.missing_qty}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}

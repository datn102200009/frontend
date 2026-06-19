import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@shared/ui/Modal/Modal';
import { Input } from '@shared/ui/Input/Input';
import { TextArea } from '@shared/ui/Input/TextArea';
import { Button } from '@shared/ui/Button/Button';
import { useToast } from '@shared/ui/Toast/Toast';
import { SearchableSelect } from '@shared/ui/Select/SearchableSelect';
import { DatePickerField } from '@shared/ui/DatePickerField/DatePickerField';
import { ConfirmModal } from '@shared/ui/Modal/ConfirmModal';
import { formatNumber } from '@shared/lib/formatNumber';
import {
  useGetManufacturingBomListQuery,
  usePostManufacturingWorkOrderCreateMutation,
  usePostManufacturingMaterialPreviewMutation,
} from '@features/manufacturing/api/manufacturingApi';
import { useGetMasterDataWarehousesListQuery, useGetMasterDataItemsListQuery } from '@features/inventory/api/masterDataApi';
import { extractApiError } from '@shared/lib/extractApiError';
import { getDecimalsForUom } from '@shared/lib/uomDecimals';
import { WorkOrderFixedAssetsSection } from './WorkOrderFixedAssetsSection';

const woSchema = z.object({
  name: z.string().min(1, 'Bắt buộc nhập tên/mã lệnh'),
  bom_id: z.string().min(1, 'Bắt buộc chọn định mức (BOM)'),
  quantity: z.number()
    .refine((val) => !isNaN(val), 'Bắt buộc')
    .refine((val) => val > 0, 'Số lượng phải lớn hơn 0'),
  source_warehouse_id: z.string().min(1, 'Bắt buộc chọn kho nguồn'),
  target_warehouse_id: z.string().min(1, 'Bắt buộc chọn kho đích'),
  production_warehouse_id: z.string().min(1, 'Bắt buộc chọn kho sản xuất'),
  planned_start_date: z.string().min(1, 'Bắt buộc chọn ngày bắt đầu'),
  planned_end_date: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
  fixed_asset_ids: z.array(z.string()),
}).superRefine((data, ctx) => {
  if (data.planned_end_date && data.planned_end_date !== '' && data.planned_start_date && data.planned_end_date < data.planned_start_date) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['planned_end_date'],
      message: 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu',
    });
  }
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const boms = (bomListResp as any)?.results || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bomOptions = boms.map((b: any) => ({
    label: `${b.name} - ${b.item_code}`,
    value: b.id
  }));

  const { data: warehouseResp, isLoading: isLoadingWarehouses } = useGetMasterDataWarehousesListQuery();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const warehouses = (warehouseResp as any) || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const warehouseOptions = warehouses.map((w: any) => ({
    label: w.name,
    value: w.id
  }));

  const [createWo, { isLoading: isCreating }] = usePostManufacturingWorkOrderCreateMutation();
  const [getPreview, { isLoading: isPreviewing }] = usePostManufacturingMaterialPreviewMutation();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [pendingFormData, setPendingFormData] = useState<WoFormData | null>(null);

  const { data: itemsResponse } = useGetMasterDataItemsListQuery({ limit: 1000 });
  const itemsList = itemsResponse?.results || [];

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
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
      fixed_asset_ids: [],
    },
  });

  const watchBomId = watch('bom_id');
  const watchQty = watch('quantity');
  const watchSourceWH = watch('source_warehouse_id');
  const selectedBom = boms.find((b: any) => b.id === watchBomId);
  const selectedItem = itemsList.find((i: any) => i.id === selectedBom?.item);

  useEffect(() => {
    if (open) {
      const defaultSource = warehouses.find((w: any) => {
        const name = w.name.toLowerCase();
        return name.includes('nguyên liệu') || name.includes('nguyên vật liệu') || name.includes('nguồn');
      })?.id ?? warehouses[0]?.id ?? '';

      const defaultProd = warehouses.find((w: any) => {
        const name = w.name.toLowerCase();
        return name.includes('bán thành phẩm') || name.includes('sản xuất') || name.includes('tạm giữ') || name.includes('wip');
      })?.id ?? warehouses[0]?.id ?? '';

      const defaultTarget = warehouses.find((w: any) => {
        const name = w.name.toLowerCase();
        return (name.includes('thành phẩm') && !name.includes('bán')) || name.includes('đích');
      })?.id ?? warehouses.find((w: any) => w.id !== defaultSource)?.id ?? warehouses[0]?.id ?? '';

      reset({
        name: '',
        bom_id: '',
        quantity: 1,
        source_warehouse_id: defaultSource,
        target_warehouse_id: defaultTarget,
        production_warehouse_id: defaultProd,
        planned_start_date: new Date().toISOString().slice(0, 10),
        planned_end_date: '',
        remarks: '',
        fixed_asset_ids: [],
      });
      setPreviewData([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reset]);

  useEffect(() => {
    if (open && warehouses.length > 0) {
      const currentSource = watch('source_warehouse_id');
      const currentProd = watch('production_warehouse_id');
      const currentTarget = watch('target_warehouse_id');
      
      if (!currentSource || !currentProd || !currentTarget) {
        const defaultSource = warehouses.find((w: any) => {
          const name = w.name.toLowerCase();
          return name.includes('nguyên liệu') || name.includes('nguyên vật liệu') || name.includes('nguồn');
        })?.id ?? warehouses[0]?.id ?? '';

        const defaultProd = warehouses.find((w: any) => {
          const name = w.name.toLowerCase();
          return name.includes('bán thành phẩm') || name.includes('sản xuất') || name.includes('tạm giữ') || name.includes('wip');
        })?.id ?? warehouses[0]?.id ?? '';

        const defaultTarget = warehouses.find((w: any) => {
          const name = w.name.toLowerCase();
          return (name.includes('thành phẩm') && !name.includes('bán')) || name.includes('đích');
        })?.id ?? warehouses.find((w: any) => w.id !== defaultSource)?.id ?? warehouses[0]?.id ?? '';
                              
        if (!currentSource) setValue('source_warehouse_id', defaultSource);
        if (!currentProd) setValue('production_warehouse_id', defaultProd);
        if (!currentTarget) setValue('target_warehouse_id', defaultTarget);
      }
    }
  }, [open, warehouses, setValue, watch]);

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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  const executeCreate = async (data: WoFormData) => {
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
          fixed_asset_ids: data.fixed_asset_ids,
        },
      }).unwrap();
      
      toast('success', 'Tạo lệnh sản xuất thành công');
      onSuccess();
      onClose();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast('error', extractApiError(error, 'Có lỗi xảy ra khi tạo lệnh sản xuất'));
    }
  };

  const onSubmit = async (data: WoFormData) => {
    // Check if there are missing materials
    const hasMissing = previewData.some(item => item.missing_qty > 0);
    if (hasMissing) {
      setPendingFormData(data);
      return;
    }
    await executeCreate(data);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tạo Lệnh Sản Xuất"
      size="xl"
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
              <div>
                <SearchableSelect
                  label="Chọn định mức (BOM)"
                  required
                  options={bomOptions}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.bom_id?.message}
                  disabled={isCreating || isLoadingBoms}
                />
                {selectedBom && (
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-secondary)', marginTop: '4px' }}>
                    Sản phẩm: <strong>{selectedBom.item_name}</strong>
                  </div>
                )}
              </div>
            )}
          />

          <Input
            label="Số lượng yêu cầu"
            type="number"
            min={0}
            required
            decimals={getDecimalsForUom(selectedItem?.stock_uom_name)}
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
            <DatePickerField
              name="planned_start_date"
              label="Ngày bắt đầu (Dự kiến)"
              control={control}
              error={errors.planned_start_date?.message}
              required
              disabled={isCreating}
            />
            <DatePickerField
              name="planned_end_date"
              label="Ngày kết thúc (Dự kiến)"
              control={control}
              error={errors.planned_end_date?.message}
              disabled={isCreating}
              minDate={watch('planned_start_date')}
            />
          </div>
          
          <TextArea
            label="Ghi chú"
            disabled={isCreating}
            error={errors.remarks?.message}
            {...register('remarks')}
          />

          <Controller
            name="fixed_asset_ids"
            control={control}
            render={({ field }) => (
              <WorkOrderFixedAssetsSection
                value={field.value || []}
                onChange={field.onChange}
                isReadOnly={isCreating}
              />
            )}
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
                    <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--clr-border)' }}>Linh kiện</th>
                    <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--clr-border)' }}>Cần</th>
                    <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--clr-border)' }}>Có</th>
                    <th style={{ padding: '8px 12px', borderBottom: '1px solid var(--clr-border)' }}>Thiếu</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--clr-border)' }}>
                      <td style={{ padding: '8px 12px' }}>
                        <div style={{ fontWeight: 500 }} title={item.item_name}>{item.item_name}</div>
                        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-secondary)' }}>{item.item_code}</div>
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatNumber(item.required_qty)}</span>
                        <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-secondary)', marginLeft: 4 }}>{item.uom || ''}</span>
                      </td>
                      <td style={{ padding: '8px 12px', color: item.available_qty < item.required_qty ? 'var(--clr-error)' : 'var(--clr-success)' }}>
                        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatNumber(item.available_qty)}</span>
                        <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-secondary)', marginLeft: 4 }}>{item.uom || ''}</span>
                      </td>
                      <td style={{ padding: '8px 12px', color: item.missing_qty > 0 ? 'var(--clr-error)' : 'inherit', fontWeight: item.missing_qty > 0 ? 600 : 400 }}>
                        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatNumber(item.missing_qty)}</span>
                        <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-secondary)', marginLeft: 4 }}>{item.uom || ''}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </form>
      {pendingFormData && (
        <ConfirmModal
          open={!!pendingFormData}
          title="Cảnh báo thiếu hụt nguyên liệu"
          message="Có nguyên liệu bị thiếu hụt so với yêu cầu. Bạn có chắc chắn muốn tiếp tục tạo lệnh sản xuất này không?"
          onConfirm={() => {
            if (pendingFormData) {
              executeCreate(pendingFormData);
              setPendingFormData(null);
            }
          }}
          onCancel={() => setPendingFormData(null)}
          isLoading={isCreating}
          nested
          zIndex={1100}
        />
      )}
    </Modal>
  );
}
 

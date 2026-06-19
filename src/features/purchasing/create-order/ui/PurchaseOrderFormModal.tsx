import React, { useEffect, useState, useRef } from 'react';
import { useForm, useFieldArray, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  usePostPurchasingOrdersMutation, 
  useGetPurchasingOrdersByPkQuery,
  usePutPurchasingOrdersByPkMutation,
  useDeletePurchasingOrdersByPkMutation,
  usePostPurchasingOrdersByPkApproveMutation,
  usePostPurchasingOrdersByPkCancelMutation,
  type PurchaseOrderInput
} from '@entities/purchasing/api/purchasingApi';
import { useGetMasterDataItemsListQuery } from '@features/inventory/api/masterDataApi';
import { useGetProcurementSuppliersQuery } from '@entities/procurement/api/procurementApi';
import { purchaseOrderSchema, type PurchaseOrderFormValues } from '../model/purchase-order.schema';
import { Modal } from '@shared/ui/Modal/Modal';
import { Button } from '@shared/ui/Button/Button';
import { Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { ConfirmModal } from '@shared/ui/Modal/ConfirmModal';
import { usePermission } from '@shared/hooks/usePermission';
import { DatePickerField } from '@shared/ui/DatePickerField/DatePickerField';
import { SearchableSelect } from '@shared/ui/Select/SearchableSelect';
import { Input } from '@shared/ui/Input/Input';
import { getDecimalsForUom } from '@shared/lib/uomDecimals';
import { formatNumber } from '@shared/lib/formatNumber';
import { useToast } from '@shared/ui/Toast/Toast';
import { extractApiError } from '@shared/lib/extractApiError';
import { shortId } from '@shared/lib/shortId';
import styles from './PurchaseOrderFormModal.module.css';


const getStockEntryStatusLabel = (status?: string) => {
  switch (status) {
    case 'posted': return 'Đã Nhập';
    case 'cancelled': return 'Đã Hủy';
    case 'submitted': return 'Chờ Duyệt';
    default: return 'Bản Nháp';
  }
};

const getStockEntryStatusColor = (status?: string) => {
  switch (status) {
    case 'posted': return 'var(--clr-success)';
    case 'cancelled': return 'var(--clr-danger)';
    default: return 'var(--clr-warning)';
  }
};

const getInvoiceStatusLabel = (status?: string) => {
  switch (status) {
    case 'paid': return 'Đã Thanh Toán';
    case 'partial': return 'Thanh Toán Một Phần';
    case 'cancelled': return 'Đã Hủy';
    default: return 'Chưa Thanh Toán';
  }
};

const getInvoiceStatusColor = (status?: string) => {
  switch (status) {
    case 'paid': return 'var(--clr-success)';
    case 'cancelled': return 'var(--clr-danger)';
    default: return 'var(--clr-warning)';
  }
};

interface PurchaseOrderFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  orderId?: string | null;
}

const formatDateToDMY = (isoDateStr: string): string => {
  if (!isoDateStr) return '';
  const cleanDateStr = isoDateStr.split('T')[0];
  const parts = cleanDateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return isoDateStr;
};

const getLocalDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const PurchaseOrderFormModal: React.FC<PurchaseOrderFormModalProps> = ({ open, onClose, onSuccess, orderId }) => {
  const { data: orderData, isLoading: isLoadingOrder } = useGetPurchasingOrdersByPkQuery({ pk: orderId as string }, { skip: !orderId });
  const { data: itemsData } = useGetMasterDataItemsListQuery({ status: 'active', limit: 100 });
  const { data: suppliersData } = useGetProcurementSuppliersQuery();
  
  const [createOrder, { isLoading: isCreating }] = usePostPurchasingOrdersMutation();
  const [updateOrder, { isLoading: isUpdating }] = usePutPurchasingOrdersByPkMutation();
  const [deleteOrder, { isLoading: isDeleting }] = useDeletePurchasingOrdersByPkMutation();
  const [approveOrder, { isLoading: isApproving }] = usePostPurchasingOrdersByPkApproveMutation();
  const [cancelOrder, { isLoading: isCancelling }] = usePostPurchasingOrdersByPkCancelMutation();
  const { toast } = useToast();

  const [confirmState, setConfirmState] = useState<{ action: 'delete' | 'cancel'; title: string; message: string; orderId: string } | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const canCancel = usePermission('purchasing.cancel_order');
  const canApprove = usePermission('purchasing.update_order');
  const isDraft = orderData ? orderData.status === 'draft' : true;
  const isReadOnly = !isDraft; // Only editable if draft or creating
  const isWorking = isCreating || isUpdating || isDeleting || isApproving || isCancelling || isLoadingOrder;

  const itemMap = React.useMemo(() => {
    const map = new Map<string, { id?: string; item_name?: string; item_code?: string; stock_uom_name?: string | null }>();
    if (itemsData?.results) {
      itemsData.results.forEach(item => {
        if (item.id) {
          map.set(item.id, {
            id: item.id,
            item_name: item.item_name,
            item_code: item.item_code,
            stock_uom_name: item.stock_uom_name,
          });
        }
      });
    }
    return map;
  }, [itemsData]);

  const supplierMap = React.useMemo(() => {
    const map = new Map<string, { id?: string; supplier_name?: string; name?: string }>();
    if (suppliersData) {
      suppliersData.forEach(s => {
        if (s.id) map.set(s.id, s);
      });
    }
    return map;
  }, [suppliersData]);

  const { register, control, handleSubmit, formState: { errors }, reset, watch } = useForm<PurchaseOrderFormValues>({
    resolver: zodResolver(purchaseOrderSchema) as unknown as Resolver<PurchaseOrderFormValues>,
    defaultValues: {
      vendor_id: '',
      advance_paid_amount: 0,
      expected_delivery_date: getLocalDateString(),
      lines: [{ item_id: '', quantity: 1, unit_price: 2000000 }],
    }
  });

  const selectedVendorId = watch('vendor_id');
  const vendorName = React.useMemo(() => {
    if (selectedVendorId) {
      const sup = supplierMap.get(selectedVendorId);
      if (sup) return `${sup.supplier_name} (${sup.name})`;
    }
    return orderData?.vendor_name || 'N/A';
  }, [selectedVendorId, supplierMap, orderData]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines'
  });

  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!open) {
      hasInitialized.current = false;
      setIsCancelModalOpen(false);
    }
  }, [open]);

  useEffect(() => {
    if (orderId && orderData && !hasInitialized.current) {
      reset({
        vendor_id: orderData.vendor,
        advance_paid_amount: Number(orderData.advance_paid_amount) || 0,
        expected_delivery_date: orderData.expected_delivery_date || '',
        lines: (orderData.lines || []).map(l => ({
          item_id: l.item,
          quantity: Number(l.quantity) || 0,
          unit_price: Number(l.unit_price) || 0,
        }))
      });
      hasInitialized.current = true;
    } else if (!orderId && suppliersData !== undefined && itemsData !== undefined && !hasInitialized.current) {
      reset({
        vendor_id: suppliersData?.[0]?.id || '',
        advance_paid_amount: 0,
        expected_delivery_date: getLocalDateString(),
        lines: [{ item_id: itemsData?.results?.[0]?.id || '', quantity: 1, unit_price: 2000000 }],
      });
      hasInitialized.current = true;
    }
  }, [orderId, orderData, reset, itemsData, suppliersData]);

  const watchLines = watch('lines') || [];
  const getSelectableItems = (index: number, currentFieldItemId?: string) => {
    const selectedIds = watchLines
      .map((line, i) => (i !== index ? line.item_id : null))
      .filter((id): id is string => !!id);
    
    const list = (itemsData?.results || []).filter(item => item.id && !selectedIds.includes(item.id)) as any[];
    const existsInMaster = (itemsData?.results || []).some(item => item.id === currentFieldItemId);
    if (currentFieldItemId && !existsInMaster) {
      const originalLine = orderData?.lines?.find(l => l.item === currentFieldItemId);
      list.push({
        id: currentFieldItemId,
        item_name: originalLine?.item_name || 'Linh Kiện Khác',
        item_code: originalLine?.item_code || 'OTHER',
      });
    }
    return list;
  };

  const getSelectableSuppliers = (currentVendorId?: string) => {
    const list = [...(suppliersData || [])];
    if (currentVendorId && !list.some(s => s.id === currentVendorId)) {
      list.push({
        id: currentVendorId,
        supplier_name: orderData?.vendor_name || 'Nhà Cung Cấp Khác',
        name: 'OTHER',
      });
    }
    return list;
  };

  const onSubmit = async (values: PurchaseOrderFormValues) => {
    try {
      const payload = values as unknown as PurchaseOrderInput;
      if (orderId) {
        await updateOrder({ pk: orderId, purchaseOrderInput: payload }).unwrap();
        toast('success', 'Cập nhật đơn mua hàng thành công');
      } else {
        await createOrder({ purchaseOrderInput: payload }).unwrap();
        toast('success', 'Tạo đơn mua hàng thành công');
      }
      onSuccess();
    } catch (err) {
      console.error('Failed to save purchase order', err);
      toast('error', extractApiError(err, 'Không thể lưu đơn mua hàng'));
    }
  };

  const handleDelete = () => {
    if (!orderId) return;
    setConfirmState({
      action: 'delete',
      title: 'Xác nhận xóa',
      message: 'Bạn có chắc chắn muốn xóa đơn hàng này?',
      orderId,
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmState) return;
    try {
      if (confirmState.action === 'delete') {
        await deleteOrder({ pk: confirmState.orderId }).unwrap();
        toast('success', 'Xóa đơn mua hàng thành công');
      }
      setConfirmState(null);
      onSuccess();
    } catch (err) {
      console.error('Failed action', err);
      toast('error', extractApiError(err, 'Thao tác không thành công'));
    }
  };

  const handleConfirmCancel = async (options: { refund_deposit: boolean; keep_goods: boolean }) => {
    if (!orderId) return;
    try {
      await cancelOrder({
        pk: orderId,
        purchaseOrderCancelInput: {
          refund_deposit: options.refund_deposit,
          keep_goods: options.keep_goods,
        }
      }).unwrap();
      toast('success', 'Hủy đơn mua hàng thành công');
      setIsCancelModalOpen(false);
      onSuccess();
    } catch (err) {
      console.error('Failed to cancel purchase order', err);
      toast('error', extractApiError(err, 'Không thể hủy đơn mua hàng'));
    }
  };

  const handleConfirm = async () => {
    if (!orderId || !orderData) return;
    try {
      await approveOrder({ pk: orderId }).unwrap();
      toast('success', 'Duyệt đơn mua hàng thành công');
      onSuccess();
    } catch (err) {
      console.error('Failed to confirm', err);
      toast('error', extractApiError(err, 'Không thể duyệt đơn mua hàng'));
    }
  };

  const handleCancel = () => {
    if (!orderId) return;
    setIsCancelModalOpen(true);
  };

  const lines = watch('lines') || [];
  const calculatedTotal = lines.reduce((sum, line) => {
    const qty = Number(line?.quantity) || 0;
    const price = Number(line?.unit_price) || 0;
    return sum + (qty * price);
  }, 0);

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const modalTitle = !orderId 
    ? "Thêm Đơn Mua Hàng Mới" 
    : isDraft 
      ? `Chi Tiết Đơn Mua Nháp - ${shortId(orderData?.id)}`
      : `Chi Tiết Đơn Mua Hàng - ${shortId(orderData?.id)}`;
  return (
    <>
      <Modal 
        open={open} 
        onClose={onClose} 
        title={modalTitle} 
        size="lg"
        footer={
          <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {orderId && isDraft && (
                <Button variant="danger" onClick={handleDelete} loading={isDeleting} disabled={isWorking} icon={<Trash2 size={16} />}>
                  Xóa
                </Button>
              )}
              {orderId && orderData?.status !== 'draft' && orderData?.status !== 'cancelled' && orderData?.status !== 'completed' && canCancel && (
                <Button variant="danger" onClick={handleCancel} loading={isCancelling} disabled={isWorking} icon={<XCircle size={16} />}>
                  Hủy Đơn
                </Button>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="ghost" onClick={onClose} disabled={isWorking}>
                Đóng
              </Button>
              {isDraft && (
                <Button variant={orderId ? "outline" : "primary"} onClick={handleSubmit(onSubmit)} loading={isCreating || isUpdating} disabled={isWorking}>
                  {orderId ? 'Cập Nhật' : 'Tạo Đơn Hàng'}
                </Button>
              )}
              {orderId && isDraft && canApprove && (
                <Button variant="primary" onClick={handleConfirm} loading={isApproving} disabled={isWorking} icon={<CheckCircle size={16} />}>
                  Duyệt Đơn
                </Button>
              )}
            </div>
          </div>
        }
      >
        {isLoadingOrder ? (
          <div style={{ padding: 'var(--sp-6)', textAlign: 'center', color: 'var(--clr-text-muted)' }}>Đang tải dữ liệu...</div>
        ) : (
          <form className={styles.form} onSubmit={(e) => e.preventDefault()}>

            
            <div className={styles.row}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
                <label htmlFor="vendor_id" style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--clr-text-secondary)' }}>
                  Nhà Cung Cấp <span style={{ color: 'var(--clr-danger)' }}>*</span>
                </label>
                {isReadOnly ? (
                  <div className={styles.staticText} data-testid="static-vendor">
                    {vendorName}
                  </div>
                ) : (
                  <select id="vendor_id" className={styles.itemInput} {...register('vendor_id')} disabled={isWorking}>
                    {getSelectableSuppliers(orderData?.vendor).map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.supplier_name} ({supplier.name})
                      </option>
                    ))}
                  </select>
                )}
                {errors.vendor_id && <span style={{ color: 'var(--clr-error)', fontSize: 'var(--fs-sm)' }}>{errors.vendor_id.message}</span>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
                {isReadOnly ? (
                  <>
                    <label htmlFor="expected_delivery_date_display" style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--clr-text-secondary)' }}>
                      Ngày Giao Dự Kiến <span style={{ color: 'var(--clr-danger)' }}>*</span>
                    </label>
                    <div className={styles.staticText}>
                      {orderData?.expected_delivery_date ? formatDateToDMY(orderData.expected_delivery_date) : '—'}
                    </div>
                  </>
                ) : (
                  <DatePickerField
                    name="expected_delivery_date"
                    label="Ngày Giao Dự Kiến"
                    control={control}
                    error={errors.expected_delivery_date?.message}
                    disabled={isWorking}
                    required={true}
                    defaultValue={getLocalDateString()}
                    minDate={getLocalDateString()}
                  />
                )}
              </div>
            </div>
 
            <div className={styles.itemsSection}>
              <div className={styles.itemsHeader}>
                <h4 className={styles.itemsTitle}>Danh Sách Linh Kiện</h4>
                {!isReadOnly && (
                  <Button variant="outline" size="sm" icon={<Plus size={14} />}
                    onClick={() => {
                      append({ item_id: '', quantity: 1, unit_price: 0 });
                    }}
                    disabled={isWorking}>
                    Thêm
                  </Button>
                )}
              </div>
 
              <div className={styles.itemsTable}>
                <div className={styles.itemRow} style={{ padding: '8px 0', borderBottom: '1px solid var(--clr-border)', fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--clr-text-secondary)', gridTemplateColumns: isReadOnly ? '1fr 100px 150px 120px' : '1fr 140px 150px 36px' }}>
                  <span>Linh Kiện</span>
                  <span>Số Lượng</span>
                  <span>Đơn Giá</span>
                  {isReadOnly && <span>Đã Nhận</span>}
                  {!isReadOnly && <span />}
                </div>
                {fields.map((field, index) => {
                  const originalLine = orderData?.lines?.[index];
                  const selectedItem = itemMap.get(field.item_id);
                  const displayName = selectedItem?.item_name || originalLine?.item_name || 'Linh Kiện Khác';
                  const displayCode = selectedItem?.item_code || originalLine?.item_code || 'OTHER';
                  return (
                    <div key={field.id} className={styles.itemRow} style={{ padding: '8px 0', gridTemplateColumns: isReadOnly ? '1fr 100px 150px 120px' : '1fr 140px 150px 36px' }}>
                      {isReadOnly ? (
                        <>
                          <div className={styles.staticText}>
                            {displayName} ({displayCode})
                          </div>
                          <div className={styles.staticText} style={{ justifyContent: 'flex-start', textAlign: 'left' }}>
                            {formatNumber(field.quantity, getDecimalsForUom(selectedItem?.stock_uom_name))} {selectedItem?.stock_uom_name || ''}
                          </div>
                          <div className={styles.staticText} style={{ justifyContent: 'flex-start', textAlign: 'left' }}>
                            {formatVND(field.unit_price)}
                          </div>
                          <div className={styles.staticText} style={{ justifyContent: 'flex-start', textAlign: 'left' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start', width: '100%' }}>
                              <span style={{
                                fontWeight: 600,
                                fontSize: 'var(--fs-xs)',
                                color: Number(originalLine?.receipt_fulfillment_rate || 0) === 100
                                  ? 'var(--clr-success)'
                                  : 'var(--clr-warning)'
                              }}>
                                {Number(originalLine?.receipt_fulfillment_rate || 0)}%
                              </span>
                              <div style={{ width: '100%', height: 4, background: 'var(--clr-border)', borderRadius: 2, overflow: 'hidden' }}>
                                <div style={{
                                  width: `${Math.min(Number(originalLine?.receipt_fulfillment_rate || 0), 100)}%`,
                                  height: '100%',
                                  background: Number(originalLine?.receipt_fulfillment_rate || 0) === 100
                                    ? 'var(--clr-success)'
                                    : 'var(--clr-warning)',
                                  transition: 'width 0.3s ease',
                                }} />
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <Controller
                              control={control}
                              name={`lines.${index}.item_id` as const}
                              rules={{ required: 'Linh kiện là bắt buộc' }}
                              render={({ field: selectField }) => (
                                <SearchableSelect
                                  placeholder="-- Chọn linh kiện --"
                                  options={getSelectableItems(index, selectField.value).map(item => ({
                                    label: `${item.item_name} (${item.item_code})`,
                                    value: item.id || ''
                                  }))}
                                  value={selectField.value}
                                  onChange={selectField.onChange}
                                  disabled={isWorking}
                                  error={errors.lines?.[index]?.item_id?.message}
                                />
                              )}
                            />
                          </div>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <Input
                              type="number"
                              min={0}
                              size="sm"
                              decimals={getDecimalsForUom(selectedItem?.stock_uom_name)}
                              disabled={isWorking}
                              error={errors.lines?.[index]?.quantity?.message}
                              {...register(`lines.${index}.quantity` as const, {
                                valueAsNumber: true,
                                required: 'Bắt buộc',
                                validate: {
                                  required: (v) => !isNaN(v) || 'Bắt buộc nhập số lượng',
                                  positive: (v) => v > 0 || 'Số lượng phải lớn hơn 0',
                                },
                              })}
                            />
                            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-secondary)', minWidth: '36px', whiteSpace: 'nowrap' }}>
                              {selectedItem?.stock_uom_name || '-'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <Input
                              type="number"
                              min={0}
                              size="sm"
                              step={1000}
                              disabled={isWorking}
                              error={errors.lines?.[index]?.unit_price?.message}
                              {...register(`lines.${index}.unit_price` as const, {
                                valueAsNumber: true,
                                required: 'Bắt buộc',
                                min: { value: 0, message: 'Đơn giá tối thiểu là 0' }
                              })}
                            />
                          </div>
                          <button type="button" className={styles.removeBtn} onClick={() => remove(index)} aria-label="Xóa linh kiện"
                            disabled={fields.length <= 1 || isWorking} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
 
            <div className={styles.summarySection}>
              <div className={styles.summaryRow}>
                <span>Tổng giá trị đơn hàng:</span>
                <span className={styles.summaryTotal}>{formatVND(calculatedTotal)}</span>
              </div>
              <div className={styles.summaryRow} style={{ gap: 'var(--sp-2)' }}>
                <label htmlFor="advance_paid_amount" style={{ fontWeight: 500, fontSize: 'var(--fs-sm)', color: 'var(--clr-text-secondary)' }}>
                  Số tiền đặt cọc:
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                  {isReadOnly ? (
                    <div className={styles.staticText} style={{ width: '180px', justifyContent: 'flex-end', textAlign: 'right', fontWeight: 600 }}>
                      {formatVND(watch('advance_paid_amount') || 0)}
                    </div>
                  ) : (
                    <input
                      id="advance_paid_amount"
                      type="number"
                      min={0}
                      step={1000}
                      className={styles.itemInput}
                      style={{ width: '180px', textAlign: 'right' }}
                      {...register('advance_paid_amount', { valueAsNumber: true })}
                      disabled={isWorking}
                    />
                  )}
                  {errors.advance_paid_amount && (
                    <span style={{ color: 'var(--clr-error)', fontSize: 'var(--fs-xs)' }}>
                      {errors.advance_paid_amount.message}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {isReadOnly && orderData && (
              <div style={{ marginTop: '20px', padding: '16px', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-md)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', backgroundColor: 'var(--clr-background)' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: 'var(--fs-sm)' }}>
                    <span style={{ fontWeight: 500 }}>Tiến độ Nhập Kho</span>
                    <span style={{ fontWeight: 600, color: 'var(--clr-success)' }}>{Number(orderData.receipt_fulfillment_rate || 0)}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--clr-border)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(Number(orderData.receipt_fulfillment_rate || 0), 100)}%`, height: '100%', background: 'var(--clr-success)', transition: 'width 0.3s ease' }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: 'var(--fs-sm)' }}>
                    <span style={{ fontWeight: 500 }}>Tiến độ Thanh Toán</span>
                    <span style={{ fontWeight: 600, color: 'var(--clr-primary)' }}>{Number(orderData.payment_fulfillment_rate || 0)}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--clr-border)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(Number(orderData.payment_fulfillment_rate || 0), 100)}%`, height: '100%', background: 'var(--clr-primary)', transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              </div>
            )}
            
            {isReadOnly && (orderData?.stock_entries?.length || orderData?.invoices?.length) ? (
              <div style={{ marginTop: '24px', borderTop: '1px dashed var(--clr-border)', paddingTop: '16px' }}>
                <h4 className={styles.itemsTitle} style={{ marginBottom: '12px' }}>Chứng Từ Liên Kết</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {orderData.stock_entries && orderData.stock_entries.length > 0 && (
                    <div>
                      <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-secondary)', fontWeight: 600 }}>Phiếu nhập kho</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                        {orderData.stock_entries.map(entry => (
                          <div key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--clr-background)' }}>
                            <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--clr-text-primary)' }}>{entry.name}</span>
                            <span style={{ fontSize: 'var(--fs-xs)', textTransform: 'uppercase', fontWeight: 600, color: getStockEntryStatusColor(entry.status) }}>
                              {getStockEntryStatusLabel(entry.status)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {orderData.invoices && orderData.invoices.length > 0 && (
                    <div>
                      <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-secondary)', fontWeight: 600 }}>Hóa đơn mua hàng</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                        {orderData.invoices.map(inv => (
                          <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--clr-background)' }}>
                            <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--clr-text-primary)' }}>
                              INV-{shortId(inv.id)}
                            </span>
                            <span style={{ fontSize: 'var(--fs-xs)', textTransform: 'uppercase', fontWeight: 600, color: getInvoiceStatusColor(inv.status) }}>
                              {getInvoiceStatusLabel(inv.status)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </form>
        )}
      </Modal>

      <CancelOrderConfirmModal
        key={`cancel-order-${isCancelModalOpen}`}
        open={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
        isLoading={isCancelling}
        hasReceivedGoods={Boolean(orderData?.stock_entries?.some(se => se.status === 'posted'))}
        hasDeposit={Boolean(orderData?.advance_paid_amount && Number(orderData.advance_paid_amount) > 0)}
        advancePaidAmount={Number(orderData?.advance_paid_amount) || 0}
      />
      {confirmState && (
        <ConfirmModal
          open={!!confirmState}
          title={confirmState.title}
          message={confirmState.message}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmState(null)}
          isLoading={isDeleting}
          confirmVariant="danger"
        />
      )}
    </>
  );
};

interface CancelOrderConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (options: { refund_deposit: boolean; keep_goods: boolean }) => void;
  isLoading: boolean;
  hasReceivedGoods: boolean;
  hasDeposit: boolean;
  advancePaidAmount: number;
}

const CancelOrderConfirmModal: React.FC<CancelOrderConfirmModalProps> = ({
  open,
  onClose,
  onConfirm,
  isLoading,
  hasReceivedGoods,
  hasDeposit,
  advancePaidAmount,
}) => {
  const [refundDeposit, setRefundDeposit] = useState(true);
  const [keepGoods, setKeepGoods] = useState(true);

  const handleConfirm = () => {
    onConfirm({
      refund_deposit: refundDeposit,
      keep_goods: keepGoods,
    });
  };

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Xác Nhận Hủy Đơn Mua Hàng"
      size="md"
      footer={
        <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Quay lại
          </Button>
          <Button variant="danger" onClick={handleConfirm} loading={isLoading}>
            Xác nhận hủy
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: 'var(--fs-sm)', color: 'var(--clr-text)' }}>
        <p style={{ fontWeight: 500 }}>Bạn có chắc chắn muốn hủy đơn mua hàng này không?</p>
        
        {!hasReceivedGoods ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--clr-background)' }}>
            <span style={{ fontWeight: 600, color: 'var(--clr-text-secondary)' }}>Trạng thái: Chưa nhập kho</span>
            {hasDeposit && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p>Đơn hàng đã thanh toán cọc số tiền: <strong>{formatVND(advancePaidAmount)}</strong>.</p>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 500 }}>
                  <input
                    type="checkbox"
                    checked={refundDeposit}
                    onChange={(e) => setRefundDeposit(e.target.checked)}
                    style={{ width: '16px', height: '16px' }}
                  />
                  Nhận lại tiền đặt cọc (Tự động tạo phiếu thu hoàn tiền cọc)
                </label>
                {!refundDeposit && (
                  <p style={{ color: 'var(--clr-warning)', fontSize: 'var(--fs-xs)', margin: 0 }}>
                    ⚠️ Cảnh báo: Tiền cọc sẽ không được hoàn lại trên hệ thống tài chính.
                  </p>
                )}
              </div>
            )}
            {!hasDeposit && <p>Đơn hàng chưa phát sinh đặt cọc. Hệ thống sẽ tiến hành hủy đơn hàng.</p>}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--clr-background)' }}>
            <span style={{ fontWeight: 600, color: 'var(--clr-danger)' }}>Trạng thái: Đã nhập hàng thực tế</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 500 }}>
                <input
                  type="checkbox"
                  checked={keepGoods}
                  onChange={(e) => setKeepGoods(e.target.checked)}
                  style={{ width: '16px', height: '16px' }}
                />
                Giữ lại phần hàng đã nhận (Cân đối công nợ và tiền trả)
              </label>
              
              {keepGoods ? (
                <p style={{ color: 'var(--clr-text-secondary)', fontSize: 'var(--fs-xs)', margin: 0 }}>
                  💡 Hệ thống sẽ giữ nguyên các phiếu nhập kho đã đăng ký, tính chênh lệch giá trị hàng nhận với số tiền đã trả để tự động sinh phiếu thu/chi đối ứng cân bằng tài chính.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <p style={{ color: 'var(--clr-danger)', fontSize: 'var(--fs-xs)', fontWeight: 600, margin: 0 }}>
                    🚨 Cảnh báo: Trả hàng toàn bộ! Hệ thống sẽ tự động tạo phiếu xuất kho đối ứng để trả lại toàn bộ số hàng đã nhận, và tạo phiếu thu đối ứng để hoàn trả toàn bộ số tiền đã thanh toán.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

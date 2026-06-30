import React, { useEffect, useState, useRef } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { 
  usePostSalesOrdersMutation, 
  useGetSalesOrdersByPkQuery,
  usePutSalesOrdersByPkMutation,
  useDeleteSalesOrdersByPkMutation,
  usePostSalesOrdersByPkApproveMutation,
  usePostSalesOrdersByPkCancelMutation
} from '@entities/sales/api/salesApi';
import { useGetMasterDataItemsListQuery } from '@features/inventory/api/masterDataApi';
import { useGetCrmCustomersQuery } from '@entities/crm/api/crmApi';
import type { SalesOrderInput } from '@entities/sales/model/types';
import { Modal } from '@shared/ui/Modal/Modal';
import { Button } from '@shared/ui/Button/Button';
import { Plus, Trash2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { ConfirmModal } from '@shared/ui/Modal/ConfirmModal';
import { usePermission } from '@shared/hooks/usePermission';
import { SearchableSelect } from '@shared/ui/Select/SearchableSelect';
import { Input } from '@shared/ui/Input/Input';
import { DatePickerField } from '@shared/ui/DatePickerField/DatePickerField';
import { getDecimalsForUom } from '@shared/lib/uomDecimals';
import { formatNumber } from '@shared/lib/formatNumber';
import { useToast } from '@shared/ui/Toast/Toast';
import { shortId } from '@shared/lib/shortId';
import styles from './SalesOrderFormModal.module.css';

const formatDateToDMY = (isoDateStr: string): string => {
  if (!isoDateStr) return '';
  const [year, month, day] = isoDateStr.split('-');
  return `${day}/${month}/${year}`;
};


const getStockEntryStatusLabel = (status?: string) => {
  switch (status) {
    case 'posted': return 'Đã Xuất';
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
    case 'paid': return 'Đã Thu Tiền';
    case 'partial': return 'Thu Một Phần';
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

const getLocalDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface SalesOrderFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  orderId?: string | null;
}

export const SalesOrderFormModal: React.FC<SalesOrderFormModalProps> = ({ open, onClose, onSuccess, orderId }) => {
  const { data: orderData, isLoading: isLoadingOrder } = useGetSalesOrdersByPkQuery({ pk: orderId as string }, { skip: !orderId });
  const { data: itemsData } = useGetMasterDataItemsListQuery({ status: 'active', limit: 100 });
  const { data: customersData } = useGetCrmCustomersQuery();
  
  const [createOrder, { isLoading: isCreating }] = usePostSalesOrdersMutation();
  const [updateOrder, { isLoading: isUpdating }] = usePutSalesOrdersByPkMutation();
  const [deleteOrder, { isLoading: isDeleting }] = useDeleteSalesOrdersByPkMutation();
  const [approveOrder, { isLoading: isApproving }] = usePostSalesOrdersByPkApproveMutation();
  const [cancelOrder, { isLoading: isCancelling }] = usePostSalesOrdersByPkCancelMutation();

  const canCancel = usePermission('sales.cancel_order');
  const canApprove = usePermission('sales.update_order');
  const { toast } = useToast();

  const [confirmState, setConfirmState] = useState<{ action: 'delete' | 'cancel'; title: string; message: string; orderId: string } | null>(null);
  const [isApproveConfirmOpen, setIsApproveConfirmOpen] = useState(false);
  const [approvalDueDate, setApprovalDueDate] = useState(getLocalDateString());

  const isDraft = orderData ? orderData.status === 'draft' : true;
  const isCreditApproval = orderData?.status === 'pending_credit_approval';
  const isReadOnly = !isDraft;
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

  const customerMap = React.useMemo(() => {
    const map = new Map<string, { id?: string; customer_name?: string; name?: string }>();
    if (customersData) {
      customersData.forEach(c => {
        if (c.id) map.set(c.id, c);
      });
    }
    return map;
  }, [customersData]);

  const { register, control, handleSubmit, formState: { errors }, reset, watch } = useForm<SalesOrderInput>({
    defaultValues: {
      customer_id: '',
      advance_paid_amount: 0,
      due_date: getLocalDateString(),
      lines: [{ item_id: '', quantity: 1, unit_price: 0 }],
    }
  });

  const selectedCustomerId = watch('customer_id');
  const customerName = React.useMemo(() => {
    if (selectedCustomerId) {
      const cust = customerMap.get(selectedCustomerId);
      if (cust) return `${cust.customer_name} (${cust.name})`;
    }
    return orderData?.customer_name || 'N/A';
  }, [selectedCustomerId, customerMap, orderData]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines'
  });

  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!open) {
      hasInitialized.current = false;
    }
  }, [open]);

  useEffect(() => {
    if (orderId && orderData && !hasInitialized.current) {
      reset({
        customer_id: orderData.customer,
        advance_paid_amount: Number(orderData.advance_paid_amount) || 0,
        due_date: orderData.due_date || '',
        lines: (orderData.lines || []).map(l => ({
          item_id: l.item,
          quantity: Number(l.quantity) || 0,
          unit_price: Number(l.unit_price) || 0,
        }))
      });
      hasInitialized.current = true;
    } else if (!orderId && customersData !== undefined && itemsData !== undefined && !hasInitialized.current) {
      reset({
        customer_id: '',
        advance_paid_amount: 0,
        due_date: getLocalDateString(),
        lines: [{ item_id: itemsData?.results?.[0]?.id || '', quantity: 1, unit_price: 0 }],
      });
      hasInitialized.current = true;
    }
  }, [orderId, orderData, reset, itemsData, customersData]);

  const getSelectableItems = (index: number, currentFieldItemId?: string) => {
    const watchLines = watch('lines') || [];
    const selectedIds = watchLines
      .map((line, i) => (i !== index ? line.item_id : null))
      .filter((id): id is string => !!id);
    
    const list = (itemsData?.results || []).filter(item => item.id && !selectedIds.includes(item.id)) as any[];
    const existsInMaster = (itemsData?.results || []).some(item => item.id === currentFieldItemId);
    if (currentFieldItemId && !existsInMaster) {
      const originalLine = orderData?.lines?.find(l => l.item === currentFieldItemId);
      list.push({
        id: currentFieldItemId,
        item_name: originalLine?.item_name || 'Sản Phẩm Khác',
        item_code: originalLine?.item_code || 'OTHER',
      });
    }
    return list;
  };

  const getSelectableCustomers = (currentCustomerId?: string) => {
    const list = [...(customersData || [])];
    if (currentCustomerId && !list.some(c => c.id === currentCustomerId)) {
      list.push({
        id: currentCustomerId,
        customer_name: orderData?.customer_name || 'Khách Hàng Khác',
        name: 'OTHER',
      });
    }
    return list;
  };

  const onSubmit = async (data: SalesOrderInput) => {
    try {
      if (orderId) {
        await updateOrder({ pk: orderId, salesOrderInput: data }).unwrap();
      } else {
        await createOrder({ salesOrderInput: data }).unwrap();
      }
      onSuccess();
    } catch (err) {
      console.error('Failed to save sales order', err);
      const errData = err as { data?: { detail?: string } };
      toast('error', errData?.data?.detail || 'Không thể lưu đơn bán hàng');
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
      } else if (confirmState.action === 'cancel') {
        await cancelOrder({ pk: confirmState.orderId }).unwrap();
      }
      setConfirmState(null);
      onSuccess();
    } catch (err) {
      console.error('Failed action', err);
      const errData = err as { data?: { detail?: string } };
      toast('error', errData?.data?.detail || 'Thao tác thất bại');
    }
  };

  const handleConfirm = () => {
    if (!orderId || !orderData) return;
    setApprovalDueDate(getLocalDateString());
    setIsApproveConfirmOpen(true);
  };



  const handleCancel = () => {
    if (!orderId) return;
    setConfirmState({
      action: 'cancel',
      title: 'Xác nhận hủy',
      message: 'Bạn có chắc chắn muốn hủy đơn hàng này?',
      orderId,
    });
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
    ? "Thêm Đơn Bán Hàng Mới" 
    : isDraft 
      ? `Chi Tiết Đơn Bán Nháp - ${shortId(orderData?.id)}`
      : `Chi Tiết Đơn Bán Hàng - ${shortId(orderData?.id)}`;

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
                <Button variant="primary" onClick={handleConfirm} loading={isUpdating} disabled={isWorking} icon={<CheckCircle size={16} />}>
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
            {isCreditApproval && (
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '16px',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '12px',
                marginBottom: '20px',
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.04)'
              }}>
                <AlertCircle size={20} color="rgb(239, 68, 68)" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'rgb(220, 38, 38)' }}>
                    Đơn hàng bị Khóa Tín Dụng
                  </span>
                  <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-secondary)', lineHeight: 1.5 }}>
                    Đơn hàng này đã bị hệ thống tự động khóa và chuyển sang trạng thái chờ duyệt do khách hàng vượt quá hạn mức nợ hoặc có nợ quá hạn trên 30 ngày. Vui lòng liên hệ Admin/CFO để duyệt đặc cách.
                  </span>
                </div>
              </div>
            )}
 

 
            <div className={styles.row}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)', flex: 1 }}>
                <label htmlFor="customer_id" style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--clr-text-secondary)' }}>
                  Khách Hàng <span style={{ color: 'var(--clr-danger)' }}>*</span>
                </label>
                {isReadOnly ? (
                  <div className={styles.staticText} data-testid="static-customer">
                    {customerName}
                  </div>
                ) : (
                  <select id="customer_id" className={styles.itemInput} {...register('customer_id', { required: 'Bắt buộc' })} disabled={isWorking}>
                    {getSelectableCustomers(orderData?.customer).map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.customer_name} ({customer.name})
                      </option>
                    ))}
                  </select>
                )}
                {errors.customer_id && <span style={{ color: 'var(--clr-error)', fontSize: 'var(--fs-sm)' }}>{errors.customer_id.message}</span>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)', flex: 1 }}>
                {isReadOnly ? (
                  <>
                    <label htmlFor="due_date_display" style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--clr-text-secondary)' }}>
                      Hạn Thanh Toán <span style={{ color: 'var(--clr-danger)' }}>*</span>
                    </label>
                    <div className={styles.staticText}>
                      {orderData?.due_date ? formatDateToDMY(orderData.due_date) : '—'}
                    </div>
                  </>
                ) : (
                  <DatePickerField
                    name="due_date"
                    label="Hạn Thanh Toán"
                    control={control}
                    error={errors.due_date?.message}
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
                <h4 className={styles.itemsTitle}>Danh Sách Sản Phẩm</h4>
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
                <div className={styles.itemRow} style={{ padding: '8px 0', borderBottom: '1px solid var(--clr-border)', fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--clr-text-secondary)', gridTemplateColumns: isReadOnly ? '1fr 100px 150px 100px 100px' : '1fr 140px 150px 36px' }}>
                  <span>Sản Phẩm</span>
                  <span>Số Lượng</span>
                  <span>Đơn Giá</span>
                  {isReadOnly && (
                    <>
                      <span>Đã Giao</span>
                      <span>% Đã Giao</span>
                    </>
                  )}
                  {!isReadOnly && <span />}
                </div>
                {fields.map((field, index) => {
                  const originalLine = orderData?.lines?.[index];
                  const selectedItem = itemMap.get(field.item_id);
                  const displayName = selectedItem?.item_name || originalLine?.item_name || 'Sản Phẩm Khác';
                  const displayCode = selectedItem?.item_code || originalLine?.item_code || 'OTHER';
                  return (
                    <div key={field.id} className={styles.itemRow} style={{ padding: '8px 0', gridTemplateColumns: isReadOnly ? '1fr 100px 150px 100px 100px' : '1fr 140px 150px 36px' }}>
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
                            {formatNumber(field.quantity * (Number(originalLine?.receipt_fulfillment_rate || 0) / 100), getDecimalsForUom(selectedItem?.stock_uom_name))} {selectedItem?.stock_uom_name || ''}
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
                              rules={{ required: 'Sản phẩm là bắt buộc' }}
                              render={({ field: selectField }) => (
                                <SearchableSelect
                                  placeholder="-- Chọn sản phẩm --"
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
                          <button type="button" className={styles.removeBtn} onClick={() => remove(index)} aria-label="Xóa sản phẩm"
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
                      {...register('advance_paid_amount', {
                        valueAsNumber: true,
                        min: { value: 0, message: 'Tiền cọc không được âm' },
                        validate: v => {
                          if (v === undefined || isNaN(v)) return 'Bắt buộc';
                          if (v > calculatedTotal) return 'Tiền cọc không vượt quá tổng giá trị đơn hàng';
                          return true;
                        }
                      })}
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
                    <span style={{ fontWeight: 500 }}>Tiến độ Giao Hàng</span>
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
                      <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-secondary)', fontWeight: 600 }}>Phiếu xuất kho</span>
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
                      <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-secondary)', fontWeight: 600 }}>Hóa đơn bán hàng</span>
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

      {isApproveConfirmOpen && (
        <ConfirmModal
          open={isApproveConfirmOpen}
          title="Xác nhận duyệt đơn bán hàng"
          isLoading={isApproving}
          message={
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
              <p>Bạn có chắc chắn muốn duyệt đơn bán hàng này? Hệ thống sẽ tự động tạo Hóa đơn bán hàng tương ứng.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label htmlFor="approve_due_date" style={{ fontWeight: 500, fontSize: 'var(--fs-xs)', color: 'var(--clr-text-secondary)' }}>
                  Hạn Thanh Toán Hóa Đơn <span style={{ color: 'var(--clr-danger)' }}>*</span>
                </label>
                <input
                  id="approve_due_date"
                  type="date"
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--clr-border-active, #cbd5e1)',
                    width: '100%',
                    fontSize: '14px'
                  }}
                  value={approvalDueDate}
                  min={getLocalDateString()}
                  onChange={(e) => setApprovalDueDate(e.target.value)}
                  required
                />
              </div>
            </div>
          }
          onConfirm={async () => {
            if (!approvalDueDate) {
              toast('error', 'Hạn thanh toán là bắt buộc');
              return;
            }
            if (approvalDueDate < getLocalDateString()) {
              toast('error', 'Hạn thanh toán không thể ở quá khứ');
              return;
            }
            try {
              await approveOrder({ pk: orderId!, body: { due_date: approvalDueDate } }).unwrap();
              toast('success', 'Duyệt đơn bán hàng thành công');
              setIsApproveConfirmOpen(false);
              onSuccess();
            } catch (err) {
              console.error('Failed to confirm', err);
              const errData = err as { data?: { detail?: string } };
              toast('error', errData?.data?.detail || 'Không thể duyệt đơn bán hàng');
            }
          }}
          onCancel={() => setIsApproveConfirmOpen(false)}
        />
      )}
 
      {confirmState && (
        <ConfirmModal
          open={!!confirmState}
          title={confirmState.title}
          message={confirmState.message}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmState(null)}
          isLoading={isDeleting || isCancelling}
          confirmVariant="danger"
        />
      )}
    </>
  );
};

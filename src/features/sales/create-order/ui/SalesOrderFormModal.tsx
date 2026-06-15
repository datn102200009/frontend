import React, { useEffect, useState, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { 
  usePostSalesOrdersMutation, 
  useGetSalesOrdersByPkQuery,
  usePutSalesOrdersByPkMutation,
  useDeleteSalesOrdersByPkMutation,
  usePostSalesOrdersByPkApproveMutation,
  usePostSalesOrdersByPkApproveCreditBypassMutation,
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
import { useToast } from '@shared/ui/Toast/Toast';
import { shortId } from '@shared/lib/shortId';
import styles from './SalesOrderFormModal.module.css';


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
  const [approveCreditBypass, { isLoading: isBypassing }] = usePostSalesOrdersByPkApproveCreditBypassMutation();
  const [cancelOrder, { isLoading: isCancelling }] = usePostSalesOrdersByPkCancelMutation();

  const canBypass = usePermission('sales.approve_credit_bypass');
  const canCancel = usePermission('sales.cancel_order');
  const canApprove = usePermission('sales.update_order');
  const { toast } = useToast();

  const [confirmState, setConfirmState] = useState<{ action: 'delete' | 'cancel'; title: string; message: string; orderId: string } | null>(null);

  const isDraft = orderData ? orderData.status === 'draft' : true;
  const isCreditApproval = orderData?.status === 'pending_credit_approval';
  const isReadOnly = !isDraft;
  const isWorking = isCreating || isUpdating || isDeleting || isApproving || isBypassing || isCancelling || isLoadingOrder;

  const itemMap = React.useMemo(() => {
    const map = new Map<string, { id?: string; item_name?: string; item_code?: string }>();
    if (itemsData?.results) {
      itemsData.results.forEach(item => {
        if (item.id) map.set(item.id, item);
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
        lines: [{ item_id: itemsData?.results?.[0]?.id || '', quantity: 1, unit_price: 0 }],
      });
      hasInitialized.current = true;
    }
  }, [orderId, orderData, reset, itemsData, customersData]);

  const getSelectableItems = (currentFieldItemId?: string) => {
    const list = [...(itemsData?.results || [])];
    if (currentFieldItemId && !list.some(item => item.id === currentFieldItemId)) {
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

  const handleConfirm = async () => {
    if (!orderId || !orderData) return;
    try {
      await approveOrder({ pk: orderId }).unwrap();
      onSuccess();
    } catch (err) {
      console.error('Failed to confirm', err);
      const errData = err as { data?: { detail?: string } };
      toast('error', errData?.data?.detail || 'Duyệt đơn hàng thất bại');
    }
  };

  const handleBypass = async () => {
    if (!orderId || !orderData) return;
    try {
      await approveCreditBypass({ pk: orderId }).unwrap();
      onSuccess();
    } catch (err) {
      console.error('Failed to bypass credit approval', err);
      const errData = err as { data?: { detail?: string } };
      toast('error', errData?.data?.detail || 'Duyệt tín dụng đặc cách thất bại');
    }
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
              {orderId && isCreditApproval && canBypass && (
                <Button variant="primary" onClick={handleBypass} loading={isBypassing} disabled={isWorking} icon={<CheckCircle size={16} />}>
                  Duyệt tín dụng đặc cách
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
            </div>
 
            <div className={styles.itemsSection}>
              <div className={styles.itemsHeader}>
                <h4 className={styles.itemsTitle}>Danh Sách Sản Phẩm</h4>
                {!isReadOnly && (
                  <Button variant="outline" size="sm" icon={<Plus size={14} />}
                    onClick={() => {
                      const firstItemId = itemsData?.results?.[0]?.id || '';
                      append({ item_id: firstItemId, quantity: 1, unit_price: 0 });
                    }}
                    disabled={isWorking}>
                    Thêm
                  </Button>
                )}
              </div>
 
              <div className={styles.itemsTable}>
                <div className={styles.itemRow} style={{ padding: '8px 0', borderBottom: '1px solid var(--clr-border)', fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--clr-text-secondary)' }}>
                  <span>Sản Phẩm</span>
                  <span>Số Lượng</span>
                  <span>Đơn Giá</span>
                  {!isReadOnly && <span />}
                </div>
                {fields.map((field, index) => {
                  const originalLine = orderData?.lines?.[index];
                  const displayName = itemMap.get(field.item_id)?.item_name || originalLine?.item_name || 'Sản Phẩm Khác';
                  const displayCode = itemMap.get(field.item_id)?.item_code || originalLine?.item_code || 'OTHER';
                  return (
                    <div key={field.id} className={styles.itemRow} style={{ padding: '8px 0', gridTemplateColumns: isReadOnly ? '1fr 100px 150px' : '1fr 100px 150px 36px' }}>
                      {isReadOnly ? (
                        <>
                          <div className={styles.staticText}>
                            {displayName} ({displayCode})
                          </div>
                          <div className={styles.staticText} style={{ justifyContent: 'flex-start', textAlign: 'left' }}>
                            {field.quantity}
                          </div>
                          <div className={styles.staticText} style={{ justifyContent: 'flex-start', textAlign: 'left' }}>
                            {formatVND(field.unit_price)}
                          </div>
                        </>
                      ) : (
                        <>
                          <select className={styles.itemInput} {...register(`lines.${index}.item_id` as const, { required: 'Bắt buộc' })} disabled={isWorking}>
                            {getSelectableItems(field.item_id).map(item => (
                              <option key={item.id} value={item.id}>
                                {item.item_name} ({item.item_code})
                              </option>
                            ))}
                          </select>
                          <input className={styles.itemInput} type="number" min={1} {...register(`lines.${index}.quantity` as const, { valueAsNumber: true, required: 'Bắt buộc', min: { value: 1, message: 'Số lượng tối thiểu là 1' }, validate: v => !isNaN(v) || 'Bắt buộc' })} disabled={isWorking} />
                          <input className={styles.itemInput} type="number" min={0} step={1000} {...register(`lines.${index}.unit_price` as const, { valueAsNumber: true, required: 'Bắt buộc', min: { value: 0, message: 'Đơn giá tối thiểu là 0' }, validate: v => !isNaN(v) || 'Bắt buộc' })} disabled={isWorking} />
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

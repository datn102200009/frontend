import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { 
  usePostSalesOrdersMutation, 
  useGetSalesOrdersByPkQuery,
  usePutSalesOrdersByPkMutation,
  useDeleteSalesOrdersByPkMutation,
  usePostSalesOrdersByPkApproveMutation
} from '@entities/sales/api/salesApi';
import { useGetMasterDataItemsListQuery } from '@features/inventory/api/masterDataApi';
import { useGetCrmCustomersQuery } from '@entities/crm/api/crmApi';
import type { SalesOrderInput } from '@entities/sales/model/types';
import { Modal } from '@shared/ui/Modal/Modal';
import { Button } from '@shared/ui/Button/Button';
import { Plus, Trash2, CheckCircle, XCircle, CreditCard, AlertCircle } from 'lucide-react';
import { CashFlowFormModal } from '@features/finance/create-transaction/ui/CashFlowFormModal';
import { ConfirmModal } from '@shared/ui/Modal/ConfirmModal';
import styles from './SalesOrderFormModal.module.css';


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

  const [showAdvancePayment, setShowAdvancePayment] = useState(false);
  const [confirmState, setConfirmState] = useState<{ action: 'delete' | 'cancel'; title: string; message: string; orderId: string } | null>(null);

  const isDraft = orderData ? orderData.status === 'draft' : true;
  const isPending = orderData?.status === 'pending';
  const isReadOnly = !isDraft;
  const isWorking = isCreating || isUpdating || isDeleting || isApproving || isLoadingOrder;

  const { register, control, handleSubmit, formState: { errors }, reset } = useForm<SalesOrderInput>({
    defaultValues: {
      customer_id: '',
      lines: [{ item_id: '', quantity: 1, unit_price: 15000000 }],
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines'
  });

  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (orderId && orderData && !hasInitialized) {
      reset({
        customer_id: orderData.customer,
        lines: (orderData.lines || []).map(l => ({
          item_id: l.item,
          quantity: l.quantity,
          unit_price: l.unit_price,
        }))
      });
      setHasInitialized(true);
    } else if (!orderId && customersData !== undefined && itemsData !== undefined && !hasInitialized) {
      reset({
        customer_id: customersData?.[0]?.id || '',
        lines: [{ item_id: itemsData?.results?.[0]?.id || '', quantity: 1, unit_price: 15000000 }],
      });
      setHasInitialized(true);
    }
  }, [orderId, orderData, reset, itemsData, customersData, hasInitialized]);

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
        await createOrder({ salesOrderInput: { ...data, status: 'draft' } }).unwrap();
      }
      onSuccess();
    } catch (err) {
      console.error('Failed to save sales order', err);
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
        await updateOrder({
          pk: confirmState.orderId,
          salesOrderInput: {
            customer_id: orderData!.customer!,
            status: 'cancelled',
            lines: orderData!.lines!.map(l => ({
              item_id: l.item!,
              quantity: l.quantity!,
              unit_price: l.unit_price!,
            }))
          }
        }).unwrap();
      }
      setConfirmState(null);
      onSuccess();
    } catch (err) {
      console.error('Failed action', err);
    }
  };

  const handleConfirm = async () => {
    if (!orderId || !orderData) return;
    try {
      await approveOrder({ pk: orderId }).unwrap();
      onSuccess();
    } catch (err) {
      console.error('Failed to confirm', err);
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

  const modalTitle = !orderId 
    ? "Thêm Đơn Bán Hàng Mới" 
    : isDraft 
      ? `Chi Tiết Đơn Bán Nháp - ${(orderData?.id || '').slice(0, 8).toUpperCase()}`
      : `Chi Tiết Đơn Bán Hàng - ${(orderData?.id || '').slice(0, 8).toUpperCase()}`;

  return (
    <>
      <Modal 
        open={open && !showAdvancePayment} 
        onClose={onClose} 
        title={modalTitle} 
        size="lg"
        footer={
          <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {orderId && isDraft && (
                <Button variant="outline" onClick={handleDelete} loading={isDeleting} disabled={isWorking} icon={<Trash2 size={16} />}>
                  Xóa
                </Button>
              )}
              {orderId && isPending && (
                <Button variant="outline" onClick={handleCancel} loading={isUpdating} disabled={isWorking} icon={<XCircle size={16} />}>
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
              {orderId && isDraft && (
                <Button variant="primary" onClick={handleConfirm} loading={isUpdating} disabled={isWorking} icon={<CheckCircle size={16} />}>
                  Duyệt Đơn
                </Button>
              )}
              {orderId && isPending && (
                <Button onClick={() => setShowAdvancePayment(true)} disabled={isWorking} icon={<CreditCard size={16} />}>
                  Nhận Thanh Toán Cọc
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
            {!isDraft && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: 'var(--clr-surface-muted)', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
                <AlertCircle size={18} color="var(--clr-primary)" />
                <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text-secondary)' }}>Đơn hàng không thể chỉnh sửa ở trạng thái hiện tại.</span>
              </div>
            )}

            <div className={styles.row}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)', flex: 1 }}>
                <label htmlFor="customer_id" style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--clr-text-secondary)' }}>
                  Khách Hàng <span style={{ color: 'var(--clr-danger)' }}>*</span>
                </label>
                <select id="customer_id" className={styles.itemInput} {...register('customer_id', { required: 'Bắt buộc' })} disabled={isWorking || isReadOnly}>
                  {getSelectableCustomers(orderData?.customer).map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.customer_name} ({customer.name})
                    </option>
                  ))}
                </select>
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
                {fields.map((field, index) => (
                  <div key={field.id} className={styles.itemRow} style={{ padding: '8px 0', gridTemplateColumns: isReadOnly ? '1fr 100px 150px' : '1fr 100px 150px 36px' }}>
                    <select className={styles.itemInput} {...register(`lines.${index}.item_id` as const, { required: true })} disabled={isWorking || isReadOnly}>
                      {getSelectableItems(field.item_id).map(item => (
                        <option key={item.id} value={item.id}>
                          {item.item_name} ({item.item_code})
                        </option>
                      ))}
                    </select>
                    <input className={styles.itemInput} type="number" min={1} {...register(`lines.${index}.quantity` as const, { valueAsNumber: true, required: true, min: 1 })} disabled={isWorking || isReadOnly} />
                    <input className={styles.itemInput} type="number" min={0} step={1000} {...register(`lines.${index}.unit_price` as const, { valueAsNumber: true, required: true, min: 0 })} disabled={isWorking || isReadOnly} />
                    {!isReadOnly && (
                      <button type="button" className={styles.removeBtn} onClick={() => remove(index)} aria-label="Xóa sản phẩm"
                        disabled={fields.length <= 1 || isWorking} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
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
                            <span style={{ fontSize: 'var(--fs-xs)', textTransform: 'uppercase', fontWeight: 600, color: entry.status === 'posted' ? 'var(--clr-success)' : 'var(--clr-warning)' }}>
                              {entry.status === 'posted' ? 'Đã Xuất' : 'Bản Nháp'}
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
                              INV-{inv.id?.slice(0, 8).toUpperCase()}
                            </span>
                            <span style={{ fontSize: 'var(--fs-xs)', textTransform: 'uppercase', fontWeight: 600, color: inv.status === 'paid' ? 'var(--clr-success)' : 'var(--clr-warning)' }}>
                              {inv.status?.toUpperCase() || 'UNPAID'}
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

      {showAdvancePayment && (
        <CashFlowFormModal 
          open={showAdvancePayment} 
          onClose={() => setShowAdvancePayment(false)} 
          onSuccess={() => {
            setShowAdvancePayment(false);
            onSuccess();
          }} 
          defaultValues={{ payment_type: 'receive', sales_order_id: orderId }} 
        />
      )}

      {confirmState && (
        <ConfirmModal
          open={!!confirmState}
          title={confirmState.title}
          message={confirmState.message}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmState(null)}
          isLoading={isDeleting || isUpdating}
        />
      )}
    </>
  );
};

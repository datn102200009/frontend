import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  usePostCrmCustomersMutation,
  useGetCrmCustomersByCustomerIdQuery,
  usePutCrmCustomersByCustomerIdMutation,
  useDeleteCrmCustomersByCustomerIdMutation,
} from '@entities/crm/api/crmApi';
import type { CustomerInput } from '@entities/crm/model/types';
import { Modal } from '@shared/ui/Modal/Modal';
import { Button } from '@shared/ui/Button/Button';
import { ConfirmModal } from '@shared/ui/Modal/ConfirmModal';
import { Trash2 } from 'lucide-react';
import styles from './CustomerFormModal.module.css';

interface CustomerFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customerId?: string | null;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  open,
  onClose,
  onSuccess,
  customerId,
}) => {
  const { data: customerData, isLoading: isLoadingCustomer } = useGetCrmCustomersByCustomerIdQuery(
    { customerId: customerId as string },
    { skip: !customerId }
  );

  const [createCustomer, { isLoading: isCreating }] = usePostCrmCustomersMutation();
  const [updateCustomer, { isLoading: isUpdating }] = usePutCrmCustomersByCustomerIdMutation();
  const [deleteCustomer, { isLoading: isDeleting }] = useDeleteCrmCustomersByCustomerIdMutation();

  const [showConfirmDelete, setShowConfirmDelete] = React.useState(false);

  const isWorking = isCreating || isUpdating || isDeleting || isLoadingCustomer;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CustomerInput>({
    defaultValues: {
      name: '',
      customer_name: '',
      customer_group: 'Commercial',
      contact_email: '',
      contact_phone: '',
      address: '',
      credit_limit: 0,
      payment_terms: 'NET30',
      is_credit_locked: false,
    },
  });

  useEffect(() => {
    if (customerData) {
      reset({
        name: customerData.name,
        customer_name: customerData.customer_name,
        customer_group: customerData.customer_group || 'Commercial',
        contact_email: customerData.contact_email || '',
        contact_phone: customerData.contact_phone || '',
        address: customerData.address || '',
        credit_limit: customerData.credit_limit || 0,
        payment_terms: customerData.payment_terms || 'NET30',
        is_credit_locked: customerData.is_credit_locked || false,
      });
    } else {
      reset({
        name: '',
        customer_name: '',
        customer_group: 'Commercial',
        contact_email: '',
        contact_phone: '',
        address: '',
        credit_limit: 0,
        payment_terms: 'NET30',
        is_credit_locked: false,
      });
    }
  }, [customerData, reset]);

  const onSubmit = async (data: CustomerInput) => {
    try {
      if (customerId) {
        await updateCustomer({ customerId, customerInput: data }).unwrap();
      } else {
        await createCustomer({ customerInput: data }).unwrap();
      }
      onSuccess();
    } catch (err) {
      console.error('Failed to save customer', err);
    }
  };

  const handleDelete = async () => {
    if (!customerId) return;
    try {
      await deleteCustomer({ customerId }).unwrap();
      setShowConfirmDelete(false);
      onSuccess();
    } catch (err) {
      console.error('Failed to delete customer', err);
    }
  };

  const modalTitle = customerId ? 'Chỉnh Sửa Thông Tin Khách Hàng' : 'Thêm Khách Hàng Mới';

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={modalTitle}
        size="md"
        footer={
          <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
            <div>
              {customerId && (
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmDelete(true)}
                  loading={isDeleting}
                  disabled={isWorking}
                  icon={<Trash2 size={16} />}
                >
                  Xóa
                </Button>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="ghost" onClick={onClose} disabled={isWorking}>
                Đóng
              </Button>
              <Button onClick={handleSubmit(onSubmit)} loading={isCreating || isUpdating} disabled={isWorking}>
                {customerId ? 'Cập Nhật' : 'Lưu Lại'}
              </Button>
            </div>
          </div>
        }
      >
        {isLoadingCustomer ? (
          <div style={{ padding: 'var(--sp-6)', textAlign: 'center', color: 'var(--clr-text-muted)' }}>
            Đang tải dữ liệu...
          </div>
        ) : (
          <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
            <div className={styles.row}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
                <label htmlFor="name" style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--clr-text-secondary)' }}>
                  Mã Khách Hàng <span style={{ color: 'var(--clr-danger)' }}>*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="VD: CUS-001"
                  className={styles.itemInput}
                  {...register('name', { required: 'Mã khách hàng là bắt buộc' })}
                  disabled={isWorking || !!customerId}
                />
                {errors.name && (
                  <span style={{ color: 'var(--clr-error)', fontSize: 'var(--fs-sm)' }}>
                    {errors.name.message}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
                <label htmlFor="customer_group" style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--clr-text-secondary)' }}>
                  Nhóm Khách Hàng
                </label>
                <select
                  id="customer_group"
                  className={styles.itemInput}
                  {...register('customer_group')}
                  disabled={isWorking}
                >
                  <option value="Commercial">Doanh Nghiệp (Commercial)</option>
                  <option value="Individual">Cá Nhân (Individual)</option>
                  <option value="Government">Chính Phủ (Government)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
              <label htmlFor="customer_name" style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--clr-text-secondary)' }}>
                Tên Khách Hàng <span style={{ color: 'var(--clr-danger)' }}>*</span>
              </label>
              <input
                id="customer_name"
                type="text"
                placeholder="VD: Công ty TNHH Giải pháp Công nghệ Việt"
                className={styles.itemInput}
                {...register('customer_name', { required: 'Tên khách hàng là bắt buộc' })}
                disabled={isWorking}
              />
              {errors.customer_name && (
                <span style={{ color: 'var(--clr-error)', fontSize: 'var(--fs-sm)' }}>
                  {errors.customer_name.message}
                </span>
              )}
            </div>

            <div className={styles.row}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
                <label htmlFor="contact_email" style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--clr-text-secondary)' }}>
                  Email Liên Hệ
                </label>
                <input
                  id="contact_email"
                  type="email"
                  placeholder="VD: contact@company.com"
                  className={styles.itemInput}
                  {...register('contact_email')}
                  disabled={isWorking}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
                <label htmlFor="contact_phone" style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--clr-text-secondary)' }}>
                  Số Điện Thoại
                </label>
                <input
                  id="contact_phone"
                  type="text"
                  placeholder="VD: 0912345678"
                  className={styles.itemInput}
                  {...register('contact_phone')}
                  disabled={isWorking}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
              <label htmlFor="address" style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--clr-text-secondary)' }}>
                Địa Chỉ
              </label>
              <textarea
                id="address"
                placeholder="VD: Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội"
                className={styles.itemInput}
                rows={2}
                {...register('address')}
                disabled={isWorking}
              />
            </div>

            <div style={{ marginTop: 'var(--sp-4)', borderTop: '1px solid var(--clr-border)', paddingTop: 'var(--sp-4)' }}>
              <h4 style={{ margin: '0 0 var(--sp-3) 0', fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--clr-text-primary)' }}>
                Thông Tin Tín Dụng & Công Nợ
              </h4>
              <div className={styles.row}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
                  <label htmlFor="credit_limit" style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--clr-text-secondary)' }}>
                    Hạn Mức Tín Dụng (VND)
                  </label>
                  <input
                    id="credit_limit"
                    type="number"
                    min={0}
                    placeholder="VD: 50000000"
                    className={styles.itemInput}
                    {...register('credit_limit', { valueAsNumber: true })}
                    disabled={isWorking}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
                  <label htmlFor="payment_terms" style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--clr-text-secondary)' }}>
                    Điều Khoản Thanh Toán
                  </label>
                  <select
                    id="payment_terms"
                    className={styles.itemInput}
                    {...register('payment_terms')}
                    disabled={isWorking}
                  >
                    <option value="NET15">Thanh toán trong 15 ngày (NET15)</option>
                    <option value="NET30">Thanh toán trong 30 ngày (NET30)</option>
                    <option value="NET45">Thanh toán trong 45 ngày (NET45)</option>
                    <option value="NET60">Thanh toán trong 60 ngày (NET60)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginTop: 'var(--sp-3)' }}>
                <input
                  id="is_credit_locked"
                  type="checkbox"
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  {...register('is_credit_locked')}
                  disabled={isWorking}
                />
                <label htmlFor="is_credit_locked" style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--clr-text-secondary)', cursor: 'pointer' }}>
                  Khóa tín dụng (Chặn tạo đơn hàng mới ngay lập tức)
                </label>
              </div>
            </div>
          </form>
        )}
      </Modal>

      {showConfirmDelete && (
        <ConfirmModal
          open={showConfirmDelete}
          title="Xác nhận xóa khách hàng"
          message="Bạn có chắc chắn muốn xóa khách hàng này khỏi hệ thống? Thao tác này không thể hoàn tác."
          onConfirm={handleDelete}
          onCancel={() => setShowConfirmDelete(false)}
        />
      )}
    </>
  );
};

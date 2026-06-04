import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  usePostProcurementSuppliersMutation,
  useGetProcurementSuppliersBySupplierIdQuery,
  usePutProcurementSuppliersBySupplierIdMutation,
  useDeleteProcurementSuppliersBySupplierIdMutation,
} from '@entities/procurement/api/procurementApi';
import type { SupplierInput } from '@entities/procurement/model/types';
import { Modal } from '@shared/ui/Modal/Modal';
import { Button } from '@shared/ui/Button/Button';
import { ConfirmModal } from '@shared/ui/Modal/ConfirmModal';
import { Trash2 } from 'lucide-react';
import styles from './SupplierFormModal.module.css';

interface SupplierFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  supplierId?: string | null;
}

export const SupplierFormModal: React.FC<SupplierFormModalProps> = ({
  open,
  onClose,
  onSuccess,
  supplierId,
}) => {
  const { data: supplierData, isLoading: isLoadingSupplier } = useGetProcurementSuppliersBySupplierIdQuery(
    { supplierId: supplierId as string },
    { skip: !supplierId }
  );

  const [createSupplier, { isLoading: isCreating }] = usePostProcurementSuppliersMutation();
  const [updateSupplier, { isLoading: isUpdating }] = usePutProcurementSuppliersBySupplierIdMutation();
  const [deleteSupplier, { isLoading: isDeleting }] = useDeleteProcurementSuppliersBySupplierIdMutation();

  const [showConfirmDelete, setShowConfirmDelete] = React.useState(false);

  const isWorking = isCreating || isUpdating || isDeleting || isLoadingSupplier;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SupplierInput>({
    defaultValues: {
      name: '',
      supplier_name: '',
      supplier_group: 'Local',
      contact_email: '',
      contact_phone: '',
      address: '',
    },
  });

  useEffect(() => {
    if (supplierData) {
      reset({
        name: supplierData.name,
        supplier_name: supplierData.supplier_name,
        supplier_group: supplierData.supplier_group || 'Local',
        contact_email: supplierData.contact_email || '',
        contact_phone: supplierData.contact_phone || '',
        address: supplierData.address || '',
      });
    } else {
      reset({
        name: '',
        supplier_name: '',
        supplier_group: 'Local',
        contact_email: '',
        contact_phone: '',
        address: '',
      });
    }
  }, [supplierData, reset]);

  const onSubmit = async (data: SupplierInput) => {
    try {
      if (supplierId) {
        await updateSupplier({ supplierId, supplierInput: data }).unwrap();
      } else {
        await createSupplier({ supplierInput: data }).unwrap();
      }
      onSuccess();
    } catch (err) {
      console.error('Failed to save supplier', err);
    }
  };

  const handleDelete = async () => {
    if (!supplierId) return;
    try {
      await deleteSupplier({ supplierId }).unwrap();
      setShowConfirmDelete(false);
      onSuccess();
    } catch (err) {
      console.error('Failed to delete supplier', err);
    }
  };

  const modalTitle = supplierId ? 'Chỉnh Sửa Thông Tin Nhà Cung Cấp' : 'Thêm Nhà Cung Cấp Mới';

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
              {supplierId && (
                <Button
                  variant="danger"
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
                {supplierId ? 'Cập Nhật' : 'Lưu Lại'}
              </Button>
            </div>
          </div>
        }
      >
        {isLoadingSupplier ? (
          <div style={{ padding: 'var(--sp-6)', textAlign: 'center', color: 'var(--clr-text-muted)' }}>
            Đang tải dữ liệu...
          </div>
        ) : (
          <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
            <div className={styles.row}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
                <label htmlFor="name" style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--clr-text-secondary)' }}>
                  Mã Nhà Cung Cấp <span style={{ color: 'var(--clr-danger)' }}>*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="VD: SUP-001"
                  className={styles.itemInput}
                  {...register('name', { required: 'Mã nhà cung cấp là bắt buộc' })}
                  disabled={isWorking || !!supplierId}
                />
                {errors.name && (
                  <span style={{ color: 'var(--clr-error)', fontSize: 'var(--fs-sm)' }}>
                    {errors.name.message}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
                <label htmlFor="supplier_group" style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--clr-text-secondary)' }}>
                  Nhóm Nhà Cung Cấp
                </label>
                <select
                  id="supplier_group"
                  className={styles.itemInput}
                  {...register('supplier_group')}
                  disabled={isWorking}
                >
                  <option value="Local">Trong Nước (Local)</option>
                  <option value="Import">Nhập Khẩu (Import)</option>
                  <option value="Distributor">Nhà Phân Phối (Distributor)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
              <label htmlFor="supplier_name" style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--clr-text-secondary)' }}>
                Tên Nhà Cung Cấp <span style={{ color: 'var(--clr-danger)' }}>*</span>
              </label>
              <input
                id="supplier_name"
                type="text"
                placeholder="VD: Tổng Công ty Thiết bị Điện tử miền Bắc"
                className={styles.itemInput}
                {...register('supplier_name', { required: 'Tên nhà cung cấp là bắt buộc' })}
                disabled={isWorking}
              />
              {errors.supplier_name && (
                <span style={{ color: 'var(--clr-error)', fontSize: 'var(--fs-sm)' }}>
                  {errors.supplier_name.message}
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
                  placeholder="VD: supplier@company.com"
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
                placeholder="VD: Khu công nghiệp Quang Minh, Mê Linh, Hà Nội"
                className={styles.itemInput}
                rows={3}
                {...register('address')}
                disabled={isWorking}
              />
            </div>
          </form>
        )}
      </Modal>

      {showConfirmDelete && (
        <ConfirmModal
          open={showConfirmDelete}
          title="Xác nhận xóa nhà cung cấp"
          message="Bạn có chắc chắn muốn xóa nhà cung cấp này khỏi hệ thống? Thao tác này không thể hoàn tác."
          onConfirm={handleDelete}
          onCancel={() => setShowConfirmDelete(false)}
          confirmVariant="danger"
        />
      )}
    </>
  );
};

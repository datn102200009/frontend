import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@shared/ui/Button/Button';
import { Modal } from '@shared/ui/Modal/Modal';
import { Input } from '@shared/ui/Input/Input';
import { FormSelect } from '@shared/ui/Select/FormSelect';
import { useToast } from '@shared/ui/Toast/Toast';
import {
  usePatchFinanceFixedAssetsByPkMutation,
  type FixedAsset,
} from '@entities/finance/api/financeApi';
import styles from './AssetFormModal.module.css';

interface AssetEditFormData {
  asset_code: string;
  asset_name: string;
  original_value: string;
  salvage_value: string;
  depreciation_method: 'straight_line' | 'unit_of_production';
  useful_life_months: number;
  designed_capacity: number | '';
  department: string;
}

interface AssetEditModalProps {
  open: boolean;
  editingAsset: FixedAsset | null;
  onClose: () => void;
  onSave: () => void;
}

export function AssetEditModal({ open, editingAsset, onClose, onSave }: AssetEditModalProps) {
  const { toast } = useToast();
  const [updateAsset, { isLoading: isUpdating }] = usePatchFinanceFixedAssetsByPkMutation();

  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm<AssetEditFormData>({
    defaultValues: {
      asset_code: '',
      asset_name: '',
      original_value: '0',
      salvage_value: '0',
      depreciation_method: 'straight_line',
      useful_life_months: 12,
      designed_capacity: '',
      department: '',
    },
  });

  const watchDepreciationMethod = watch('depreciation_method');

  useEffect(() => {
    if (editingAsset) {
      reset({
        asset_code: editingAsset.asset_code || '',
        asset_name: editingAsset.asset_name || '',
        original_value: editingAsset.original_value || '0',
        salvage_value: editingAsset.salvage_value || '0',
        depreciation_method: (editingAsset.depreciation_method as 'straight_line' | 'unit_of_production') || 'straight_line',
        useful_life_months: editingAsset.useful_life_months || 0,
        designed_capacity: editingAsset.designed_capacity || '',
        department: editingAsset.department || '',
      });
    }
  }, [editingAsset, open, reset]);

  const onSubmit = async (data: AssetEditFormData) => {
    if (!editingAsset) return;
    try {
      const fixedAssetUpdateInput: { asset_name?: string; useful_life_months?: number } = {
        asset_name: data.asset_name,
      };
      if (data.depreciation_method === 'straight_line') {
        fixedAssetUpdateInput.useful_life_months = Number(data.useful_life_months);
      }
      await updateAsset({
        pk: editingAsset.id!,
        fixedAssetUpdateInput,
      }).unwrap();
      toast('success', 'Cập nhật tài sản cố định thành công');
      onSave();
    } catch (error: unknown) {
      const err = error as { data?: { error?: string; detail?: string } };
      toast('error', err?.data?.error || err?.data?.detail || 'Có lỗi xảy ra');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Chỉnh Sửa Tài Sản Cố Định"
      size="lg"
      footer={
        <>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isUpdating}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={isUpdating}
          >
            Lưu
          </Button>
        </>
      }
    >
      <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
        <div className={styles.row}>
          <Input
            label="Mã tài sản"
            disabled
            {...register('asset_code')}
          />
          <Input
            label="Tên tài sản"
            required
            error={errors.asset_name?.message}
            {...register('asset_name', { required: 'Tên tài sản là bắt buộc' })}
          />
        </div>

        <div className={styles.row}>
          <Input
            label="Nguyên giá (VND)"
            type="text"
            disabled
            {...register('original_value')}
          />
          <Input
            label="Giá trị thanh lý ước tính (VND)"
            type="text"
            disabled
            {...register('salvage_value')}
          />
        </div>

        <div className={styles.row}>
          <FormSelect
            label="Phương pháp khấu hao"
            disabled
            options={[
              { label: 'Đường thẳng', value: 'straight_line' },
              { label: 'Sản lượng (UOP)', value: 'unit_of_production' },
            ]}
            value={watchDepreciationMethod}
            onChange={() => {}}
          />
          {watchDepreciationMethod === 'straight_line' ? (
            <Input
              label="Số tháng khấu hao hữu ích"
              type="number"
              required
              error={errors.useful_life_months?.message}
              {...register('useful_life_months', {
                required: watchDepreciationMethod === 'straight_line' ? 'Số tháng khấu hao là bắt buộc' : false,
                valueAsNumber: true,
                min: watchDepreciationMethod === 'straight_line' ? { value: 1, message: 'Phải lớn hơn hoặc bằng 1' } : undefined,
              })}
            />
          ) : (
            <div />
          )}
        </div>

        <div className={styles.row}>
          {watchDepreciationMethod === 'unit_of_production' ? (
            <Input
              label="Công suất thiết kế (Tổng sản lượng)"
              type="number"
              disabled
              {...register('designed_capacity')}
            />
          ) : (
            <div />
          )}
          <Input
            label="Bộ phận sử dụng"
            disabled
            {...register('department')}
          />
        </div>
      </form>
    </Modal>
  );
}

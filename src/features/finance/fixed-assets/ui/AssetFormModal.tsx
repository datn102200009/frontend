import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@shared/ui/Button/Button';
import { Modal } from '@shared/ui/Modal/Modal';
import { Input } from '@shared/ui/Input/Input';
import { FormSelect } from '@shared/ui/Select/FormSelect';
import { useToast } from '@shared/ui/Toast/Toast';
import {
  usePostFinanceFixedAssetsMutation,
  usePatchFinanceFixedAssetsByPkMutation,
  type FixedAsset,
} from '@entities/finance/api/financeApi';
import styles from './AssetFormModal.module.css';

interface AssetFormData {
  asset_code: string;
  asset_name: string;
  original_value: string;
  salvage_value: string;
  depreciation_method: 'straight_line' | 'unit_of_production';
  useful_life_months: number;
  designed_capacity: number | '';
  department: string;
}

interface AssetFormModalProps {
  open: boolean;
  editingAsset: FixedAsset | null;
  onClose: () => void;
  onSave: () => void;
}

export function AssetFormModal({ open, editingAsset, onClose, onSave }: AssetFormModalProps) {
  const { toast } = useToast();
  const [createAsset, { isLoading: isCreating }] = usePostFinanceFixedAssetsMutation();
  const [updateAsset, { isLoading: isUpdating }] = usePatchFinanceFixedAssetsByPkMutation();

  const { register, control, handleSubmit, formState: { errors }, watch, reset } = useForm<AssetFormData>({
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
        depreciation_method: editingAsset.depreciation_method || 'straight_line',
        useful_life_months: editingAsset.useful_life_months || 0,
        designed_capacity: editingAsset.designed_capacity || '',
        department: editingAsset.department || '',
      });
    } else {
      reset({
        asset_code: '',
        asset_name: '',
        original_value: '0',
        salvage_value: '0',
        depreciation_method: 'straight_line',
        useful_life_months: 12,
        designed_capacity: '',
        department: '',
      });
    }
  }, [editingAsset, open, reset]);

  const onSubmit = async (data: AssetFormData) => {
    try {
      const payload = {
        asset_code: data.asset_code,
        asset_name: data.asset_name,
        original_value: data.original_value,
        salvage_value: data.salvage_value,
        depreciation_method: data.depreciation_method,
        useful_life_months: Number(data.useful_life_months),
        designed_capacity: data.depreciation_method === 'unit_of_production' ? Number(data.designed_capacity) : null,
        department: data.department || null,
      };

      if (editingAsset) {
        await updateAsset({
          pk: editingAsset.id!,
          fixedAssetUpdateInput: {
            asset_name: payload.asset_name,
            original_value: payload.original_value,
            salvage_value: payload.salvage_value,
            depreciation_method: payload.depreciation_method,
            useful_life_months: payload.useful_life_months,
            designed_capacity: payload.designed_capacity,
            department: payload.department,
          },
        }).unwrap();
        toast('success', 'Cập nhật tài sản cố định thành công');
      } else {
        await createAsset({
          fixedAssetInput: payload,
        }).unwrap();
        toast('success', 'Thêm mới tài sản cố định thành công');
      }
      onSave();
    } catch (error: unknown) {
      const err = error as { data?: { error?: string; detail?: string } };
      toast('error', err?.data?.error || err?.data?.detail || 'Có lỗi xảy ra');
    }
  };

  const isCoreFieldsDisabled = editingAsset ? (Number(editingAsset.accumulated_depreciation) || 0) > 0 : false;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingAsset ? 'Chỉnh Sửa Tài Sản Cố Định' : 'Thêm Tài Sản Cố Định Mới'}
      size="lg"
      footer={
        <>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isCreating || isUpdating}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={isCreating || isUpdating}
          >
            Lưu
          </Button>
        </>
      }
    >
      {editingAsset && isCoreFieldsDisabled && (
        <div
          style={{
            marginBottom: '16px',
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: 'var(--clr-error)',
            fontSize: 'var(--fs-xs)',
          }}
        >
          ⚠️ Tài sản đã phát sinh trích khấu hao. Một số thông tin cốt lõi (nguyên giá, phương pháp khấu hao, số tháng sử dụng hữu ích) sẽ bị khóa chỉnh sửa.
        </div>
      )}
      <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
        <div className={styles.row}>
          <Input
            label="Mã tài sản"
            required
            disabled={!!editingAsset}
            error={errors.asset_code?.message}
            {...register('asset_code', { required: 'Mã tài sản là bắt buộc' })}
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
            required
            disabled={isCoreFieldsDisabled}
            error={errors.original_value?.message}
            {...register('original_value', {
              required: 'Nguyên giá là bắt buộc',
              validate: (val) => !isNaN(Number(val)) && Number(val) > 0 || 'Nguyên giá phải lớn hơn 0',
            })}
          />
          <Input
            label="Giá trị thanh lý ước tính (VND)"
            type="text"
            disabled={isCoreFieldsDisabled}
            error={errors.salvage_value?.message}
            {...register('salvage_value', {
              validate: (val) => !isNaN(Number(val)) && Number(val) >= 0 || 'Không được là số âm',
            })}
          />
        </div>

        <div className={styles.row}>
          <Controller
            control={control}
            name="depreciation_method"
            render={({ field }) => (
              <FormSelect
                label="Phương pháp khấu hao"
                required
                disabled={isCoreFieldsDisabled}
                options={[
                  { label: 'Đường thẳng', value: 'straight_line' },
                  { label: 'Sản lượng (UOP)', value: 'unit_of_production' },
                ]}
                value={field.value}
                onChange={field.onChange}
                error={errors.depreciation_method?.message}
              />
            )}
          />
          <Input
            label="Số tháng khấu hao hữu ích"
            type="number"
            required
            disabled={isCoreFieldsDisabled}
            error={errors.useful_life_months?.message}
            {...register('useful_life_months', {
              required: 'Số tháng khấu hao là bắt buộc',
              valueAsNumber: true,
              min: { value: 1, message: 'Phải lớn hơn hoặc bằng 1' },
            })}
          />
        </div>

        <div className={styles.row}>
          {watchDepreciationMethod === 'unit_of_production' ? (
            <Input
              label="Công suất thiết kế (Tổng sản lượng)"
              type="number"
              required
              disabled={isCoreFieldsDisabled}
              error={errors.designed_capacity?.message}
              {...register('designed_capacity', {
                required: 'Công suất thiết kế bắt buộc cho phương pháp sản lượng',
                valueAsNumber: true,
                min: { value: 0.01, message: 'Công suất phải lớn hơn 0' },
              })}
            />
          ) : (
            <div />
          )}
          <Input
            label="Phòng ban sử dụng"
            error={errors.department?.message}
            {...register('department')}
          />
        </div>
      </form>
    </Modal>
  );
}

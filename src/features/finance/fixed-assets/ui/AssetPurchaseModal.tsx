import { useForm, Controller } from 'react-hook-form';
import { Button } from '@shared/ui/Button/Button';
import { Modal } from '@shared/ui/Modal/Modal';
import { Input } from '@shared/ui/Input/Input';
import { FormSelect } from '@shared/ui/Select/FormSelect';
import { useToast } from '@shared/ui/Toast/Toast';
import { usePostFinanceFixedAssetsMutation } from '@entities/finance/api/financeApi';
import styles from './AssetFormModal.module.css';

interface AssetPurchaseFormData {
  asset_name: string;
  original_value: string;
  depreciation_method: 'straight_line' | 'unit_of_production';
  useful_life_months: number;
  designed_capacity: number | '';
  vendor_name: string;
  payment_method: 'cash' | 'bank_transfer';
}

interface AssetPurchaseModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function AssetPurchaseModal({ open, onClose, onSave }: AssetPurchaseModalProps) {
  const { toast } = useToast();
  const [purchaseAsset, { isLoading: isPurchasing }] = usePostFinanceFixedAssetsMutation();

  const { register, control, handleSubmit, formState: { errors }, watch } = useForm<AssetPurchaseFormData>({
    defaultValues: {
      asset_name: '',
      original_value: '',
      depreciation_method: 'straight_line',
      useful_life_months: 12,
      designed_capacity: '',
      vendor_name: '',
      payment_method: 'bank_transfer',
    },
  });

  const watchDepreciationMethod = watch('depreciation_method');

  const onSubmit = async (data: AssetPurchaseFormData) => {
    try {
      const payload = {
        asset_name: data.asset_name,
        original_value: data.original_value,
        depreciation_method: data.depreciation_method,
        useful_life_months: data.depreciation_method === 'straight_line' ? Number(data.useful_life_months) : null,
        designed_capacity: data.depreciation_method === 'unit_of_production' ? Number(data.designed_capacity) : null,
        vendor_name: data.vendor_name,
        payment_method: data.payment_method,
      };

      await purchaseAsset({
        fixedAssetPurchaseInput: payload,
      }).unwrap();

      toast('success', 'Ghi nhận mua và thêm mới tài sản thành công');
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
      title="Ghi Nhận Mua Tài Sản Cố Định"
      size="lg"
      footer={
        <>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isPurchasing}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={isPurchasing}
          >
            Ghi nhận mua
          </Button>
        </>
      }
    >
      <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
        <div className={styles.row}>
          <Input
            label="Tên tài sản"
            required
            error={errors.asset_name?.message}
            {...register('asset_name', { required: 'Tên tài sản là bắt buộc' })}
          />
          <Input
            label="Nguyên giá (VND)"
            type="number"
            decimals={0}
            required
            error={errors.original_value?.message}
            {...register('original_value', {
              required: 'Nguyên giá là bắt buộc',
              validate: (val) => !isNaN(Number(val)) && Number(val) > 0 || 'Nguyên giá phải lớn hơn 0',
            })}
          />
        </div>

        <div className={styles.row}>
          <Input
            label="Nhà cung cấp"
            required
            error={errors.vendor_name?.message}
            {...register('vendor_name', { required: 'Nhà cung cấp là bắt buộc' })}
          />
          <Controller
            control={control}
            name="payment_method"
            render={({ field }) => (
              <FormSelect
                label="Phương thức thanh toán"
                required
                options={[
                  { label: 'Tiền mặt', value: 'cash' },
                  { label: 'Chuyển khoản ngân hàng', value: 'bank_transfer' },
                ]}
                value={field.value}
                onChange={field.onChange}
                error={errors.payment_method?.message}
              />
            )}
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
          {watchDepreciationMethod === 'straight_line' ? (
            <Input
              label="Số tháng khấu hao hữu ích"
              type="number"
              decimals={0}
              required
              error={errors.useful_life_months?.message}
              {...register('useful_life_months', {
                required: watchDepreciationMethod === 'straight_line' ? 'Số tháng khấu hao là bắt buộc' : false,
                valueAsNumber: true,
                min: watchDepreciationMethod === 'straight_line' ? { value: 1, message: 'Phải lớn hơn hoặc bằng 1' } : undefined,
              })}
            />
          ) : (
            <Input
              label="Công suất thiết kế (Tổng sản lượng)"
              type="number"
              decimals={0}
              required
              error={errors.designed_capacity?.message}
              {...register('designed_capacity', {
                required: 'Công suất thiết kế bắt buộc cho UOP',
                valueAsNumber: true,
                min: { value: 1, message: 'Công suất phải lớn hơn 0' },
              })}
            />
          )}
        </div>
      </form>
    </Modal>
  );
}

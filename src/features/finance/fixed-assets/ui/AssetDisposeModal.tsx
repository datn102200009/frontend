import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@shared/ui/Button/Button';
import { Modal } from '@shared/ui/Modal/Modal';
import { Input } from '@shared/ui/Input/Input';
import { TextArea } from '@shared/ui/Input/TextArea';
import { useToast } from '@shared/ui/Toast/Toast';
import { usePostFinanceFixedAssetsByPkRequestDisposeMutation, type FixedAsset } from '@entities/finance/api/financeApi';
import { ConfirmModal } from '@shared/ui/Modal/ConfirmModal';
import { shortAssetCode } from '@shared/lib/shortId';
import { formatVND } from '@shared/lib/formatVND';
import styles from './AssetFormModal.module.css';

interface AssetDisposeFormData {
  disposal_value: string;
  remarks: string;
}

interface AssetDisposeModalProps {
  open: boolean;
  asset: FixedAsset | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function AssetDisposeModal({ open, asset, onClose, onConfirm }: AssetDisposeModalProps) {
  const { toast } = useToast();
  const [requestDisposeAsset, { isLoading: isDisposing }] = usePostFinanceFixedAssetsByPkRequestDisposeMutation();
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState<AssetDisposeFormData | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<AssetDisposeFormData>({
    defaultValues: {
      disposal_value: '0',
      remarks: '',
    },
  });

  const handleFormSubmit = (data: AssetDisposeFormData) => {
    setFormData(data);
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    if (!asset || !formData) return;
    try {
      await requestDisposeAsset({
        pk: asset.id!,
        fixedAssetRequestDisposeInput: {
          disposal_value: formData.disposal_value,
          remarks: formData.remarks || null,
        },
      }).unwrap();

      toast('success', `Đã yêu cầu thanh lý tài sản ${shortAssetCode(asset.asset_code)} thành công`);
      setShowConfirm(false);
      onConfirm();
    } catch (error: unknown) {
      const err = error as { data?: { error?: string; detail?: string } };
      toast('error', err?.data?.error || err?.data?.detail || 'Có lỗi xảy ra');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Yêu Cầu Thanh Lý Tài Sản Cố Định"
      footer={
        <>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isDisposing}
          >
            Hủy
          </Button>
          <Button
            variant="danger"
            onClick={handleSubmit(handleFormSubmit)}
            disabled={isDisposing}
          >
            Ghi nhận yêu cầu
          </Button>
        </>
      }
    >
      <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
        <div style={{ marginBottom: '16px', fontSize: 'var(--fs-sm)' }}>
          Bạn đang yêu cầu thanh lý tài sản cố định:{' '}
          <strong>{asset?.asset_name} ({shortAssetCode(asset?.asset_code)})</strong>. Trạng thái tài sản sẽ chuyển sang Chờ duyệt thanh lý.
        </div>

        <Input
          label="Giá trị thu về dự kiến (VND)"
          type="number"
          decimals={0}
          required
          error={errors.disposal_value?.message}
          {...register('disposal_value', {
            required: 'Giá trị thu hồi là bắt buộc',
            validate: (val) => !isNaN(Number(val)) && Number(val) >= 0 || 'Giá trị phải lớn hơn hoặc bằng 0',
          })}
        />

        <TextArea
          label="Ghi chú / Lý do thanh lý"
          rows={4}
          maxLength={1000}
          placeholder="Nhập chi tiết lý do thanh lý, tình trạng tài sản, đề xuất phương án xử lý..."
          error={errors.remarks?.message}
          {...register('remarks')}
        />
      </form>

      <ConfirmModal
        open={showConfirm}
        title="Xác nhận yêu cầu thanh lý tài sản"
        message={
          formData ? (
            <div>
              <p style={{ marginBottom: '8px' }}>
                Bạn đang yêu cầu thanh lý tài sản cố định:{' '}
                <strong>
                  {asset?.asset_name} ({shortAssetCode(asset?.asset_code)})
                </strong>
                .
              </p>
              <ul style={{ paddingLeft: '20px', listStyleType: 'disc' }}>
                {Number(formData.disposal_value) === 0 ? (
                  <li style={{ marginBottom: '4px' }}>
                    Ngày thanh lý thực tế: Hôm nay (hệ thống tự động gán)
                  </li>
                ) : (
                  <li style={{ marginBottom: '4px' }}>
                    Ngày thanh lý thực tế: Sẽ được tự động gán khi CFO duyệt dòng tiền thanh lý
                  </li>
                )}
                <li style={{ marginBottom: '4px' }}>
                  Giá trị thu hồi dự kiến: {formatVND(formData.disposal_value)}
                </li>
                {Number(formData.disposal_value) === 0 && (
                  <li style={{ color: 'var(--clr-warning)', fontWeight: 'bold', marginBottom: '4px' }}>
                    ⚠️ Giá trị thu hồi bằng 0 — tài sản sẽ được thanh lý ngay khi bạn xác nhận (không qua bước duyệt Dòng Tiền).
                  </li>
                )}
                {Number(formData.disposal_value) > 100000000 && (
                  <li style={{ color: 'var(--clr-error)', fontWeight: 'bold', marginBottom: '4px' }}>
                    ⚠️ Tài sản có giá trị lớn, vui lòng kiểm tra kỹ thông tin trước khi xác nhận.
                  </li>
                )}
                {formData.remarks && (
                  <li style={{ marginBottom: '4px' }}>Ghi chú: {formData.remarks}</li>
                )}
              </ul>
            </div>
          ) : null
        }
        confirmText="Xác nhận thanh lý"
        cancelText="Hủy"
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirm(false)}
        isLoading={isDisposing}
      />
    </Modal>
  );
}

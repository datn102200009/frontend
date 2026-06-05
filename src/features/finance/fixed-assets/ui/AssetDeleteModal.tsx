import { Button } from '@shared/ui/Button/Button';
import { Modal } from '@shared/ui/Modal/Modal';
import { useToast } from '@shared/ui/Toast/Toast';
import { useDeleteFinanceFixedAssetsByPkMutation, type FixedAsset } from '@entities/finance/api/financeApi';

interface AssetDeleteModalProps {
  open: boolean;
  asset: FixedAsset | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function AssetDeleteModal({ open, asset, onClose, onConfirm }: AssetDeleteModalProps) {
  const { toast } = useToast();
  const [deleteAsset, { isLoading: isDeleting }] = useDeleteFinanceFixedAssetsByPkMutation();

  const handleConfirm = async () => {
    if (!asset) return;
    try {
      await deleteAsset({ pk: asset.id! }).unwrap();
      toast('success', `Xóa tài sản cố định ${asset.asset_code} thành công`);
      onConfirm();
    } catch (error: unknown) {
      const err = error as { data?: { error?: string; detail?: string } };
      toast('error', err?.data?.error || err?.data?.detail || 'Không thể xóa tài sản cố định');
    }
  };

  if (!asset) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Xác Nhận Xóa Tài Sản"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isDeleting}>
            Hủy
          </Button>
          <Button variant="danger" onClick={handleConfirm} disabled={isDeleting}>
            Xóa tài sản
          </Button>
        </>
      }
    >
      <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text)' }}>
        Bạn có chắc chắn muốn xóa tài sản cố định <strong>"{asset.asset_code} - {asset.asset_name}"</strong> không? Hành động này không thể hoàn tác.
      </p>
    </Modal>
  );
}

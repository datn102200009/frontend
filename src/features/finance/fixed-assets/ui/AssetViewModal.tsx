import { Modal } from '@shared/ui/Modal/Modal';
import { Button } from '@shared/ui/Button/Button';
import type { FixedAsset } from '@entities/finance/api/financeApi';
import styles from './AssetFormModal.module.css';

interface AssetViewModalProps {
  open: boolean;
  asset: FixedAsset | null;
  onClose: () => void;
}

function fmtVND(v: string | number | null | undefined) {
  if (v == null || v === '') return '0 ₫';
  return Number(v).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
}

const STATUS_LABELS: Record<string, string> = {
  pending_receive: 'Chờ duyệt mua',
  idle: 'Đang nhàn rỗi',
  active: 'Đang sử dụng',
  pending_dispose: 'Chờ duyệt thanh lý',
  disposed: 'Đã thanh lý',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Tiền mặt',
  bank_transfer: 'Chuyển khoản ngân hàng',
};

const DEPRECIATION_METHOD_LABELS: Record<string, string> = {
  straight_line: 'Đường thẳng',
  unit_of_production: 'Sản lượng (UOP)',
};

export function AssetViewModal({ open, asset, onClose }: AssetViewModalProps) {
  if (!asset) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Thông tin Tài sản: ${asset.asset_name}`}
      size="lg"
      footer={
        <Button onClick={onClose}>
          Đóng
        </Button>
      }
    >
      <div className={styles.form}>
        <div className={styles.row}>
          <div className={styles.infoField}>
            <div className={styles.infoLabel}>Mã tài sản</div>
            <div className={styles.infoValue}>{asset.asset_code || '-'}</div>
          </div>
          <div className={styles.infoField}>
            <div className={styles.infoLabel}>Tên tài sản</div>
            <div className={styles.infoValue}>{asset.asset_name || '-'}</div>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.infoField}>
            <div className={styles.infoLabel}>Nguyên giá</div>
            <div className={styles.infoValue}>{fmtVND(asset.original_value)}</div>
          </div>
          <div className={styles.infoField}>
            <div className={styles.infoLabel}>Giá trị thanh lý ước tính</div>
            <div className={styles.infoValue}>{fmtVND(asset.salvage_value)}</div>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.infoField}>
            <div className={styles.infoLabel}>Lũy kế khấu hao</div>
            <div className={styles.infoValue}>{fmtVND(asset.accumulated_depreciation)}</div>
          </div>
          <div className={styles.infoField}>
            <div className={styles.infoLabel}>Giá trị còn lại</div>
            <div className={styles.infoValue}>{fmtVND(asset.remaining_value)}</div>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.infoField}>
            <div className={styles.infoLabel}>Phương pháp khấu hao</div>
            <div className={styles.infoValue}>
              {DEPRECIATION_METHOD_LABELS[asset.depreciation_method || ''] || asset.depreciation_method || 'Đường thẳng'}
            </div>
          </div>
          {asset.depreciation_method === 'straight_line' ? (
            <div className={styles.infoField}>
              <div className={styles.infoLabel}>Số tháng khấu hao hữu ích</div>
              <div className={styles.infoValue}>{asset.useful_life_months || 0} tháng</div>
            </div>
          ) : (
            <div className={styles.infoField}>
              <div className={styles.infoLabel}>Công suất thiết kế (Tổng sản lượng)</div>
              <div className={styles.infoValue}>{asset.designed_capacity || 0}</div>
            </div>
          )}
        </div>

        <div className={styles.row}>
          <div className={styles.infoField}>
            <div className={styles.infoLabel}>Trạng thái</div>
            <div className={styles.infoValue}>
              {STATUS_LABELS[asset.status || ''] || asset.status || ''}
            </div>
          </div>
          <div className={styles.infoField}>
            <div className={styles.infoLabel}>Nhà cung cấp</div>
            <div className={styles.infoValue}>{asset.vendor_name || '-'}</div>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.infoField}>
            <div className={styles.infoLabel}>Ngày mua</div>
            <div className={styles.infoValue}>{asset.purchase_date || '-'}</div>
          </div>
          <div className={styles.infoField}>
            <div className={styles.infoLabel}>Phương thức thanh toán</div>
            <div className={styles.infoValue}>
              {PAYMENT_METHOD_LABELS[asset.payment_method || ''] || asset.payment_method || '-'}
            </div>
          </div>
        </div>

        {asset.status === 'disposed' && (
          <div className={styles.row}>
            <div className={styles.infoField}>
              <div className={styles.infoLabel}>Ngày thanh lý</div>
              <div className={styles.infoValue}>{asset.disposal_date || '-'}</div>
            </div>
            <div className={styles.infoField}>
              <div className={styles.infoLabel}>Giá trị thanh lý thực tế</div>
              <div className={styles.infoValue}>{fmtVND(asset.disposal_value)}</div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}


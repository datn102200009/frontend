import React, { useState } from 'react';
import { Modal } from '@shared/ui/Modal/Modal';
import { Button } from '@shared/ui/Button/Button';

interface CancelRecordDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  title: string;
  confirmLabel?: string;
  isLoading?: boolean;
}

export const CancelRecordDialog: React.FC<CancelRecordDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  confirmLabel = 'Hủy quyết định',
  isLoading = false,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do hủy bỏ.');
      return;
    }
    setError('');
    onConfirm(reason);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Quay lại
          </Button>
          <Button variant="primary" onClick={handleConfirm} loading={isLoading} style={{ backgroundColor: 'var(--clr-danger)' }}>
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <p style={{ fontSize: '14px', color: 'var(--clr-text-secondary)' }}>
          Hành động này sẽ thay đổi trạng thái của bản ghi thành **Đã hủy** và không thể phê duyệt bản ghi này vào phiếu lương nữa.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--clr-text)' }} htmlFor="cancel-reason">
            Lý do hủy <span style={{ color: 'var(--clr-danger)' }}>*</span>
          </label>
          <textarea
            id="cancel-reason"
            placeholder="Nhập lý do hủy quyết định này..."
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (e.target.value.trim()) setError('');
            }}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1.5px solid var(--clr-border)',
              borderRadius: 'var(--radius-md)',
              fontSize: '14px',
              minHeight: '80px',
              resize: 'vertical',
            }}
          />
          {error && <span style={{ color: 'var(--clr-error)', fontSize: '12px' }}>{error}</span>}
        </div>
      </div>
    </Modal>
  );
};

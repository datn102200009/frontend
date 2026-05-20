import React from 'react';
import { Modal } from './Modal';
import { Button } from '../Button/Button';
import { AlertCircle } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title = 'Xác nhận',
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
          <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={isLoading}>
            {confirmText}
          </Button>
        </div>
      }
    >
      <div style={{ padding: 'var(--sp-4)', display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-3)' }}>
        <div style={{ color: 'var(--clr-danger)' }}>
          <AlertCircle size={24} />
        </div>
        <div>
          <p style={{ margin: 0, color: 'var(--clr-text-secondary)', fontSize: 'var(--fs-sm)', lineHeight: 1.5 }}>
            {message}
          </p>
        </div>
      </div>
    </Modal>
  );
};

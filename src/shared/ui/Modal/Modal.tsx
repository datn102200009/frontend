import { type ReactNode, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import styles from './Modal.module.css';
import clsx from 'clsx';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: ReactNode;
  nested?: boolean;
  zIndex?: number;
}

export function Modal({ open, onClose, title, children, size = 'md', footer, nested = false, zIndex }: ModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
        onClose();
      }
    },
    [onClose],
  );

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal={!nested ? 'true' : 'false'}
      aria-label={title}
      className={clsx(styles.dialog, nested && 'nested-modal-backdrop')}
      style={zIndex ? { zIndex } : undefined}
      onClick={handleBackdropClick}
    >
      <div ref={contentRef} className={clsx(styles.content, styles[size])}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
}

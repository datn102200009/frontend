import React from 'react';
import styles from './TableActions.module.css';
import { Tooltip } from '../Tooltip/Tooltip';

interface TableActionsProps {
  children: React.ReactNode;
}

/**
 * Wrapper for action buttons inside a DataTable cell.
 * Ensures consistent gap and alignment matching BOM/Inventory modules.
 */
export const TableActions: React.FC<TableActionsProps> = ({ children }) => {
  return <div className={styles.actions}>{children}</div>;
};

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  variant?: 'default' | 'danger';
}

/**
 * Standard icon button for table actions.
 */
export const ActionButton: React.FC<ActionButtonProps> = ({ icon, variant = 'default', className, title, ...props }) => {
  return (
    <Tooltip content={title || ''}>
      <button
        type="button"
        className={`${styles.actionBtn} ${variant === 'danger' ? styles.deleteBtn : ''} ${className || ''}`}
        aria-label={props['aria-label'] || title}
        {...props}
      >
        {icon}
      </button>
    </Tooltip>
  );
};

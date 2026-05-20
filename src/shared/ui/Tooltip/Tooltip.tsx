import React, { type ReactNode } from 'react';
import styles from './Tooltip.module.css';

interface TooltipProps {
  content: string;
  children: ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  return (
    <div className={styles.tooltipContainer}>
      {children}
      <div className={styles.tooltip}>{content}</div>
    </div>
  );
};

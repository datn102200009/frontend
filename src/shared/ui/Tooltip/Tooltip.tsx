import React, { useState, useRef, type ReactNode } from 'react';
import ReactDOM from 'react-dom';
import styles from './Tooltip.module.css';

interface TooltipProps {
  content: string;
  children: ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  if (!content) return <>{children}</>;

  const showTooltip = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top + window.scrollY - 8,
        left: rect.left + window.scrollX + rect.width / 2,
      });
      setVisible(true);
    }
  };

  const hideTooltip = () => {
    setVisible(false);
  };

  return (
    <div
      ref={containerRef}
      className={styles.tooltipContainer}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {visible &&
        ReactDOM.createPortal(
          <div
            className={styles.tooltipPortal}
            style={{
              top: coords.top,
              left: coords.left,
            }}
          >
            {content}
          </div>,
          document.body
        )}
    </div>
  );
};

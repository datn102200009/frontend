import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import styles from './Button.module.css';
import clsx from 'clsx';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, icon, children, className, disabled, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(styles.btn, styles[variant], styles[size], loading && styles.loading, className)}
        disabled={disabled || loading}
        {...rest}
      >
        {loading ? (
          <Loader2 className={styles.spinner} size={size === 'sm' ? 14 : 16} aria-hidden="true" />
        ) : icon ? (
          <span className={styles.icon} aria-hidden="true">{icon}</span>
        ) : null}
        <span>{children}</span>
      </button>
    );
  },
);

Button.displayName = 'Button';

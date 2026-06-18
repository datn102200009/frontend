import { type TextareaHTMLAttributes, forwardRef, useId } from 'react';
import styles from './Input.module.css';
import clsx from 'clsx';

export interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label: string;
  error?: string;
  helperText?: string;
  size?: 'sm' | 'md';
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, helperText, size = 'md', className, required, id: idProp, rows = 3, ...rest }, ref) => {
    const autoId = useId();
    const id = idProp ?? autoId;

    return (
      <div className={clsx(styles.field, error && styles.hasError, className)}>
        <label htmlFor={id} className={styles.label}>
          {label}
          {required && <span className={styles.required} aria-hidden="true">*</span>}
        </label>
        <div className={styles.inputWrap}>
          <textarea
            ref={ref}
            id={id}
            rows={rows}
            className={clsx(styles.input, styles[size])}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
            required={required}
            {...rest}
          />
        </div>
        {error && (
          <p id={`${id}-error`} className={styles.error} role="alert">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${id}-helper`} className={styles.helper}>
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

TextArea.displayName = 'TextArea';

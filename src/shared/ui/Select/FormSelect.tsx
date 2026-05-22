import { forwardRef, type SelectHTMLAttributes, useId } from 'react';
import inputStyles from '@shared/ui/Input/Input.module.css';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';

export interface FormSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label: string;
  error?: string;
  helperText?: string;
  options: { label: string; value: string }[];
  size?: 'sm' | 'md';
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, error, helperText, size = 'md', className, required, id: idProp, options, ...rest }, ref) => {
    const autoId = useId();
    const id = idProp ?? autoId;

    return (
      <div className={clsx(inputStyles.field, error && inputStyles.hasError, className)}>
        <label htmlFor={id} className={inputStyles.label}>
          {label}
          {required && <span className={inputStyles.required} aria-hidden="true">*</span>}
        </label>
        <div className={inputStyles.inputWrap}>
          <select
            ref={ref}
            id={id}
            className={clsx(inputStyles.input, inputStyles[size], 'appearance-none')}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
            required={required}
            {...rest}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <ChevronDown size={18} />
          </div>
        </div>
        {error && (
          <p id={`${id}-error`} className={inputStyles.error} role="alert">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${id}-helper`} className={inputStyles.helper}>
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

FormSelect.displayName = 'FormSelect';

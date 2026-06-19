import { type InputHTMLAttributes, forwardRef, useState, useId, useEffect, useMemo, useRef, useCallback } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import styles from './Input.module.css';
import clsx from 'clsx';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'defaultValue' | 'value' | 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  size?: 'sm' | 'md';
  decimals?: number;
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const roundToDecimals = (value: number | string, decimals: number): number => {
  const n = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(n)) return n;
  const factor = Math.pow(10, decimals);
  return Math.round((n + Number.EPSILON) * factor) / factor;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, type = 'text', size = 'md', className, required, id: idProp, decimals, value, defaultValue, onChange, ...rest }, ref) => {
    const autoId = useId();
    const id = idProp ?? autoId;
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    const isNumberType = type === 'number';

    let step = rest.step;
    let inputMode = rest.inputMode;
    if (isNumberType) {
      step = rest.step ?? (decimals !== undefined && decimals > 0 ? Math.pow(10, -decimals).toFixed(decimals) : '1');
      inputMode = rest.inputMode ?? (decimals !== undefined && decimals > 0 ? 'decimal' : 'numeric');
    }

    const inputRef = useRef<HTMLInputElement | null>(null);

    const setRefs = useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
        }
      },
      [ref]
    );

    // DOM value property setter monkey patching - giải quyết triệt để RHF reset / load values qua ref
    useEffect(() => {
      const element = inputRef.current;
      if (!element || !isNumberType || decimals === undefined) return;

      const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
      if (!descriptor || !descriptor.set) return;

      const originalSet = descriptor.set;

      Object.defineProperty(element, 'value', {
        ...descriptor,
        set: function (val) {
          let newValue = val;
          if (val !== '' && val !== null && val !== undefined) {
            const n = Number(val);
            if (!Number.isNaN(n)) {
              newValue = String(roundToDecimals(n, decimals));
            }
          }
          originalSet.call(this, newValue);
        },
      });

      // Làm tròn giá trị có sẵn khi mount hoặc decimals đổi
      if (element.value !== '') {
        const n = Number(element.value);
        if (!Number.isNaN(n)) {
          element.value = String(roundToDecimals(n, decimals));
        }
      }
    }, [decimals, isNumberType]);

    // Round value ban đầu hoặc khi value thay đổi (controlled) - chỉ chạy khi decimals !== undefined
    useEffect(() => {
      if (!isNumberType || decimals === undefined) return;
      if (value === undefined || value === null || value === '') return;
      const n = Number(value);
      if (Number.isNaN(n)) return;
      const rounded = roundToDecimals(n, decimals);
      if (rounded !== n && onChange) {
        const event = { target: { value: String(rounded) } } as React.ChangeEvent<HTMLInputElement>;
        onChange(event);
      }
    }, [value, decimals, isNumberType, onChange]);

    // Với uncontrolled: làm tròn defaultValue ban đầu - chỉ chạy khi decimals !== undefined
    const internalDefaultValue = useMemo(() => {
      if (isNumberType && decimals !== undefined && defaultValue !== undefined && defaultValue !== null && defaultValue !== '') {
        const n = Number(defaultValue);
        if (!Number.isNaN(n)) {
          return String(roundToDecimals(n, decimals));
        }
      }
      return defaultValue;
    }, [defaultValue, isNumberType, decimals]);

    // Xử lý khi gõ bàn phím - tự động làm tròn nếu vượt quá số chữ số thập phân
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isNumberType && decimals !== undefined) {
        const val = e.target.value;
        const dotIndex = val.indexOf('.');
        if (dotIndex !== -1 && val.length - dotIndex - 1 > decimals) {
          const n = Number(val);
          if (!Number.isNaN(n)) {
            e.target.value = String(roundToDecimals(n, decimals));
          }
        }
      }
      if (onChange) {
        onChange(e);
      }
    };

    // Xử lý khi rời input - làm tròn triệt để và đồng bộ state
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (isNumberType && decimals !== undefined) {
        const val = e.target.value;
        if (val !== '') {
          const n = Number(val);
          if (!Number.isNaN(n)) {
            const rounded = roundToDecimals(n, decimals);
            e.target.value = String(rounded);
            // Trigger onChange để React Hook Form cập nhật state
            if (onChange) {
              const changeEvent = {
                ...e,
                type: 'change',
                target: e.target,
                currentTarget: e.target,
              } as unknown as React.ChangeEvent<HTMLInputElement>;
              onChange(changeEvent);
            }
          }
        }
      }
      if (rest.onBlur) {
        rest.onBlur(e);
      }
    };

    // Chặn dấu chấm, dấu phẩy và ký hiệu khoa học khi decimals === 0
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (isNumberType && decimals === 0) {
        if (e.key === '.' || e.key === ',' || e.key === 'e' || e.key === 'E') {
          e.preventDefault();
        }
      }
      if (rest.onKeyDown) {
        rest.onKeyDown(e);
      }
    };

    // Tạo props có điều kiện cho input element để tránh truyền value={undefined}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inputProps: any = {
      ref: setRefs,
      id,
      type: inputType,
      className: clsx(styles.input, styles[size]),
      'aria-invalid': !!error,
      'aria-describedby': error ? `${id}-error` : helperText ? `${id}-helper` : undefined,
      required,
      step,
      inputMode,
      onChange: handleChange,
      onBlur: handleBlur,
      onKeyDown: handleKeyDown,
      ...rest
    };

    if (value !== undefined) {
      inputProps.value = value;
    }
    if (internalDefaultValue !== undefined) {
      inputProps.defaultValue = internalDefaultValue;
    }

    return (
      <div className={clsx(styles.field, error && styles.hasError, className)}>
        {label && (
          <label htmlFor={id} className={styles.label}>
            {label}
            {required && <span className={styles.required} aria-hidden="true">*</span>}
          </label>
        )}
        <div className={styles.inputWrap}>
          <input {...inputProps} />
          {isPassword && (
            <button
              type="button"
              className={styles.toggle}
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
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

Input.displayName = 'Input';

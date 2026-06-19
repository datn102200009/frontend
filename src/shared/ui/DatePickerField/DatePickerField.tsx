import React, { useState } from 'react';
import { Controller } from 'react-hook-form';
import { Calendar } from 'lucide-react';
import { DatePickerModal } from '@shared/ui/DatePickerModal/DatePickerModal';
import { formatDateVN } from '@shared/lib/formatDate';
import styles from './DatePickerField.module.css';

export interface DatePickerFieldProps {
  name: string;
  label: string;
  control: any;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  validate?: (value: string) => string | true;
  placeholder?: string;
  defaultValue?: string;
  minDate?: string | null;
  maxDate?: string | null;
}

export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  name,
  label,
  control,
  error,
  required,
  disabled,
  validate,
  placeholder = 'DD-MM-YYYY',
  defaultValue = '',
  minDate,
  maxDate,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.formGroup}>
      <label className={styles.label} htmlFor={`${name}_display`}>
        {label} {required && <span className={styles.required}>*</span>}
      </label>
      <Controller
        control={control}
        name={name}
        rules={{
          required: required ? `${label} là bắt buộc` : false,
          validate,
        }}
        defaultValue={defaultValue}
        render={({ field }) => (
          <>
            <div className={styles.inputWithIcon}>
              <input
                id={`${name}_display`}
                type="text"
                readOnly
                placeholder={placeholder}
                value={formatDateVN(field.value)}
                onClick={() => !disabled && setOpen(true)}
                onKeyDown={(e) => {
                  if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    setOpen(true);
                  }
                }}
                className={styles.input}
                disabled={disabled}
                style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
              />
              <Calendar className={styles.inputIcon} size={16} />
            </div>
            <input type="text" style={{ display: 'none' }} name={field.name} ref={field.ref} value={field.value || ''} onChange={field.onChange} />
            <DatePickerModal
              open={open}
              onClose={() => setOpen(false)}
              value={field.value || ''}
              onChange={(d) => field.onChange(d)}
              minDate={minDate}
              maxDate={maxDate}
            />
          </>
        )}
      />
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
};

import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import clsx from 'clsx';
import './Select.scss';

export interface Option {
  label: string;
  value: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta?: any;
}

interface Props {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  ariaLabel?: string;
  renderOption?: (option: Option) => React.ReactNode;
}

export const SearchableSelect = React.forwardRef<HTMLInputElement, Props>(
  (
    {
      options,
      value,
      onChange,
      placeholder = 'Chọn một mục...',
      label,
      error,
      disabled,
      required,
      ariaLabel,
      renderOption,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const labelId = useId();
    const listboxId = useId();

    const selectedOption = options.find((opt) => opt.value === value);

    const filteredOptions = options.filter((opt) =>
      opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    const toggleOpen = () => {
      if (!disabled) {
        setIsOpen(!isOpen);
        if (!isOpen) setSearchTerm('');
      }
    };

    const handleSelect = (val: string) => {
      onChange(val);
      setIsOpen(false);
      setSearchTerm('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleOpen();
      } else if (e.key === 'Escape') {
        if (isOpen) {
          e.preventDefault();
          setIsOpen(false);
        }
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (!isOpen) {
          e.preventDefault();
          setIsOpen(true);
        }
      }
    };

    return (
      <div className={clsx('select-container', { disabled })} ref={containerRef}>
        {/* Hidden input for react-hook-form ref */}
        <input type="hidden" ref={ref} value={value} readOnly />
        {label && (
          <div className="select-label" id={labelId} onClick={toggleOpen}>
            {label} {required && <span className="required">*</span>}
          </div>
        )}
        <div
          className={clsx('select-trigger', { error: !!error, open: isOpen })}
          onClick={toggleOpen}
          tabIndex={disabled ? -1 : 0}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={isOpen ? listboxId : undefined}
          aria-labelledby={label ? labelId : undefined}
          aria-label={ariaLabel}
          aria-disabled={disabled}
          onKeyDown={handleKeyDown}
        >
          <span className={clsx('select-value', { placeholder: !selectedOption })}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown size={18} className="select-icon" />
        </div>

        {isOpen && (
          <div className="select-dropdown">
            <div className="select-search">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
            <ul className="select-options" role="listbox" id={listboxId} aria-labelledby={label ? labelId : undefined}>
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => (
                  <li
                    key={opt.value}
                    className={clsx('select-option', {
                      selected: opt.value === value,
                    })}
                    onClick={() => handleSelect(opt.value)}
                    role="option"
                    aria-selected={opt.value === value}
                  >
                    {renderOption ? renderOption(opt) : opt.label}
                    {opt.value === value && <Check size={16} className="check-icon" />}
                  </li>
                ))
              ) : (
                <li className="select-option empty" role="option" aria-selected="false">Không tìm thấy kết quả</li>
              )}
            </ul>
          </div>
        )}
        {error && <span className="select-error">{error}</span>}
      </div>
    );
  }
);
SearchableSelect.displayName = 'SearchableSelect';

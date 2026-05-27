import React, { useState, useMemo } from 'react';
import { Modal } from '../Modal/Modal';
import { Button } from '../Button/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './DatePickerModal.module.css';

interface DatePickerModalProps {
  open: boolean;
  onClose: () => void;
  value: string; // YYYY-MM-DD format
  onChange: (date: string) => void; // returns YYYY-MM-DD format
}

const parseISODate = (str: string): Date => {
  if (!str) return new Date();
  const parts = str.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return new Date(y, m, d);
  }
  return new Date();
};

const formatToISODate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  open,
  onClose,
  value,
  onChange,
}) => {
  // Parsed initial date from props
  const initialDate = useMemo(() => parseISODate(value), [value]);

  // Selected date state inside the modal (starts as current value)
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);

  // View state (which month/year the calendar grid is displaying)
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth());
  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());

  // Synchronize internal state during render when modal opens or value changes
  const [prevOpen, setPrevOpen] = useState(open);
  const [prevValue, setPrevValue] = useState(value);

  if (open !== prevOpen || value !== prevValue) {
    setPrevOpen(open);
    setPrevValue(value);
    if (open) {
      const d = parseISODate(value);
      setSelectedDate(d);
      setViewMonth(d.getMonth());
      setViewYear(d.getFullYear());
    }
  }

  // Year choices range: dynamically derived from current year and viewYear
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const minYear = Math.min(currentYear - 10, viewYear - 10);
    const maxYear = Math.max(currentYear + 10, viewYear + 10);
    const years: number[] = [];
    for (let y = minYear; y <= maxYear; y++) {
      years.push(y);
    }
    return years;
  }, [viewYear]);

  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => i);
  }, []);

  // Calendar grid construction logic
  const daysInGrid = useMemo(() => {
    // 0-indexed month
    const firstDay = new Date(viewYear, viewMonth, 1);
    
    // Adjust day index so Monday is 0, Sunday is 6
    // js getDay() is 0 for Sunday, 1 for Monday, etc.
    const dayOfWeek = firstDay.getDay();
    const daysBefore = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const daysCount = new Date(viewYear, viewMonth + 1, 0).getDate();

    const grid: { date: Date; isCurrentMonth: boolean }[] = [];

    // Previous month filler days
    const prevMonthYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
    const prevMonthDaysCount = new Date(prevMonthYear, prevMonth + 1, 0).getDate();
    for (let i = daysBefore - 1; i >= 0; i--) {
      grid.push({
        date: new Date(prevMonthYear, prevMonth, prevMonthDaysCount - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let d = 1; d <= daysCount; d++) {
      grid.push({
        date: new Date(viewYear, viewMonth, d),
        isCurrentMonth: true,
      });
    }

    // Next month filler days to complete 6 rows (42 days)
    const remainingCells = 42 - grid.length;
    const nextMonthYear = viewMonth === 11 ? viewYear + 1 : viewYear;
    const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
    for (let d = 1; d <= remainingCells; d++) {
      grid.push({
        date: new Date(nextMonthYear, nextMonth, d),
        isCurrentMonth: false,
      });
    }

    return grid;
  }, [viewMonth, viewYear]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleConfirm = () => {
    onChange(formatToISODate(selectedDate));
    onClose();
  };

  const isSameDate = (d1: Date, d2: Date) => {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  const isToday = (d: Date) => {
    const today = new Date();
    return isSameDate(d, today);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Chọn Ngày Tháng Năm"
      size="sm"
      footer={
        <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleConfirm}>
            Xác nhận
          </Button>
        </div>
      }
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <button
            type="button"
            className={styles.navButton}
            onClick={handlePrevMonth}
            aria-label="Tháng trước"
          >
            <ChevronLeft size={16} />
          </button>
          
          <div className={styles.selectors}>
            <select
              aria-label="Chọn tháng"
              className={styles.select}
              value={viewMonth}
              onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
            >
              {monthOptions.map((m) => (
                <option key={m} value={m}>
                  Tháng {m + 1}
                </option>
              ))}
            </select>
            
            <select
              aria-label="Chọn năm"
              className={styles.select}
              value={viewYear}
              onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  Năm {y}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className={styles.navButton}
            onClick={handleNextMonth}
            aria-label="Tháng sau"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className={styles.calendar}>
          <div className={styles.weekdays}>
            <div className={styles.weekday}>T2</div>
            <div className={styles.weekday}>T3</div>
            <div className={styles.weekday}>T4</div>
            <div className={styles.weekday}>T5</div>
            <div className={styles.weekday}>T6</div>
            <div className={styles.weekday}>T7</div>
            <div className={styles.weekday}>CN</div>
          </div>

          <div className={styles.daysGrid}>
            {daysInGrid.map(({ date, isCurrentMonth }, idx) => {
              const selected = isSameDate(date, selectedDate);
              const today = isToday(date);
              
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedDate(date);
                    // Also bring view to match the clicked day's month/year
                    setViewMonth(date.getMonth());
                    setViewYear(date.getFullYear());
                  }}
                  className={`${styles.dayCell} ${
                    !isCurrentMonth ? styles.outside : ''
                  } ${selected ? styles.selected : ''} ${
                    today ? styles.today : ''
                  }`}
                  aria-label={`${date.getDate()} Tháng ${
                    date.getMonth() + 1
                  } Năm ${date.getFullYear()}`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
};

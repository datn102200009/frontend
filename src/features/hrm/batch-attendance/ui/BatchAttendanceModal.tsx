import React, { useEffect, useState } from 'react';
import {
  useGetHrmEmployeesQuery,
  usePostHrmAttendancesBatchMutation,
  useGetHrmPublicHolidaysQuery,
  useGetHrmSalarySlipsQuery,
} from '@entities/hrm/api/hrmApi';
import { Modal } from '@shared/ui/Modal/Modal';
import { Button } from '@shared/ui/Button/Button';
import styles from './BatchAttendanceModal.module.css';

const parseLocalDate = (dateStr: string): Date => {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return new Date(y, m, d);
  }
  return new Date(dateStr);
};

interface BatchAttendanceModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialDate?: string;
}

interface AttendanceRecord {
  employee_id: string;
  employee_name: string;
  employee_code: string;
  status: 'working' | 'paid_leave' | 'unpaid_leave' | 'holiday';
  work_hours: number;
  overtime_hours: number;
  remarks: string;
}

export const BatchAttendanceModal: React.FC<BatchAttendanceModalProps> = ({
  open,
  onClose,
  onSuccess,
  initialDate,
}) => {
  const [date, setDate] = useState<string>(initialDate || new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  const period = date ? date.slice(0, 7) : '';
  const { data: salarySlips = [] } = useGetHrmSalarySlipsQuery(
    { salaryPeriod: period },
    { skip: !period || !open }
  );

  const isPeriodPaid = React.useMemo(() => {
    if (!salarySlips || salarySlips.length === 0) return false;
    return salarySlips.every((slip) => slip.status === 'paid');
  }, [salarySlips]);

  // Fetch public holidays
  const { data: holidays = [] } = useGetHrmPublicHolidaysQuery({});

  // Analyze holidays and calculate compensatory holidays (compensating official holidays on Sunday)
  const holidayAnalysis = React.useMemo(() => {
    const officialMap = new Map<string, typeof holidays[number]>();
    holidays.forEach((h) => {
      if (!h.start_date) return;
      const start = parseLocalDate(h.start_date);
      const days = h.days || 1;
      for (let i = 0; i < days; i++) {
        const current = new Date(start);
        current.setDate(start.getDate() + i);
        const y = current.getFullYear();
        const m = String(current.getMonth() + 1).padStart(2, '0');
        const d = String(current.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;
        officialMap.set(dateStr, h);
      }
    });

    const sortedDates = Array.from(officialMap.keys()).sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime();
    });

    const compensatoryMap = new Map<string, typeof holidays[number]>();
    const officialToCompensatoryMap = new Map<string, string>();
    sortedDates.forEach((dateStr) => {
      const d = parseLocalDate(dateStr);
      if (d.getDay() === 0) { // Sunday is rest day
        const compDate = new Date(d);
        compDate.setDate(d.getDate() + 1);
        
        const getFormatted = (dt: Date) => {
          const y = dt.getFullYear();
          const m = String(dt.getMonth() + 1).padStart(2, '0');
          const day = String(dt.getDate()).padStart(2, '0');
          return `${y}-${m}-${day}`;
        };

        while (
          compDate.getDay() === 0 ||
          officialMap.has(getFormatted(compDate)) ||
          compensatoryMap.has(getFormatted(compDate))
        ) {
          compDate.setDate(compDate.getDate() + 1);
        }
        const compDateStr = getFormatted(compDate);
        compensatoryMap.set(compDateStr, officialMap.get(dateStr)!);
        officialToCompensatoryMap.set(dateStr, compDateStr);
      }
    });

    return {
      officialMap,
      compensatoryMap,
      officialToCompensatoryMap,
    };
  }, [holidays]);

  // Info for the currently selected date
  const selectedHolidayInfo = React.useMemo(() => {
    if (!date) return null;
    const official = holidayAnalysis.officialMap.get(date);
    if (official) {
      const d = parseLocalDate(date);
      const isSunday = d.getDay() === 0;
      let compensatoryDayName = '';
      if (isSunday) {
        const compDateStr = holidayAnalysis.officialToCompensatoryMap.get(date);
        if (compDateStr) {
          const compDate = parseLocalDate(compDateStr);
          const dayOfWeek = compDate.getDay();
          const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
          compensatoryDayName = dayNames[dayOfWeek];
        }
      }
      return {
        type: 'official' as const,
        name: official.name,
        isSunday,
        compensatoryDayName,
      };
    }
    const compensatory = holidayAnalysis.compensatoryMap.get(date);
    if (compensatory) {
      return {
        type: 'compensatory' as const,
        name: compensatory.name,
      };
    }
    return null;
  }, [holidayAnalysis, date]);

  // Fetch active employees
  const { data: employeeData, isLoading: isLoadingEmployees, error: loadError } = useGetHrmEmployeesQuery(
    { status: 'active', limit: 100 },
    { skip: !open }
  );

  const [saveAttendance, { isLoading: isSaving }] = usePostHrmAttendancesBatchMutation();

  // Initialize records when employee data loads or holiday status changes
  useEffect(() => {
    if (employeeData?.results) {
      const isHoliday = !!selectedHolidayInfo;
      const defaultStatus = isHoliday ? 'holiday' : 'working';
      const defaultWorkHours = isHoliday ? 0 : 8;

      const initialRecords: AttendanceRecord[] = employeeData.results.map((emp) => ({
        employee_id: emp.id || '',
        employee_name: emp.full_name || '',
        employee_code: emp.employee_id || '',
        status: defaultStatus,
        work_hours: defaultWorkHours,
        overtime_hours: 0,
        remarks: '',
      }));
      setRecords(initialRecords);
    }
  }, [employeeData, selectedHolidayInfo]);

  // Reset local state when opened/closed
  useEffect(() => {
    if (open) {
      setDate(initialDate || new Date().toISOString().split('T')[0]);
      setApiError(null);
    } else {
      setRecords([]);
    }
  }, [open, initialDate]);

  const handleStatusChange = (index: number, newStatus: AttendanceRecord['status']) => {
    setRecords((prev) => {
      const next = [...prev];
      const workHoursDisabled = ['holiday', 'paid_leave', 'unpaid_leave'].includes(newStatus);
      const otHoursDisabled = ['paid_leave', 'unpaid_leave'].includes(newStatus);

      next[index] = {
        ...next[index],
        status: newStatus,
        work_hours: workHoursDisabled ? 0 : (newStatus === 'working' ? 8 : next[index].work_hours),
        overtime_hours: otHoursDisabled ? 0 : next[index].overtime_hours,
      };
      return next;
    });
  };

  const handleFieldChange = (index: number, key: keyof AttendanceRecord, value: any) => {
    setRecords((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [key]: value,
      };
      return next;
    });
  };

  const handleSubmit = async () => {
    setApiError(null);
    if (!date) {
      setApiError('Vui lòng chọn ngày chấm công.');
      return;
    }

    if (records.length === 0) {
      setApiError('Không có nhân sự nào để chấm công.');
      return;
    }

    try {
      const body = {
        date,
        records: records.map((r) => ({
          employee_id: r.employee_id,
          status: r.status,
          work_hours: Number(r.work_hours),
          overtime_hours: Number(r.overtime_hours),
          remarks: r.remarks || undefined,
        })),
      };

      await saveAttendance({ body }).unwrap();
      onSuccess();
    } catch (err: any) {
      console.error('Failed to save batch attendance', err);
      setApiError(err?.data?.detail || 'Có lỗi xảy ra khi lưu bảng công. Vui lòng kiểm tra lại.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Chấm Công"
      size="lg"
      footer={
        <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Hủy
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={isSaving}
            disabled={isLoadingEmployees || records.length === 0 || isPeriodPaid}
          >
            Lưu chấm công
          </Button>
        </div>
      }
    >
      <div className={styles.container}>
        {apiError && (
          <div className={styles.errorSection}>
            <span>{apiError}</span>
          </div>
        )}

        {isPeriodPaid && (
          <div className={styles.errorSection} data-testid="paid-period-modal-banner">
            <span>Kỳ lương {period} đã được thanh toán 100%. Không cho phép chỉnh sửa chấm công.</span>
          </div>
        )}

        <div className={styles.dateRow}>
          <label className={styles.label} htmlFor="attendance_date">
            Ngày chấm công:
          </label>
          <input
            id="attendance_date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={styles.input}
            disabled={isSaving}
          />
        </div>

        {selectedHolidayInfo && (
          <div className={`${styles.infoBanner} ${selectedHolidayInfo.type === 'official' ? styles.warningBanner : styles.successBanner}`}>
            {selectedHolidayInfo.type === 'official' ? (
              <span>
                Hôm nay là ngày nghỉ lễ chính thức: <strong>{selectedHolidayInfo.name}</strong>
                {selectedHolidayInfo.isSunday && selectedHolidayInfo.compensatoryDayName && (
                  <> trùng Chủ Nhật (sẽ được nghỉ bù vào <strong>{selectedHolidayInfo.compensatoryDayName}</strong>)</>
                )}.
              </span>
            ) : (
              <span>
                Hôm nay là ngày nghỉ bù cho: <strong>{selectedHolidayInfo.name}</strong> (do trùng vào Chủ Nhật). Người lao động được nghỉ hưởng 100% lương, đi làm tính tăng ca hệ số 2.0x.
              </span>
            )}
          </div>
        )}

        {isLoadingEmployees ? (
          <div className={styles.loadingSection}>Đang tải danh sách nhân viên...</div>
        ) : loadError ? (
          <div className={styles.errorSection}>Không thể tải danh sách nhân viên.</div>
        ) : records.length === 0 ? (
          <div className={styles.emptySection}>Không tìm thấy nhân viên đang hoạt động nào.</div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead className={styles.thead}>
                <tr>
                  <th className={styles.th} style={{ width: '25%' }}>Nhân viên</th>
                  <th className={styles.th} style={{ width: '20%' }}>Trạng thái</th>
                  <th className={styles.th} style={{ width: '15%' }}>Số giờ công</th>
                  <th className={styles.th} style={{ width: '15%' }}>Giờ OT</th>
                  <th className={styles.th} style={{ width: '25%' }}>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record, idx) => (
                  <tr key={record.employee_id} className={styles.tr}>
                    <td className={styles.td}>
                      <div className={styles.employeeInfo}>
                        <span className={styles.employeeName}>{record.employee_name}</span>
                        <span className={styles.employeeCode}>{record.employee_code}</span>
                      </div>
                    </td>
                    <td className={styles.td}>
                      <select
                        aria-label={`Trạng thái của ${record.employee_name}`}
                        value={record.status}
                        onChange={(e) => handleStatusChange(idx, e.target.value as any)}
                        className={styles.select}
                        disabled={isSaving || !!selectedHolidayInfo || isPeriodPaid}
                      >
                        <option value="working">Ngày công thường</option>
                        <option value="paid_leave">Nghỉ phép có lương</option>
                        <option value="unpaid_leave">Nghỉ không lương</option>
                        <option value="holiday">Nghỉ lễ</option>
                      </select>
                    </td>
                    <td className={styles.td}>
                      <input
                        aria-label={`Số giờ công của ${record.employee_name}`}
                        type="number"
                        min={0}
                        max={24}
                        step={0.5}
                        value={record.work_hours}
                        onChange={(e) => handleFieldChange(idx, 'work_hours', Number(e.target.value))}
                        className={styles.numberInput}
                        disabled={isSaving || ['holiday', 'paid_leave', 'unpaid_leave'].includes(record.status) || isPeriodPaid}
                      />
                    </td>
                    <td className={styles.td}>
                      <input
                        aria-label={`Giờ OT của ${record.employee_name}`}
                        type="number"
                        min={0}
                        max={24}
                        step={0.5}
                        value={record.overtime_hours}
                        onChange={(e) => handleFieldChange(idx, 'overtime_hours', Number(e.target.value))}
                        className={styles.numberInput}
                        disabled={isSaving || ['paid_leave', 'unpaid_leave'].includes(record.status) || isPeriodPaid}
                      />
                    </td>
                    <td className={styles.td}>
                      <input
                        aria-label={`Ghi chú của ${record.employee_name}`}
                        type="text"
                        placeholder="Lý do tăng ca, đi trễ..."
                        value={record.remarks}
                        onChange={(e) => handleFieldChange(idx, 'remarks', e.target.value)}
                        className={styles.textInput}
                        disabled={isSaving || isPeriodPaid}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
};

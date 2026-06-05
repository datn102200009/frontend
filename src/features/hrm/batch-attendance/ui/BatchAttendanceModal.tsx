import React, { useState } from 'react';
import {
  useGetHrmEmployeesQuery,
  usePostHrmAttendancesBatchMutation,
  useGetHrmPublicHolidaysQuery,
  useGetHrmSalarySlipsQuery,
  useGetHrmAttendancesQuery,
} from '@entities/hrm/api/hrmApi';
import { Modal } from '@shared/ui/Modal/Modal';
import { Button } from '@shared/ui/Button/Button';
import { batchAttendanceSchema } from '../model/batch-attendance.schema';
import styles from './BatchAttendanceModal.module.css';

import { calculateHolidayAnalysis, getSelectedHolidayInfo } from '@entities/hrm/lib/holiday';

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

const EMPTY_ARRAY: never[] = [];

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
    return calculateHolidayAnalysis(holidays);
  }, [holidays]);

  // Info for the currently selected date
  const selectedHolidayInfo = React.useMemo(() => {
    return getSelectedHolidayInfo(date, holidayAnalysis);
  }, [holidayAnalysis, date]);

  // Fetch active employees
  const { data: employeeData, isLoading: isLoadingEmployees, error: loadError } = useGetHrmEmployeesQuery(
    { status: 'active', limit: 100 },
    { skip: !open }
  );

  // Fetch existing attendance records for the selected date
  const { data: existingAttendances = EMPTY_ARRAY, isLoading: isLoadingAttendances } = useGetHrmAttendancesQuery(
    { date },
    { skip: !date || !open }
  );

  const [saveAttendance, { isLoading: isSaving }] = usePostHrmAttendancesBatchMutation();

  const [prevOpen, setPrevOpen] = React.useState(open);
  const [prevInitialDate, setPrevInitialDate] = React.useState(initialDate);

  if (open !== prevOpen || initialDate !== prevInitialDate) {
    setPrevOpen(open);
    setPrevInitialDate(initialDate);
    if (open) {
      setDate(initialDate || new Date().toISOString().split('T')[0]);
      setApiError(null);
    } else {
      setRecords([]);
    }
  }

  const dataKey = open ? `${employeeData?.results?.length || 0}-${existingAttendances?.length || 0}-${date}-${!!selectedHolidayInfo}` : '';
  const [prevDataKey, setPrevDataKey] = React.useState('');

  if (open && dataKey !== prevDataKey) {
    setPrevDataKey(dataKey);
    if (employeeData?.results) {
      const isHoliday = !!selectedHolidayInfo;
      const defaultStatus = isHoliday ? 'holiday' : 'working';
      const defaultWorkHours = isHoliday ? 0 : 8;

      const initialRecords: AttendanceRecord[] = employeeData.results.map((emp) => {
        const existing = existingAttendances?.find((att) => att.employee_id === emp.id);
        if (existing) {
          return {
            employee_id: emp.id || '',
            employee_name: emp.full_name || '',
            employee_code: emp.employee_id || '',
            status: (existing.status as AttendanceRecord['status']) || defaultStatus,
            work_hours: existing.work_hours !== undefined ? Number(existing.work_hours) : defaultWorkHours,
            overtime_hours: existing.overtime_hours !== undefined ? Number(existing.overtime_hours) : 0,
            remarks: existing.remarks || '',
          };
        }
        return {
          employee_id: emp.id || '',
          employee_name: emp.full_name || '',
          employee_code: emp.employee_id || '',
          status: defaultStatus,
          work_hours: defaultWorkHours,
          overtime_hours: 0,
          remarks: '',
        };
      });
      setRecords(initialRecords);
    }
  }

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

  const handleFieldChange = (index: number, key: keyof AttendanceRecord, value: string | number) => {
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
    const result = batchAttendanceSchema.safeParse({
      date,
      records: records.map(r => ({
        employee_id: r.employee_id,
        status: r.status,
        work_hours: r.work_hours,
        overtime_hours: r.overtime_hours,
        remarks: r.remarks,
      })),
    });

    if (!result.success) {
      const firstError = result.error.issues[0];
      setApiError(firstError.message);
      return;
    }

    try {
      const body = {
        date: result.data.date,
        records: result.data.records.map((r) => ({
          employee_id: r.employee_id,
          status: r.status,
          work_hours: r.work_hours,
          overtime_hours: r.overtime_hours,
          remarks: r.remarks || undefined,
        })),
      };

      await saveAttendance({ body }).unwrap();
      onSuccess();
    } catch (err: unknown) {
      console.error('Failed to save batch attendance', err);
      const error = err as { data?: { detail?: string } };
      setApiError(error?.data?.detail || 'Có lỗi xảy ra khi lưu bảng công. Vui lòng kiểm tra lại.');
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
            disabled={isLoadingEmployees || isLoadingAttendances || records.length === 0 || isPeriodPaid}
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

        {isLoadingEmployees || isLoadingAttendances ? (
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
                        onChange={(e) => handleStatusChange(idx, e.target.value as AttendanceRecord['status'])}
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

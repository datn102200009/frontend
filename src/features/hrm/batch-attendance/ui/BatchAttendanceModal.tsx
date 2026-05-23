import React, { useEffect, useState } from 'react';
import { useGetHrmEmployeesQuery, usePostHrmAttendancesBatchMutation } from '@entities/hrm/api/hrmApi';
import { Modal } from '@shared/ui/Modal/Modal';
import { Button } from '@shared/ui/Button/Button';
import styles from './BatchAttendanceModal.module.css';

interface BatchAttendanceModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface AttendanceRecord {
  employee_id: string;
  employee_name: string;
  employee_code: string;
  status: 'working' | 'paid_leave' | 'unpaid_leave' | 'sick_leave' | 'holiday' | 'other';
  work_hours: number;
  overtime_hours: number;
  remarks: string;
}

export const BatchAttendanceModal: React.FC<BatchAttendanceModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  // Fetch active employees
  const { data: employeeData, isLoading: isLoadingEmployees, error: loadError } = useGetHrmEmployeesQuery(
    { status: 'active', limit: 100 },
    { skip: !open }
  );

  const [saveAttendance, { isLoading: isSaving }] = usePostHrmAttendancesBatchMutation();

  // Initialize records when employee data loads
  useEffect(() => {
    if (employeeData?.results) {
      const initialRecords: AttendanceRecord[] = employeeData.results.map((emp) => ({
        employee_id: emp.id || '',
        employee_name: emp.full_name || '',
        employee_code: emp.employee_id || '',
        status: 'working',
        work_hours: 8,
        overtime_hours: 0,
        remarks: '',
      }));
      setRecords(initialRecords);
    }
  }, [employeeData]);

  // Reset local state when opened/closed
  useEffect(() => {
    if (open) {
      setDate(new Date().toISOString().split('T')[0]);
      setApiError(null);
    } else {
      setRecords([]);
    }
  }, [open]);

  const handleStatusChange = (index: number, newStatus: AttendanceRecord['status']) => {
    setRecords((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        status: newStatus,
        // Set work hours to 0 if they are off, or 8 if they are working
        work_hours: newStatus === 'working' ? 8 : 0,
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
      title="Chấm Công Hàng Loạt"
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
            disabled={isLoadingEmployees || records.length === 0}
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
                        disabled={isSaving}
                      >
                        <option value="working">Đi làm</option>
                        <option value="paid_leave">Nghỉ phép</option>
                        <option value="unpaid_leave">Nghỉ không lương</option>
                        <option value="sick_leave">Nghỉ ốm</option>
                        <option value="holiday">Nghỉ lễ</option>
                        <option value="other">Khác</option>
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
                        disabled={isSaving}
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
                        disabled={isSaving}
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
                        disabled={isSaving}
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

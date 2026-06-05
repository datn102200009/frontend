import { z } from 'zod';

export const batchAttendanceSchema = z.object({
  date: z.string().min(1, 'Ngày chấm công là bắt buộc').refine((val) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(val);
    return selectedDate <= today;
  }, 'Không cho phép chọn ngày tương lai'),
  records: z.array(
    z.object({
      employee_id: z.string().min(1, 'ID nhân viên là bắt buộc'),
      status: z.enum(['working', 'paid_leave', 'unpaid_leave', 'holiday']),
      work_hours: z.coerce.number().min(0, 'Số giờ công không được âm').max(24, 'Số giờ công tối đa là 24 giờ'),
      overtime_hours: z.coerce.number().min(0, 'Số giờ tăng ca không được âm').max(24, 'Số giờ tăng ca tối đa là 24 giờ'),
      remarks: z.string().optional().or(z.literal('')),
    })
  ).min(1, 'Không có nhân sự nào để chấm công'),
});

export type BatchAttendanceValues = z.infer<typeof batchAttendanceSchema>;

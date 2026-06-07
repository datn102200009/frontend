import { z } from 'zod';

export const leaveRequestSchema = z.object({
  employee_id: z.string().optional().or(z.literal('')),
  leave_type: z.enum(['paid', 'unpaid']),
  start_date: z.string().min(1, 'Ngày bắt đầu là bắt buộc'),
  end_date: z.string().min(1, 'Ngày kết thúc là bắt buộc'),
  days: z.coerce.number().min(0.1, 'Số ngày nghỉ tối thiểu là 0.1'),
  reason: z.string().optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  if (data.end_date && data.start_date && data.end_date < data.start_date) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['end_date'],
      message: 'Ngày kết thúc không được nhỏ hơn ngày bắt đầu.',
    });
  }
});

export type LeaveRequestFormValues = z.infer<typeof leaveRequestSchema>;

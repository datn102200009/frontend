import { z } from 'zod';

export const handleContractSchema = z.object({
  action: z.enum(['renew', 'renew_with_salary_change', 'terminate', 'defer']),
  new_salary_base: z.coerce.number().min(0, 'Lương mới không được âm').optional(),
  new_title: z.string().optional().or(z.literal('')),
  start_date: z.string().optional().or(z.literal('')),
  reason: z.string().optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  if (data.action === 'renew_with_salary_change') {
    if (data.new_salary_base === undefined || data.new_salary_base === null || data.new_salary_base <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['new_salary_base'],
        message: 'Lương mới phải lớn hơn 0',
      });
    }
  }
  if (data.action === 'terminate') {
    if (!data.reason || data.reason.trim().length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reason'],
        message: 'Lý do chấm dứt hợp đồng phải dài ít nhất 10 ký tự',
      });
    }
  }
});

export type HandleContractFormValues = z.infer<typeof handleContractSchema>;

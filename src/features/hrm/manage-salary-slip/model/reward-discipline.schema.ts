import { z } from 'zod';

export const rewardSchema = z.object({
  employee_id: z.string().optional().or(z.literal('')),
  reward_date: z.string().min(1, 'Ngày quyết định là bắt buộc'),
  reward_type: z.enum(['performance_bonus', 'initiative', 'holiday_bonus', 'other']),
  amount: z.coerce.number().min(0.01, 'Số tiền thưởng phải lớn hơn 0'),
  description: z.string().min(1, 'Mô tả khen thưởng là bắt buộc'),
});

export const disciplineSchema = z.object({
  employee_id: z.string().optional().or(z.literal('')),
  incident_date: z.string().min(1, 'Ngày sự việc là bắt buộc'),
  discipline_date: z.string().min(1, 'Ngày quyết định là bắt buộc'),
  discipline_type: z.enum(['reprimand', 'warning', 'salary_deduction', 'termination', 'other']),
  description: z.string().min(1, 'Nội dung vi phạm là bắt buộc'),
  penalty_amount: z.coerce.number().min(0, 'Số tiền phạt không được âm'),
  file_url: z.string().optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  if (data.discipline_type === 'salary_deduction') {
    if (data.penalty_amount <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['penalty_amount'],
        message: 'Số tiền phạt khấu trừ phải lớn hơn 0',
      });
    }
  }
});

export type RewardFormValues = z.infer<typeof rewardSchema>;
export type DisciplineFormValues = z.infer<typeof disciplineSchema>;

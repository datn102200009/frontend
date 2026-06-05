import { z } from 'zod';

export const initializeSalarySlipSchema = z.object({
  salary_period: z.string().regex(/^\d{4}-\d{2}$/, 'Kỳ lương không đúng định dạng YYYY-MM'),
});

export type InitializeSalarySlipValues = z.infer<typeof initializeSalarySlipSchema>;

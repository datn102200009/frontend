import { z } from 'zod';

export const contractSchema = z.object({
  contract_no: z.string().min(1, 'Số hợp đồng là bắt buộc'),
  contract_type: z.enum(['probation', 'definite_term', 'indefinite_term', 'other']),
  start_date: z.string().min(1, 'Ngày bắt đầu là bắt buộc'),
  end_date: z.string().optional().or(z.literal('')),
  note: z.string().optional().or(z.literal('')),
  file_url: z.string().optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  if (data.contract_type !== 'indefinite_term' && data.contract_type !== 'other') {
    if (!data.end_date || data.end_date === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['end_date'],
        message: 'Ngày kết thúc là bắt buộc cho loại hợp đồng này',
      });
      return;
    }
  }

  if (data.end_date && data.start_date && data.end_date <= data.start_date) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['end_date'],
      message: 'Ngày kết thúc phải sau ngày bắt đầu hợp đồng.',
    });
  }
});

export type ContractFormValues = z.infer<typeof contractSchema>;

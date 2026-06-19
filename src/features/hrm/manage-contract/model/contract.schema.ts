import { z } from 'zod';

export const contractSchema = z.object({
  contract_no: z.string().min(1, 'Số hợp đồng là bắt buộc'),
  contract_type: z.enum(['probation', 'definite_term', 'indefinite_term', 'other']),
  start_date: z.string().min(1, 'Ngày bắt đầu là bắt buộc'),
  end_date: z.string().optional().or(z.literal('')),
  note: z.string().optional().or(z.literal('')),
  file_url: z.string().optional().or(z.literal('')),
  salary_base: z.union([z.literal(''), z.coerce.number().min(0, 'Lương cơ bản không được âm')]).optional(),
  adjust_salary: z.boolean().optional(),
  new_salary_base: z.string().optional().or(z.literal('')),
  is_renewal: z.boolean().optional(),
}).superRefine((data, ctx) => {
  if (!data.is_renewal) {
    if (data.salary_base === undefined || data.salary_base === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['salary_base'],
        message: 'Lương cơ bản theo hợp đồng là bắt buộc',
      });
    }
  }

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

  if (data.adjust_salary) {
    if (!data.new_salary_base || data.new_salary_base.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['new_salary_base'],
        message: 'Mức lương mới là bắt buộc khi chọn điều chỉnh lương',
      });
    } else if (isNaN(Number(data.new_salary_base)) || Number(data.new_salary_base) <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['new_salary_base'],
        message: 'Mức lương mới phải là số dương hợp lệ',
      });
    }
  }
});

export type ContractFormValues = z.infer<typeof contractSchema>;

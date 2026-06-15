import { z } from 'zod';

export const employeeSchema = z.object({
  employee_id: z.string().min(1, 'Mã nhân viên là bắt buộc'),
  full_name: z.string().min(1, 'Họ tên là bắt buộc'),
  department: z.string().optional().or(z.literal('')),
  position_title: z.string().optional().or(z.literal('')),
  salary_base: z.coerce.number().min(0, 'Lương cơ bản không được âm'),
  email: z.string().email('Địa chỉ email không hợp lệ').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  gender: z.enum(['male', 'female', 'other']),
  date_of_birth: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  join_date: z.string().optional().or(z.literal('')),
  create_user: z.boolean(),
  username: z.string().optional().or(z.literal('')),
  password: z.string().optional().or(z.literal('')),
  role_id: z.string().optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  if (data.create_user) {
    if (!data.username || data.username.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['username'],
        message: 'Tên đăng nhập là bắt buộc khi tạo tài khoản User',
      });
    }
    if (!data.password || data.password.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['password'],
        message: 'Mật khẩu là bắt buộc khi tạo tài khoản User',
      });
    } else {
      const password = data.password;
      if (password.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['password'],
          message: 'Mật khẩu phải chứa ít nhất 8 ký tự',
        });
      }
      if (!/[A-Z]/.test(password)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['password'],
          message: 'Mật khẩu phải chứa ít nhất 1 chữ hoa',
        });
      }
      if (!/[a-z]/.test(password)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['password'],
          message: 'Mật khẩu phải chứa ít nhất 1 chữ thường',
        });
      }
      if (!/\d/.test(password)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['password'],
          message: 'Mật khẩu phải chứa ít nhất 1 chữ số',
        });
      }
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['password'],
          message: 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt',
        });
      }
    }
    if (!data.role_id || data.role_id.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['role_id'],
        message: 'Vai trò là bắt buộc khi tạo tài khoản User',
      });
    }
  }
});

export type EmployeeFormValues = z.infer<typeof employeeSchema>;

import { z } from 'zod';

export const purchaseOrderSchema = z.object({
  vendor_id: z.string().min(1, 'Nhà cung cấp là bắt buộc'),
  advance_paid_amount: z.coerce.number().min(0, 'Tiền cọc không được âm'),
  expected_delivery_date: z.string().min(1, 'Ngày giao dự kiến là bắt buộc'),
  lines: z.array(
    z.object({
      item_id: z.string().min(1, 'Linh kiện là bắt buộc'),
      quantity: z.coerce.number().positive('Số lượng phải lớn hơn 0'),
      unit_price: z.coerce.number().min(0, 'Đơn giá tối thiểu là 0'),
    })
  ).min(1, 'Cần ít nhất một linh kiện'),
}).superRefine((data, ctx) => {
  const total = data.lines.reduce((sum, line) => sum + (line.quantity * line.unit_price), 0);
  if (data.advance_paid_amount > total) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['advance_paid_amount'],
      message: 'Tiền cọc không vượt quá tổng giá trị đơn hàng',
    });
  }

  if (data.expected_delivery_date) {
    const getLocalDateString = () => {
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    if (data.expected_delivery_date < getLocalDateString()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['expected_delivery_date'],
        message: 'Ngày giao dự kiến phải lớn hơn hoặc bằng ngày hôm nay',
      });
    }
  }
});

export type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>;

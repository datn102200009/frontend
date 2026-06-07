import { z } from 'zod';

export const purchaseOrderSchema = z.object({
  vendor_id: z.string().min(1, 'Nhà cung cấp là bắt buộc'),
  advance_paid_amount: z.coerce.number().min(0, 'Tiền cọc không được âm'),
  expected_delivery_date: z.string().optional().or(z.literal('')),
  lines: z.array(
    z.object({
      item_id: z.string().min(1, 'Linh kiện là bắt buộc'),
      quantity: z.coerce.number().min(0.01, 'Số lượng tối thiểu là 0.01'),
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deliveryDate = new Date(data.expected_delivery_date);
    if (deliveryDate < today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['expected_delivery_date'],
        message: 'Ngày giao dự kiến phải lớn hơn hoặc bằng ngày hôm nay',
      });
    }
  }
});

export type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>;

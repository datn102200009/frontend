/**
 * Lấy số chữ số thập phân cho phép hiển thị và nhập liệu dựa theo Đơn vị tính (ĐVT/UOM).
 * 
 * - Đơn vị không thể chia lẻ (Cái, Bộ, Chiếc, Hộp, Thùng,...) -> 0 decimals.
 * - Đơn vị đo lường thông thường (Kg, Mét, Lít,...) -> 2 decimals.
 */
export function getDecimalsForUom(uomName?: string | null): number {
  if (!uomName) return 2; // Mặc định là 2 decimals nếu không có ĐVT
  const lowerName = uomName.toLowerCase().trim();
  
  // Các ĐVT không thể chia lẻ (chỉ nhận số nguyên)
  const integerUoms = [
    'cái', 'bộ', 'chiếc', 'hộp', 'thùng', 'cuộn', 'cặp', 'quyển', 'bao', 'can', 'chai', 'viên', 'tờ', 'gói', 'khay', 'vỉ'
  ];

  if (integerUoms.includes(lowerName)) {
    return 0;
  }

  return 2; // Mặc định với các đơn vị cân đo đong đếm như kg, lít, mét...
}

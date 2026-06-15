/**
 * Helper dùng chung để rút gọn hiển thị UUID/ID trên toàn dự án.
 * - shortId: hiển thị 8 ký tự đầu viết hoa; trả về '—' nếu rỗng.
 *   Thay thế pattern inline: id.slice(0, 8).toUpperCase().
 * - shortAssetCode: chuyên biệt cho FixedAsset — giữ nguyên mã do user
 *   nhập (vd: MOLD-001), chỉ rút gọn khi là UUID dạng FA-<uuid>.
 */

/**
 * UUID v4 có dạng xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (36 ký tự).
 * Pattern nhận biết UUID: chứa 4 dấu '-' và tổng độ dài >= 32.
 */
function isUuidLike(value: string): boolean {
  return value.length >= 32 && value.split('-').length - 1 >= 4;
}

export function shortId(id?: string | null): string {
  if (!id) return '—';
  return id.substring(0, 8).toUpperCase();
}

export function shortAssetCode(code?: string | null): string {
  if (!code) return '—';
  if (isUuidLike(code)) {
    return code.substring(0, 8).toUpperCase();
  }
  return code;
}

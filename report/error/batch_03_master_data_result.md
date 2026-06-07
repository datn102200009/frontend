# Batch_03_Master_Data — Test Report

- **Thời gian bắt đầu**: 2026-06-07 16:50:26
- **Thời gian chạy**: 32.3s
- **Kết quả**: ✅ 17 PASS | ❌ 0 FAIL | 🔴 0 BLOCKER

## Tất cả kết quả

| WF | Step | Status | Expected |
|-----|------|--------|----------|
| WF-03 | 1 | ✅ PASS | Truy cập /inventory thành công và Tab Sản Phẩm active mặc định |
| WF-03 | 2 | ✅ PASS | Xác nhận danh sách hiển thị đủ >= 18 sản phẩm (thực tế: 18) |
| WF-03 | 3 | ✅ PASS | Tìm kiếm 'Bóng đèn' hiển thị đúng TP_HQ01 và TP_LED01 |
| WF-03 | 4 | ✅ PASS | Tìm kiếm 'NVL_LED_02' hiển thị đúng sản phẩm 'Mạch Chip LED SMD2835' |
| WF-04 | 5 | ✅ PASS | Truy cập /suppliers và xác nhận hiển thị NCC001, NCC002, NCC003 |
| WF-04 | 6 | ✅ PASS | Submit form trống báo lỗi validation bắt buộc Mã và Tên |
| WF-04 | 7 | ✅ PASS | Tạo nhà cung cấp NCC_T_60187 thành công và hiển thị trong danh sách |
| WF-04 | 8 | ✅ PASS | Click Xem chi tiết NCC001 hiển thị đúng thông tin Sunrise và không sửa được mã |
| WF-04 | 9 | ✅ PASS | Click Chỉnh sửa NCC001 load form thành công |
| WF-04 | 10 | ✅ PASS | Chỉnh sửa số điện thoại NCC001 thành '0911111111' và lưu thành công |
| WF-05 | 11 | ✅ PASS | Truy cập /customers và xác nhận hiển thị KH001, KH002, KH003 |
| WF-05 | 12 | ✅ PASS | Xác nhận KH003 (GreenMart) đang bị khóa tín dụng trong modal chi tiết |
| WF-05 | 13 | ✅ PASS | Submit form trống báo lỗi validation bắt buộc Mã và Tên khách hàng |
| WF-05 | 14 | ✅ PASS | Tạo khách hàng mới KH_T_60187 thành công và hiển thị trong danh sách |
| WF-05 | 15 | ✅ PASS | Xem chi tiết KH001 hiển thị đúng thông tin Minh Anh và không sửa được mã |
| WF-05 | 16 | ✅ PASS | Click Chỉnh sửa KH001 load form thành công |
| WF-05 | 17 | ✅ PASS | Chỉnh sửa số điện thoại KH001 thành '0922222222' và lưu thành công |

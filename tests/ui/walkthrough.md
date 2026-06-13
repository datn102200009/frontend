# Walkthrough: Cập Nhật Bộ Kiểm Thử Playwright Dashboard (batch_02_dashboard.py)

Bộ kiểm thử Playwright cho trang Dashboard đã được viết lại hoàn toàn để phù hợp với giao diện Dashboard mới cải tiến (25 widgets đa dạng loại hình và 10 liên kết sidebar navigation).

## 1. Tóm tắt 25 Widgets Đã Kiểm Thử

| Step | Widget Key | Tiêu đề Widget | Loại Widget | Helper Hàm Sử Dụng | URL Đích |
|---|---|---|---|---|---|
| 2 | sales_today_revenue | Doanh thu hôm nay | line_chart | `test_line_chart_card` | `/sales?tab=orders` |
| 3 | sales_draft_orders | Đơn bán hàng nháp | kpi_list | `test_kpi_list_card` (money) | `/sales?tab=orders&status=draft` |
| 4 | sales_pending_credit_bypass | Đơn bán hàng chờ duyệt vượt hạn mức | kpi_list | `test_kpi_list_card` (money) | `/sales?tab=orders&status=pending_credit_approval` |
| 5 | sales_pending_fulfillment | Đơn bán hàng chờ giao hàng | kpi_list | `test_kpi_list_card` | `/inventory?tab=entries&status=draft` |
| 6 | purchasing_active_po_count | Đơn mua hàng hoạt động | kpi_list | `test_kpi_list_card` (money) | `/purchasing?tab=orders&status=pending` |
| 7 | purchasing_draft_orders | Đơn mua hàng nháp | kpi_list | `test_kpi_list_card` (money) | `/purchasing?tab=orders&status=draft` |
| 8 | purchasing_pending_delivery | Đơn mua hàng chờ nhận hàng | kpi_list | `test_kpi_list_card` | `/inventory?tab=entries&status=draft` |
| 9 | purchasing_pending_qc | Lô hàng chờ kiểm QC | kpi_list | `test_kpi_list_card` | `/purchasing?tab=shipment` |
| 10 | purchasing_pending_logistic_fees | Lô hàng chờ phân bổ chi phí | kpi_list | `test_kpi_list_card` | `/purchasing?tab=shipment` |
| 11 | purchasing_blocked_invoices | Hóa đơn mua bị chặn | kpi_list | `test_kpi_list_card` (money) | `/purchasing?tab=invoices&status=blocked` |
| 12 | inventory_pending_entry_count | Phiếu nhập kho chờ duyệt | kpi_list | `test_kpi_list_card` | `/inventory?tab=entries&status=draft` |
| 13 | inventory_low_stock | Theo dõi linh kiện | donut_chart | `test_donut_chart_card` | `/inventory?tab=ledger` |
| 14 | inventory_pending_entries | Yêu cầu chuyển kho chờ thực hiện | kpi_list (tabs) | `test_kpi_list_card` (test_tabs) | `/inventory?tab=entries&status=draft` |
| 15 | finance_cashflow_overview | Tổng quan & Xu hướng dòng tiền | cashflow_overview | `test_cashflow_overview_card` | `/finance` |
| 16 | finance_unpaid_purchase_invoices | Hóa đơn mua chưa thanh toán | donut_chart (Aging) | `test_aging_bar_chart_card` | `/finance?tab=ap&status=unpaid` |
| 17 | finance_unpaid_sales_invoices | Hóa đơn bán chưa thanh toán | donut_chart (Aging) | `test_aging_bar_chart_card` | `/sales?tab=invoices&status=unpaid` |
| 18 | finance_depreciation_status | Khấu hao tài sản cố định | kpi_list | `test_kpi_list_card` | `/finance/fixed-assets` |
| 19 | hrm_payroll_lifecycle_status | Bảng lương chờ duyệt & thanh toán | kpi_list | `test_kpi_list_card` (money) | `/hrm?tab=salary` |
| 20 | hrm_pending_leave_requests | Yêu cầu nghỉ phép chờ duyệt | kpi_list | `test_kpi_list_card` | `/hrm?tab=leave` |
| 21 | hrm_expiring_contracts | Hợp đồng lao động sắp hết hạn | kpi_list | `test_kpi_list_card` | `/hrm?tab=employees` |
| 22 | hrm_today_attendance_rate | Theo dõi vắng mặt | gauge | `test_gauge_card` | `/hrm?tab=attendance` |
| 23 | manufacturing_pending_wo_approval | Lệnh sản xuất chờ duyệt | kpi_list | `test_kpi_list_card` | `/bom?tab=wo&status=pending_approval` |
| 24 | manufacturing_active_wos | Lệnh sản xuất đang thực hiện | stacked_progress | `test_stacked_progress_card` | `/bom?tab=wo&status=in_progress` |
| 25 | manufacturing_pending_declarations | Lệnh sản xuất sắp trễ hạn | kpi_list | `test_kpi_list_card` | `/bom?tab=wo&status=in_progress` |
| 26 | manufacturing_pending_completion | Lệnh sản xuất chờ nghiệm thu | kpi_list | `test_kpi_list_card` | `/bom?tab=wo&status=in_progress` |

## 2. Các Helper Functions Mới Thiết Kế

Chúng tôi đã thiết kế các hàm test helper tổng quát để kiểm tra chính xác DOM structure của từng loại widget:

*   **`find_card(page, title)`**: Tìm card div chứa liên kết tiêu đề (`a[aria-label='Mở chi tiết: {title}']`) hoặc span tiêu đề tương ứng một cách chính xác, tăng timeout lên `5000ms` để đảm bảo an toàn.
*   **`test_kpi_list_card`**: 
    *   Hỗ trợ kiểm tra trạng thái trống (empty state "Không có hoạt động cần xử lý").
    *   Hỗ trợ kiểm tra Tab Filter (click 4 tab "Tất cả" / "Nhập 📥" / "Xuất 📤" / "Chuyển 🔄" và kiểm tra icon tương ứng, chờ loading overlay biến mất).
    *   Assert định dạng tiền tệ nếu có (`expect_money=True`).
    *   Kiểm tra click dòng đầu tiên và click title card để redirect về trang đích tương ứng.
*   **`test_line_chart_card`**: Kiểm tra SVG line chart, hover vùng tương tác (`rect[fill='transparent']`) để xuất hiện tooltip, kiểm tra nội dung tooltip chứa doanh thu/tiền tệ và click title.
*   **`test_cashflow_overview_card`**: Kiểm tra tổng quan dòng tiền ròng, tổng thu/chi, cột biểu đồ SVG, hover tương tác tooltip và click title.
*   **`test_donut_chart_card`**: Kiểm tra vòng tròn SVG donut, center value tổng số mặt hàng, danh sách legend và click title.
*   **`test_aging_bar_chart_card`**: Kiểm tra tổng dư nợ, vòng tròn SVG donut, legends 4 buckets và click title.
*   **`test_gauge_card`**: Kiểm tra vòng tròn biểu đồ tiến độ gauge SVG, hiển thị tỷ lệ %, hiển thị số người vắng và click title.
*   **`test_stacked_progress_card`**: Kiểm tra tiến độ phần trăm, thanh track/fill progress và click title.

## 3. Kết Quả Xác Minh Cuối Cùng

Đã thực hiện chạy kiểm thử thành công qua lệnh:
```bash
python datn_frontend/tests/ui/batch_02_dashboard.py
```

Kết quả:
*   **Tổng số Steps**: 36
*   **Kết quả**: **✅ 36 PASS | ❌ 0 FAIL | 🔴 0 BLOCKER**
*   **Thời gian chạy**: ~52.9s
*   **File Báo cáo chi tiết sinh tại**: [batch_02_dashboard_result.md](file:///E:/Code%20Project/datn/datn_frontend/report/error/batch_02_dashboard_result.md)

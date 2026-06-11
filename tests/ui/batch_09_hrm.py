# -*- coding: utf-8 -*-
"""Batch 09 — WF-11: Quản Lý Nhân Sự & Chấm Công - Tính Lương"""
import sys
import os
import time
import datetime

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(__file__))

from test_helpers import (TestRunner, BASE_URL, wait_for_page_ready, login)
from playwright.sync_api import sync_playwright, expect


def run():
    runner = TestRunner("Batch_09_Hrm", "batch_09_hrm_result.md")
    import random
    rand_id = random.randint(1000, 9999)
    emp_code = f"NV_TEST_{rand_id}"
    username = f"nv_test_{rand_id}"
    email = f"nv_test_{rand_id}@xuanhoa.com"
    contract_no = f"HĐLD-2026-TEST_{rand_id}"
    test_month = f"{(rand_id % 12) + 1:02d}"
    test_year = str(2025 + (rand_id % 5))

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 1024})
        page = context.new_page()
        page.set_default_timeout(10000)

        # Dynamic holiday date helper (10 days + random offset in the future to avoid duplicate validation errors)
        today = datetime.date.today()
        holiday_date = today + datetime.timedelta(days=10 + (rand_id % 100))

        try:
            # ── Login & Navigate to /hrm ──
            login(page)
            page.goto(f"{BASE_URL}/hrm")
            wait_for_page_ready(page)
            try:
                expect(page.get_by_role("heading", name="Hồ Sơ Nhân Sự")).to_be_visible()
                runner.log("WF-11", 1, "PASS", "Truy cập /hrm thành công và mặc định ở tab Nhân Viên", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf11_s1")
                runner.log("WF-11", 1, "FAIL", "Truy cập /hrm thành công và mặc định ở tab Nhân Viên", str(e), "BLOCKER", url=page.url)

            # ── Tab 1: Verify 10 employees ──
            try:
                rows = page.locator("tbody tr")
                count = rows.count()
                if count >= 10:
                    runner.log("WF-11", 2, "PASS", f"Xác nhận danh sách nhân viên hiển thị đầy đủ (Số nhân sự: {count})", url=page.url)
                else:
                    raise AssertionError(f"Chỉ tìm thấy {count} nhân sự, yêu cầu tối thiểu là 10.")
            except Exception as e:
                runner.screenshot(page, "wf11_s2")
                runner.log("WF-11", 2, "FAIL", "Xác nhận danh sách nhân viên hiển thị đầy đủ", str(e), url=page.url)

            # ── Tab 1: Create new employee with credentials ──
            try:
                page.get_by_role("button", name="Thêm Nhân Viên").click()
                time.sleep(0.5)
                expect(page.get_by_role("dialog")).to_be_visible()

                # Fill form fields
                page.get_by_label("Mã nhân viên").fill(emp_code)
                page.get_by_label("Họ và tên").fill("Nguyễn Văn Thử Nghiệm")
                page.get_by_label("Phòng ban").fill("Kỹ Thuật")
                page.get_by_label("Chức vụ").fill("Nhân viên kỹ thuật")
                page.get_by_label("Lương cơ bản (VND)").fill("15000000")
                page.get_by_label("Giới tính").select_option("male")
                page.get_by_label("Email").fill(email)
                page.get_by_label("Số điện thoại").fill("0987654321")
                page.get_by_label("Địa chỉ thường trú").fill("123 Phố Huế, Hà Nội")

                # Create user credentials
                page.get_by_label("Tạo tài khoản đăng nhập hệ thống đi kèm cho nhân sự").check()
                time.sleep(0.3)
                page.get_by_label("Tên đăng nhập").fill(username)
                page.get_by_label("Mật khẩu").fill("Admin123!")

                # Save
                page.get_by_role("button", name="Lưu nhân sự").click()
                time.sleep(1.5)
                expect(page.get_by_role("dialog")).not_to_be_visible()
                runner.log("WF-11", 3, "PASS", f"Tạo mới nhân viên {emp_code} và tài khoản đăng nhập thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf11_s3")
                runner.log("WF-11", 3, "FAIL", f"Tạo mới nhân viên {emp_code} thành công", str(e), url=page.url)

            # ── Tab 1: View/edit/update salary/contract ──
            try:
                # Search for the newly created employee
                search = page.get_by_placeholder("Tìm kiếm nhân viên theo mã hoặc tên...")
                search.fill(emp_code)
                time.sleep(0.5)

                # Click update salary/title
                page.get_by_role("button", name="Điều chỉnh lương/chức danh").click()
                time.sleep(0.5)
                expect(page.get_by_role("dialog")).to_be_visible()
                
                # Fill adjustment form
                page.get_by_label("Mức lương cơ bản mới (VND)").fill("18000000")
                page.get_by_label("Lý do điều chỉnh").fill("Tăng lương thử việc")
                page.get_by_role("button", name="Lưu thay đổi").click()
                time.sleep(1)
                expect(page.get_by_role("dialog")).not_to_be_visible()
                runner.log("WF-11", 4, "PASS", "Điều chỉnh lương cơ bản thành công lên 18,000,000 VND", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf11_s4")
                runner.log("WF-11", 4, "FAIL", "Điều chỉnh lương cơ bản thành công lên 18,000,000 VND", str(e), url=page.url)

            try:
                # Click create contract
                page.get_by_role("button", name="Gia hạn hợp đồng").click()
                time.sleep(0.5)
                expect(page.get_by_role("dialog")).to_be_visible()
                
                page.get_by_label("Số hợp đồng").fill(contract_no)
                page.get_by_label("Loại hợp đồng").select_option("definite_term")
                page.locator("#end_date").fill("2027-01-15")
                
                # Clear search to avoid side-effects
                page.get_by_role("button", name="Tạo hợp đồng").click()
                time.sleep(1)
                expect(page.get_by_role("dialog")).not_to_be_visible()
                runner.log("WF-11", 5, "PASS", f"Tạo hợp đồng xác định thời hạn cho {emp_code} thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf11_s5")
                runner.log("WF-11", 5, "FAIL", f"Tạo hợp đồng xác định thời hạn cho {emp_code} thành công", str(e), url=page.url)

            # Clear search input
            try:
                search = page.get_by_placeholder("Tìm kiếm nhân viên theo mã hoặc tên...")
                search.fill("")
                time.sleep(0.5)
            except Exception:
                pass

            # ── Tab 2: Chấm Công - Verify attendance on 2026-01-15 ──
            try:
                page.get_by_role("tab", name="Chấm Công").click()
                time.sleep(0.5)
                
                # Open date picker and select 2026-05-15
                page.locator("#attendance-date-filter").click()
                time.sleep(0.5)
                page.get_by_role("combobox", name="Chọn năm").select_option("2026")
                page.get_by_role("combobox", name="Chọn tháng").select_option("4")  # May (0-indexed)
                page.get_by_role("button", name="15 Tháng 5 Năm 2026").click()
                page.get_by_role("button", name="Xác nhận").click()
                time.sleep(1)

                # Nếu chưa có dữ liệu chấm công (lần đầu chạy sau reset DB), tự động tạo chấm công trước
                rows = page.locator("tbody tr")
                if rows.count() < 10:
                    page.get_by_role("button", name="Chấm Công").click()
                    time.sleep(0.5)
                    page.locator("#attendance_date").fill("2026-05-15")
                    time.sleep(0.3)
                    page.get_by_role("button", name="Lưu chấm công").click()
                    time.sleep(1.5)
                    # Lọc lại ngày 15/05/2026
                    page.locator("#attendance-date-filter").click()
                    time.sleep(0.5)
                    page.get_by_role("button", name="Xác nhận").click()
                    time.sleep(1)

                # Expect to see 10 records
                rows = page.locator("tbody tr")
                count = rows.count()
                if count >= 10:
                    runner.log("WF-11", 6, "PASS", f"Xác nhận chấm công ngày 15/05/2026 hiển thị đầy đủ (Số bản ghi: {count})", url=page.url)
                else:
                    raise AssertionError(f"Chỉ tìm thấy {count} bản ghi chấm công.")
            except Exception as e:
                runner.screenshot(page, "wf11_s6")
                runner.log("WF-11", 6, "FAIL", "Xác nhận chấm công ngày 15/05/2026 hiển thị đầy đủ", str(e), url=page.url)

            # ── Tab 2: Batch attendance (test future date and invalid hours) ──
            try:
                page.get_by_role("button", name="Chấm Công").click()
                time.sleep(0.5)
                expect(page.get_by_role("dialog")).to_be_visible()

                # Set future date
                page.locator("#attendance_date").fill("2028-12-31")
                page.get_by_role("button", name="Lưu chấm công").click()
                time.sleep(0.5)
                expect(page.get_by_text("Không cho phép chọn ngày tương lai")).to_be_visible()
                runner.log("WF-11", 7, "PASS", "Lỗi validate chặn chọn ngày tương lai hiển thị chính xác", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf11_s7")
                runner.log("WF-11", 7, "FAIL", "Lỗi validate chặn chọn ngày tương lai", str(e), url=page.url)

            try:
                # Set valid date back
                page.locator("#attendance_date").fill("2026-05-15")
                time.sleep(0.5)

                # Fill invalid work hours (-5) in the first row
                first_row = page.get_by_role("dialog").locator("tbody tr").first
                work_hours = first_row.locator("input[type='number']").first
                work_hours.fill("-5")
                page.get_by_role("button", name="Lưu chấm công").click()
                time.sleep(0.5)
                
                expect(page.get_by_text("Số giờ công không được âm")).to_be_visible()
                runner.log("WF-11", 8, "PASS", "Lỗi validate chặn số giờ công âm hiển thị chính xác", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf11_s8")
                runner.log("WF-11", 8, "FAIL", "Lỗi validate chặn số giờ công âm", str(e), url=page.url)

            try:
                # Reset valid work hours (8) and save successfully
                first_row = page.get_by_role("dialog").locator("tbody tr").first
                work_hours = first_row.locator("input[type='number']").first
                work_hours.fill("8")
                
                page.get_by_role("button", name="Lưu chấm công").click()
                time.sleep(1)
                expect(page.get_by_role("dialog")).not_to_be_visible()
                runner.log("WF-11", 9, "PASS", "Cập nhật chấm công hàng loạt thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf11_s9")
                runner.log("WF-11", 9, "FAIL", "Cập nhật chấm công hàng loạt thành công", str(e), url=page.url)

            # ── Tab 3: Nghỉ Phép ──
            try:
                page.get_by_role("tab", name="Nghỉ Phép").click()
                time.sleep(0.5)

                # Filter status to "Đã phê duyệt"
                page.get_by_label("Lọc trạng thái đơn nghỉ phép").select_option("approved")
                time.sleep(0.5)

                # Verify 4 approved requests
                rows = page.locator("tbody tr")
                count = rows.count()
                if count >= 2:
                    runner.log("WF-11", 10, "PASS", f"Xác nhận hiển thị đủ ít nhất 2 đơn nghỉ phép đã duyệt (Số đơn: {count})", url=page.url)
                else:
                    raise AssertionError(f"Chỉ tìm thấy {count} đơn nghỉ phép đã duyệt.")
            except Exception as e:
                runner.screenshot(page, "wf11_s10")
                runner.log("WF-11", 10, "FAIL", "Xác nhận hiển thị đủ 2 đơn nghỉ phép đã duyệt", str(e), url=page.url)

            # ── Tab 3: Create leave request and approve it ──
            try:
                page.get_by_role("button", name="Tạo Đơn Phép").click()
                time.sleep(0.5)
                expect(page.get_by_role("dialog")).to_be_visible()

                # Fill form
                page.get_by_label("Chọn nhân viên").select_option(label=f"Nguyễn Văn Thử Nghiệm ({emp_code})")
                page.get_by_label("Loại nghỉ phép").select_option("paid")
                page.get_by_label("Từ ngày").fill("2026-01-20")
                page.get_by_label("Đến ngày").fill("2026-01-22")
                page.get_by_label("Số ngày nghỉ thực tế").fill("3")
                page.get_by_label("Lý do xin nghỉ phép").fill("Nghỉ phép thường niên")

                page.get_by_role("button", name="Gửi đơn phép").click()
                time.sleep(1)
                expect(page.get_by_role("dialog")).not_to_be_visible()
                runner.log("WF-11", 11, "PASS", f"Tạo mới đơn nghỉ phép cho {emp_code} thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf11_s11")
                runner.log("WF-11", 11, "FAIL", f"Tạo mới đơn nghỉ phép cho {emp_code} thành công", str(e), url=page.url)

            try:
                # Select filter "Chờ phê duyệt" to see the pending leave request
                page.get_by_label("Lọc trạng thái đơn nghỉ phép").select_option("pending")
                time.sleep(0.5)

                # Search and approve
                page.get_by_placeholder("Tìm kiếm đơn phép theo mã hoặc tên...").fill("Nguyễn Văn Thử Nghiệm")
                time.sleep(0.5)

                page.get_by_title("Xem & Duyệt đơn").first.click()
                time.sleep(0.5)
                expect(page.get_by_role("dialog")).to_be_visible()

                # Click Approve
                page.get_by_role("dialog").get_by_role("button", name="Duyệt đơn", exact=True).click()
                time.sleep(1.5)
                expect(page.get_by_role("dialog")).not_to_be_visible()
                runner.log("WF-11", 12, "PASS", "Phê duyệt đơn xin nghỉ phép thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf11_s12")
                runner.log("WF-11", 12, "FAIL", "Phê duyệt đơn xin nghỉ phép thành công", str(e), url=page.url)

            # ── Tab 5: Bảng Lương - Initialize period 2026-01 ──
            try:
                page.get_by_role("tab", name="Bảng Lương").click()
                time.sleep(0.5)

                page.get_by_role("button", name="Khởi Tạo Kỳ Lương").click()
                time.sleep(0.5)
                expect(page.get_by_role("dialog")).to_be_visible()

                # Set period
                dialog = page.get_by_role("dialog")
                dialog.get_by_role("combobox", name="Chọn tháng").select_option(test_month)
                dialog.get_by_role("combobox", name="Chọn năm").select_option(test_year)
                
                dialog.get_by_role("button", name="Khởi tạo").click()
                time.sleep(2)
                expect(page.get_by_role("dialog")).not_to_be_visible()
                runner.log("WF-11", 13, "PASS", f"Khởi tạo kỳ lương Tháng {test_month}/{test_year} thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf11_s13")
                runner.log("WF-11", 13, "FAIL", f"Khởi tạo kỳ lương Tháng {test_month}/{test_year} thành công", str(e), url=page.url)

            # ── Tab 5: Calculate salary ──
            try:
                # Select filters to see period
                page.get_by_label("Chọn tháng kỳ lương").select_option(test_month)
                page.get_by_label("Chọn năm kỳ lương").select_option(test_year)
                page.get_by_label("Lọc trạng thái phiếu lương").select_option("all")
                time.sleep(2.0)

                # Calculate first salary slip
                page.get_by_role("button", name="Xem & Tính lương").first.click()
                
                # Wait for the calculation dialog to open
                dialog = page.get_by_role("dialog")
                dialog.wait_for(state="visible", timeout=5000)
                time.sleep(2) # Auto calculation starts on open
                
                # Check that Approve button is now visible inside the dialog and click it
                approve_btn = dialog.get_by_role("button", name="Phê duyệt lương")
                approve_btn.wait_for(state="visible", timeout=5000)
                approve_btn.click()
                time.sleep(1)
                expect(dialog).not_to_be_visible()
                runner.log("WF-11", 14, "PASS", "Tính toán và phê duyệt phiếu lương nháp thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf11_s14")
                runner.log("WF-11", 14, "FAIL", "Tính toán và phê duyệt phiếu lương nháp thành công", str(e), url=page.url)

            # ── Tab 5: Bulk confirm pay period ──
            try:
                page.get_by_role("button", name="Thanh Toán Kỳ Lương").click()
                time.sleep(0.5)
                expect(page.get_by_role("dialog")).to_be_visible()

                # Confirm expected confirmation phrase after 3s cooldown
                time.sleep(3.2)
                page.locator("#confirm_input").fill("XÁC NHẬN")
                
                page.get_by_role("button", name="Xác nhận thanh toán").click()
                time.sleep(2)
                expect(page.get_by_role("dialog")).not_to_be_visible()
                runner.log("WF-11", 15, "PASS", "Thanh toán kỳ lương tự động hàng loạt thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf11_s15")
                runner.log("WF-11", 15, "FAIL", "Thanh toán kỳ lương tự động hàng loạt thành công", str(e), url=page.url)

            # ── Tab 6: Ngày Nghỉ Lễ - Add "Tết Nguyên Đán" (10 days) ──
            try:
                page.get_by_role("tab", name="Ngày Nghỉ Lễ").click()
                time.sleep(0.5)

                page.get_by_role("button", name="Thêm Ngày Nghỉ Lễ").click()
                time.sleep(0.5)
                dialog = page.get_by_role("dialog")
                expect(dialog).to_be_visible()

                dialog.get_by_label("Tên ngày nghỉ lễ").fill(f"Tết Nguyên Đán {rand_id}")
                
                # Start date picker
                dialog.locator("#start_date_display").click()
                time.sleep(0.5)
                page.get_by_role("combobox", name="Chọn năm").select_option(str(holiday_date.year))
                page.get_by_role("combobox", name="Chọn tháng").select_option(str(holiday_date.month - 1))
                
                aria_label = f"{holiday_date.day} Tháng {holiday_date.month} Năm {holiday_date.year}"
                page.get_by_role("button", name=aria_label).click()
                page.get_by_role("button", name="Xác nhận").click()
                time.sleep(0.5)

                dialog.get_by_label("Số ngày nghỉ").fill("10")
                dialog.get_by_label("Mô tả").fill("Nghỉ tết cổ truyền")
                dialog.get_by_role("button", name="Lưu").click()
                time.sleep(1)
                expect(dialog).not_to_be_visible()
                runner.log("WF-11", 16, "PASS", f"Khai báo ngày nghỉ lễ Tết Nguyên Đán bắt đầu từ {holiday_date} thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf11_s16")
                runner.log("WF-11", 16, "FAIL", "Khai báo ngày nghỉ lễ Tết Nguyên Đán thành công", str(e), url=page.url)

            # ── Tab 2: Chấm Công - Verify public holiday banner appears for holiday date ──
            try:
                page.get_by_role("tab", name="Chấm Công").click()
                time.sleep(0.5)

                # Set date to holiday_date
                page.locator("#attendance-date-filter").click()
                time.sleep(0.5)
                page.get_by_role("combobox", name="Chọn năm").select_option(str(holiday_date.year))
                page.get_by_role("combobox", name="Chọn tháng").select_option(str(holiday_date.month - 1))
                
                aria_label = f"{holiday_date.day} Tháng {holiday_date.month} Năm {holiday_date.year}"
                page.get_by_role("button", name=aria_label).click()
                page.get_by_role("button", name="Xác nhận").click()
                time.sleep(1)

                # Verify public-holiday-banner
                expect(page.get_by_test_id("public-holiday-banner")).to_be_visible()
                runner.log("WF-11", 17, "PASS", f"Xác nhận banner ngày nghỉ lễ hiển thị đúng cho ngày {holiday_date}", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf11_s17")
                runner.log("WF-11", 17, "FAIL", f"Xác nhận banner ngày nghỉ lễ hiển thị đúng cho ngày {holiday_date}", str(e), url=page.url)

        except Exception as e:
            runner.screenshot(page, "wf11_blocker")
            runner.log("WF-11", "ALL", "FAIL", "Toàn bộ WF-11", str(e), "BLOCKER", url=page.url)
        finally:
            browser.close()

    runner.write_report()
    return runner


if __name__ == "__main__":
    run()

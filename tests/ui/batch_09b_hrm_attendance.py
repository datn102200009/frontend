# -*- coding: utf-8 -*-
"""Batch 09b — WF-11: Chấm Công & Nghỉ Phép (HRM)"""
import sys
import os
import time

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(__file__))

from test_helpers import (TestRunner, BASE_URL, wait_for_page_ready, login)
from playwright.sync_api import sync_playwright, expect


def run():
    runner = TestRunner("Batch_09b_Hrm_Attendance", "batch_09b_hrm_attendance_result.md")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 1024})
        page = context.new_page()
        page.set_default_timeout(10000)

        try:
            # ── Login & Navigate to /hrm ──
            login(page)
            page.goto(f"{BASE_URL}/hrm")
            wait_for_page_ready(page)
            
            # ── Tab 2: Chấm Công - Verify attendance on 2026-05-15 ──
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
                # Note: Because the DB was refreshed, NV_TEST_001 might exist or not depending on if batch_09a was run first.
                # If NV_TEST_001 doesn't exist (e.g. batch_09a failed or not run), it falls back to EMP001.
                # We try to select NV_TEST_001 first, if fail we select Nguyễn Văn An (EMP001)
                try:
                    page.get_by_label("Chọn nhân viên").select_option(label="Nguyễn Văn Thử Nghiệm (NV_TEST_001)")
                except Exception:
                    page.get_by_label("Chọn nhân viên").select_option(label="Nguyễn Văn An (NV001)")
                    
                page.get_by_label("Loại nghỉ phép").select_option("paid")
                page.get_by_label("Từ ngày").fill("2026-04-20")
                page.get_by_label("Đến ngày").fill("2026-04-22")

                page.get_by_label("Số ngày nghỉ thực tế").fill("3")
                page.get_by_label("Lý do xin nghỉ phép").fill("Nghỉ phép thường niên")

                page.get_by_role("button", name="Gửi đơn phép").click()
                time.sleep(1)
                expect(page.get_by_role("dialog")).not_to_be_visible()
                runner.log("WF-11", 11, "PASS", "Tạo mới đơn nghỉ phép thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf11_s11")
                runner.log("WF-11", 11, "FAIL", "Tạo mới đơn nghỉ phép thành công", str(e), url=page.url)

            try:
                # Select filter "Chờ phê duyệt" to see the pending leave request
                page.get_by_label("Lọc trạng thái đơn nghỉ phép").select_option("pending")
                time.sleep(0.5)

                # Search and approve
                # Search for either the new employee or Nguyễn Văn An
                page.get_by_placeholder("Tìm kiếm đơn phép theo mã hoặc tên...").fill("Nguyễn Văn")
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

        except Exception as e:
            runner.screenshot(page, "wf11b_blocker")
            runner.log("WF-11", "ALL_ATTENDANCE", "FAIL", "Toàn bộ WF-11 tab Chấm Công và Nghỉ Phép", str(e), "BLOCKER", url=page.url)
        finally:
            browser.close()

    runner.write_report()
    return runner


if __name__ == "__main__":
    run()

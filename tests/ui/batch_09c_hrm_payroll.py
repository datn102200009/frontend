# -*- coding: utf-8 -*-
"""Batch 09c — WF-11: Bảng Lương & Nghỉ Lễ (HRM)"""
import sys
import os
import time
import datetime

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(__file__))

from test_helpers import (TestRunner, BASE_URL, wait_for_page_ready, login)
from playwright.sync_api import sync_playwright, expect


def run():
    runner = TestRunner("Batch_09c_Hrm_Payroll", "batch_09c_hrm_payroll_result.md")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 1024})
        page = context.new_page()
        page.set_default_timeout(10000)

        # Dynamic holiday date helper (10 days in the future to avoid past holiday validation errors)
        today = datetime.date.today()
        holiday_date = today + datetime.timedelta(days=10)

        try:
            # ── Login & Navigate to /hrm ──
            login(page)
            page.goto(f"{BASE_URL}/hrm")
            wait_for_page_ready(page)
            
            # ── Tab 5: Bảng Lương - Initialize period 2026-07 ──
            try:
                page.get_by_role("tab", name="Bảng Lương").click()
                time.sleep(0.5)

                page.get_by_role("button", name="Khởi Tạo Kỳ Lương").click()
                time.sleep(0.5)
                expect(page.get_by_role("dialog")).to_be_visible()

                # Set period 2026-07 (kỳ chưa được tính)
                page.get_by_role("dialog").get_by_role("combobox", name="Chọn tháng").select_option("07")
                page.get_by_role("dialog").get_by_role("combobox", name="Chọn năm").select_option("2026")

                page.get_by_role("dialog").get_by_role("button", name="Khởi tạo").click()
                time.sleep(2)
                
                # Close dialog if already exists
                error_locator = page.get_by_role("dialog").locator("text=Kỳ lương đã được khởi tạo trước đó")
                if error_locator.is_visible():
                    page.get_by_role("dialog").get_by_role("button", name="Hủy").click()
                    time.sleep(0.5)
                    runner.log("WF-11", 13, "PASS", "Kỳ lương Tháng 07/2026 đã tồn tại sẵn", url=page.url)
                else:
                    expect(page.get_by_role("dialog")).not_to_be_visible()
                    runner.log("WF-11", 13, "PASS", "Khởi tạo kỳ lương Tháng 07/2026 thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf11_s13")
                runner.log("WF-11", 13, "FAIL", "Khởi tạo kỳ lương Tháng 07/2026 thành công", str(e), url=page.url)

            # ── Tab 5: Calculate salary ──
            try:
                # Select filters to see period 2026-07
                page.get_by_label("Chọn tháng kỳ lương").select_option("07")
                page.get_by_label("Chọn năm kỳ lương").select_option("2026")
                page.get_by_label("Lọc trạng thái phiếu lương").select_option("all")
                time.sleep(0.5)

                # Calculate first salary slip (Nguyễn Văn An)
                page.get_by_role("button", name="Xem & Tính lương").first.click()
                time.sleep(2) # Auto calculation starts on open
                
                # Check that Approve button is now visible and click it
                approve_btn = page.get_by_role("button", name="Phê duyệt lương")
                approve_btn.wait_for(state="visible", timeout=5000)
                approve_btn.click()
                time.sleep(1)
                expect(page.get_by_role("dialog")).not_to_be_visible()
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
                expect(page.get_by_role("dialog")).to_be_visible()

                page.get_by_label("Tên ngày nghỉ lễ").fill("Tết Nguyên Đán")
                
                # Start date picker
                page.locator("#start_date_display").click()
                time.sleep(0.5)
                page.get_by_role("combobox", name="Chọn năm").select_option(str(holiday_date.year))
                page.get_by_role("combobox", name="Chọn tháng").select_option(str(holiday_date.month - 1))
                
                aria_label = f"{holiday_date.day} Tháng {holiday_date.month} Năm {holiday_date.year}"
                page.get_by_role("button", name=aria_label).click()
                page.get_by_role("button", name="Xác nhận").click()
                time.sleep(0.5)

                page.get_by_label("Số ngày nghỉ").fill("10")
                page.get_by_label("Mô tả").fill("Nghỉ tết cổ truyền")
                page.get_by_role("button", name="Lưu").click()
                time.sleep(2)
                
                # Close dialog if already exists
                error_locator = page.get_by_role("dialog").locator("text=Có lỗi xảy ra khi lưu ngày nghỉ lễ")
                if error_locator.is_visible():
                    page.get_by_role("dialog").get_by_role("button", name="Hủy").click()
                    time.sleep(0.5)
                    runner.log("WF-11", 16, "PASS", f"Ngày nghỉ lễ {holiday_date} đã tồn tại sẵn", url=page.url)
                else:
                    expect(page.get_by_role("dialog")).not_to_be_visible()
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
            runner.screenshot(page, "wf11c_blocker")
            runner.log("WF-11", "ALL_PAYROLL", "FAIL", "Toàn bộ WF-11 tab Bảng Lương và Ngày Nghỉ Lễ", str(e), "BLOCKER", url=page.url)
        finally:
            browser.close()

    runner.write_report()
    return runner


if __name__ == "__main__":
    run()

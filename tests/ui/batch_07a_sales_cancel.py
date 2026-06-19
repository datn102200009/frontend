# -*- coding: utf-8 -*-
"""Batch 07a — WF-09: Hủy Đơn Bán Hàng & Phê Duyệt"""
import sys
import os
import time
import random

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(__file__))

from test_helpers import (TestRunner, BASE_URL, wait_for_page_ready, login, dismiss_all_toasts)
from playwright.sync_api import sync_playwright, expect


def run():
    runner = TestRunner("Batch_07a_Sales_Cancel", "batch_07a_sales_cancel_result.md")
    rand_id = random.randint(1000, 9999)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 1024})
        page = context.new_page()
        page.set_default_timeout(10000)

        try:
            # ── Login & Navigate to /sales ──
            login(page)
            page.goto(f"{BASE_URL}/sales")
            wait_for_page_ready(page)

            # ── Step 1: Tạo + duyệt SO mới thành công ──
            try:
                page.get_by_role("button", name="Thêm Đơn Bán").click()
                time.sleep(0.5)
                expect(page.get_by_role("heading", name="Thêm Đơn Bán Hàng Mới")).to_be_visible()

                # Select customer KH001 (not locked) and item TP_HQ01
                page.locator("select").nth(1).select_option(label="Công ty TNHH Thiết bị Điện & Chiếu sáng Minh Anh (KH001)")
                page.locator("select").nth(2).select_option(label="Bóng đèn Huỳnh Quang 1m2 36W (TP_HQ01)")
                page.get_by_role("spinbutton").nth(0).fill("10")
                page.get_by_role("spinbutton").nth(1).fill("100000")

                page.get_by_role("button", name="Tạo Đơn Hàng").click()
                time.sleep(1.5)
                expect(page.get_by_role("dialog")).not_to_be_visible()

                # Open the draft SO (first in the list)
                page.get_by_role("row").filter(has_text="Minh Anh").filter(has_text="Nháp").first.get_by_title("Xem chi tiết").click()
                time.sleep(0.5)

                # Approve it
                page.get_by_role("button", name="Duyệt Đơn").click()
                time.sleep(1.5)
                dismiss_all_toasts(page)

                # Kiểm tra xem có bị khóa tín dụng hay không (do công nợ vượt hạn mức)
                row = page.get_by_role("row").filter(has_text="Minh Anh").first
                if row.get_by_text("Chờ duyệt tín dụng").is_visible():
                    row.get_by_title("Xem chi tiết").click()
                    time.sleep(0.5)
                    page.get_by_role("button", name="Duyệt tín dụng đặc cách").click()
                    time.sleep(1.5)
                    dismiss_all_toasts(page)

                # Verify status is active
                row = page.get_by_role("row").filter(has_text="Minh Anh").first
                expect(row.get_by_text("Đang hoạt động")).to_be_visible()

                runner.log("WF-09", 1, "PASS", "Tạo và phê duyệt đơn bán hàng SO mới thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "step1_fail")
                runner.log("WF-09", 1, "FAIL", "Tạo và phê duyệt đơn bán hàng SO mới thành công", str(e), url=page.url)
            finally:
                close_btn = page.get_by_role("button", name="Đóng")
                if close_btn.count() > 0 and close_btn.last.is_visible():
                    close_btn.last.click()
                    time.sleep(0.5)

            # ── Step 2: Hủy SO đã phê duyệt thành công (Happy Case) ──
            try:
                # Open approved SO details
                page.get_by_title("Xem chi tiết").first.click()
                time.sleep(0.5)

                page.get_by_role("button", name="Hủy Đơn").click()
                time.sleep(0.5)
                expect(page.get_by_role("dialog", name="Xác nhận hủy")).to_be_visible()

                # Click confirm "Xác nhận" in ConfirmModal
                page.get_by_role("button", name="Xác nhận").click()
                time.sleep(1.5)
                expect(page.get_by_role("dialog", name="Xác nhận hủy")).not_to_be_visible()

                # Verify status changes to "Đã hủy"
                row = page.get_by_role("row").filter(has_text="Minh Anh").first
                expect(row.get_by_text("Đã hủy")).to_be_visible()

                runner.log("WF-09", 2, "PASS", "Hủy đơn bán hàng SO ở trạng thái Đang hoạt động thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "step2_fail")
                runner.log("WF-09", 2, "FAIL", "Hủy đơn bán hàng SO ở trạng thái Đang hoạt động thành công", str(e), url=page.url)
            finally:
                close_btn = page.get_by_role("button", name="Đóng")
                if close_btn.count() > 0 and close_btn.last.is_visible():
                    close_btn.last.click()
                    time.sleep(0.5)

            # ── Step 3: Hủy SO ở trạng thái Nháp (Fail Case) ──
            try:
                # Create a new draft SO
                page.get_by_role("button", name="Thêm Đơn Bán").click()
                time.sleep(0.5)
                page.locator("select").nth(1).select_option(label="Công ty TNHH Thiết bị Điện & Chiếu sáng Minh Anh (KH001)")
                page.locator("select").nth(2).select_option(label="Bóng đèn Huỳnh Quang 1m2 36W (TP_HQ01)")
                page.get_by_role("spinbutton").nth(0).fill("5")
                page.get_by_role("spinbutton").nth(1).fill("100000")
                page.get_by_role("button", name="Tạo Đơn Hàng").click()
                time.sleep(1)
                dismiss_all_toasts(page)

                # Open the draft SO form (click Chỉnh sửa)
                page.get_by_title("Xem chi tiết").first.click()
                time.sleep(0.5)

                # Verify button "Hủy Đơn" is NOT visible
                btn = page.get_by_role("button", name="Hủy Đơn")
                expect(btn).not_to_be_visible()
                runner.log("WF-09", 3, "PASS", "Không hiển thị nút Hủy Đơn cho đơn bán hàng nháp (Draft)", url=page.url)
            except Exception as e:
                runner.screenshot(page, "step3_fail")
                runner.log("WF-09", 3, "FAIL", "Không hiển thị nút Hủy Đơn cho đơn bán hàng nháp (Draft)", str(e), url=page.url)
            finally:
                close_btn = page.get_by_role("button", name="Đóng")
                if close_btn.count() > 0 and close_btn.last.is_visible():
                    close_btn.last.click()
                    time.sleep(0.5)

            # ── Step 4: Hủy SO đã hủy (Fail Case) ──
            try:
                # Find the cancelled SO (Minh Anh, second row or filter)
                row = page.get_by_role("row").filter(has_text="Minh Anh").nth(1)
                row.get_by_title("Xem chi tiết").click()
                time.sleep(0.5)

                # Verify button "Hủy Đơn" is NOT visible
                btn = page.get_by_role("button", name="Hủy Đơn")
                expect(btn).not_to_be_visible()
                runner.log("WF-09", 4, "PASS", "Không hiển thị nút Hủy Đơn cho đơn bán hàng đã hủy", url=page.url)
            except Exception as e:
                runner.screenshot(page, "step4_fail")
                runner.log("WF-09", 4, "FAIL", "Không hiển thị nút Hủy Đơn cho đơn bán hàng đã hủy", str(e), url=page.url)
            finally:
                close_btn = page.get_by_role("button", name="Đóng")
                if close_btn.count() > 0 and close_btn.last.is_visible():
                    close_btn.last.click()
                    time.sleep(0.5)

            # ── Step 5: Duyệt SO không ở Nháp (Fail Case) ──
            try:
                # Open the cancelled SO details again
                row = page.get_by_role("row").filter(has_text="Minh Anh").nth(1)
                row.get_by_title("Xem chi tiết").click()
                time.sleep(0.5)

                # Verify button "Duyệt Đơn" is NOT visible
                btn = page.get_by_role("button", name="Duyệt Đơn")
                expect(btn).not_to_be_visible()
                runner.log("WF-09", 5, "PASS", "Không hiển thị nút Duyệt Đơn cho đơn bán hàng đã hủy", url=page.url)
            except Exception as e:
                runner.screenshot(page, "step5_fail")
                runner.log("WF-09", 5, "FAIL", "Không hiển thị nút Duyệt Đơn cho đơn bán hàng đã hủy", str(e), url=page.url)
            finally:
                close_btn = page.get_by_role("button", name="Đóng")
                if close_btn.count() > 0 and close_btn.last.is_visible():
                    close_btn.last.click()
                    time.sleep(0.5)

        except Exception as e:
            runner.screenshot(page, "blocker_batch_07a")
            runner.log("WF-09", "ALL_SALES_CANCEL", "FAIL", "Toàn bộ Batch 07a Sales Cancel", str(e), "BLOCKER", url=page.url)
        finally:
            browser.close()

    runner.write_report()
    return runner


if __name__ == "__main__":
    run()

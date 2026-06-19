# -*- coding: utf-8 -*-
"""Batch 07 — WF-09: Bán Hàng & Hạn Mức Tín Dụng"""
import sys
import os
import time

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(__file__))

from test_helpers import (TestRunner, BASE_URL, ADMIN_USER, ADMIN_PASS,
                          wait_for_page_ready, login, dismiss_all_toasts)
from playwright.sync_api import sync_playwright, expect


def run():
    runner = TestRunner("Batch_07_Sales", "batch_07_sales_result.md")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 1024})
        page = context.new_page()
        page.set_default_timeout(10000)

        try:
            # ── Step 1: Đăng nhập và truy cập trang bán hàng ──
            try:
                login(page, ADMIN_USER, ADMIN_PASS)
                page.goto(f"{BASE_URL}/sales")
                wait_for_page_ready(page)
                expect(page.get_by_role("button", name="Thêm Đơn Bán")).to_be_visible()
                runner.log("WF-09", 1, "PASS", "Truy cập /sales thành công, hiển thị danh sách đơn bán hàng", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf09_s1")
                runner.log("WF-09", 1, "FAIL", "Truy cập /sales thành công", str(e), "BLOCKER", url=page.url)
                raise e

            # ── Step 2: Đồng bộ hóa tab qua URL và reload để duy trì trạng thái ──
            try:
                page.goto(f"{BASE_URL}/finance?tab=sales_invoices")
                wait_for_page_ready(page)
                expect(page.get_by_role("tab", name="Phải Thu (AR)")).to_have_attribute("aria-selected", "true")
                
                page.reload()
                wait_for_page_ready(page)
                expect(page.get_by_role("tab", name="Phải Thu (AR)")).to_have_attribute("aria-selected", "true")
                
                # Quay trở lại trang sales
                page.goto(f"{BASE_URL}/sales")
                wait_for_page_ready(page)
                time.sleep(0.5)
                runner.log("WF-09", 2, "PASS", "Tab đồng bộ chính xác qua URL (?tab=sales_invoices) trên trang tài chính và duy trì trạng thái sau khi reload", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf09_s2")
                runner.log("WF-09", 2, "FAIL", "Tab đồng bộ chính xác qua URL và duy trì trạng thái", str(e), url=page.url)

            # ── Step 3: Tạo Đơn Bán Hàng (SO) với KH003 (GreenMart - Khóa Tín Dụng) ──
            try:
                dismiss_all_toasts(page)
                page.get_by_role("button", name="Thêm Đơn Bán").click()
                time.sleep(0.5)
                expect(page.get_by_role("heading", name="Thêm Đơn Bán Hàng Mới")).to_be_visible()
                
                # Điền thông tin đơn bán
                page.locator("select").nth(1).select_option(label="Siêu thị Điện máy & Đồ gia dụng GreenMart (KH003)")
                page.locator("select").nth(2).select_option(label="Bóng đèn Huỳnh Quang 1m2 36W (TP_HQ01)")
                page.get_by_role("spinbutton").nth(0).fill("5")
                page.get_by_role("spinbutton").nth(1).fill("100000")
                page.get_by_role("spinbutton").nth(2).fill("0")
                
                # Tạo đơn
                page.get_by_role("button", name="Tạo Đơn Hàng").click()
                expect(page.get_by_role("heading", name="Thêm Đơn Bán Hàng Mới")).not_to_be_visible()
                time.sleep(0.8)
                dismiss_all_toasts(page)
                runner.log("WF-09", 3, "PASS", "Tạo đơn bán hàng nháp với Siêu thị GreenMart (KH003) thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf09_s3")
                runner.log("WF-09", 3, "FAIL", "Tạo đơn bán hàng nháp với Siêu thị GreenMart (KH003)", str(e), url=page.url)
            finally:
                close_btn = page.get_by_role("button", name="Đóng")
                if close_btn.count() > 0 and close_btn.last.is_visible():
                    close_btn.last.click()
                    time.sleep(0.5)

            # ── Step 4: Duyệt Đơn nháp và xác thực đơn bị hệ thống Khóa Tín Dụng ──
            try:
                # Mở chi tiết đơn hàng nháp mới tạo (dòng đầu tiên có khách hàng GreenMart)
                row = page.get_by_role("row").filter(has_text="GreenMart").first
                row.get_by_role("button", name="Xem chi tiết").click()
                time.sleep(0.5)
                
                # Nhấn duyệt đơn
                page.get_by_role("button", name="Duyệt Đơn").click()
                
                # Chờ modal tự động đóng (sau khi duyệt đơn và chuyển thành Chờ duyệt tín dụng)
                expect(page.get_by_role("heading", name="Chi Tiết Đơn Bán Nháp")).not_to_be_visible()
                time.sleep(0.5)
                dismiss_all_toasts(page)
                
                # Xác thực trạng thái của đơn hàng trong danh sách chuyển thành "Chờ duyệt tín dụng"
                row = page.get_by_role("row").filter(has_text="GreenMart").first
                expect(row.get_by_text("Chờ duyệt tín dụng")).to_be_visible(timeout=10000)
                runner.log("WF-09", 4, "PASS", "Hệ thống tự động khóa tín dụng đơn hàng đối với khách hàng vượt hạn mức thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf09_s4")
                runner.log("WF-09", 4, "FAIL", "Hệ thống tự động khóa tín dụng đơn hàng đối với khách hàng vượt hạn mức", str(e), url=page.url)

            # ── Step 5: Thực hiện Duyệt đặc cách tín dụng bằng quyền Admin ──
            try:
                # Mở lại chi tiết đơn hàng (lúc này đang ở trạng thái Chờ duyệt tín dụng)
                row = page.get_by_role("row").filter(has_text="GreenMart").first
                row.get_by_role("button", name="Xem chi tiết").click()
                time.sleep(0.5)

                # Xác thực banner thông báo đơn bị khóa tín dụng trong modal
                expect(page.get_by_text("Đơn hàng bị Khóa Tín Dụng")).to_be_visible()
                
                # Nút duyệt đặc cách phải hiển thị
                expect(page.get_by_role("button", name="Duyệt tín dụng đặc cách")).to_be_visible()
                page.get_by_role("button", name="Duyệt tín dụng đặc cách").click()
                
                # Chờ modal đóng
                expect(page.get_by_role("dialog")).not_to_be_visible()
                time.sleep(0.8)
                dismiss_all_toasts(page)
                
                runner.log("WF-09", 5, "PASS", "Duyệt đặc cách tín dụng cho đơn hàng bị khóa bằng tài khoản Admin thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf09_s5")
                runner.log("WF-09", 5, "FAIL", "Duyệt đặc cách tín dụng cho đơn hàng bị khóa", str(e), url=page.url)

            # ── Step 6: Xác thực đơn hàng chuyển sang trạng thái hoạt động trên danh sách ──
            try:
                # Đơn hàng lúc này phải có trạng thái hoạt động (Đang hoạt động)
                row = page.get_by_role("row").filter(has_text="GreenMart").first
                expect(row.get_by_text("Đang hoạt động")).to_be_visible(timeout=10000)
                runner.log("WF-09", 6, "PASS", "Xác thực trạng thái đơn hàng chuyển sang 'Đang hoạt động' thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf09_s6")
                runner.log("WF-09", 6, "FAIL", "Xác thực trạng thái đơn hàng chuyển sang 'Đang hoạt động'", str(e), url=page.url)

            # ── Step 7: Xác thực hóa đơn bán được sinh tự động ở trạng thái Chưa Thanh Toán ──
            try:
                # Chuyển qua trang Tài chính / Phải thu (AR)
                page.goto(f"{BASE_URL}/finance?tab=sales_invoices")
                wait_for_page_ready(page)
                
                # Tìm dòng hóa đơn mới của Siêu thị GreenMart
                row_invoice = page.get_by_role("row").filter(has_text="GreenMart").first
                expect(row_invoice.get_by_text("Chưa Thanh Toán")).to_be_visible(timeout=10000)
                runner.log("WF-09", 7, "PASS", "Xác thực hóa đơn bán được tự động tạo với trạng thái 'Chưa Thanh Toán' tại phân hệ Dòng Tiền thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf09_s7")
                runner.log("WF-09", 7, "FAIL", "Xác thực hóa đơn bán được tự động tạo với trạng thái 'Chưa Thanh Toán'", str(e), url=page.url)

        except Exception as e:
            runner.screenshot(page, "wf09_blocker")
            runner.log("WF-09", "ALL", "FAIL", "Chạy toàn bộ WF-09", str(e), "BLOCKER", url=page.url)
        finally:
            browser.close()

    runner.write_report()
    return runner


if __name__ == "__main__":
    run()

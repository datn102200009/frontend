# -*- coding: utf-8 -*-
"""Batch 04 — WF-06: Mua Hàng & Quản Lý Công Nợ"""
import sys
import os
import time

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(__file__))

from test_helpers import (TestRunner, BASE_URL, ADMIN_USER, ADMIN_PASS,
                          wait_for_page_ready, login, dismiss_all_toasts)
from playwright.sync_api import sync_playwright, expect


def run():
    runner = TestRunner("Batch_04_Purchasing", "batch_04_purchasing_result.md")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 1024})
        page = context.new_page()
        page.set_default_timeout(10000)

        try:
            # ── Step 1: Đăng nhập và truy cập trang mua hàng ──
            try:
                login(page, ADMIN_USER, ADMIN_PASS)
                page.goto(f"{BASE_URL}/purchasing")
                wait_for_page_ready(page)
                expect(page.get_by_role("tab", name="Đơn Mua Hàng")).to_be_visible()
                runner.log("WF-06", 1, "PASS", "Truy cập /purchasing thành công, hiển thị tab mặc định Đơn Mua Hàng", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf06_s1")
                runner.log("WF-06", 1, "FAIL", "Truy cập /purchasing thành công", str(e), "BLOCKER", url=page.url)
                raise e

            # ── Step 2: Đồng bộ hóa tab qua URL và reload để duy trì trạng thái ──
            try:
                page.goto(f"{BASE_URL}/purchasing?tab=invoices")
                wait_for_page_ready(page)
                expect(page.get_by_role("tab", name="Hóa Đơn Mua")).to_have_attribute("aria-selected", "true")
                
                page.reload()
                wait_for_page_ready(page)
                expect(page.get_by_role("tab", name="Hóa Đơn Mua")).to_have_attribute("aria-selected", "true")
                
                # Quay trở lại tab Đơn Mua Hàng
                page.get_by_role("tab", name="Đơn Mua Hàng").click()
                time.sleep(0.5)
                runner.log("WF-06", 2, "PASS", "Tab đồng bộ chính xác qua URL (?tab=invoices) và duy trì trạng thái sau khi reload", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf06_s2")
                runner.log("WF-06", 2, "FAIL", "Tab đồng bộ chính xác qua URL và duy trì trạng thái", str(e), url=page.url)

            # ── Step 3: Tạo đơn mua PO1 với NCC001, item NVL_HQ_01 (qty=100, price=50000) và phê duyệt đơn ──
            try:
                dismiss_all_toasts(page)
                page.get_by_role("button", name="Thêm Đơn Mua").click()
                time.sleep(0.5)
                
                # Điền thông tin nhà cung cấp và linh kiện
                page.get_by_label("Nhà Cung Cấp").select_option(label="Công ty TNHH Linh kiện Điện tử Sunrise (NCC001)")
                page.get_by_role("combobox").nth(1).select_option(label="Ống thủy tinh huỳnh quang 1m2 (NVL_HQ_01)")
                page.get_by_role("spinbutton").nth(0).fill("100")
                page.get_by_role("spinbutton").nth(1).fill("50000")
                
                # Chọn ngày giao dự kiến (hôm nay)
                page.get_by_placeholder("DD/MM/YYYY").click()
                time.sleep(0.3)
                page.get_by_role("button", name="Xác nhận").click()
                time.sleep(0.3)
                
                page.get_by_role("button", name="Tạo Đơn Hàng").click()
                expect(page.get_by_text("Tạo đơn mua hàng thành công")).to_be_visible()
                time.sleep(0.8)
                dismiss_all_toasts(page)
                
                # Mở lại PO1 (đơn nháp đầu tiên trong danh sách) để duyệt đơn
                page.get_by_role("button", name="Chỉnh sửa").first.click()
                time.sleep(0.5)
                
                page.get_by_role("button", name="Duyệt Đơn").click()
                expect(page.get_by_text("Duyệt đơn mua hàng thành công")).to_be_visible()
                time.sleep(0.8)
                dismiss_all_toasts(page)
                runner.log("WF-06", 3, "PASS", "Tạo và duyệt đơn mua hàng PO1 thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf06_s3")
                runner.log("WF-06", 3, "FAIL", "Tạo và duyệt đơn mua hàng PO1", str(e), url=page.url)

            # ── Step 4: Tạo đơn mua PO2 với NCC002, item NVL_LED_02 ──
            try:
                page.get_by_role("button", name="Thêm Đơn Mua").click()
                time.sleep(0.5)
                
                page.get_by_label("Nhà Cung Cấp").select_option(label="CTCP Vật liệu Thủy tinh & Nhựa Á Châu (NCC002)")
                page.get_by_role("combobox").nth(1).select_option(label="Mạch Chip LED SMD2835 (NVL_LED_02)")
                page.get_by_role("spinbutton").nth(0).fill("50")
                page.get_by_role("spinbutton").nth(1).fill("30000")
                
                # Chọn ngày giao dự kiến (hôm nay)
                page.get_by_placeholder("DD/MM/YYYY").click()
                time.sleep(0.3)
                page.get_by_role("button", name="Xác nhận").click()
                time.sleep(0.3)
                
                page.get_by_role("button", name="Tạo Đơn Hàng").click()
                expect(page.get_by_text("Tạo đơn mua hàng thành công")).to_be_visible()
                time.sleep(0.8)
                dismiss_all_toasts(page)
                runner.log("WF-06", 4, "PASS", "Tạo đơn mua hàng PO2 (draft) thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf06_s4")
                runner.log("WF-06", 4, "FAIL", "Tạo đơn mua hàng PO2 (draft)", str(e), url=page.url)

            # ── Step 5: Tạo đơn mua PO3 và chạy quy trình hủy đơn ──
            try:
                page.get_by_role("button", name="Thêm Đơn Mua").click()
                time.sleep(0.5)
                
                page.get_by_label("Nhà Cung Cấp").select_option(label="Công ty TNHH Linh kiện Điện tử Sunrise (NCC001)")
                page.get_by_role("combobox").nth(1).select_option(label="Ống thủy tinh huỳnh quang 1m2 (NVL_HQ_01)")
                page.get_by_role("spinbutton").nth(0).fill("5")
                page.get_by_role("spinbutton").nth(1).fill("10000")
                
                # Chọn ngày giao dự kiến (hôm nay)
                page.get_by_placeholder("DD/MM/YYYY").click()
                time.sleep(0.3)
                page.get_by_role("button", name="Xác nhận").click()
                time.sleep(0.3)
                
                page.get_by_role("button", name="Tạo Đơn Hàng").click()
                expect(page.get_by_text("Tạo đơn mua hàng thành công")).to_be_visible()
                time.sleep(0.8)
                dismiss_all_toasts(page)
                
                # Duyệt đơn PO3 để chuyển trạng thái sang pending
                page.get_by_role("button", name="Chỉnh sửa").first.click()
                time.sleep(0.5)
                page.get_by_role("button", name="Duyệt Đơn").click()
                expect(page.get_by_text("Duyệt đơn mua hàng thành công")).to_be_visible()
                time.sleep(0.8)
                dismiss_all_toasts(page)
                
                # Mở chi tiết đơn PO3 đã duyệt
                page.get_by_role("button", name="Xem chi tiết").first.click()
                time.sleep(0.5)
                
                # Thực hiện quy trình hủy đơn
                page.get_by_role("button", name="Hủy Đơn").click()
                time.sleep(0.5)
                expect(page.get_by_role("heading", name="Xác Nhận Hủy Đơn Mua Hàng")).to_be_visible()
                
                page.get_by_role("button", name="Xác nhận hủy").click()
                expect(page.get_by_text("Hủy đơn mua hàng thành công")).to_be_visible()
                time.sleep(0.8)
                dismiss_all_toasts(page)
                runner.log("WF-06", 5, "PASS", "Tạo, duyệt và hủy đơn mua hàng PO3 thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf06_s5")
                runner.log("WF-06", 5, "FAIL", "Hủy đơn mua hàng PO3", str(e), url=page.url)

            # ── Step 6: Xác thực tải thành công các tab chức năng khác ──
            try:
                # 1. Hóa Đơn Mua
                page.get_by_role("tab", name="Hóa Đơn Mua").click()
                time.sleep(0.5)
                expect(page.get_by_placeholder("Tìm kiếm hóa đơn...")).to_be_visible()
                
                # 2. Quản Lý Lô Hàng
                page.get_by_role("tab", name="Quản Lý Lô Hàng").click()
                time.sleep(0.5)
                expect(page.get_by_text("Hồ sơ Lô hàng")).to_be_visible()
                
                # 3. Kiểm Định QA/QC
                page.get_by_role("tab", name="Kiểm Định QA/QC").click()
                time.sleep(0.5)
                expect(page.get_by_text("Lịch Sử Kiểm Định QA/QC")).to_be_visible()
                
                # 4. Báo Cáo Công Nợ
                page.get_by_role("tab", name="Báo Cáo Công Nợ").click()
                time.sleep(0.5)
                expect(page.get_by_text("Tổng Phải Trả NCC").first).to_be_visible()
                expect(page.get_by_text("Công nợ Chưa đến hạn").first).to_be_visible()
                expect(page.get_by_text("Quá Hạn 1 - 30 Ngày").first).to_be_visible()
                expect(page.get_by_text("Quá Hạn > 30 Ngày").first).to_be_visible()
                
                runner.log("WF-06", 6, "PASS", "Tải thành công các tab Hóa Đơn Mua, Quản Lý Lô Hàng, Kiểm Định QA/QC, và Báo Cáo Công Nợ", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf06_s6")
                runner.log("WF-06", 6, "FAIL", "Xác thực tải các tab chức năng khác", str(e), url=page.url)

        except Exception as e:
            runner.screenshot(page, "wf06_blocker")
            runner.log("WF-06", "ALL", "FAIL", "Chạy toàn bộ WF-06", str(e), "BLOCKER", url=page.url)
        finally:
            browser.close()

    runner.write_report()
    return runner


if __name__ == "__main__":
    run()

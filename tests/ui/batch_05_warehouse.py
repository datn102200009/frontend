# -*- coding: utf-8 -*-
"""Batch 05 — WF-07: Quản Lý Kho & Giao Dịch Ghi Sổ Cái"""
import sys
import os
import time
import random

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(__file__))

from test_helpers import (TestRunner, BASE_URL, ADMIN_USER, ADMIN_PASS,
                          wait_for_page_ready, login, dismiss_all_toasts)
from playwright.sync_api import sync_playwright, expect


def run():
    runner = TestRunner("Batch_05_Warehouse", "batch_05_warehouse_result.md")
    rand_id = random.randint(1000, 9999)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 1024})
        page = context.new_page()
        page.set_default_timeout(10000)

        try:
            # ── Step 1: Đăng nhập và truy cập tab Phiếu Kho ──
            try:
                login(page, ADMIN_USER, ADMIN_PASS)
                page.goto(f"{BASE_URL}/inventory")
                wait_for_page_ready(page)
                
                # Chuyển sang tab Phiếu Kho
                page.get_by_role("tab", name="Phiếu Kho").click()
                time.sleep(0.5)
                expect(page.get_by_role("button", name="Nhập Kho")).to_be_visible()
                runner.log("WF-07", 1, "PASS", "Đăng nhập và mở tab Phiếu Kho thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf07_s1")
                runner.log("WF-07", 1, "FAIL", "Đăng nhập và mở tab Phiếu Kho", str(e), "BLOCKER", url=page.url)
                raise e

            # ── Step 2: Kiểm tra lỗi validation khi nhập số lượng bằng 0 ──
            try:
                page.get_by_role("button", name="Nhập Kho").click()
                time.sleep(0.5)
                
                page.get_by_label("Tên phiếu").fill("Phiếu Nhập Kho Test Lỗi")
                page.get_by_label("Kho đích").select_option(label="Kho Nguyên Vật Liệu")
                page.get_by_label("Mã vật tư").first.select_option(value="NVL_HQ_01")
                
                # Điền số lượng = 0
                page.get_by_role("spinbutton").first.fill("0")
                
                # Click Tạo mới để kiểm tra validation
                page.get_by_role("button", name="Tạo mới").click()
                time.sleep(0.5)
                
                # Vì giao diện không hiển thị text lỗi validation cho details, 
                # ta xác thực form bị chặn submit bằng cách kiểm tra modal vẫn mở.
                expect(page.get_by_role("dialog")).to_be_visible()
                
                # Đóng form modal test lỗi
                page.get_by_role("button", name="Hủy").click()
                time.sleep(0.5)
                runner.log("WF-07", 2, "PASS", "Xác thực thành công lỗi số lượng tối thiểu = 1 khi nhập số lượng = 0", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf07_s2")
                runner.log("WF-07", 2, "FAIL", "Xác thực lỗi validation khi nhập số lượng bằng 0", str(e), url=page.url)

            # ── Step 3: Tạo Phiếu Nhập Kho #1 và Phê Duyệt (Duyệt) ──
            try:
                dismiss_all_toasts(page)
                page.get_by_role("button", name="Nhập Kho").click()
                time.sleep(0.5)
                
                page.get_by_label("Tên phiếu").fill(f"Phiếu Nhập Kho #1 {rand_id}")
                page.get_by_label("Kho đích").select_option(label="Kho Nguyên Vật Liệu")
                
                # Thêm linh kiện thứ 1: NVL_HQ_01 = 50
                page.get_by_label("Mã vật tư").first.select_option(value="NVL_HQ_01")
                page.get_by_role("spinbutton").first.fill("50")
                
                # Thêm linh kiện thứ 2: NVL_HQ_02 = 5
                page.get_by_role("button", name="Thêm").click()
                page.get_by_label("Mã vật tư").nth(1).select_option(value="NVL_HQ_02")
                page.get_by_role("spinbutton").nth(1).fill("5")
                
                # Thêm linh kiện thứ 3: NVL_HQ_03 = 50
                page.get_by_role("button", name="Thêm").click()
                page.get_by_label("Mã vật tư").nth(2).select_option(value="NVL_HQ_03")
                page.get_by_role("spinbutton").nth(2).fill("50")
                
                # Thêm linh kiện thứ 4: NVL_HQ_04 = 50
                page.get_by_role("button", name="Thêm").click()
                page.get_by_label("Mã vật tư").nth(3).select_option(value="NVL_HQ_04")
                page.get_by_role("spinbutton").nth(3).fill("50")
                
                # Thêm linh kiện thứ 5: NVL_HQ_05 = 100
                page.get_by_role("button", name="Thêm").click()
                page.get_by_label("Mã vật tư").nth(4).select_option(value="NVL_HQ_05")
                page.get_by_role("spinbutton").nth(4).fill("100")
                
                # Click tạo mới phiếu kho
                page.get_by_role("button", name="Tạo mới").click()
                expect(page.get_by_text("Tạo phiếu thành công")).to_be_visible()
                time.sleep(0.8)
                dismiss_all_toasts(page)
                
                # Thực hiện Phê Duyệt Phiếu Nhập Kho #1
                page.get_by_role("button", name="Duyệt").first.click()
                time.sleep(0.5)
                
                page.get_by_label("Kho nhận hàng").select_option(label="Kho Nguyên Vật Liệu")
                page.get_by_role("button", name="Phê duyệt").click()
                expect(page.get_by_text("thành công")).to_be_visible()
                time.sleep(0.8)
                dismiss_all_toasts(page)
                runner.log("WF-07", 3, "PASS", "Tạo và Phê Duyệt Phiếu Nhập Kho #1 thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf07_s3")
                runner.log("WF-07", 3, "FAIL", "Tạo và Phê Duyệt Phiếu Nhập Kho #1", str(e), url=page.url)

            # ── Step 4: Tạo Phiếu Nhập Kho #2 (LED) và Phê Duyệt ──
            try:
                page.get_by_role("button", name="Nhập Kho").click()
                time.sleep(0.5)
                
                page.get_by_label("Tên phiếu").fill(f"Phiếu Nhập Kho #2 {rand_id}")
                page.get_by_label("Kho đích").select_option(label="Kho Nguyên Vật Liệu")
                
                # Thêm NVL_LED_01 = 50
                page.get_by_label("Mã vật tư").first.select_option(value="NVL_LED_01")
                page.get_by_role("spinbutton").first.fill("50")
                
                # Thêm NVL_LED_02 = 50
                page.get_by_role("button", name="Thêm").click()
                page.get_by_label("Mã vật tư").nth(1).select_option(value="NVL_LED_02")
                page.get_by_role("spinbutton").nth(1).fill("50")
                
                # Thêm NVL_LED_03 = 50
                page.get_by_role("button", name="Thêm").click()
                page.get_by_label("Mã vật tư").nth(2).select_option(value="NVL_LED_03")
                page.get_by_role("spinbutton").nth(2).fill("50")
                
                # Thêm NVL_LED_04 = 50
                page.get_by_role("button", name="Thêm").click()
                page.get_by_label("Mã vật tư").nth(3).select_option(value="NVL_LED_04")
                page.get_by_role("spinbutton").nth(3).fill("50")
                
                # Thêm NVL_LED_05 = 50
                page.get_by_role("button", name="Thêm").click()
                page.get_by_label("Mã vật tư").nth(4).select_option(value="NVL_LED_05")
                page.get_by_role("spinbutton").nth(4).fill("50")
                
                page.get_by_role("button", name="Tạo mới").click()
                expect(page.get_by_text("Tạo phiếu thành công")).to_be_visible()
                time.sleep(0.8)
                dismiss_all_toasts(page)
                
                # Thực hiện Phê Duyệt Phiếu Nhập Kho #2
                page.get_by_role("button", name="Duyệt").first.click()
                time.sleep(0.5)
                
                page.get_by_label("Kho nhận hàng").select_option(label="Kho Nguyên Vật Liệu")
                page.get_by_role("button", name="Phê duyệt").click()
                expect(page.get_by_text("thành công")).to_be_visible()
                time.sleep(0.8)
                dismiss_all_toasts(page)
                runner.log("WF-07", 4, "PASS", "Tạo và Phê Duyệt Phiếu Nhập Kho #2 thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf07_s4")
                runner.log("WF-07", 4, "FAIL", "Tạo và Phê Duyệt Phiếu Nhập Kho #2", str(e), url=page.url)

            # ── Step 5: Tạo Phiếu Xuất Kho: NVL_HQ_01=5 và Phê Duyệt (50 -> 45) ──
            try:
                page.get_by_role("button", name="Xuất Kho").click()
                time.sleep(0.5)
                
                page.get_by_label("Tên phiếu").fill(f"Phiếu Xuất Kho 1 {rand_id}")
                page.get_by_label("Kho nguồn").select_option(label="Kho Nguyên Vật Liệu")
                
                # Thêm NVL_HQ_01 = 5
                page.get_by_label("Mã vật tư").first.select_option(value="NVL_HQ_01")
                page.get_by_role("spinbutton").first.fill("5")
                
                page.get_by_role("button", name="Tạo mới").click()
                expect(page.get_by_text("Tạo phiếu thành công")).to_be_visible()
                time.sleep(0.8)
                dismiss_all_toasts(page)
                
                # Thực hiện Phê Duyệt Phiếu Xuất Kho
                page.get_by_role("button", name="Duyệt").first.click()
                time.sleep(0.5)
                
                page.get_by_label("Kho xuất hàng").select_option(label="Kho Nguyên Vật Liệu")
                page.get_by_role("button", name="Phê duyệt").click()
                expect(page.get_by_text("thành công")).to_be_visible()
                time.sleep(0.8)
                dismiss_all_toasts(page)
                runner.log("WF-07", 5, "PASS", "Tạo và Phê Duyệt Phiếu Xuất Kho (NVL_HQ_01=5) thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf07_s5")
                runner.log("WF-07", 5, "FAIL", "Tạo và Phê Duyệt Phiếu Xuất Kho", str(e), url=page.url)

            # ── Step 6: Tạo Phiếu Chuyển Kho: NVL_HQ_01=2 từ Kho NVL sang Kho Bán Thành Phẩm và Phê Duyệt ──
            try:
                page.get_by_role("button", name="Chuyển Kho").click()
                time.sleep(0.5)
                
                page.get_by_label("Tên phiếu").fill(f"Phiếu Chuyển Kho 1 {rand_id}")
                page.get_by_label("Kho nguồn").select_option(label="Kho Nguyên Vật Liệu")
                page.get_by_label("Kho đích").select_option(label="Kho Bán Thành Phẩm")
                
                # Thêm NVL_HQ_01 = 2
                page.get_by_label("Mã vật tư").first.select_option(value="NVL_HQ_01")
                page.get_by_role("spinbutton").first.fill("2")
                
                page.get_by_role("button", name="Tạo mới").click()
                expect(page.get_by_text("Tạo phiếu thành công")).to_be_visible()
                time.sleep(0.8)
                dismiss_all_toasts(page)
                
                # Thực hiện Phê Duyệt Phiếu Chuyển Kho
                page.get_by_role("button", name="Duyệt").first.click()
                time.sleep(0.5)
                
                # Đối với chuyển kho, nút Phê duyệt bấm trực tiếp được ngay mà không cần chọn lại kho
                page.get_by_role("button", name="Phê duyệt").click()
                expect(page.get_by_text("thành công")).to_be_visible()
                time.sleep(0.8)
                dismiss_all_toasts(page)
                runner.log("WF-07", 6, "PASS", "Tạo và Phê Duyệt Phiếu Chuyển Kho (NVL_HQ_01=2) thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf07_s6")
                runner.log("WF-07", 6, "FAIL", "Tạo và Phê Duyệt Phiếu Chuyển Kho", str(e), url=page.url)

            # ── Step 7: Xác nhận Tồn Kho (Ledger Quantities) trên tab Tồn Kho ──
            try:
                # Chuyển sang tab Tồn Kho
                page.get_by_role("tab", name="Tồn Kho").click()
                time.sleep(0.5)
                
                # Tìm kiếm NVL_HQ_01 để lọc
                search_input = page.get_by_placeholder("Tìm theo mã hoặc tên sản phẩm...")
                search_input.fill("NVL_HQ_01")
                time.sleep(0.5)
                wait_for_page_ready(page)
                
                # Lọc theo Kho Nguyên Vật Liệu
                page.get_by_label("Lọc theo kho").select_option(label="Kho Nguyên Vật Liệu")
                time.sleep(0.5)
                wait_for_page_ready(page)
                
                # Xác thực tồn kho của NVL_HQ_01 tại Kho Nguyên Vật Liệu >= 43
                row_nvl = page.get_by_role("row").filter(has=page.get_by_text("NVL_HQ_01")).filter(has=page.get_by_text("Kho Nguyên Vật Liệu"))
                qty_text = row_nvl.locator("td").nth(3).inner_text()
                qty = float(qty_text.replace(",", "").strip())
                assert qty >= 43, f"Số lượng thực tế tại Kho Nguyên Vật Liệu là {qty} (kỳ vọng >= 43)"
                
                # Lọc theo Kho Bán Thành Phẩm
                page.get_by_label("Lọc theo kho").select_option(label="Kho Bán Thành Phẩm")
                time.sleep(0.5)
                wait_for_page_ready(page)
                
                # Xác thực tồn kho của NVL_HQ_01 tại Kho Bán Thành Phẩm >= 2
                row_btp = page.get_by_role("row").filter(has=page.get_by_text("NVL_HQ_01")).filter(has=page.get_by_text("Kho Bán Thành Phẩm"))
                qty_btp_text = row_btp.locator("td").nth(3).inner_text()
                qty_btp = float(qty_btp_text.replace(",", "").strip())
                assert qty_btp >= 2, f"Số lượng thực tế tại Kho Bán Thành Phẩm là {qty_btp} (kỳ vọng >= 2)"
                
                runner.log("WF-07", 7, "PASS", f"Xác nhận số dư thực tế hợp lý: Kho NVL = {qty}, Kho Bán Thành Phẩm = {qty_btp}", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf07_s7")
                runner.log("WF-07", 7, "FAIL", "Xác thực số dư tồn kho trên sổ cái", str(e), url=page.url)

        except Exception as e:
            runner.screenshot(page, "wf07_blocker")
            runner.log("WF-07", "ALL", "FAIL", "Chạy toàn bộ WF-07", str(e), "BLOCKER", url=page.url)
        finally:
            browser.close()

    runner.write_report()
    return runner


if __name__ == "__main__":
    run()

# -*- coding: utf-8 -*-
"""Batch 03 — WF-03 + WF-04 + WF-05: Master Data & CRM (17 steps)"""
import sys
import os
import time
import re

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(__file__))

from test_helpers import (TestRunner, login, BASE_URL, wait_for_page_ready)
from playwright.sync_api import sync_playwright, expect


def run():
    runner = TestRunner("Batch_03_Master_Data", "batch_03_master_data_result.md")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 1024})
        page = context.new_page()
        page.set_default_timeout(10000)

        try:
            # First, login as admin to perform all master data actions
            try:
                login(page)
            except Exception as e:
                runner.screenshot(page, "login_failure")
                runner.log("WF-03", 1, "FAIL", "Đăng nhập trước khi kiểm thử Master Data", str(e), "BLOCKER", url=page.url)
                raise e

            # ==========================================
            # WF-03: Inventory Product Search (4 steps)
            # ==========================================

            # ── Step 1: Đi tới /inventory ──
            try:
                page.goto(f"{BASE_URL}/inventory")
                wait_for_page_ready(page)
                expect(page.get_by_role("tab", name="Sản Phẩm")).to_have_attribute("aria-selected", "true")
                runner.log("WF-03", 1, "PASS", "Truy cập /inventory thành công và Tab Sản Phẩm active mặc định", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf03_s1")
                runner.log("WF-03", 1, "FAIL", "Truy cập /inventory thành công", str(e), url=page.url)

            # ── Step 2: Xác nhận >= 18 sản phẩm ──
            try:
                # We can locate the counter text containing "sản phẩm"
                text_locator = page.get_by_text(re.compile(r"\d+\s+sản phẩm"))
                expect(text_locator).to_be_visible()
                text = text_locator.inner_text()
                match = re.search(r"(\d+)\s+sản phẩm", text)
                count = int(match.group(1)) if match else 0
                assert count >= 18, f"Số lượng sản phẩm thực tế là {count}"
                runner.log("WF-03", 2, "PASS", f"Xác nhận danh sách hiển thị đủ >= 18 sản phẩm (thực tế: {count})", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf03_s2")
                runner.log("WF-03", 2, "FAIL", "Xác nhận danh sách hiển thị đủ >= 18 sản phẩm", str(e), url=page.url)

            # ── Step 3: Tìm kiếm "Bóng đèn" -> verify kết quả chứa TP_HQ01, TP_LED01 ──
            try:
                search_input = page.get_by_placeholder("Tìm mã hoặc tên sản phẩm...")
                search_input.fill("Bóng đèn")
                time.sleep(0.5)
                wait_for_page_ready(page)
                
                # Check results
                expect(page.get_by_role("cell", name="TP_HQ01")).to_be_visible()
                expect(page.get_by_role("cell", name="TP_LED01")).to_be_visible()
                runner.log("WF-03", 3, "PASS", "Tìm kiếm 'Bóng đèn' hiển thị đúng TP_HQ01 và TP_LED01", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf03_s3")
                runner.log("WF-03", 3, "FAIL", "Tìm kiếm 'Bóng đèn' hiển thị đúng TP_HQ01 và TP_LED01", str(e), url=page.url)

            # ── Step 4: Tìm kiếm "NVL_LED_02" -> verify kết quả có "Mạch Chip LED SMD2835" ──
            try:
                search_input = page.get_by_placeholder("Tìm mã hoặc tên sản phẩm...")
                search_input.fill("NVL_LED_02")
                time.sleep(0.5)
                wait_for_page_ready(page)
                
                # Check results
                expect(page.get_by_text("Mạch Chip LED SMD2835")).to_be_visible()
                runner.log("WF-03", 4, "PASS", "Tìm kiếm 'NVL_LED_02' hiển thị đúng sản phẩm 'Mạch Chip LED SMD2835'", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf03_s4")
                runner.log("WF-03", 4, "FAIL", "Tìm kiếm 'NVL_LED_02' hiển thị đúng 'Mạch Chip LED SMD2835'", str(e), url=page.url)

            # ==========================================
            # WF-04: Suppliers (6 steps)
            # ==========================================

            # ── Step 5: Đi tới /suppliers và xác nhận 3 nhà cung cấp (NCC001-003) ──
            try:
                page.goto(f"{BASE_URL}/suppliers")
                wait_for_page_ready(page)
                expect(page.get_by_role("cell", name="NCC001")).to_be_visible()
                expect(page.get_by_role("cell", name="NCC002")).to_be_visible()
                expect(page.get_by_role("cell", name="NCC003")).to_be_visible()
                runner.log("WF-04", 5, "PASS", "Truy cập /suppliers và xác nhận hiển thị NCC001, NCC002, NCC003", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf04_s5")
                runner.log("WF-04", 5, "FAIL", "Truy cập /suppliers và xác nhận hiển thị NCC001-003", str(e), url=page.url)

            # ── Step 6: Click "Thêm Nhà Cung Cấp", submit rỗng -> báo lỗi validation ──
            try:
                page.get_by_role("button", name="Thêm Nhà Cung Cấp").click()
                time.sleep(0.3)
                modal = page.get_by_role("dialog")
                expect(modal).to_be_visible()
                
                modal.get_by_role("button", name="Lưu Lại").click()
                time.sleep(0.3)
                
                expect(page.get_by_text("Mã nhà cung cấp là bắt buộc")).to_be_visible()
                expect(page.get_by_text("Tên nhà cung cấp là bắt buộc")).to_be_visible()
                runner.log("WF-04", 6, "PASS", "Submit form trống báo lỗi validation bắt buộc Mã và Tên", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf04_s6")
                runner.log("WF-04", 6, "FAIL", "Submit form trống báo lỗi validation bắt buộc", str(e), url=page.url)

            # ── Step 7: Tạo nhà cung cấp mới với thông tin hợp lệ -> check toast/thành công ──
            try:
                import random
                rand_id = str(random.randint(10000, 99999))
                test_supplier_code = f"NCC_T_{rand_id}"
                
                page.get_by_label("Mã Nhà Cung Cấp").fill(test_supplier_code)
                page.get_by_label("Tên Nhà Cung Cấp").fill("Nhà Cung Cấp Test E2E")
                page.get_by_label("Email Liên Hệ").fill("test@supplier.com")
                page.get_by_label("Số Điện Thoại").fill("0987654321")
                page.get_by_label("Địa Chỉ").fill("123 Test Street")
                
                page.get_by_role("dialog").get_by_role("button", name="Lưu Lại").click()
                time.sleep(1)
                
                # Check toast if any, otherwise check table
                try:
                    page.get_by_text("Thành công").wait_for(state="visible", timeout=2000)
                except Exception:
                    pass
                
                # Check persistence
                search_box = page.get_by_placeholder("Tìm kiếm nhà cung cấp...")
                search_box.fill(test_supplier_code)
                time.sleep(0.5)
                wait_for_page_ready(page)
                expect(page.get_by_role("cell", name=test_supplier_code)).to_be_visible()
                
                runner.log("WF-04", 7, "PASS", f"Tạo nhà cung cấp {test_supplier_code} thành công và hiển thị trong danh sách", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf04_s7")
                runner.log("WF-04", 7, "FAIL", "Tạo nhà cung cấp mới", str(e), url=page.url)

            # ── Step 8: Click NCC001 trong list -> verify modal chi tiết ──
            try:
                # Clear search
                search_box = page.get_by_placeholder("Tìm kiếm nhà cung cấp...")
                search_box.fill("")
                time.sleep(0.5)
                wait_for_page_ready(page)
                
                row = page.get_by_role("row").filter(has_text="NCC001")
                row.get_by_role("button", name="Xem chi tiết").click()
                time.sleep(0.5)
                
                # Verify details
                expect(page.get_by_label("Tên Nhà Cung Cấp")).to_have_value("Công ty TNHH Linh kiện Điện tử Sunrise")
                expect(page.get_by_label("Mã Nhà Cung Cấp")).to_be_disabled()
                
                # Close modal
                page.get_by_role("dialog").get_by_role("button", name="Đóng").last.click()
                time.sleep(0.3)
                runner.log("WF-04", 8, "PASS", "Click Xem chi tiết NCC001 hiển thị đúng thông tin Sunrise và không sửa được mã", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf04_s8")
                runner.log("WF-04", 8, "FAIL", "Xem chi tiết NCC001", str(e), url=page.url)

            # ── Step 9: Click Chỉnh sửa NCC001 -> verify modal load data ──
            try:
                row = page.get_by_role("row").filter(has_text="NCC001")
                row.get_by_role("button", name="Chỉnh sửa").click()
                time.sleep(0.5)
                
                expect(page.get_by_label("Tên Nhà Cung Cấp")).to_have_value("Công ty TNHH Linh kiện Điện tử Sunrise")
                runner.log("WF-04", 9, "PASS", "Click Chỉnh sửa NCC001 load form thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf04_s9")
                runner.log("WF-04", 9, "FAIL", "Click Chỉnh sửa NCC001 load form", str(e), url=page.url)

            # ── Step 10: Chỉnh sửa thông tin NCC001, lưu -> check thành công ──
            try:
                page.get_by_label("Số Điện Thoại").fill("0911111111")
                page.get_by_role("dialog").get_by_role("button", name="Cập Nhật").click()
                time.sleep(1)
                
                try:
                    page.get_by_text("Thành công").wait_for(state="visible", timeout=2000)
                except Exception:
                    pass
                
                expect(page.get_by_role("row").filter(has_text="NCC001")).to_contain_text("0911111111")
                runner.log("WF-04", 10, "PASS", "Chỉnh sửa số điện thoại NCC001 thành '0911111111' và lưu thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf04_s10")
                runner.log("WF-04", 10, "FAIL", "Chỉnh sửa nhà cung cấp NCC001", str(e), url=page.url)

            # ==========================================
            # WF-05: Customers CRM (7 steps)
            # ==========================================

            # ── Step 11: Đi tới /customers, xác nhận 3 KH (KH001-003) ──
            try:
                page.goto(f"{BASE_URL}/customers")
                wait_for_page_ready(page)
                expect(page.get_by_role("cell", name="KH001")).to_be_visible()
                expect(page.get_by_role("cell", name="KH002")).to_be_visible()
                expect(page.get_by_role("cell", name="KH003")).to_be_visible()
                runner.log("WF-05", 11, "PASS", "Truy cập /customers và xác nhận hiển thị KH001, KH002, KH003", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf05_s11")
                runner.log("WF-05", 11, "FAIL", "Truy cập /customers và xác nhận hiển thị KH001-003", str(e), url=page.url)

            # ── Step 12: Xác nhận KH003 (GreenMart) có credit locked indicator ──
            try:
                row = page.get_by_role("row").filter(has_text="KH003")
                row.get_by_role("button", name="Chỉnh sửa").click()
                time.sleep(0.5)
                
                # Checkbox 'is_credit_locked' should be checked
                expect(page.get_by_label("Khóa tín dụng (Chặn tạo đơn hàng mới ngay lập tức)")).to_be_checked()
                
                # Close modal
                page.get_by_role("dialog").get_by_role("button", name="Đóng").last.click()
                time.sleep(0.3)
                runner.log("WF-05", 12, "PASS", "Xác nhận KH003 (GreenMart) đang bị khóa tín dụng trong modal chi tiết", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf05_s12")
                runner.log("WF-05", 12, "FAIL", "Xác nhận KH003 (GreenMart) bị khóa tín dụng", str(e), url=page.url)

            # ── Step 13: Click "Thêm Khách Hàng", submit trống -> báo lỗi validation ──
            try:
                page.get_by_role("button", name="Thêm Khách Hàng").click()
                time.sleep(0.3)
                modal = page.get_by_role("dialog")
                expect(modal).to_be_visible()
                
                modal.get_by_role("button", name="Lưu Lại").click()
                time.sleep(0.3)
                
                expect(page.get_by_text("Mã khách hàng là bắt buộc")).to_be_visible()
                expect(page.get_by_text("Tên khách hàng là bắt buộc")).to_be_visible()
                runner.log("WF-05", 13, "PASS", "Submit form trống báo lỗi validation bắt buộc Mã và Tên khách hàng", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf05_s13")
                runner.log("WF-05", 13, "FAIL", "Submit form trống báo lỗi validation", str(e), url=page.url)

            # ── Step 14: Tạo khách hàng mới với thông tin hợp lệ -> check toast/thành công ──
            try:
                test_customer_code = f"KH_T_{rand_id}"
                page.get_by_label("Mã Khách Hàng").fill(test_customer_code)
                page.get_by_label("Tên Khách Hàng").fill("Khách Hàng Test E2E")
                page.get_by_label("Email Liên Hệ").fill("test@customer.com")
                page.get_by_label("Số Điện Thoại").fill("0123456789")
                page.get_by_label("Địa Chỉ").fill("456 Test Road")
                page.get_by_label("Hạn Mức Tín Dụng (VND)").fill("50000000")
                
                page.get_by_role("dialog").get_by_role("button", name="Lưu Lại").click()
                time.sleep(1)
                
                try:
                    page.get_by_text("Thành công").wait_for(state="visible", timeout=2000)
                except Exception:
                    pass
                
                # Check table persistence
                search_box = page.get_by_placeholder("Tìm kiếm khách hàng...")
                search_box.fill(test_customer_code)
                time.sleep(0.5)
                wait_for_page_ready(page)
                expect(page.get_by_role("cell", name=test_customer_code)).to_be_visible()
                
                runner.log("WF-05", 14, "PASS", f"Tạo khách hàng mới {test_customer_code} thành công và hiển thị trong danh sách", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf05_s14")
                runner.log("WF-05", 14, "FAIL", "Tạo khách hàng mới", str(e), url=page.url)

            # ── Step 15: Click KH001 -> verify modal chi tiết ──
            try:
                search_box = page.get_by_placeholder("Tìm kiếm khách hàng...")
                search_box.fill("")
                time.sleep(0.5)
                wait_for_page_ready(page)
                
                row = page.get_by_role("row").filter(has_text="KH001")
                row.get_by_role("button", name="Xem chi tiết").click()
                time.sleep(0.5)
                
                expect(page.get_by_label("Tên Khách Hàng")).to_have_value("Công ty TNHH Thiết bị Điện & Chiếu sáng Minh Anh")
                expect(page.get_by_label("Mã Khách Hàng")).to_be_disabled()
                
                page.get_by_role("dialog").get_by_role("button", name="Đóng").last.click()
                time.sleep(0.3)
                runner.log("WF-05", 15, "PASS", "Xem chi tiết KH001 hiển thị đúng thông tin Minh Anh và không sửa được mã", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf05_s15")
                runner.log("WF-05", 15, "FAIL", "Xem chi tiết KH001", str(e), url=page.url)

            # ── Step 16: Click Chỉnh sửa KH001 -> verify modal loads data ──
            try:
                row = page.get_by_role("row").filter(has_text="KH001")
                row.get_by_role("button", name="Chỉnh sửa").click()
                time.sleep(0.5)
                
                expect(page.get_by_label("Tên Khách Hàng")).to_have_value("Công ty TNHH Thiết bị Điện & Chiếu sáng Minh Anh")
                runner.log("WF-05", 16, "PASS", "Click Chỉnh sửa KH001 load form thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf05_s16")
                runner.log("WF-05", 16, "FAIL", "Click Chỉnh sửa KH001 load form", str(e), url=page.url)

            # ── Step 17: Chỉnh sửa KH001, lưu -> check thành công ──
            try:
                page.get_by_label("Số Điện Thoại").fill("0922222222")
                page.get_by_role("dialog").get_by_role("button", name="Cập Nhật").click()
                time.sleep(1)
                
                try:
                    page.get_by_text("Thành công").wait_for(state="visible", timeout=2000)
                except Exception:
                    pass
                
                expect(page.get_by_role("row").filter(has_text="KH001")).to_contain_text("0922222222")
                runner.log("WF-05", 17, "PASS", "Chỉnh sửa số điện thoại KH001 thành '0922222222' và lưu thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf05_s17")
                runner.log("WF-05", 17, "FAIL", "Chỉnh sửa khách hàng KH001", str(e), url=page.url)

        except Exception as e:
            runner.screenshot(page, "wf03_wf04_wf05_blocker")
            runner.log("WF-03", "ALL", "FAIL", "Toàn bộ WF-03+04+05", str(e), "BLOCKER", url=page.url)
        finally:
            browser.close()

    runner.write_report()
    return runner


if __name__ == "__main__":
    run()

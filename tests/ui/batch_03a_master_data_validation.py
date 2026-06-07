# -*- coding: utf-8 -*-
"""Batch 03a — WF-03 + WF-04 + WF-05: Master Data Validation & Deletion (6 steps)"""
import sys
import os
import time
import random

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(__file__))

from test_helpers import (TestRunner, BASE_URL, wait_for_page_ready, login, dismiss_all_toasts)
from playwright.sync_api import sync_playwright, expect


def run():
    runner = TestRunner("Batch_03a_Master_Data_Validation", "batch_03a_master_data_validation_result.md")
    rand_id = random.randint(10000, 99999)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 1024})
        page = context.new_page()
        page.set_default_timeout(10000)

        try:
            # Login first
            try:
                login(page)
            except Exception as e:
                runner.screenshot(page, "login_failure")
                runner.log("WF-04", 1, "FAIL", "Đăng nhập trước khi kiểm thử Master Data Validation", str(e), "BLOCKER", url=page.url)
                raise e

            # ==========================================
            # WF-04: Suppliers Deletion (Happy Case)
            # ==========================================

            # ── Step 1: Tạo và xóa một Nhà Cung Cấp không có giao dịch ──
            try:
                page.goto(f"{BASE_URL}/suppliers")
                wait_for_page_ready(page)
                
                # Add supplier
                page.get_by_role("button", name="Thêm Nhà Cung Cấp").click()
                time.sleep(0.3)
                
                test_supplier_code = f"SUP_DEL_{rand_id}"
                page.get_by_label("Mã Nhà Cung Cấp").fill(test_supplier_code)
                page.get_by_label("Tên Nhà Cung Cấp").fill("Supplier Temporary Delete")
                page.get_by_role("dialog").get_by_role("button", name="Lưu Lại").click()
                time.sleep(1)
                
                # Dismiss toast if any
                dismiss_all_toasts(page)
                
                # Search and open the newly created supplier
                search_box = page.get_by_placeholder("Tìm kiếm nhà cung cấp...")
                search_box.fill(test_supplier_code)
                time.sleep(0.5)
                wait_for_page_ready(page)
                
                row = page.get_by_role("row").filter(has_text=test_supplier_code)
                row.get_by_role("button", name="Chỉnh sửa").click()
                time.sleep(0.5)
                
                # Click Xóa in the form footer
                page.get_by_role("dialog").get_by_role("button", name="Xóa").click()
                time.sleep(0.3)
                
                # Confirm delete
                page.get_by_role("button", name="Xác nhận").click()
                time.sleep(1)
                
                # Verify it's no longer in the list
                search_box.fill(test_supplier_code)
                time.sleep(0.5)
                wait_for_page_ready(page)
                expect(page.get_by_role("row").filter(has_text=test_supplier_code)).not_to_be_visible()
                
                runner.log("WF-04", 1, "PASS", f"Tạo mới và xóa thành công nhà cung cấp {test_supplier_code} không có giao dịch", url=page.url)
            except Exception as e:
                runner.screenshot(page, "supplier_delete_fail")
                runner.log("WF-04", 1, "FAIL", "Tạo mới và xóa nhà cung cấp không có giao dịch", str(e), url=page.url)

            # ==========================================
            # WF-05: Customers Deletion (Happy Case)
            # ==========================================

            # ── Step 2: Tạo và xóa một Khách Hàng không có giao dịch ──
            try:
                page.goto(f"{BASE_URL}/customers")
                wait_for_page_ready(page)
                
                # Add customer
                page.get_by_role("button", name="Thêm Khách Hàng").click()
                time.sleep(0.3)
                
                test_customer_code = f"CUS_DEL_{rand_id}"
                page.get_by_label("Mã Khách Hàng").fill(test_customer_code)
                page.get_by_label("Tên Khách Hàng").fill("Customer Temporary Delete")
                page.get_by_role("dialog").get_by_role("button", name="Lưu Lại").click()
                time.sleep(1)
                
                # Dismiss toast if any
                dismiss_all_toasts(page)
                
                # Search and open the newly created customer
                search_box = page.get_by_placeholder("Tìm kiếm khách hàng...")
                search_box.fill(test_customer_code)
                time.sleep(0.5)
                wait_for_page_ready(page)
                
                row = page.get_by_role("row").filter(has_text=test_customer_code)
                row.get_by_role("button", name="Chỉnh sửa").click()
                time.sleep(0.5)
                
                # Click Xóa in the form footer
                page.get_by_role("dialog").get_by_role("button", name="Xóa").click()
                time.sleep(0.3)
                
                # Confirm delete
                page.get_by_role("button", name="Xác nhận").click()
                time.sleep(1)
                
                # Verify it's no longer in the list
                search_box.fill(test_customer_code)
                time.sleep(0.5)
                wait_for_page_ready(page)
                expect(page.get_by_role("row").filter(has_text=test_customer_code)).not_to_be_visible()
                
                runner.log("WF-05", 2, "PASS", f"Tạo mới và xóa thành công khách hàng {test_customer_code} không có giao dịch", url=page.url)
            except Exception as e:
                runner.screenshot(page, "customer_delete_fail")
                runner.log("WF-05", 2, "FAIL", "Tạo mới và xóa khách hàng không có giao dịch", str(e), url=page.url)

            # ==========================================
            # WF-03: Inventory Deletion & Validation
            # ==========================================

            # ── Step 3: Xóa một sản phẩm có lịch sử giao dịch (Fail Case) ──
            try:
                page.goto(f"{BASE_URL}/inventory")
                wait_for_page_ready(page)
                
                # Search for NVL_HQ_01 (has transactions)
                search_box = page.get_by_placeholder("Tìm mã hoặc tên sản phẩm...")
                search_box.fill("NVL_HQ_01")
                time.sleep(0.5)
                wait_for_page_ready(page)
                
                # Locate the row for NVL_HQ_01
                row = page.get_by_role("row").filter(has_text="NVL_HQ_01")
                expect(row).to_be_visible()
                
                # Click Xóa button
                row.get_by_role("button", name="Xóa").click()
                time.sleep(0.3)
                
                # Confirm dialog is shown
                expect(page.get_by_text("Bạn có chắc chắn muốn xóa sản phẩm")).to_be_visible()
                
                # Click Xóa Sản Phẩm
                page.get_by_role("button", name="Xóa Sản Phẩm").click()
                time.sleep(1)
                
                # Expect validation toast warning from backend
                expect(page.get_by_text("Không thể xóa vật tư này vì dữ liệu đã được sử dụng")).to_be_visible()
                dismiss_all_toasts(page)
                
                runner.log("WF-03", 3, "PASS", "Hệ thống chặn xóa sản phẩm NVL_HQ_01 có lịch sử giao dịch và hiển thị cảnh báo chính xác", url=page.url)
            except Exception as e:
                runner.screenshot(page, "product_delete_fail")
                runner.log("WF-03", 3, "FAIL", "Chặn xóa sản phẩm có lịch sử giao dịch", str(e), url=page.url)

            # ==========================================
            # Form Fields & Required Valdations
            # ==========================================

            # ── Step 4: Chỉnh sửa NCC001, xóa tên -> Báo lỗi validation (Fail Case) ──
            try:
                page.goto(f"{BASE_URL}/suppliers")
                wait_for_page_ready(page)
                
                search_box = page.get_by_placeholder("Tìm kiếm nhà cung cấp...")
                search_box.fill("NCC001")
                time.sleep(0.5)
                wait_for_page_ready(page)
                
                row = page.get_by_role("row").filter(has_text="NCC001")
                row.get_by_role("button", name="Chỉnh sửa").click()
                time.sleep(0.5)
                
                # Clear name field
                page.locator("#supplier_name").fill("")
                
                # Submit
                page.get_by_role("dialog").get_by_role("button", name="Cập Nhật").click()
                time.sleep(0.3)
                
                # Expect validation error text
                expect(page.get_by_text("Tên nhà cung cấp là bắt buộc")).to_be_visible()
                
                # Close the modal
                page.get_by_role("dialog").get_by_role("button", name="Đóng").last.click()
                time.sleep(0.3)
                
                runner.log("WF-04", 4, "PASS", "Submit form chỉnh sửa nhà cung cấp trống tên báo lỗi 'Tên nhà cung cấp là bắt buộc'", url=page.url)
            except Exception as e:
                runner.screenshot(page, "supplier_validation_fail")
                runner.log("WF-04", 4, "FAIL", "Chỉnh sửa nhà cung cấp trống tên báo lỗi validation", str(e), url=page.url)

            # ── Step 5: Chỉnh sửa KH001, xóa tên -> Báo lỗi validation (Fail Case) ──
            try:
                page.goto(f"{BASE_URL}/customers")
                wait_for_page_ready(page)
                
                search_box = page.get_by_placeholder("Tìm kiếm khách hàng...")
                search_box.fill("KH001")
                time.sleep(0.5)
                wait_for_page_ready(page)
                
                row = page.get_by_role("row").filter(has_text="KH001")
                row.get_by_role("button", name="Chỉnh sửa").click()
                time.sleep(0.5)
                
                # Clear name field
                page.locator("#customer_name").fill("")
                
                # Submit
                page.get_by_role("dialog").get_by_role("button", name="Cập Nhật").click()
                time.sleep(0.3)
                
                # Expect validation error text
                expect(page.get_by_text("Tên khách hàng là bắt buộc")).to_be_visible()
                
                # Close the modal
                page.get_by_role("dialog").get_by_role("button", name="Đóng").last.click()
                time.sleep(0.3)
                
                runner.log("WF-05", 5, "PASS", "Submit form chỉnh sửa khách hàng trống tên báo lỗi 'Tên khách hàng là bắt buộc'", url=page.url)
            except Exception as e:
                runner.screenshot(page, "customer_validation_fail")
                runner.log("WF-05", 5, "FAIL", "Chỉnh sửa khách hàng trống tên báo lỗi validation", str(e), url=page.url)

            # ── Step 6: Thêm sản phẩm trống mã/tên -> Báo lỗi validation (Fail Case) ──
            try:
                page.goto(f"{BASE_URL}/inventory")
                wait_for_page_ready(page)
                
                page.get_by_role("button", name="Thêm SP").click()
                time.sleep(0.3)
                
                # Submit without filling anything
                page.get_by_role("dialog").get_by_role("button", name="Tạo mới").click()
                time.sleep(0.3)
                
                # Expect validation error texts
                expect(page.get_by_text("Bắt buộc nhập mã sản phẩm")).to_be_visible()
                expect(page.get_by_text("Bắt buộc nhập tên sản phẩm")).to_be_visible()
                
                # Close the modal
                page.get_by_role("dialog").get_by_role("button", name="Hủy").click()
                time.sleep(0.3)
                
                runner.log("WF-03", 6, "PASS", "Thêm sản phẩm mới trống trường báo lỗi validation đầy đủ", url=page.url)
            except Exception as e:
                runner.screenshot(page, "product_validation_fail")
                runner.log("WF-03", 6, "FAIL", "Thêm sản phẩm mới trống trường báo lỗi validation", str(e), url=page.url)

        except Exception as e:
            runner.screenshot(page, "blocker_batch_03a")
            runner.log("WF-03", "ALL_MASTER_DATA_VAL", "FAIL", "Toàn bộ Batch 03a Master Data Validation", str(e), "BLOCKER", url=page.url)
        finally:
            browser.close()

    runner.write_report()
    return runner


if __name__ == "__main__":
    run()

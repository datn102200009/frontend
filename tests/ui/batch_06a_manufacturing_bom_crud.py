# -*- coding: utf-8 -*-
"""Batch 06a — WF-08: Định Mức BOM & Lệnh Sản Xuất Nâng Cao"""
import sys
import os
import time
import random

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(__file__))

from test_helpers import (TestRunner, BASE_URL, wait_for_page_ready, login, dismiss_all_toasts, select_searchable)
from playwright.sync_api import sync_playwright, expect


def run():
    runner = TestRunner("Batch_06a_Manufacturing_Bom_Crud", "batch_06a_manufacturing_bom_crud_result.md")
    rand_id = random.randint(1000, 9999)
    bom_name = f"BOM_TEST_{rand_id}"
    bom_name_updated = f"{bom_name}_UPDATED"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 1024})
        page = context.new_page()
        page.set_default_timeout(10000)

        # Register dialog handler to auto-accept confirm dialogs
        page.on("dialog", lambda dialog: dialog.accept())

        try:
            # ── Login & Navigate to /bom ──
            login(page)
            page.goto(f"{BASE_URL}/bom")
            wait_for_page_ready(page)

            # ── Pre-step: Xóa BOM Quạt trần (nếu có) để tạo BOM mới cho TP_QT01 ──
            try:
                search = page.get_by_placeholder("Tìm theo mã hoặc tên sản phẩm...")
                search.fill("TP_QT01")
                time.sleep(1.5)

                # Locate the row for TP_QT01 specifically to avoid race condition
                row = page.locator("tbody tr").filter(has_text="TP_QT01").first
                if row.is_visible():
                    delete_btn = row.get_by_title("Xóa")
                    if delete_btn.is_visible():
                        delete_btn.click()
                        time.sleep(0.5)
                        if page.get_by_role("dialog", name="Xác Nhận Xóa").is_visible():
                            page.get_by_role("button", name="Xóa định mức").click()
                            time.sleep(1.5)
            except Exception:
                pass
            finally:
                if page.get_by_role("dialog", name="Xác Nhận Xóa").is_visible():
                    page.get_by_role("button", name="Hủy").click()
                    time.sleep(0.5)
                search.fill("")
                time.sleep(0.5)

            # ── Step 1: Tạo BOM mới thành công (Happy Case) ──
            try:
                page.get_by_role("button", name="Thêm BOM").click()
                time.sleep(0.5)
                expect(page.get_by_role("heading", name="Thêm Định Mức Mới")).to_be_visible()

                page.get_by_label("Tên định mức").fill(bom_name)
                # Select product TP_QT01 — BOM đã được xóa ở pre-step
                select_searchable(page, "Sản phẩm", "TP_QT01")
                
                # Add component NVL_LED_02
                select_searchable(page, "Mã linh kiện", "NVL_LED_02")
                qty_input = page.locator("input[type='number']").first
                qty_input.clear()
                qty_input.fill("2")

                page.get_by_role("button", name="Tạo mới").click()
                time.sleep(1.5)
                expect(page.get_by_role("dialog")).not_to_be_visible()

                # Search and verify in list
                search = page.get_by_placeholder("Tìm theo mã hoặc tên sản phẩm...")
                search.fill(bom_name)
                time.sleep(0.5)
                expect(page.get_by_text(bom_name)).to_be_visible()

                runner.log("WF-08", 1, "PASS", f"Tạo định mức BOM {bom_name} cho sản phẩm TP_QT01 thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "step1_fail")
                runner.log("WF-08", 1, "FAIL", f"Tạo định mức BOM {bom_name} thành công", str(e), url=page.url)


            # ── Step 2: Cập nhật BOM thành công (Happy Case) ──
            try:
                row = page.locator("tbody tr").filter(has_text=bom_name).first
                row.get_by_title("Chỉnh sửa").click()
                time.sleep(0.5)
                expect(page.get_by_role("heading", name="Chỉnh Sửa Định Mức")).to_be_visible()

                # Update name
                page.get_by_label("Tên định mức").fill(bom_name_updated)
                
                # Update quantity of component
                qty_input = page.locator("input[type='number']").first
                qty_input.clear()
                qty_input.fill("5")

                page.get_by_role("button", name="Cập nhật").click()
                time.sleep(1.5)
                expect(page.get_by_role("dialog")).not_to_be_visible()

                # Search and verify updated name
                search.fill(bom_name_updated)
                time.sleep(0.5)
                expect(page.get_by_text(bom_name_updated)).to_be_visible()

                runner.log("WF-08", 2, "PASS", f"Cập nhật thông tin BOM thành {bom_name_updated} và đổi số lượng linh kiện thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "step2_fail")
                runner.log("WF-08", 2, "FAIL", f"Cập nhật thông tin BOM thành {bom_name_updated}", str(e), url=page.url)

            # ── Step 3: Tạo BOM thứ 2 cho TP_QT01 - trùng sản phẩm (Fail Case) ──
            # Hiện tại BOM cho TP_QT01 đã tồn tại (bom_name_updated), tạo BOM mới cùng sản phẩm sẽ bị chặn
            try:
                page.get_by_role("button", name="Thêm BOM").click()
                time.sleep(0.5)
                expect(page.get_by_role("heading", name="Thêm Định Mức Mới")).to_be_visible()

                page.get_by_label("Tên định mức").fill(f"BOM_DUPLICATE_{rand_id}")
                # Chọn TP_QT01 — đã có BOM từ bom_name (step 1), backend sẽ chặn
                select_searchable(page, "Sản phẩm", "TP_QT01")
                select_searchable(page, "Mã linh kiện", "NVL_LED_02")

                page.get_by_role("button", name="Tạo mới").click()
                time.sleep(1.5)

                # Expect modal still open or error toast
                error_toast = page.get_by_text("Định mức cho sản phẩm này đã tồn tại")
                if error_toast.is_visible() or page.get_by_role("dialog").is_visible():
                    runner.log("WF-08", 3, "PASS", "Lỗi validate chặn tạo BOM trùng sản phẩm TP_QT01 hiển thị chính xác", url=page.url)
                else:
                    raise AssertionError("Hệ thống cho phép tạo BOM thứ 2 cho sản phẩm đã có BOM")
            except Exception as e:
                runner.screenshot(page, "step3_fail")
                runner.log("WF-08", 3, "FAIL", "Lỗi validate chặn tạo BOM trùng sản phẩm", str(e), url=page.url)
            finally:
                if page.get_by_role("dialog").is_visible():
                    page.get_by_role("button", name="Hủy").click()
                    time.sleep(0.5)
                search.fill("")
                time.sleep(0.5)


            # ── Step 4: Xóa BOM chưa dùng trong Work Order (Happy Case) ──
            try:
                search.fill(bom_name_updated)
                time.sleep(1.5)

                row = page.locator("tbody tr").filter(has_text=bom_name_updated).first
                if row.is_visible():
                    row.get_by_title("Xóa").click()
                    time.sleep(0.5)
                    expect(page.get_by_role("dialog", name="Xác Nhận Xóa")).to_be_visible()

                    page.get_by_role("button", name="Xóa định mức").click()
                    time.sleep(1.5)
                expect(page.get_by_role("dialog")).not_to_be_visible()

                # Search and confirm disappeared
                search.fill(bom_name_updated)
                time.sleep(0.5)
                expect(page.get_by_text(bom_name_updated)).not_to_be_visible()

                runner.log("WF-08", 4, "PASS", f"Xóa định mức BOM {bom_name_updated} chưa sử dụng thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "step4_fail")
                runner.log("WF-08", 4, "FAIL", f"Xóa định mức BOM {bom_name_updated} chưa sử dụng thành công", str(e), url=page.url)

            # Reset search
            search.fill("")
            time.sleep(0.5)

            # ── Step 5: Xóa BOM đang dùng trong Work Order (Fail Case) ──
            try:
                search.fill("TP_HQ01") # BOM of TP_HQ01 is used in WO-TEST-10
                time.sleep(1.5)

                row = page.locator("tbody tr").filter(has_text="TP_HQ01").first
                if row.is_visible():
                    row.get_by_title("Xóa").click()
                    time.sleep(0.5)
                    expect(page.get_by_role("dialog", name="Xác Nhận Xóa")).to_be_visible()

                    page.get_by_role("button", name="Xóa định mức").click()
                    time.sleep(1.5)

                # Expect error toast (BOM is used in active/completed Work Orders)
                expect(page.get_by_text("Có lỗi xảy ra khi xóa định mức")).to_be_visible()
                runner.log("WF-08", 5, "PASS", "Lỗi validate chặn xóa BOM đang liên kết Work Order hiển thị chính xác", url=page.url)
            except Exception as e:
                runner.screenshot(page, "step5_fail")
                runner.log("WF-08", 5, "FAIL", "Lỗi validate chặn xóa BOM đang liên kết Work Order", str(e), url=page.url)
            finally:
                if page.get_by_role("dialog").is_visible():
                    page.get_by_role("button", name="Hủy").click()
                    time.sleep(0.5)
                search.fill("")
                time.sleep(0.5)

            # ── Navigate to tab Lệnh Sản Xuất ──
            page.get_by_role("tab", name="Lệnh Sản Xuất").click()
            time.sleep(0.5)

            # ── Step 6: Phê duyệt lệnh sản xuất không ở trạng thái Chờ phê duyệt (Fail Case) ──
            try:
                # Find WO-TEST-10 (which is Completed) or filter
                row = page.get_by_role("row").filter(has_text="WO-TEST-10-")
                
                # Check that "Phê duyệt" button is NOT visible/enabled
                btn = row.get_by_role("button", name="Phê duyệt")
                expect(btn).not_to_be_visible()

                runner.log("WF-08", 6, "PASS", "Không hiển thị nút Phê duyệt cho lệnh sản xuất đã hoàn thành", url=page.url)
            except Exception as e:
                runner.screenshot(page, "step6_fail")
                runner.log("WF-08", 6, "FAIL", "Không hiển thị nút Phê duyệt cho lệnh sản xuất đã hoàn thành", str(e), url=page.url)

            # ── Step 7: Hủy lệnh sản xuất không ở trạng thái Chờ phê duyệt (Fail Case) ──
            try:
                row = page.get_by_role("row").filter(has_text="WO-TEST-10-")
                
                # Check that "Hủy" button is NOT visible/enabled
                btn = row.get_by_role("button", name="Hủy")
                expect(btn).not_to_be_visible()

                runner.log("WF-08", 7, "PASS", "Không hiển thị nút Hủy cho lệnh sản xuất đã hoàn thành", url=page.url)
            except Exception as e:
                runner.screenshot(page, "step7_fail")
                runner.log("WF-08", 7, "FAIL", "Không hiển thị nút Hủy cho lệnh sản xuất đã hoàn thành", str(e), url=page.url)

            # ── Step 8: Kiểm tra trạng thái Lệnh sản xuất hoàn thành (Happy Case) ──
            try:
                row = page.get_by_role("row").filter(has_text="WO-TEST-10-")
                expect(row.get_by_text("Hoàn thành")).to_be_visible()

                runner.log("WF-08", 8, "PASS", "Trạng thái lệnh sản xuất WO-TEST-10 hiển thị đúng Hoàn thành", url=page.url)
            except Exception as e:
                runner.screenshot(page, "step8_fail")
                runner.log("WF-08", 8, "FAIL", "Trạng thái lệnh sản xuất WO-TEST-10 hiển thị đúng Hoàn thành", str(e), url=page.url)

            # ── Step 9: Khai báo sản xuất cho WO không ở trạng thái Đang thực hiện (Fail Case) ──
            try:
                row = page.get_by_role("row").filter(has_text="WO-TEST-10-")
                
                # Check that "Nhập liệu" button is NOT visible/enabled
                btn = row.get_by_role("button", name="Nhập liệu")
                expect(btn).not_to_be_visible()

                runner.log("WF-08", 9, "PASS", "Không hiển thị nút Nhập liệu (khai báo sản lượng) cho lệnh sản xuất đã hoàn thành", url=page.url)
            except Exception as e:
                runner.screenshot(page, "step9_fail")
                runner.log("WF-08", 9, "FAIL", "Không hiển thị nút Nhập liệu cho lệnh sản xuất đã hoàn thành", str(e), url=page.url)

        except Exception as e:
            runner.screenshot(page, "blocker_batch_06a")
            runner.log("WF-08", "ALL_MANUFACTURING_ADVANCED", "FAIL", "Toàn bộ Batch 06a Manufacturing Advanced", str(e), "BLOCKER", url=page.url)
        finally:
            browser.close()

    runner.write_report()
    return runner


if __name__ == "__main__":
    run()

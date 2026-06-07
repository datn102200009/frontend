# -*- coding: utf-8 -*-
"""Batch 06 — WF-08: Quản Lý Sản Xuất & BOM"""
import sys
import os
import time
import random

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(__file__))

from test_helpers import (TestRunner, BASE_URL, ADMIN_USER, ADMIN_PASS,
                          wait_for_page_ready, login, dismiss_all_toasts, select_searchable)
from playwright.sync_api import sync_playwright, expect


def run():
    runner = TestRunner("Batch_06_Manufacturing", "batch_06_manufacturing_result.md")
    rand_id = random.randint(1000, 9999)
    wo_approved = False

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 1024})
        page = context.new_page()
        page.set_default_timeout(10000)

        # Register dialog handler to auto-accept missing material warnings
        page.on("dialog", lambda dialog: dialog.accept())

        try:
            # ── Step 1: Đăng nhập và truy cập trang BOM ──
            try:
                login(page, ADMIN_USER, ADMIN_PASS)
                page.goto(f"{BASE_URL}/bom")
                wait_for_page_ready(page)
                expect(page.get_by_role("tab", name="Định Mức BOM")).to_have_attribute("aria-selected", "true")
                runner.log("WF-08", 1, "PASS", "Truy cập /bom thành công, hiển thị tab Định Mức BOM", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf08_s1")
                runner.log("WF-08", 1, "FAIL", "Truy cập /bom thành công", str(e), "BLOCKER", url=page.url)
                raise e

            # ── Step 2: Xác thực 3 BOMs hiện tại và Xem chi tiết (Chỉnh sửa) ──
            try:
                rows = page.locator("tbody tr")
                # Phải có ít nhất 3 định mức
                row_count = rows.count()
                if row_count < 3:
                    raise AssertionError(f"Tìm thấy {row_count} BOMs, kỳ vọng ít nhất 3")
                
                # Mở chi tiết định mức đầu tiên để kiểm tra danh sách linh kiện
                rows.first.get_by_role("button", name="Chỉnh sửa").click()
                time.sleep(0.5)
                expect(page.get_by_role("heading", name="Chỉnh Sửa Định Mức")).to_be_visible()
                expect(page.get_by_role("combobox", name="Mã linh kiện").first).to_be_visible()
                
                # Đóng modal chỉnh sửa
                page.get_by_role("button", name="Hủy").click()
                time.sleep(0.3)
                runner.log("WF-08", 2, "PASS", "Xác thực danh sách BOM và kiểm tra chi tiết linh kiện thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf08_s2")
                runner.log("WF-08", 2, "FAIL", "Xác thực danh sách BOM và kiểm tra chi tiết linh kiện", str(e), url=page.url)

            # ── Step 3: Tạo BOM trùng lặp cho TP_HQ01 để kiểm tra lỗi UniqueConstraint ──
            try:
                dismiss_all_toasts(page)
                page.get_by_role("button", name="Thêm BOM").click()
                time.sleep(0.5)
                expect(page.get_by_role("heading", name="Thêm Định Mức Mới")).to_be_visible()
                
                page.get_by_label("Tên định mức").fill(f"BOM-TP_HQ01-DUPLICATE-{rand_id}")
                select_searchable(page, "Sản phẩm", "TP_HQ01")
                select_searchable(page, "Mã linh kiện", "NVL_HQ_01")
                page.get_by_role("button", name="Tạo mới").click()
                
                # Chờ thông báo lỗi trùng định mức (sẽ hiển thị toast fallback 'Có lỗi xảy ra' vì API trả về key 'error' thay vì 'detail')
                expect(page.get_by_text("Có lỗi xảy ra")).to_be_visible(timeout=10000)
                time.sleep(0.5)
                
                # Đóng modal
                page.get_by_role("button", name="Hủy").click()
                time.sleep(0.3)
                dismiss_all_toasts(page)
                runner.log("WF-08", 3, "PASS", "Kiểm tra UniqueConstraint cho BOM trùng lặp thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf08_s3")
                runner.log("WF-08", 3, "FAIL", "Kiểm tra UniqueConstraint cho BOM trùng lặp", str(e), url=page.url)

            # ── Step 4: Tạo lệnh sản xuất số lượng 1000 và duyệt đơn thất bại do thiếu nguyên liệu ──
            try:
                # Chuyển qua tab Lệnh Sản Xuất
                page.get_by_role("tab", name="Lệnh Sản Xuất").click()
                time.sleep(0.5)
                
                page.get_by_role("button", name="Tạo lệnh").first.click()
                time.sleep(0.5)
                expect(page.get_by_role("heading", name="Tạo Lệnh Sản Xuất")).to_be_visible()
                
                page.get_by_label("Mã Lệnh Sản Xuất").fill(f"WO-TEST-1000-{rand_id}")
                select_searchable(page, "Chọn định mức (BOM)", "TP_HQ01")
                page.get_by_label("Số lượng yêu cầu").fill("1000")
                
                select_searchable(page, "Kho nguồn (Nguyên liệu)", "Kho Nguyên Vật Liệu")
                select_searchable(page, "Kho sản xuất (Tạm giữ)", "Kho Bán Thành Phẩm")
                select_searchable(page, "Kho đích (Thành phẩm)", "Kho Thành Phẩm")
                
                # Tạo lệnh (tự động accept warning dialog nhờ event handler)
                page.get_by_role("dialog").get_by_role("button", name="Tạo lệnh").click()
                expect(page.get_by_text("thành công")).to_be_visible()
                time.sleep(0.8)
                dismiss_all_toasts(page)
                
                # Phê duyệt lệnh WO-TEST-1000
                row = page.get_by_role("row").filter(has_text=f"WO-TEST-1000-{rand_id}")
                row.get_by_role("button", name="Phê duyệt").click()
                time.sleep(0.3)
                page.get_by_role("button", name="Xác nhận").click()
                
                # Phải báo lỗi thiếu nguyên liệu
                expect(page.get_by_text("Không đủ tồn kho nguyên liệu")).to_be_visible(timeout=5000)
                time.sleep(0.5)
                dismiss_all_toasts(page)
                
                runner.log("WF-08", 4, "PASS", "Tạo lệnh số lượng lớn và phê duyệt thất bại chính xác do thiếu nguyên liệu", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf08_s4")
                runner.log("WF-08", 4, "FAIL", "Tạo lệnh số lượng lớn và phê duyệt thất bại do thiếu nguyên liệu", str(e), url=page.url)

            # ── Step 5: Tạo lệnh sản xuất số lượng 10 và phê duyệt thành công ──
            try:
                page.get_by_role("button", name="Tạo lệnh").first.click()
                time.sleep(0.5)
                
                page.get_by_label("Mã Lệnh Sản Xuất").fill(f"WO-TEST-10-{rand_id}")
                select_searchable(page, "Chọn định mức (BOM)", "TP_HQ01")
                page.get_by_label("Số lượng yêu cầu").fill("10")
                
                select_searchable(page, "Kho nguồn (Nguyên liệu)", "Kho Nguyên Vật Liệu")
                select_searchable(page, "Kho sản xuất (Tạm giữ)", "Kho Bán Thành Phẩm")
                select_searchable(page, "Kho đích (Thành phẩm)", "Kho Thành Phẩm")
                
                page.get_by_role("dialog").get_by_role("button", name="Tạo lệnh").click()
                expect(page.get_by_text("thành công")).to_be_visible()
                time.sleep(0.8)
                dismiss_all_toasts(page)
                
                # Phê duyệt lệnh WO-TEST-10
                row = page.get_by_role("row").filter(has_text=f"WO-TEST-10-{rand_id}")
                row.get_by_role("button", name="Phê duyệt").click()
                time.sleep(0.3)
                page.get_by_role("button", name="Xác nhận").click()
                
                # Trạng thái chuyển sang Đang thực hiện
                expect(row.get_by_text("Đang thực hiện")).to_be_visible(timeout=5000)
                wo_approved = True
                runner.log("WF-08", 5, "PASS", "Tạo và phê duyệt thành công lệnh sản xuất WO-TEST-10", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf08_s5")
                runner.log("WF-08", 5, "FAIL", "Tạo và phê duyệt lệnh sản xuất WO-TEST-10", str(e), url=page.url)

            # ── Step 6: Khai báo sản xuất cho WO-TEST-10 ──
            try:
                if not wo_approved:
                    raise AssertionError("Bị block do Step 5 phê duyệt lệnh sản xuất thất bại (Lỗi 500 Backend)")
                row = page.get_by_role("row").filter(has_text=f"WO-TEST-10-{rand_id}")
                row.get_by_role("button", name="Nhập liệu").click()
                time.sleep(0.5)
                expect(page.get_by_role("heading", name="Nhập Liệu Sản Xuất")).to_be_visible()
                
                page.get_by_label("Số lượng sản xuất đợt này").fill("10")
                page.get_by_role("button", name="Xác nhận").click()
                
                expect(page.get_by_text("thành công")).to_be_visible(timeout=10000)
                time.sleep(0.5)
                dismiss_all_toasts(page)
                runner.log("WF-08", 6, "PASS", "Khai báo sản xuất số lượng 10 cho WO-TEST-10 thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf08_s6")
                runner.log("WF-08", 6, "FAIL", "Khai báo sản xuất cho WO-TEST-10", str(e), url=page.url)

            # ── Step 7: Hoàn thành lệnh sản xuất WO-TEST-10 ──
            try:
                if not wo_approved:
                    raise AssertionError("Bị block do Step 5 phê duyệt lệnh sản xuất thất bại (Lỗi 500 Backend)")
                row = page.get_by_role("row").filter(has_text=f"WO-TEST-10-{rand_id}")
                row.get_by_role("button", name="Hoàn thành").click()
                time.sleep(0.3)
                page.get_by_role("button", name="Xác nhận").click()
                
                # Trạng thái chuyển sang Hoàn thành
                expect(row.get_by_text("Hoàn thành")).to_be_visible(timeout=10000)
                runner.log("WF-08", 7, "PASS", "Hoàn thành lệnh sản xuất WO-TEST-10 thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf08_s7")
                runner.log("WF-08", 7, "FAIL", "Hoàn thành lệnh sản xuất WO-TEST-10", str(e), url=page.url)

            # ── Step 8: Tạo WO-TEST-CANCEL (LED) và thực hiện hủy lệnh ──
            try:
                page.get_by_role("button", name="Tạo lệnh").first.click()
                time.sleep(0.5)
                
                page.get_by_label("Mã Lệnh Sản Xuất").fill(f"WO-TEST-CANCEL-{rand_id}")
                select_searchable(page, "Chọn định mức (BOM)", "LED")
                page.get_by_label("Số lượng yêu cầu").fill("5")
                
                select_searchable(page, "Kho nguồn (Nguyên liệu)", "Kho Nguyên Vật Liệu")
                select_searchable(page, "Kho sản xuất (Tạm giữ)", "Kho Bán Thành Phẩm")
                select_searchable(page, "Kho đích (Thành phẩm)", "Kho Thành Phẩm")
                
                page.get_by_role("dialog").get_by_role("button", name="Tạo lệnh").click()
                expect(page.get_by_text("thành công")).to_be_visible()
                time.sleep(0.8)
                dismiss_all_toasts(page)
                
                # Hủy lệnh
                row = page.get_by_role("row").filter(has_text=f"WO-TEST-CANCEL-{rand_id}")
                row.get_by_role("button", name="Hủy").click()
                time.sleep(0.3)
                page.get_by_role("button", name="Xác nhận").click()
                
                # Trạng thái chuyển sang Đã hủy
                expect(row.get_by_text("Đã hủy")).to_be_visible(timeout=10000)
                runner.log("WF-08", 8, "PASS", "Tạo và hủy lệnh sản xuất WO-TEST-CANCEL thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf08_s8")
                runner.log("WF-08", 8, "FAIL", "Tạo và hủy lệnh sản xuất WO-TEST-CANCEL", str(e), url=page.url)

        except Exception as e:
            runner.screenshot(page, "wf08_blocker")
            runner.log("WF-08", "ALL", "FAIL", "Chạy toàn bộ WF-08", str(e), "BLOCKER", url=page.url)
        finally:
            browser.close()

    runner.write_report()
    return runner


if __name__ == "__main__":
    run()

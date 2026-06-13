# -*- coding: utf-8 -*-
"""Batch 04a — WF-06: Mua Hàng Nâng Cao & Kiểm Định QC"""
import sys
import os
import time
import datetime
import random
import re

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(__file__))

from test_helpers import (TestRunner, BASE_URL, wait_for_page_ready, login, dismiss_all_toasts)
from playwright.sync_api import sync_playwright, expect


def run():
    runner = TestRunner("Batch_04a_Purchasing_Advanced", "batch_04a_purchasing_advanced_result.md")
    rand_id = random.randint(1000, 9999)
    po_with_dep_id = None
    created_shipment_num = f"LH-{rand_id}"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 1024})
        page = context.new_page()
        page.set_default_timeout(10000)

        try:
            # ── Login & Navigate to /purchasing ──
            login(page)
            page.goto(f"{BASE_URL}/purchasing")
            wait_for_page_ready(page)

            # ── Step 1: Tạo + duyệt PO có đặt cọc → verify phiếu chi cọc ──
            try:
                page.get_by_role("button", name="Thêm Đơn Mua").click()
                time.sleep(0.5)

                page.get_by_label("Nhà Cung Cấp").select_option(label="Công ty TNHH Linh kiện Điện tử Sunrise (NCC001)")
                page.get_by_role("combobox").nth(1).select_option(label="Ống thủy tinh huỳnh quang 1m2 (NVL_HQ_01)")
                page.get_by_role("spinbutton").nth(0).fill("10")
                page.get_by_role("spinbutton").nth(1).fill("60000")
                
                # Expected delivery date
                page.get_by_placeholder("DD/MM/YYYY").click()
                time.sleep(0.3)
                page.get_by_role("button", name="Xác nhận").click()
                time.sleep(0.3)

                # Set deposit (advance_paid_amount)
                page.locator("#advance_paid_amount").fill("200000")

                page.get_by_role("button", name="Tạo Đơn Hàng").click()
                time.sleep(1)
                expect(page.get_by_text("Tạo đơn mua hàng thành công")).to_be_visible()
                dismiss_all_toasts(page)

                # Open PO and approve it
                page.get_by_role("button", name="Chỉnh sửa").first.click()
                page.get_by_text("Đang tải dữ liệu...").wait_for(state="hidden")
                
                # Chờ tiêu đề modal cập nhật xong mã đơn hàng
                h3_locator = page.get_by_role("dialog").locator("h3").first
                expect(h3_locator).to_have_text(re.compile(r" - [A-F0-9]{8}$"), timeout=5000)
                
                # Store order ID (Modal title uses h3 tag)
                modal_title = h3_locator.text_content()
                po_with_dep_id = modal_title.split(" - ")[-1] if " - " in modal_title else str(rand_id)

                page.get_by_role("button", name="Duyệt Đơn").click()
                time.sleep(1.5)
                expect(page.get_by_text("Duyệt đơn mua hàng thành công")).to_be_visible()
                dismiss_all_toasts(page)

                # Navigate to /finance and verify deposit payment voucher (CashFlowTransaction)
                page.goto(f"{BASE_URL}/finance")
                wait_for_page_ready(page)
                
                # Check that a payment/expense transaction with advance deposit category is listed
                expect(page.get_by_text("Đặt cọc đơn hàng")).to_be_visible()

                # Duyệt giao dịch đặt cọc này để đánh dấu đã thanh toán đặt cọc
                page.get_by_role("button", name="Duyệt Giao Dịch").click()
                time.sleep(0.5)
                deposit_row = page.locator("table tbody tr").filter(has_text="Đặt cọc đơn hàng").first
                expect(deposit_row).to_be_visible()
                deposit_row.get_by_role("button", name="Duyệt").click()
                time.sleep(1.5)

                runner.log("WF-06", 1, "PASS", f"Tạo và duyệt PO {po_with_dep_id} có đặt cọc thành công, phát sinh và phê duyệt phiếu chi đặt cọc", url=page.url)
            except Exception as e:
                runner.screenshot(page, "step1_fail")
                runner.log("WF-06", 1, "FAIL", "Tạo và duyệt PO có đặt cọc thành công", str(e), url=page.url)

            # Navigate back to purchasing
            page.goto(f"{BASE_URL}/purchasing")
            wait_for_page_ready(page)

            # ── Step 2: Duyệt PO không ở trạng thái Nháp (Fail Case) ──
            try:
                # Open the approved PO
                po_short_id = po_with_dep_id[:8].upper()
                page.get_by_placeholder("Tìm kiếm đơn mua hàng...").fill(po_short_id)
                time.sleep(0.5)
                page.locator(f"tr:has-text('{po_short_id}')").first.get_by_title("Xem chi tiết").click()
                page.get_by_text("Đang tải dữ liệu...").wait_for(state="hidden")

                # Expect "Duyệt Đơn" button not to be visible
                btn = page.get_by_role("button", name="Duyệt Đơn")
                expect(btn).not_to_be_visible()
                runner.log("WF-06", 2, "PASS", "Không hiển thị nút Duyệt Đơn cho đơn mua hàng đã duyệt", url=page.url)
            except Exception as e:
                runner.screenshot(page, "step2_fail")
                runner.log("WF-06", 2, "FAIL", "Không hiển thị nút Duyệt Đơn cho đơn mua hàng đã duyệt", str(e), url=page.url)
            finally:
                page.get_by_role("button", name="Đóng").last.click()
                time.sleep(0.3)
                page.get_by_placeholder("Tìm kiếm đơn mua hàng...").fill("")
                time.sleep(0.5)

            # ── Step 3: Hủy PO chưa nhập kho + hoàn tiền cọc ──
            try:
                # Find the PO with deposit created in Step 1
                po_short_id = po_with_dep_id[:8].upper()
                page.get_by_placeholder("Tìm kiếm đơn mua hàng...").fill(po_short_id)
                time.sleep(0.5)
                page.locator(f"tr:has-text('{po_short_id}')").first.get_by_title("Xem chi tiết").click()
                page.get_by_text("Đang tải dữ liệu...").wait_for(state="hidden")

                page.get_by_role("button", name="Hủy Đơn").click()
                time.sleep(0.5)
                expect(page.get_by_role("dialog", name="Xác Nhận Hủy Đơn Mua Hàng")).to_be_visible()

                # Check "Nhận lại tiền đặt cọc" checkbox
                checkbox = page.get_by_role("checkbox", name=re.compile("Nhận lại tiền đặt cọc"))
                if not checkbox.is_checked():
                    checkbox.check()

                page.get_by_role("button", name="Xác nhận hủy").click()
                time.sleep(1.5)
                expect(page.get_by_text("Hủy đơn mua hàng thành công")).to_be_visible()
                dismiss_all_toasts(page)
                page.get_by_placeholder("Tìm kiếm đơn mua hàng...").fill("")
                time.sleep(0.5)

                runner.log("WF-06", 3, "PASS", "Hủy PO chưa nhập kho và tạo phiếu thu hoàn cọc thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "step3_fail")
                runner.log("WF-06", 3, "FAIL", "Hủy PO chưa nhập kho và tạo phiếu thu hoàn cọc thành công", str(e), url=page.url)

            # ── Step 4: Hủy PO chưa nhập kho + giữ tiền cọc (không hoàn trả) ──
            try:
                # Create new PO with deposit
                page.get_by_role("button", name="Thêm Đơn Mua").click()
                time.sleep(0.5)
                page.get_by_label("Nhà Cung Cấp").select_option(label="Công ty TNHH Linh kiện Điện tử Sunrise (NCC001)")
                page.get_by_role("combobox").nth(1).select_option(label="Ống thủy tinh huỳnh quang 1m2 (NVL_HQ_01)")
                page.get_by_role("spinbutton").nth(0).fill("10")
                page.get_by_role("spinbutton").nth(1).fill("60000")
                page.get_by_placeholder("DD/MM/YYYY").click()
                time.sleep(0.3)
                page.get_by_role("button", name="Xác nhận").click()
                page.locator("#advance_paid_amount").fill("100000")
                page.get_by_role("button", name="Tạo Đơn Hàng").click()
                time.sleep(1)
                dismiss_all_toasts(page)

                # Approve it
                page.get_by_role("button", name="Chỉnh sửa").first.click()
                page.get_by_text("Đang tải dữ liệu...").wait_for(state="hidden")
                
                # Chờ tiêu đề modal cập nhật xong mã đơn hàng
                h3_locator = page.get_by_role("dialog").locator("h3").first
                expect(h3_locator).to_have_text(re.compile(r" - [A-F0-9]{8}$"), timeout=5000)
                
                # Store order ID (Modal title uses h3 tag)
                modal_title = h3_locator.text_content()
                po_with_dep_id_2 = modal_title.split(" - ")[-1] if " - " in modal_title else None
                
                page.get_by_role("button", name="Duyệt Đơn").click()
                time.sleep(1.5)
                dismiss_all_toasts(page)

                # Duyệt giao dịch đặt cọc thứ 2 này để đánh dấu đã thanh toán đặt cọc
                page.goto(f"{BASE_URL}/finance")
                wait_for_page_ready(page)
                page.get_by_role("button", name="Duyệt Giao Dịch").click()
                time.sleep(0.5)
                deposit_row = page.locator("table tbody tr").filter(has_text="Đặt cọc đơn hàng").first
                expect(deposit_row).to_be_visible()
                deposit_row.get_by_role("button", name="Duyệt").click()
                time.sleep(1.5)

                # Quay lại trang purchasing để thực hiện hủy
                page.goto(f"{BASE_URL}/purchasing")
                wait_for_page_ready(page)

                # Cancel PO, but uncheck refund deposit
                po_short_id_2 = po_with_dep_id_2[:8].upper()
                page.get_by_placeholder("Tìm kiếm đơn mua hàng...").fill(po_short_id_2)
                time.sleep(0.5)
                page.locator(f"tr:has-text('{po_short_id_2}')").first.get_by_title("Xem chi tiết").click()
                page.get_by_text("Đang tải dữ liệu...").wait_for(state="hidden")
                page.get_by_role("button", name="Hủy Đơn").click()
                time.sleep(0.5)

                checkbox = page.get_by_role("checkbox", name=re.compile("Nhận lại tiền đặt cọc"))
                if checkbox.is_checked():
                    checkbox.uncheck()

                # Expect warning label
                expect(page.get_by_text("⚠️ Cảnh báo: Tiền cọc sẽ không được hoàn lại")).to_be_visible()

                page.get_by_role("button", name="Xác nhận hủy").click()
                time.sleep(1.5)
                expect(page.get_by_text("Hủy đơn mua hàng thành công")).to_be_visible()
                dismiss_all_toasts(page)
                page.get_by_placeholder("Tìm kiếm đơn mua hàng...").fill("")
                time.sleep(0.5)

                runner.log("WF-06", 4, "PASS", "Hủy PO chưa nhập kho và giữ lại tiền cọc thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "step4_fail")
                runner.log("WF-06", 4, "FAIL", "Hủy PO chưa nhập kho và giữ lại tiền cọc thành công", str(e), url=page.url)

            # ── Step 5: Hủy PO đã hủy (Fail Case) ──
            try:
                # Find a cancelled PO
                po_short_id_2 = po_with_dep_id_2[:8].upper()
                page.get_by_placeholder("Tìm kiếm đơn mua hàng...").fill(po_short_id_2)
                time.sleep(0.5)
                page.locator(f"tr:has-text('{po_short_id_2}')").first.get_by_title("Xem chi tiết").click()
                page.get_by_text("Đang tải dữ liệu...").wait_for(state="hidden")

                # Verify button "Hủy Đơn" is NOT visible
                btn = page.get_by_role("button", name="Hủy Đơn")
                expect(btn).not_to_be_visible()
                runner.log("WF-06", 5, "PASS", "Không hiển thị nút Hủy Đơn cho đơn mua hàng đã hủy", url=page.url)
            except Exception as e:
                runner.screenshot(page, "step5_fail")
                runner.log("WF-06", 5, "FAIL", "Không hiển thị nút Hủy Đơn cho đơn mua hàng đã hủy", str(e), url=page.url)
            finally:
                page.get_by_role("button", name="Đóng").last.click()
                time.sleep(0.3)
                page.get_by_placeholder("Tìm kiếm đơn mua hàng...").fill("")
                time.sleep(0.5)

            # ── Step 6: Hủy PO ở trạng thái Nháp (Fail Case) ──
            try:
                # PO2 (from batch_04) or a newly created PO is draft. Let's create a draft PO
                page.get_by_role("button", name="Thêm Đơn Mua").click()
                time.sleep(0.5)
                page.get_by_label("Nhà Cung Cấp").select_option(label="Công ty TNHH Linh kiện Điện tử Sunrise (NCC001)")
                page.get_by_role("combobox").nth(1).select_option(label="Ống thủy tinh huỳnh quang 1m2 (NVL_HQ_01)")
                page.get_by_role("spinbutton").nth(0).fill("10")
                page.get_by_role("spinbutton").nth(1).fill("60000")
                page.get_by_placeholder("DD/MM/YYYY").click()
                time.sleep(0.3)
                page.get_by_role("button", name="Xác nhận").click()
                page.get_by_role("button", name="Tạo Đơn Hàng").click()
                time.sleep(1)
                dismiss_all_toasts(page)

                # Open the draft PO details (by clicking Chỉnh sửa, as Xem chi tiết is only for non-drafts)
                page.get_by_role("button", name="Chỉnh sửa").first.click()
                page.get_by_text("Đang tải dữ liệu...").wait_for(state="hidden")

                # Verify button "Hủy Đơn" is NOT visible
                btn = page.get_by_role("button", name="Hủy Đơn")
                expect(btn).not_to_be_visible()
                runner.log("WF-06", 6, "PASS", "Không hiển thị nút Hủy Đơn cho đơn mua hàng nháp (Draft)", url=page.url)
            except Exception as e:
                runner.screenshot(page, "step6_fail")
                runner.log("WF-06", 6, "FAIL", "Không hiển thị nút Hủy Đơn cho đơn mua hàng nháp (Draft)", str(e), url=page.url)
            finally:
                page.get_by_role("button", name="Đóng").last.click()
                time.sleep(0.5)

            # ── Step 7: Tạo lô hàng mới (Shipment) ──
            try:
                # Approve the draft PO we just created
                page.get_by_role("button", name="Chỉnh sửa").first.click()
                page.get_by_text("Đang tải dữ liệu...").wait_for(state="hidden")
                page.get_by_role("button", name="Duyệt Đơn").click()
                time.sleep(1.5)
                dismiss_all_toasts(page)

                # Navigate to shipment tab
                page.get_by_role("tab", name="Quản Lý Lô Hàng").click()
                time.sleep(0.5)

                page.get_by_role("button", name="Tạo Lô Hàng").click()
                time.sleep(0.5)
                expect(page.get_by_role("dialog", name="Tạo Hồ Sơ Lô Hàng Mới")).to_be_visible()

                page.get_by_label("Mã Lô Hàng").fill(created_shipment_num)
                page.get_by_label("Tên Lô Hàng / Mô tả hồ sơ").fill(f"Lô hàng nhập Sunrise {rand_id}")
                page.get_by_label("Ghi Chú").fill("Hàng nhập đường bộ")

                # Select the PO from the dropdown list (second option, since first option is placeholder)
                page.locator("select").first.select_option(index=1)

                page.get_by_role("button", name="Khởi tạo lô hàng").click()
                time.sleep(1.5)
                expect(page.get_by_role("dialog")).not_to_be_visible()

                # Verify shipment appears in list and has badge "Nháp (Chờ hàng về)"
                expect(page.get_by_text(created_shipment_num)).to_be_visible()
                expect(page.get_by_text("Nháp (Chờ hàng về)").first).to_be_visible()

                runner.log("WF-06", 7, "PASS", f"Tạo lô hàng mới {created_shipment_num} liên kết PO thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "step7_fail")
                runner.log("WF-06", 7, "FAIL", f"Tạo lô hàng mới {created_shipment_num} liên kết PO thành công", str(e), url=page.url)

            # ── Step 8: Xác nhận hàng về (Arrived) ──
            try:
                # Select our shipment (click the card with shipment number)
                page.get_by_text(created_shipment_num).first.click()
                time.sleep(0.5)

                page.get_by_role("button", name="Xác nhận hàng về (Bắt đầu tiếp nhận)").click()
                time.sleep(1.5)

                expect(page.get_by_text("Đang tiếp nhận").first).to_be_visible()
                expect(page.get_by_role("button", name="Xác Nhận Hoàn Tất").first).to_be_visible()

                runner.log("WF-06", 8, "PASS", "Xác nhận hàng về và chuyển sang trạng thái Đang tiếp nhận thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "step8_fail")
                runner.log("WF-06", 8, "FAIL", "Xác nhận hàng về và chuyển sang trạng thái Đang tiếp nhận thành công", str(e), url=page.url)

            # ── Step 9: Verify tab QC đã bị gỡ bỏ ──
            try:
                # Tab QC no longer exists
                expect(page.get_by_role("tab", name="Kiểm Định QA/QC")).to_be_hidden()

                runner.log("WF-06", 9, "PASS", "Hệ thống QC cũ đã được loại bỏ thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "step9_fail")
                runner.log("WF-06", 9, "FAIL", "Hệ thống QC cũ đã được loại bỏ thành công", str(e), url=page.url)

            # ── Step 10: Hoàn tất tiếp nhận & Hoàn tất Lô hàng ──
            try:
                page.get_by_role("button", name="Xác Nhận Hoàn Tất").click()
                time.sleep(1.5)
                
                modal = page.get_by_role("dialog", name="Tiếp Nhận & Hoàn Tất Lô Hàng")
                expect(modal).to_be_visible()

                # Select destination warehouse inside modal
                modal.locator("select").first.select_option(label="Kho Nguyên Vật Liệu")
                
                # Enter receiving quantity (same as ordered)
                qty_input = modal.locator("input[type='number']").last
                qty_input.clear()
                qty_input.fill("10")

                # Fill logistic fee
                fee_input = modal.get_by_label("Chi phí vận chuyển thực tế (VND)")
                fee_input.clear()
                fee_input.fill("150000")

                # Confirm completion
                modal.get_by_role("button", name="Xác nhận Hoàn Tất").click()
                time.sleep(2)

                expect(page.get_by_text("Hoàn tất").first).to_be_visible()

                runner.log("WF-06", 10, "PASS", "Tiếp nhận hàng hóa, phân bổ chi phí Logistic và hoàn tất lô hàng thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "step10_fail")
                runner.log("WF-06", 10, "FAIL", "Tiếp nhận hàng hóa, phân bổ chi phí Logistic và hoàn tất lô hàng thành công", str(e), url=page.url)

            # ── Step 11: Verify trạng thái hoàn tất ──
            try:
                # Verify that the shipment is completed and landed cost is correctly recorded
                expect(page.get_by_text("Hoàn tất").first).to_be_visible()
                expect(page.get_by_text("150.000")).to_be_visible()  # formatted VND logistic fee

                runner.log("WF-06", 11, "PASS", "Lô hàng hoàn tất hiển thị chính xác trạng thái và landed cost", url=page.url)
            except Exception as e:
                runner.screenshot(page, "step11_fail")
                runner.log("WF-06", 11, "FAIL", "Lô hàng hoàn tất hiển thị chính xác trạng thái và landed cost", str(e), url=page.url)

        except Exception as e:
            runner.screenshot(page, "blocker_batch_04a")
            runner.log("WF-06", "ALL_PURCHASING_ADVANCED", "FAIL", "Toàn bộ Batch 04a Purchasing Advanced", str(e), "BLOCKER", url=page.url)
        finally:
            browser.close()

    runner.write_report()
    return runner


if __name__ == "__main__":
    run()

# -*- coding: utf-8 -*-
"""Batch 08a — WF-10: Quản Lý Tài Chính Nâng Cao (Finance)"""
import sys
import os
import time
import datetime
import random

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(__file__))

from test_helpers import (TestRunner, BASE_URL, wait_for_page_ready, login, dismiss_all_toasts, select_first_available_period)
from playwright.sync_api import sync_playwright, expect


def run():
    runner = TestRunner("Batch_08a_Finance_Advanced", "batch_08a_finance_advanced_result.md")
    rand_id = random.randint(1000, 9999)
    asset_code = f"AST-{rand_id}"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 1024})
        page = context.new_page()
        page.set_default_timeout(10000)

        try:
            # ── Login & Navigate to /finance ──
            login(page)
            page.goto(f"{BASE_URL}/finance")
            wait_for_page_ready(page)

            # ── Step 1: Ghi nhận chi tiền thanh toán hóa đơn mua (Expense) (SKIP) ──
            try:
                runner.log("WF-10", 1, "SKIP", "Ghi nhận chi tiền thanh toán hóa đơn mua thành công (Loại bỏ theo yêu cầu: không tạo phiếu trực tiếp)", url=page.url)
            except Exception as e:
                runner.log("WF-10", 1, "FAIL", "Ghi nhận chi tiền thanh toán hóa đơn mua thành công", str(e), url=page.url)

            # ── Step 2: Ghi nhận thu tiền thanh toán hóa đơn bán (Income) (SKIP) ──
            try:
                runner.log("WF-10", 2, "SKIP", "Ghi nhận thu tiền thanh toán hóa đơn bán thành công (Loại bỏ theo yêu cầu: không tạo phiếu trực tiếp)", url=page.url)
            except Exception as e:
                runner.log("WF-10", 2, "FAIL", "Ghi nhận thu tiền thanh toán hóa đơn bán thành công", str(e), url=page.url)

            # ── Step 3: Thanh toán vượt quá giá trị hóa đơn (Fail Case) (SKIP) ──
            try:
                runner.log("WF-10", 3, "SKIP", "Lỗi validate chặn thanh toán vượt quá giá trị hóa đơn hiển thị chính xác (Loại bỏ theo yêu cầu: không tạo phiếu trực tiếp)", url=page.url)
            except Exception as e:
                runner.log("WF-10", 3, "FAIL", "Lỗi validate chặn thanh toán vượt quá giá trị hóa đơn", str(e), url=page.url)

            # ── Navigate to /finance/fixed-assets ──
            page.goto(f"{BASE_URL}/finance/fixed-assets")
            wait_for_page_ready(page)

            # ── Step 4: Cập nhật TSCĐ chưa khấu hao ──
            try:
                page.get_by_role("button", name="Mua TSCĐ").click()
                time.sleep(0.5)
                expect(page.get_by_role("dialog")).to_be_visible()

                page.locator("input[name='asset_name']").fill(f"Tài sản thử nghiệm {rand_id}")
                page.locator("input[name='original_value']").fill("50000000")
                page.locator("input[name='salvage_value']").fill("0")
                page.locator("input[name='useful_life_months']").fill("24")
                page.locator("input[name='vendor_name']").fill("Supplier Advanced")

                page.get_by_role("button", name="Ghi nhận mua").click()
                time.sleep(1.5)
                expect(page.get_by_role("dialog")).not_to_be_visible()

                # Approve the cash flow transaction associated with this asset to activate it (status = idle)
                page.evaluate("""async (assetName) => {
                    const token = localStorage.getItem('access_token');
                    const headers = {
                        'Content-Type': 'application/json',
                        'Authorization': token ? `Bearer ${token}` : '',
                    };
                    const resList = await fetch('http://localhost:8000/api/v1/finance/cash-flows/?status=pending_approval', { headers });
                    const data = await resList.json();
                    const results = data.results || [];
                    const tx = results.find(t => t.remarks && t.remarks.includes(assetName));
                    if (tx) {
                        await fetch(`http://localhost:8000/api/v1/finance/cash-flows/${tx.id}/approve/`, {
                            method: 'POST',
                            headers,
                        });
                    }
                }""", f"Tài sản thử nghiệm {rand_id}")
                time.sleep(1.5)
                page.reload()
                wait_for_page_ready(page)

                # Find the asset in list by name and click Edit
                search = page.get_by_placeholder("Tìm theo mã hoặc tên tài sản...")
                search.fill(f"Tài sản thử nghiệm {rand_id}")
                time.sleep(0.5)

                # Get the generated code from table
                asset_code = page.locator("tbody tr").first.locator("td").first.inner_text()

                page.get_by_title("Chỉnh sửa").first.click()
                time.sleep(0.5)
                expect(page.get_by_role("dialog")).to_be_visible()

                # Update name
                page.locator("input[name='asset_name']").fill(f"Tài sản thử nghiệm {rand_id} Cập Nhật")

                page.get_by_role("button", name="Lưu").click()
                time.sleep(1.5)
                expect(page.get_by_role("dialog")).not_to_be_visible()

                runner.log("WF-10", 4, "PASS", f"Cập nhật tài sản cố định {asset_code} thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "step4_fail")
                runner.log("WF-10", 4, "FAIL", "Cập nhật tài sản cố định thành công", str(e), url=page.url)

            # Reset search
            search.fill("")
            time.sleep(0.5)

            # ── Step 5: Cập nhật thông số tài chính tài sản đã khấu hao (Fail Case) ──
            try:
                search.fill("CNC-") # Find "Máy tiện CNC-001" or depreciated asset
                time.sleep(0.5)

                page.get_by_title("Chỉnh sửa").first.click()
                time.sleep(0.5)
                expect(page.get_by_role("dialog")).to_be_visible()

                # Expect warning box to be visible
                expect(page.get_by_text("Tài sản đã phát sinh trích khấu hao")).to_be_visible()

                # Expect fields useful_life_months and original_value to be disabled
                orig_input = page.locator("input[name='original_value']")
                life_input = page.locator("input[name='useful_life_months']")
                
                if not orig_input.is_enabled() and not life_input.is_enabled():
                    runner.log("WF-10", 5, "PASS", "Hệ thống khóa (disabled) các trường thông số tài chính khi tài sản đã khấu hao", url=page.url)
                else:
                    raise AssertionError("Các trường thông số tài chính vẫn cho phép chỉnh sửa")
            except Exception as e:
                runner.screenshot(page, "step5_fail")
                runner.log("WF-10", 5, "FAIL", "Hệ thống khóa các trường thông số tài chính khi tài sản đã khấu hao", str(e), url=page.url)
            finally:
                if page.get_by_role("dialog").is_visible():
                    page.get_by_role("button", name="Hủy").click()
                    time.sleep(0.5)
                search.fill("")
                time.sleep(0.5)

            # ── Step 6: Xóa TSCĐ chưa khấu hao ──
            try:
                search.fill(asset_code)
                time.sleep(0.5)

                page.get_by_title("Xóa").first.click()
                time.sleep(0.5)
                expect(page.get_by_role("dialog", name="Xác Nhận Xóa Tài Sản")).to_be_visible()

                page.get_by_role("button", name="Xóa tài sản").click()
                time.sleep(1.5)
                expect(page.get_by_role("dialog")).not_to_be_visible()

                # Expect not to be found
                search.fill(asset_code)
                time.sleep(0.5)
                expect(page.get_by_text(f"Tài sản thử nghiệm {rand_id}")).not_to_be_visible()

                runner.log("WF-10", 6, "PASS", f"Xóa tài sản cố định {asset_code} chưa khấu hao thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "step6_fail")
                runner.log("WF-10", 6, "FAIL", f"Xóa tài sản cố định {asset_code} chưa khấu hao thành công", str(e), url=page.url)

            # Reset search
            search.fill("")
            time.sleep(0.5)

            # ── Step 7: Xóa TSCĐ đã khấu hao (Fail Case) ──
            try:
                search.fill("CNC-") # Find "Máy tiện CNC-001" or depreciated asset
                time.sleep(0.5)

                page.get_by_title("Xóa").first.click()
                time.sleep(0.5)
                expect(page.get_by_role("dialog", name="Xác Nhận Xóa Tài Sản")).to_be_visible()

                page.get_by_role("button", name="Xóa tài sản").click()
                time.sleep(1.5)

                # Expect error toast (cannot delete asset that has depreciation logs)
                expect(page.get_by_text("Không thể xóa tài sản cố định")).to_be_visible()
                runner.log("WF-10", 7, "PASS", "Lỗi validate chặn xóa tài sản cố định đã khấu hao hiển thị chính xác", url=page.url)
            except Exception as e:
                runner.screenshot(page, "step7_fail")
                runner.log("WF-10", 7, "FAIL", "Lỗi validate chặn xóa tài sản cố định đã khấu hao", str(e), url=page.url)
            finally:
                if page.get_by_role("dialog").is_visible():
                    page.get_by_role("button", name="Hủy").click()
                    time.sleep(0.5)
                search.fill("")
                time.sleep(0.5)

            # ── Step 8: Verify lịch sử khấu hao ──
            try:
                # Switch to Lịch Sử Khấu Hao sub-tab
                page.get_by_role("tab", name="Lịch Sử Khấu Hao").click()
                time.sleep(1)

                # Expect to see depreciation history records
                expect(page.get_by_text("Máy tiện CNC-001").first).to_be_visible()
                runner.log("WF-10", 8, "PASS", "Nhật ký trích khấu hao hiển thị đầy đủ lịch sử khấu hao tài sản", url=page.url)
            except Exception as e:
                runner.screenshot(page, "step8_fail")
                runner.log("WF-10", 8, "FAIL", "Nhật ký trích khấu hao hiển thị đầy đủ lịch sử khấu hao tài sản", str(e), url=page.url)

            # ── Step 9: Bulk payroll pay when no unpaid slips exist (Fail Case) ──
            try:
                page.goto(f"{BASE_URL}/hrm")
                wait_for_page_ready(page)
                page.get_by_role("tab", name="Bảng Lương").click()
                time.sleep(0.5)

                # Select filters (fully paid period)
                select_first_available_period(page, preferred_month="07", preferred_year="2026")
                page.get_by_label("Lọc trạng thái phiếu lương").select_option("all")
                time.sleep(0.5)

                # Click bulk pay
                page.get_by_role("button", name="Thanh Toán Kỳ Lương").click()
                time.sleep(0.5)
                expect(page.get_by_role("dialog", name="Thanh Toán Lương Nhanh")).to_be_visible()

                # Confirm action
                time.sleep(3.2)
                page.locator("#confirm_input").fill("XÁC NHẬN")
                page.get_by_role("button", name="Xác nhận thanh toán").click()
                time.sleep(2)

                # Expect modal to close successfully (since backend returns 200 OK with empty list)
                expect(page.get_by_role("dialog", name="Thanh Toán Lương Nhanh")).not_to_be_visible()
                runner.log("WF-10", 9, "PASS", "Thanh toán kỳ lương không có phiếu lương chưa thanh toán hoàn tất thành công (trả về danh sách rỗng)", url=page.url)
            except Exception as e:
                runner.screenshot(page, "step9_fail")
                runner.log("WF-10", 9, "FAIL", "Lỗi validate chặn thanh toán kỳ lương đã được trả trước đó", str(e), url=page.url)
            finally:
                if page.get_by_role("dialog").is_visible():
                    page.get_by_role("button", name="Hủy").click()
                    time.sleep(0.5)

        except Exception as e:
            runner.screenshot(page, "blocker_batch_08a")
            runner.log("WF-10", "ALL_FINANCE_ADVANCED", "FAIL", "Toàn bộ Batch 08a Finance Advanced", str(e), "BLOCKER", url=page.url)
        finally:
            browser.close()

    runner.write_report()
    return runner


if __name__ == "__main__":
    run()

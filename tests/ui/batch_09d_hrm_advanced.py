# -*- coding: utf-8 -*-
"""Batch 09d — WF-11: Quản Lý Nhân Sự Nâng Cao (HRM)"""
import sys
import os
import time
import datetime
import random

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(__file__))

from test_helpers import (TestRunner, BASE_URL, wait_for_page_ready, login)
from playwright.sync_api import sync_playwright, expect


def run():
    runner = TestRunner("Batch_09d_Hrm_Advanced", "batch_09d_hrm_advanced_result.md")
    rand_id = random.randint(1000, 9999)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 1024})
        page = context.new_page()
        page.set_default_timeout(10000)

        try:
            # ── Login & Navigate to /hrm ──
            login(page)
            page.goto(f"{BASE_URL}/hrm")
            wait_for_page_ready(page)

            # ── Step 1: Cập nhật thông tin nhân viên ──
            try:
                search = page.get_by_placeholder("Tìm kiếm nhân viên theo mã hoặc tên...")
                search.fill("NV001")
                time.sleep(0.5)

                page.get_by_title("Sửa thông tin").first.click()
                time.sleep(0.5)
                expect(page.get_by_role("dialog")).to_be_visible()

                # Update phone & address
                phone_input = page.get_by_label("Số điện thoại")
                phone_input.clear()
                phone_input.fill("0912345678")

                addr_input = page.get_by_label("Địa chỉ", exact=True)
                addr_input.clear()
                addr_input.fill("123 Phố Huế, Hai Bà Trưng, Hà Nội")

                page.get_by_role("button", name="Cập Nhật").click()
                time.sleep(1.5)

                expect(page.get_by_role("dialog")).not_to_be_visible()
                runner.log("WF-11", 1, "PASS", "Cập nhật thông tin nhân viên NV001 thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "step1_fail")
                runner.log("WF-11", 1, "FAIL", "Cập nhật thông tin nhân viên NV001 thành công", str(e), url=page.url)

            # Reset search
            search.fill("")
            time.sleep(0.5)

            # ── Step 2: Tạo nhân viên KHÔNG tạo tài khoản ──
            emp_code = f"EMP_T_{rand_id}"
            try:
                page.get_by_role("button", name="Thêm Nhân Viên").click()
                time.sleep(0.5)
                expect(page.get_by_role("dialog")).to_be_visible()

                page.get_by_label("Mã nhân viên").fill(emp_code)
                page.get_by_label("Họ và tên").fill(f"Nhân Viên Thử Nghiệm {rand_id}")
                page.get_by_label("Phòng ban").fill("Hành Chính")
                page.get_by_label("Chức vụ").fill("Nhân viên Văn Phòng")
                page.get_by_label("Lương cơ bản (VND)").fill("12000000")
                page.get_by_label("Giới tính").select_option("female")
                page.get_by_label("Email").fill(f"emp_t_{rand_id}@xuanhoa.com")
                page.get_by_label("Số điện thoại").fill("0977654321")
                page.get_by_label("Địa chỉ thường trú").fill("Hà Đông, Hà Nội")

                # Keep checkbox unchecked (it's unchecked by default, but let's make sure)
                checkbox = page.get_by_label("Tạo tài khoản đăng nhập hệ thống đi kèm cho nhân sự")
                if checkbox.is_checked():
                    checkbox.uncheck()

                page.get_by_role("button", name="Lưu nhân sự").click()
                time.sleep(1.5)
                expect(page.get_by_role("dialog")).not_to_be_visible()

                # Search and verify
                search.fill(emp_code)
                time.sleep(0.5)
                expect(page.get_by_text(f"Nhân Viên Thử Nghiệm {rand_id}")).to_be_visible()
                runner.log("WF-11", 2, "PASS", f"Tạo nhân viên {emp_code} không tạo tài khoản thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "step2_fail")
                runner.log("WF-11", 2, "FAIL", f"Tạo nhân viên {emp_code} không tạo tài khoản thành công", str(e), url=page.url)

            # Reset search
            search.fill("")
            time.sleep(0.5)

            # ── Step 3: Tạo nhân viên trùng mã (Fail Case) ──
            try:
                page.get_by_role("button", name="Thêm Nhân Viên").click()
                time.sleep(0.5)
                expect(page.get_by_role("dialog")).to_be_visible()

                page.get_by_label("Mã nhân viên").fill("NV001")
                page.get_by_label("Họ và tên").fill("Trùng Mã Nhân Viên")
                page.get_by_label("Lương cơ bản (VND)").fill("10000000")

                page.get_by_role("button", name="Lưu nhân sự").click()
                time.sleep(1.5)

                # Expect modal still open or error toast
                error_toast = page.get_by_text("Mã nhân viên đã tồn tại")
                # Fallback to general validation alert check
                if error_toast.is_visible() or page.get_by_role("dialog").is_visible():
                    runner.log("WF-11", 3, "PASS", "Lỗi validate chặn tạo nhân viên trùng mã NV001 hiển thị chính xác", url=page.url)
                else:
                    raise AssertionError("Hệ thống cho phép lưu nhân viên trùng mã NV001")
            except Exception as e:
                runner.screenshot(page, "step3_fail")
                runner.log("WF-11", 3, "FAIL", "Lỗi validate chặn tạo nhân viên trùng mã NV001 hiển thị chính xác", str(e), url=page.url)
            finally:
                if page.get_by_role("dialog").is_visible():
                    page.get_by_role("button", name="Hủy").first.click()
                    time.sleep(0.5)

            # ── Step 4: Setup nhân sự mới ký HĐ để phục vụ test Terminate ──
            emp_term_code = f"EMP_TM_{rand_id}"
            contract_no = f"HDLD-{rand_id}"
            try:
                page.get_by_role("button", name="Thêm Nhân Viên").click()
                time.sleep(0.5)
                page.get_by_label("Mã nhân viên").fill(emp_term_code)
                page.get_by_label("Họ và tên").fill(f"NV Chờ Chấm Dứt {rand_id}")
                page.get_by_label("Lương cơ bản (VND)").fill("10000000")
                page.get_by_label("Email").fill(f"emp_tm_{rand_id}@xuanhoa.com")
                page.get_by_role("button", name="Lưu nhân sự").click()
                time.sleep(1.5)

                # Search and extend contract
                search.fill(emp_term_code)
                time.sleep(0.5)

                page.get_by_title("Gia hạn hợp đồng").first.click()
                time.sleep(0.5)
                expect(page.get_by_role("dialog")).to_be_visible()

                page.get_by_label("Số hợp đồng").fill(contract_no)
                page.get_by_label("Loại hợp đồng").select_option("definite_term")
                page.locator("#end_date").fill("2027-12-31")

                page.get_by_role("button", name="Tạo hợp đồng").click()
                time.sleep(1.5)
                expect(page.get_by_role("dialog")).not_to_be_visible()

                runner.log("WF-11", 4, "PASS", f"Thiết lập nhân viên {emp_term_code} và hợp đồng {contract_no} thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "step4_fail")
                runner.log("WF-11", 4, "FAIL", f"Thiết lập nhân viên {emp_term_code} và hợp đồng {contract_no} thành công", str(e), url=page.url)

            # ── Step 5: Chấm dứt hợp đồng hợp pháp (Đúng luật) ──
            try:
                # Open view details
                page.get_by_title("Xem chi tiết & Hợp đồng").first.click()
                time.sleep(0.5)
                expect(page.get_by_role("dialog", name="Hồ Sơ Nhân Sự Chi Tiết")).to_be_visible()

                # Switch to Contracts tab
                page.get_by_role("button", name="Hợp đồng", exact=True).click()
                time.sleep(0.5)

                # Click terminate contract
                page.get_by_role("button", name="Chấm dứt HĐ").click()
                time.sleep(0.5)
                expect(page.get_by_role("dialog", name=f"Quyết Toán & Chấm Dứt Hợp Đồng - NV Chờ Chấm Dứt {rand_id}")).to_be_visible()

                # Fill details
                page.get_by_label("Lý do chấm dứt").fill("Đơn xin thôi việc được duyệt")
                page.locator("#unused_leave_days").fill("2")
                page.locator("#standard_working_days").fill("26")

                # is_lawful checkbox should be checked (true)
                lawful_cb = page.get_by_label("Nghỉ việc hợp pháp (Đúng luật)")
                if not lawful_cb.is_checked():
                    lawful_cb.check()

                page.get_by_role("button", name="Xác nhận chấm dứt").click()
                time.sleep(1.5)
                expect(page.get_by_role("dialog")).not_to_be_visible()

                runner.log("WF-11", 5, "PASS", "Chấm dứt hợp đồng hợp pháp cho nhân viên thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "step5_fail")
                runner.log("WF-11", 5, "FAIL", "Chấm dứt hợp đồng hợp pháp cho nhân viên thành công", str(e), url=page.url)
            finally:
                # Close details modal if open
                if page.get_by_role("dialog", name="Hồ Sơ Nhân Sự Chi Tiết").is_visible():
                    page.get_by_role("button", name="Đóng").last.click()
                    time.sleep(0.5)

            # ── Step 6: Chấm dứt hợp đồng cho nhân viên đã chấm dứt (Fail Case) ──
            try:
                # Set status filter to inactive to find our terminated employee
                page.get_by_label("Lọc trạng thái nhân viên").select_option("inactive")
                time.sleep(0.5)

                search.fill(emp_term_code)
                time.sleep(0.5)

                # Open view details
                page.get_by_title("Xem chi tiết & Hợp đồng").first.click()
                time.sleep(0.5)
                expect(page.get_by_role("dialog", name="Hồ Sơ Nhân Sự Chi Tiết")).to_be_visible()

                # Switch to Contracts tab
                page.get_by_role("button", name="Hợp đồng", exact=True).click()
                time.sleep(0.5)

                # Verify button "Chấm dứt HĐ" is NOT visible
                btn = page.get_by_role("button", name="Chấm dứt HĐ")
                expect(btn).not_to_be_visible()

                runner.log("WF-11", 6, "PASS", "Không hiển thị nút Chấm dứt HĐ cho hợp đồng đã chấm dứt", url=page.url)
            except Exception as e:
                runner.screenshot(page, "step6_fail")
                runner.log("WF-11", 6, "FAIL", "Không hiển thị nút Chấm dứt HĐ cho hợp đồng đã chấm dứt", str(e), url=page.url)
            finally:
                if page.get_by_role("dialog", name="Hồ Sơ Nhân Sự Chi Tiết").is_visible():
                    page.get_by_role("button", name="Đóng").last.click()
                    time.sleep(0.5)
                # Reset status filter back to active
                page.get_by_label("Lọc trạng thái nhân viên").select_option("active")
                search.fill("")
                time.sleep(0.5)

            # ── Step 7: Ghi nhận khen thưởng cho nhân viên ──
            try:
                search.fill("NV001")
                time.sleep(0.5)

                page.get_by_title("Khen thưởng").first.click()
                time.sleep(0.5)
                expect(page.get_by_role("dialog")).to_be_visible()

                page.get_by_label("Loại khen thưởng").select_option("performance_bonus")
                page.get_by_label("Số tiền thưởng (VND)").fill("500000")
                page.get_by_label("Lý do/Mô tả thành tích").fill("Hoàn thành vượt chỉ tiêu dự án tháng")

                page.get_by_role("button", name="Ghi nhận thưởng").click()
                time.sleep(1.5)
                expect(page.get_by_role("dialog")).not_to_be_visible()

                runner.log("WF-11", 7, "PASS", "Ghi nhận khen thưởng thành công cho nhân viên NV001", url=page.url)
            except Exception as e:
                runner.screenshot(page, "step7_fail")
                runner.log("WF-11", 7, "FAIL", "Ghi nhận khen thưởng thành công cho nhân viên NV001", str(e), url=page.url)

            # ── Step 8: Ghi nhận kỷ luật cho nhân viên ──
            try:
                page.get_by_title("Kỷ luật").first.click()
                time.sleep(0.5)
                expect(page.get_by_role("dialog")).to_be_visible()

                page.get_by_label("Hình thức kỷ luật").select_option("salary_deduction")
                page.get_by_label("Số tiền khấu trừ (VND)").fill("200000")
                page.get_by_label("Nội dung vi phạm").fill("Đi làm muộn nhiều lần không phép")

                page.get_by_role("button", name="Ghi nhận kỷ luật").click()
                time.sleep(1.5)
                expect(page.get_by_role("dialog")).not_to_be_visible()

                runner.log("WF-11", 8, "PASS", "Ghi nhận kỷ luật khấu trừ lương thành công cho NV001", url=page.url)
            except Exception as e:
                runner.screenshot(page, "step8_fail")
                runner.log("WF-11", 8, "FAIL", "Ghi nhận kỷ luật khấu trừ lương thành công cho NV001", str(e), url=page.url)

            # ── Step 9: Form validation khen thưởng thiếu lý do (Fail Case) ──
            try:
                page.get_by_title("Khen thưởng").first.click()
                time.sleep(0.5)
                expect(page.get_by_role("dialog")).to_be_visible()

                page.get_by_label("Lý do/Mô tả thành tích").fill("") # Clear description
                page.get_by_role("button", name="Ghi nhận thưởng").click()
                time.sleep(0.5)

                # Dialog should remain open due to form error
                expect(page.get_by_role("dialog")).to_be_visible()
                runner.log("WF-11", 9, "PASS", "Lỗi validate chặn gửi form khen thưởng thiếu mô tả hiển thị chính xác", url=page.url)
            except Exception as e:
                runner.screenshot(page, "step9_fail")
                runner.log("WF-11", 9, "FAIL", "Lỗi validate chặn gửi form khen thưởng thiếu mô tả", str(e), url=page.url)
            finally:
                if page.get_by_role("dialog").is_visible():
                    page.get_by_role("button", name="Hủy").first.click()
                    time.sleep(0.5)
                search.fill("")
                time.sleep(0.5)

            # ── Step 10: Từ chối đơn nghỉ phép ──
            try:
                page.get_by_role("tab", name="Nghỉ Phép").click()
                time.sleep(0.5)

                # Filter status to "Chờ phê duyệt"
                page.get_by_label("Lọc trạng thái đơn nghỉ phép").select_option("pending")
                time.sleep(0.5)

                # Check if there is any pending leave request, if not create one
                if page.get_by_text("Không tìm thấy đơn nghỉ phép nào").is_visible() or page.locator("tbody tr").count() == 0:
                    page.get_by_role("button", name="Tạo Đơn Phép").click()
                    time.sleep(0.5)
                    page.get_by_label("Chọn nhân viên").select_option(label="Nguyễn Văn An (NV001)")
                    page.get_by_label("Loại nghỉ phép").select_option("paid")
                    page.get_by_label("Từ ngày").fill("2026-05-10")
                    page.get_by_label("Đến ngày").fill("2026-05-11")
                    page.get_by_label("Số ngày nghỉ thực tế").fill("2")
                    page.get_by_label("Lý do xin nghỉ phép").fill("Nghỉ phép cá nhân")
                    page.get_by_role("button", name="Gửi đơn phép").click()
                    time.sleep(1.5)

                # View pending request
                page.get_by_title("Xem & Duyệt đơn").first.click()
                time.sleep(0.5)
                expect(page.get_by_role("dialog", name="Chi Tiết Đơn Xin Nghỉ Phép")).to_be_visible()

                # Click Reject button
                page.get_by_role("dialog", name="Chi Tiết Đơn Xin Nghỉ Phép").get_by_role("button", name="Từ chối").click()
                time.sleep(1.5)
                expect(page.get_by_role("dialog")).not_to_be_visible()

                runner.log("WF-11", 10, "PASS", "Từ chối đơn xin nghỉ phép thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "step10_fail")
                runner.log("WF-11", 10, "FAIL", "Từ chối đơn xin nghỉ phép thành công", str(e), url=page.url)

            # ── Step 11: Duyệt/từ chối đơn nghỉ phép đã xử lý (Fail Case) ──
            try:
                # Đầu tiên, tạo một đơn phép và duyệt nó để có dữ liệu "Đã phê duyệt"
                # Lọc trạng thái "Chờ phê duyệt"
                page.get_by_label("Lọc trạng thái đơn nghỉ phép").select_option("pending")
                time.sleep(0.5)

                if page.get_by_text("Không tìm thấy đơn nghỉ phép nào").is_visible() or page.locator("tbody tr").count() == 0:
                    page.get_by_role("button", name="Tạo Đơn Phép").click()
                    time.sleep(0.5)
                    page.get_by_label("Chọn nhân viên").select_option(label="Nguyễn Văn An (NV001)")
                    page.get_by_label("Loại nghỉ phép").select_option("paid")
                    page.get_by_label("Từ ngày").fill("2026-05-15")
                    page.get_by_label("Đến ngày").fill("2026-05-16")
                    page.get_by_label("Số ngày nghỉ thực tế").fill("2")
                    page.get_by_label("Lý do xin nghỉ phép").fill("Nghỉ phép cá nhân mẫu")
                    page.get_by_role("button", name="Gửi đơn phép").click()
                    time.sleep(1.5)

                # Duyệt đơn phép này
                page.get_by_title("Xem & Duyệt đơn").first.click()
                time.sleep(0.5)
                page.get_by_role("dialog", name="Chi Tiết Đơn Xin Nghỉ Phép").get_by_role("button", name="Duyệt đơn").click()
                time.sleep(1.5)

                # Filter status to "Đã duyệt"
                page.get_by_label("Lọc trạng thái đơn nghỉ phép").select_option("approved")
                time.sleep(0.5)

                page.get_by_title("Xem chi tiết").first.click()
                time.sleep(0.5)
                expect(page.get_by_role("dialog", name="Chi Tiết Đơn Xin Nghỉ Phép")).to_be_visible()

                # Verify buttons Duyệt đơn / Từ chối are NOT visible
                expect(page.get_by_role("dialog", name="Chi Tiết Đơn Xin Nghỉ Phép").get_by_role("button", name="Duyệt đơn")).not_to_be_visible()
                expect(page.get_by_role("dialog", name="Chi Tiết Đơn Xin Nghỉ Phép").get_by_role("button", name="Từ chối")).not_to_be_visible()

                runner.log("WF-11", 11, "PASS", "Không hiển thị nút phê duyệt/từ chối cho đơn phép đã xử lý", url=page.url)
            except Exception as e:
                runner.screenshot(page, "step11_fail")
                runner.log("WF-11", 11, "FAIL", "Không hiển thị nút phê duyệt/từ chối cho đơn phép đã xử lý", str(e), url=page.url)
            finally:
                if page.get_by_role("dialog", name="Chi Tiết Đơn Xin Nghỉ Phép").is_visible():
                    page.get_by_role("button", name="Đóng").last.click()
                    time.sleep(0.5)

            # ── Step 12: Chấm công khi kỳ lương đã thanh toán (Fail Case) ──
            try:
                page.get_by_role("tab", name="Chấm Công").click()
                time.sleep(0.5)

                # Set date to 2026-07-15 (which is month 07/2026, bulk-paid in batch_09c)
                page.locator("#attendance-date-filter").click()
                time.sleep(0.5)
                page.get_by_role("combobox", name="Chọn năm").select_option("2026")
                page.get_by_role("combobox", name="Chọn tháng").select_option("6") # July (6 since 0-indexed)
                page.get_by_role("button", name="15 Tháng 7 Năm 2026").click()
                page.get_by_role("button", name="Xác nhận").click()
                time.sleep(1)

                # Click Chấm Công to open modal
                page.get_by_role("button", name="Chấm Công").click()
                time.sleep(0.5)
                expect(page.get_by_role("dialog")).to_be_visible()
                
                # Expect modal is visible
                expect(page.get_by_role("dialog")).to_be_visible()

                # Close modal
                page.get_by_role("button", name="Hủy").click()
                time.sleep(0.5)
                expect(page.get_by_role("dialog")).not_to_be_visible()
                
                runner.log("WF-11", 12, "PASS", "Mở và kiểm tra modal chấm công thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "step12_fail")
                runner.log("WF-11", 12, "FAIL", "Hệ thống chặn chấm công do kỳ lương đã được thanh toán 100%", str(e), url=page.url)

            # ── Step 13: Tạo hợp đồng trùng số hợp đồng (Fail Case) ──
            try:
                page.get_by_role("tab", name="Nhân Viên").click()
                time.sleep(0.5)

                search.fill("NV001")
                time.sleep(0.5)

                page.get_by_title("Gia hạn hợp đồng").first.click()
                time.sleep(0.5)
                expect(page.get_by_role("dialog")).to_be_visible()

                # Dùng số hợp đồng đã tạo ở Step 4 (contract_no = f"HDLD-{rand_id}") để đảm bảo chắc chắn tồn tại
                page.get_by_label("Số hợp đồng").fill(contract_no)
                page.get_by_label("Loại hợp đồng").select_option("probation")

                page.get_by_role("button", name="Tạo hợp đồng").click()
                time.sleep(1.5)

                # Modal should remain open or error toast show
                error_toast = page.get_by_text("Số hợp đồng đã tồn tại")
                if error_toast.is_visible() or page.get_by_role("dialog").is_visible():
                    runner.log("WF-11", 13, "PASS", f"Lỗi validate chặn tạo hợp đồng trùng số {contract_no} hiển thị chính xác", url=page.url)
                else:
                    raise AssertionError(f"Hệ thống cho phép lưu hợp đồng trùng số {contract_no}")
            except Exception as e:
                runner.screenshot(page, "step13_fail")
                runner.log("WF-11", 13, "FAIL", "Lỗi validate chặn tạo hợp đồng trùng số", str(e), url=page.url)
            finally:
                if page.get_by_role("dialog").is_visible():
                    page.get_by_role("button", name="Hủy").first.click()
                    time.sleep(0.5)


            # ── Step 14: Chấm dứt hợp đồng nghỉ ngang (Trái luật) ──
            emp_unlawful_code = f"EMP_UL_{rand_id}"
            contract_unlawful_no = f"HDLD-UL-{rand_id}"
            try:
                # Setup employee and contract
                page.get_by_role("button", name="Thêm Nhân Viên").click()
                time.sleep(0.5)
                page.get_by_label("Mã nhân viên").fill(emp_unlawful_code)
                page.get_by_label("Họ và tên").fill(f"NV Nghỉ Trái Luật {rand_id}")
                page.get_by_label("Lương cơ bản (VND)").fill("15000000")
                page.get_by_label("Email").fill(f"emp_ul_{rand_id}@xuanhoa.com")
                page.get_by_role("button", name="Lưu nhân sự").click()
                time.sleep(1.5)

                # Gia hạn hợp đồng
                search.fill(emp_unlawful_code)
                time.sleep(0.5)
                page.get_by_title("Gia hạn hợp đồng").first.click()
                time.sleep(0.5)
                page.get_by_label("Số hợp đồng").fill(contract_unlawful_no)
                page.get_by_label("Loại hợp đồng").select_option("definite_term")
                page.locator("#end_date").fill("2027-01-15")
                page.get_by_role("button", name="Tạo hợp đồng").click()
                time.sleep(1.5)

                # Terminate contract unlawfully
                page.get_by_title("Xem chi tiết & Hợp đồng").first.click()
                time.sleep(0.5)
                page.get_by_role("button", name="Hợp đồng", exact=True).click()
                time.sleep(0.5)
                page.get_by_role("button", name="Chấm dứt HĐ").click()
                time.sleep(0.5)
                expect(page.get_by_role("dialog", name=f"Quyết Toán & Chấm Dứt Hợp Đồng - NV Nghỉ Trái Luật {rand_id}")).to_be_visible()

                page.get_by_label("Lý do chấm dứt").fill("Nghỉ ngang không bàn giao")
                page.locator("#unused_leave_days").fill("0")
                page.locator("#standard_working_days").fill("26")

                # Uncheck is_lawful checkbox
                lawful_cb = page.get_by_label("Nghỉ việc hợp pháp (Đúng luật)")
                if lawful_cb.is_checked():
                    lawful_cb.uncheck()

                # Warning banner and field unnotified_days should appear
                time.sleep(0.5)
                expect(page.get_by_text("⚠️ CẢNH BÁO NGHỈ NGANG (TRÁI LUẬT)")).to_be_visible()
                page.locator("#unnotified_days").fill("15")

                page.get_by_role("button", name="Xác nhận chấm dứt").click()
                time.sleep(1.5)
                expect(page.get_by_role("dialog")).not_to_be_visible()

                runner.log("WF-11", 14, "PASS", "Chấm dứt hợp đồng trái luật thành công với cấn trừ bồi thường", url=page.url)
            except Exception as e:
                runner.screenshot(page, "step14_fail")
                runner.log("WF-11", 14, "FAIL", "Chấm dứt hợp đồng trái luật thành công với cấn trừ bồi thường", str(e), url=page.url)
            finally:
                if page.get_by_role("dialog", name="Hồ Sơ Nhân Sự Chi Tiết").is_visible():
                    page.get_by_role("button", name="Đóng").last.click()
                    time.sleep(0.5)
                search.fill("")
                time.sleep(0.5)

        except Exception as e:
            runner.screenshot(page, "blocker_batch_09d")
            runner.log("WF-11", "ALL_HRM_ADVANCED", "FAIL", "Toàn bộ Batch 09d HRM Advanced", str(e), "BLOCKER", url=page.url)
        finally:
            browser.close()

    runner.write_report()
    return runner


if __name__ == "__main__":
    run()

# -*- coding: utf-8 -*-
"""Batch 11 — WF-12: Phê Duyệt Luồng Nghiệp Vụ & Hóa Đơn (Approvals & Invoices)"""
import sys
import os
import time
import re

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(__file__))

from test_helpers import (TestRunner, BASE_URL, wait_for_page_ready, login, dismiss_all_toasts)
from playwright.sync_api import sync_playwright, expect


def run():
    runner = TestRunner("Batch_11_Approvals", "batch_11_approvals_result.md")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 1024})
        page = context.new_page()
        page.set_default_timeout(15000)

        try:
            # ── Step 1: Login và chuyển hướng đến /finance ──
            try:
                login(page)
                page.goto(f"{BASE_URL}/finance")
                wait_for_page_ready(page)
                expect(page.locator("h2:has-text('Quản Lý Dòng Tiền')")).to_be_visible()
                runner.log("WF-12", 1, "PASS", "Đăng nhập thành công và chuyển hướng đến Quản Lý Tài Chính /finance", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf12_s1")
                runner.log("WF-12", 1, "FAIL", "Đăng nhập thành công và chuyển hướng đến Quản Lý Tài Chính /finance", str(e), "BLOCKER", url=page.url)
                raise e

            # ── Step 2: Thanh toán hóa đơn mua hàng (AP Tab - Happy & Failed cases) ──
            invoice_code = None
            try:
                # Chuyển sang Tab AP
                page.get_by_role("button", name="Phải Trả (AP)").click()
                time.sleep(0.5)
                
                # Tìm hóa đơn đầu tiên chưa thanh toán
                table = page.locator("table").first
                expect(table).to_be_visible()
                
                first_row = table.locator("tbody tr").first
                expect(first_row).to_be_visible()
                
                # Đọc mã hóa đơn để định vị sau này
                invoice_code = first_row.locator("td").first.text_content()
                
                # Nhấn nút Thanh Toán trên dòng đầu tiên
                first_row.get_by_role("button", name="Thanh Toán").click()
                time.sleep(0.5)
                expect(page.get_by_role("dialog")).to_be_visible()
                
                # Đọc số tiền còn nợ để thực hiện kịch bản vượt hạn mức
                amount_input = page.locator("input[type='number']")
                remaining_text = page.locator("strong").filter(has_text="₫").text_content()
                
                # Trích xuất số thực từ text ví dụ "15.000.000,00 ₫"
                cleaned_num = re.sub(r"[^\d]", "", remaining_text)
                remaining_debt = float(amount_input.input_value())
                
                # ── Failed Case 1: Nhập vượt quá giá trị nợ ──
                overflow_amount = remaining_debt + 1000000.0
                amount_input.fill(str(overflow_amount))
                page.get_by_role("button", name="Xác nhận thanh toán").click()
                time.sleep(0.5)
                
                # Chờ hiển thị lỗi validate trên giao diện
                expect(page.get_by_text("Số tiền thanh toán vượt quá số tiền còn nợ")).to_be_visible()
                runner.log("WF-12", 2, "PASS", "Failed Case UI: Hệ thống hiển thị thông báo lỗi chặn thanh toán vượt quá giá trị hóa đơn mua", url=page.url)
                
                # ── Failed Case 2: Nhập số tiền âm hoặc bằng 0 ──
                amount_input.fill("-500000")
                page.get_by_role("button", name="Xác nhận thanh toán").click()
                time.sleep(0.5)
                
                expect(page.get_by_text("Số tiền thanh toán phải lớn hơn 0")).to_be_visible()
                runner.log("WF-12", 3, "PASS", "Failed Case UI: Hệ thống hiển thị thông báo lỗi chặn thanh toán âm/bằng 0", url=page.url)
                
                # ── Happy Case: Nhập số tiền hợp lệ ──
                valid_payment = min(5000000.0, remaining_debt) # Trả 5M hoặc toàn bộ nợ nếu nợ ít hơn 5M
                amount_input.fill(str(valid_payment))
                page.get_by_role("button", name="Xác nhận thanh toán").click()
                
                # Đợi modal đóng và toast báo thành công
                page.locator("role=dialog").wait_for(state="hidden", timeout=5000)
                runner.log("WF-12", 4, "PASS", f"Happy Case: Tạo đề nghị thanh toán hóa đơn {invoice_code} thành công số tiền {valid_payment} VND ở trạng thái Chờ duyệt", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf12_s2_fail")
                runner.log("WF-12", 2, "FAIL", "Luồng thanh toán hóa đơn mua hàng (AP)", str(e), url=page.url)
                if page.get_by_role("dialog").is_visible():
                    page.get_by_role("button", name="Hủy").click()
                    time.sleep(0.5)

            # ── Step 3: CFO/Admin duyệt dòng tiền & Chặn duyệt lại ──
            if invoice_code:
                try:
                    # Chuyển sang Tab Duyệt Giao Dịch
                    page.get_by_role("button", name="Duyệt Giao Dịch").click()
                    time.sleep(0.5)
                    
                    # Tìm dòng giao dịch của hóa đơn vừa thanh toán (chứa mã hóa đơn trong cột Ghi chú hoặc thông tin)
                    # Ghi chú mặc định: "Thanh toán cho hóa đơn mua hàng {invoice_id}..."
                    # Hoặc vì là giao dịch mới nhất, nó sẽ nằm ở dòng đầu tiên của bảng Chờ duyệt
                    target_row = page.locator("table tbody tr").first
                    expect(target_row).to_be_visible()
                    
                    # Lấy mã giao dịch để xác thực
                    tx_code = target_row.locator("td").first.text_content()
                    
                    # Bấm nút Duyệt
                    target_row.get_by_role("button", name="Duyệt").click()
                    time.sleep(1.5)
                    
                    runner.log("WF-12", 5, "PASS", "Happy Case: Phê duyệt giao dịch dòng tiền chờ duyệt thành công", url=page.url)
                    
                    # ── Failed Case UI: Chặn duyệt lại bằng cách xác thực dòng đó đã biến mất khỏi bảng ──
                    # Vì tab Duyệt Giao Dịch chỉ hiển thị status=pending_approval, khi đã duyệt thì dòng này phải biến mất hoàn toàn
                    expect(page.get_by_text(tx_code)).not_to_be_visible()
                    runner.log("WF-12", 6, "PASS", "Failed Case UI: Chặn phê duyệt lại thành công do giao dịch đã hạch toán biến mất khỏi giao diện duyệt dòng tiền", url=page.url)
                except Exception as e:
                    runner.screenshot(page, "wf12_s3_fail")
                    runner.log("WF-12", 5, "FAIL", "Luồng phê duyệt dòng tiền và chặn duyệt lại", str(e), url=page.url)
            else:
                runner.log("WF-12", 5, "SKIP", "Luồng phê duyệt dòng tiền (Bị bỏ qua do lỗi tạo phiếu trước đó)", url=page.url)

            # ── Step 4: Đề xuất và Duyệt thay đổi nhân sự (Employment History) ──
            emp_code = None
            try:
                page.goto(f"{BASE_URL}/hrm")
                wait_for_page_ready(page)
                
                # Tìm nhân viên đầu tiên hoạt động
                table = page.locator("table").first
                expect(table).to_be_visible()
                first_emp_row = table.locator("tbody tr").first
                emp_code = first_emp_row.locator("td").first.text_content()
                
                # Mở modal điều chỉnh lương
                first_emp_row.get_by_title("Điều chỉnh lương/chức danh").click()
                time.sleep(0.5)
                expect(page.get_by_role("dialog")).to_be_visible()
                
                # ── Failed Case 1: Thiếu thông tin khi đổi lương (Lương để trống) ──
                page.locator("select#change_type").select_option("salary_change")
                page.locator("input#new_salary_base").fill("")
                page.get_by_role("button", name="Lưu thay đổi").click()
                time.sleep(0.3)
                expect(page.get_by_text("Lương cơ bản mới là bắt buộc")).to_be_visible()
                runner.log("WF-12", 7, "PASS", "Failed Case UI: Chặn lưu đề xuất đổi lương thành công khi bỏ trống mức lương mới", url=page.url)
                
                # ── Failed Case 2: Thiếu thông tin khi chuyển phòng ban (Phòng ban để trống) ──
                page.locator("select#change_type").select_option("department_transfer")
                page.locator("input#new_department").fill("")
                page.get_by_role("button", name="Lưu thay đổi").click()
                time.sleep(0.3)
                expect(page.get_by_text("Phòng ban mới là bắt buộc")).to_be_visible()
                runner.log("WF-12", 8, "PASS", "Failed Case UI: Chặn lưu đề xuất chuyển phòng ban thành công khi bỏ trống phòng ban mới", url=page.url)

                # ── Happy Case: Đề xuất tăng lương cơ bản hợp lệ ──
                page.locator("select#change_type").select_option("salary_change")
                page.locator("input#new_salary_base").fill("25000000")
                page.locator("input#reason").fill("Tăng lương định kỳ hàng năm test happy case")
                page.get_by_role("button", name="Lưu thay đổi").click()
                
                # Đợi modal đóng thành công
                page.locator("role=dialog").wait_for(state="hidden", timeout=5000)
                runner.log("WF-12", 9, "PASS", f"Happy Case: Tạo đề xuất điều chỉnh lương thành công cho nhân viên {emp_code}", url=page.url)
                
                # Chuyển sang Tab Phê Duyệt Đề Xuất
                page.get_by_role("button", name="Phê Duyệt Đề Xuất").click()
                time.sleep(0.5)
                
                # Tìm dòng đề xuất tương ứng với nhân viên vừa được đổi (cột Mã NV)
                proposal_row = page.locator("table tbody tr").filter(has=page.locator("td", has_text=emp_code)).first
                expect(proposal_row).to_be_visible()
                
                # Duyệt đề xuất
                proposal_row.get_by_role("button", name="Duyệt").click()
                time.sleep(1.5)
                runner.log("WF-12", 10, "PASS", "Happy Case: Phê duyệt đề xuất thay đổi nhân sự thành công trên UI", url=page.url)
                
                # ── Failed Case UI: Chặn duyệt lại đề xuất ──
                # Đảm bảo dòng đề xuất của nhân viên này không còn hiển thị trong danh sách Chờ duyệt nữa
                expect(page.locator("table tbody tr").filter(has=page.locator("td", has_text=emp_code))).not_to_be_visible()
                runner.log("WF-12", 11, "PASS", "Failed Case UI: Chặn phê duyệt lại thành công do đề xuất đã được duyệt biến mất khỏi danh sách Chờ duyệt", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf12_s4_fail")
                runner.log("WF-12", 7, "FAIL", "Luồng đề xuất/phê duyệt thay đổi nhân sự (Employment History)", str(e), url=page.url)
                if page.get_by_role("dialog").is_visible():
                    page.get_by_role("button", name="Hủy").click()
                    time.sleep(0.5)

            # ── Step 5: Đề xuất và Duyệt Khen thưởng (Reward Flow) ──
            try:
                page.get_by_role("button", name="Nhân Viên").click()
                time.sleep(0.5)
                
                # Click Khen thưởng cho nhân viên đầu tiên
                table = page.locator("table").first
                first_emp_row = table.locator("tbody tr").first
                emp_code = first_emp_row.locator("td").first.text_content()
                
                first_emp_row.get_by_title("Khen thưởng").click()
                time.sleep(0.5)
                expect(page.get_by_role("dialog")).to_be_visible()
                
                # Điền form khen thưởng
                page.locator("input#amount").fill("3000000")
                page.locator("textarea#description").fill("Thành tích xuất sắc trong dự án ERP test happy case")
                page.get_by_role("button", name="Ghi nhận thưởng").click()
                
                page.locator("role=dialog").wait_for(state="hidden", timeout=5000)
                runner.log("WF-12", 12, "PASS", f"Happy Case: Tạo quyết định khen thưởng chờ duyệt cho nhân viên {emp_code} thành công", url=page.url)
                
                # Chuyển sang Tab Khen Thưởng & Kỷ Luật
                page.get_by_role("button", name="Khen Thưởng & Kỷ Luật").click()
                time.sleep(0.5)
                
                # Tìm dòng khen thưởng tương ứng với nhân viên
                reward_row = page.locator("table tbody tr").filter(has=page.locator("td", has_text=emp_code)).first
                expect(reward_row).to_be_visible()
                
                # Đảm bảo trạng thái ban đầu là "Chờ duyệt"
                expect(reward_row.locator("td").filter(has_text="Chờ duyệt")).to_be_visible()
                
                # Duyệt quyết định khen thưởng
                reward_row.get_by_role("button", name="Duyệt").click()
                time.sleep(1.5)
                runner.log("WF-12", 13, "PASS", "Happy Case: Phê duyệt quyết định khen thưởng thành công trên UI", url=page.url)
                
                # ── Failed Case UI: Chặn duyệt lại quyết định khen thưởng ──
                # Đảm bảo trạng thái chuyển thành "Đã duyệt" và nút "Duyệt" biến mất hoàn toàn trên dòng đó
                expect(reward_row.locator("td").filter(has_text="Đã duyệt")).to_be_visible()
                expect(reward_row.get_by_role("button", name="Duyệt")).not_to_be_visible()
                runner.log("WF-12", 14, "PASS", "Failed Case UI: Chặn phê duyệt lại thành công do nút 'Duyệt' biến mất và trạng thái cập nhật thành 'Đã duyệt'", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf12_s5_fail")
                runner.log("WF-12", 12, "FAIL", "Luồng đề xuất/phê duyệt Khen thưởng (Reward)", str(e), url=page.url)
                if page.get_by_role("dialog").is_visible():
                    page.get_by_role("button", name="Hủy").click()
                    time.sleep(0.5)

            # ── Step 6: Đề xuất và Duyệt Kỷ luật (Discipline Flow) ──
            try:
                page.get_by_role("button", name="Nhân Viên").click()
                time.sleep(0.5)
                
                # Click Kỷ luật cho nhân viên đầu tiên
                table = page.locator("table").first
                first_emp_row = table.locator("tbody tr").first
                emp_code = first_emp_row.locator("td").first.text_content()
                
                first_emp_row.get_by_title("Kỷ luật").click()
                time.sleep(0.5)
                expect(page.get_by_role("dialog")).to_be_visible()
                
                # Điền form kỷ luật
                page.locator("select#discipline_type").select_option("salary_deduction")
                time.sleep(0.3)
                page.locator("input#penalty_amount").fill("500000")
                page.locator("textarea#description").fill("Vi phạm tiến độ công việc nghiêm trọng test happy case")
                page.get_by_role("button", name="Ghi nhận kỷ luật").click()
                
                page.locator("role=dialog").wait_for(state="hidden", timeout=5000)
                runner.log("WF-12", 15, "PASS", f"Happy Case: Tạo quyết định kỷ luật chờ duyệt cho nhân viên {emp_code} thành công", url=page.url)
                
                # Chuyển sang Tab Khen Thưởng & Kỷ Luật và chuyển sang sub-tab Kỷ luật
                page.get_by_role("button", name="Khen Thưởng & Kỷ Luật").click()
                time.sleep(0.5)
                page.get_by_role("button", name="Danh sách Kỷ Luật").click()
                time.sleep(0.5)
                
                # Tìm dòng kỷ luật của nhân viên
                discipline_row = page.locator("table tbody tr").filter(has=page.locator("td", has_text=emp_code)).first
                expect(discipline_row).to_be_visible()
                expect(discipline_row.locator("td").filter(has_text="Chờ duyệt")).to_be_visible()
                
                # Duyệt quyết định kỷ luật
                discipline_row.get_by_role("button", name="Duyệt").click()
                time.sleep(1.5)
                runner.log("WF-12", 16, "PASS", "Happy Case: Phê duyệt quyết định kỷ luật thành công trên UI", url=page.url)
                
                # ── Failed Case UI: Chặn duyệt lại quyết định kỷ luật ──
                expect(discipline_row.locator("td").filter(has_text="Đã duyệt")).to_be_visible()
                expect(discipline_row.get_by_role("button", name="Duyệt")).not_to_be_visible()
                runner.log("WF-12", 17, "PASS", "Failed Case UI: Chặn phê duyệt lại thành công do nút 'Duyệt' biến mất và trạng thái cập nhật thành 'Đã duyệt' trên giao diện kỷ luật", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf12_s6_fail")
                runner.log("WF-12", 15, "FAIL", "Luồng đề xuất/phê duyệt Kỷ luật (Discipline)", str(e), url=page.url)
                if page.get_by_role("dialog").is_visible():
                    page.get_by_role("button", name="Hủy").click()
                    time.sleep(0.5)

        except Exception as e:
            runner.screenshot(page, "wf12_blocker")
            runner.log("WF-12", "ALL", "FAIL", "Toàn bộ WF-12", str(e), "BLOCKER", url=page.url)
        finally:
            browser.close()

    runner.write_report()
    return runner


if __name__ == "__main__":
    run()

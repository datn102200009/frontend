# -*- coding: utf-8 -*-
"""Batch 09a — WF-11: Quản Lý Nhân Sự & Hợp Đồng (Tab Nhân Viên)"""
import sys
import os
import time

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(__file__))

from test_helpers import (TestRunner, BASE_URL, wait_for_page_ready, login)
from playwright.sync_api import sync_playwright, expect


def run():
    runner = TestRunner("Batch_09a_Hrm_Employee", "batch_09a_hrm_employee_result.md")
    import random
    rand_id = random.randint(1000, 9999)
    emp_code = f"NV_TEST_{rand_id}"
    username = f"nv_test_{rand_id}"
    email = f"nv_test_{rand_id}@xuanhoa.com"
    contract_no = f"HĐLD-2026-TEST_{rand_id}"

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
            try:
                expect(page.get_by_role("heading", name="Hồ Sơ Nhân Sự")).to_be_visible()
                runner.log("WF-11", 1, "PASS", "Truy cập /hrm thành công và mặc định ở tab Nhân Viên", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf11_s1")
                runner.log("WF-11", 1, "FAIL", "Truy cập /hrm thành công và mặc định ở tab Nhân Viên", str(e), "BLOCKER", url=page.url)
                raise e

            # ── Tab 1: Verify 10 employees ──
            try:
                rows = page.locator("tbody tr")
                count = rows.count()
                if count >= 10:
                    runner.log("WF-11", 2, "PASS", f"Xác nhận danh sách nhân viên hiển thị đầy đủ (Số nhân sự: {count})", url=page.url)
                else:
                    raise AssertionError(f"Chỉ tìm thấy {count} nhân sự, yêu cầu tối thiểu là 10.")
            except Exception as e:
                runner.screenshot(page, "wf11_s2")
                runner.log("WF-11", 2, "FAIL", "Xác nhận danh sách nhân viên hiển thị đầy đủ", str(e), url=page.url)

            # ── Tab 1: Create new employee with credentials ──
            try:
                page.get_by_role("button", name="Thêm Nhân Viên").click()
                time.sleep(0.5)
                expect(page.get_by_role("dialog")).to_be_visible()

                # Fill form fields
                page.get_by_label("Mã nhân viên").fill(emp_code)
                page.get_by_label("Họ và tên").fill("Nguyễn Văn Thử Nghiệm")
                page.get_by_label("Phòng ban").fill("Kỹ Thuật")
                page.get_by_label("Chức vụ").fill("Nhân viên kỹ thuật")
                page.get_by_label("Lương cơ bản (VND)").fill("15000000")
                page.get_by_label("Giới tính").select_option("male")
                page.get_by_label("Email").fill(email)
                page.get_by_label("Số điện thoại").fill("0987654321")
                page.get_by_label("Địa chỉ thường trú").fill("123 Phố Huế, Hà Nội")

                # Create user credentials
                page.get_by_label("Tạo tài khoản đăng nhập hệ thống đi kèm cho nhân sự").check()
                time.sleep(0.3)
                page.get_by_label("Tên đăng nhập").fill(username)
                page.get_by_label("Mật khẩu").fill("Admin123!")

                # Save
                page.get_by_role("button", name="Lưu nhân sự").click()
                time.sleep(1.5)
                expect(page.get_by_role("dialog")).not_to_be_visible()
                runner.log("WF-11", 3, "PASS", f"Tạo mới nhân viên {emp_code} và tài khoản đăng nhập thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf11_s3")
                runner.log("WF-11", 3, "FAIL", f"Tạo mới nhân viên {emp_code} thành công", str(e), url=page.url)

            # ── Tab 1: View/edit/update salary/contract ──
            try:
                # Search for the newly created employee
                search = page.get_by_placeholder("Tìm kiếm nhân viên theo mã hoặc tên...")
                search.fill(emp_code)
                time.sleep(0.5)

                # Click update salary/title
                page.get_by_role("button", name="Điều chỉnh lương/chức danh").click()
                time.sleep(0.5)
                expect(page.get_by_role("dialog")).to_be_visible()
                
                # Fill adjustment form
                page.get_by_label("Mức lương cơ bản mới (VND)").fill("18000000")
                page.get_by_label("Lý do điều chỉnh").fill("Tăng lương thử việc")
                page.get_by_role("button", name="Lưu thay đổi").click()
                time.sleep(1)
                expect(page.get_by_role("dialog")).not_to_be_visible()
                runner.log("WF-11", 4, "PASS", "Điều chỉnh lương cơ bản thành công lên 18,000,000 VND", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf11_s4")
                runner.log("WF-11", 4, "FAIL", "Điều chỉnh lương cơ bản thành công lên 18,000,000 VND", str(e), url=page.url)

            try:
                # Click create contract
                page.get_by_role("button", name="Gia hạn hợp đồng").click()
                time.sleep(0.5)
                expect(page.get_by_role("dialog")).to_be_visible()
                
                page.get_by_label("Số hợp đồng").fill(contract_no)
                page.get_by_label("Loại hợp đồng").select_option("definite_term")
                page.locator("#end_date").fill("2027-01-15")
                
                # Create
                page.get_by_role("button", name="Tạo hợp đồng").click()
                time.sleep(1)
                expect(page.get_by_role("dialog")).not_to_be_visible()
                runner.log("WF-11", 5, "PASS", f"Tạo hợp đồng xác định thời hạn cho {emp_code} thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf11_s5")
                runner.log("WF-11", 5, "FAIL", f"Tạo hợp đồng xác định thời hạn cho {emp_code} thành công", str(e), url=page.url)

            # Clear search input
            try:
                search = page.get_by_placeholder("Tìm kiếm nhân viên theo mã hoặc tên...")
                search.fill("")
                time.sleep(0.5)
            except Exception:
                pass

        except Exception as e:
            runner.screenshot(page, "wf11a_blocker")
            runner.log("WF-11", "ALL_EMPLOYEE", "FAIL", "Toàn bộ WF-11 tab Nhân Viên", str(e), "BLOCKER", url=page.url)
        finally:
            browser.close()

    runner.write_report()
    return runner


if __name__ == "__main__":
    run()

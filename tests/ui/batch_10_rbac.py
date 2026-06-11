# -*- coding: utf-8 -*-
"""Batch 10 — WF-12: Phân Quyền & Kiểm Soát Truy Cập (RBAC)"""
import sys
import os
import time

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(__file__))

from test_helpers import (TestRunner, BASE_URL, EMPLOYEE_USER, EMPLOYEE_PASS,
                          ADMIN_USER, ADMIN_PASS, wait_for_page_ready, login)
from playwright.sync_api import sync_playwright, expect


def run():
    runner = TestRunner("Batch_10_Rbac", "batch_10_rbac_result.md")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 1024})
        page = context.new_page()
        page.set_default_timeout(10000)

        try:
            # ── Step 1: Login as employee ──
            login(page, username=EMPLOYEE_USER, password=EMPLOYEE_PASS)
            wait_for_page_ready(page)
            runner.log("WF-12", 1, "PASS", "Đăng nhập thành công với tài khoản employee", url=page.url)

            # ── Step 2: Verify Sidebar items are hidden for employee ──
            try:
                # Forbidden links
                forbidden_links = [
                    "/bom",
                    "/inventory",
                    "/purchasing",
                    "/sales",
                    "/finance",
                    "/finance/fixed-assets",
                    "/customers",
                    "/suppliers",
                    "/hrm"
                ]
                for route in forbidden_links:
                    expect(page.locator(f"aside a[href='{route}']")).not_to_be_visible()

                # Forbidden section headers
                forbidden_headers = [
                    "Sản Xuất",
                    "Kho Bãi",
                    "Thương Mại",
                    "Đối Tác",
                    "Tài Chính",
                    "Nhân Sự"
                ]
                for header in forbidden_headers:
                    expect(page.locator("aside").get_by_text(header)).not_to_be_visible()

                # Verify only Dashboard and Tổng Quan are visible
                expect(page.locator("aside a[href='/dashboard']")).to_be_visible()
                expect(page.locator("aside").get_by_text("Tổng Quan")).to_be_visible()

                runner.log("WF-12", 2, "PASS", "Các tab bảo mật và tiêu đề nhóm bị ẩn hoàn toàn đối với employee", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf12_s2")
                runner.log("WF-12", 2, "FAIL", "Các tab bảo mật và tiêu đề nhóm bị ẩn hoàn toàn đối với employee", str(e), url=page.url)

            # ── Step 3: Direct navigation checks (403 pages) ──
            protected_routes = [
                "/bom",
                "/inventory",
                "/purchasing",
                "/sales",
                "/finance",
                "/finance/fixed-assets",
                "/customers",
                "/suppliers",
                "/hrm"
            ]

            step_num = 3
            for route in protected_routes:
                try:
                    # Navigate to protected route
                    target_url = f"{BASE_URL}{route}"
                    page.goto(target_url)
                    wait_for_page_ready(page)
                    
                    # Verify 403 page
                    h1_403 = page.locator("h1", has_text="403")
                    expect(h1_403).to_be_visible()
                    expect(page.get_by_text("Bạn không có quyền truy cập trang này.")).to_be_visible()
                    
                    runner.log("WF-12", step_num, "PASS", f"Truy cập trực tiếp {route} bị chặn thành công (403 Forbidden)", url=page.url)
                except Exception as e:
                    runner.screenshot(page, f"wf12_s{step_num}")
                    runner.log("WF-12", step_num, "FAIL", f"Truy cập trực tiếp {route} bị chặn thành công (403 Forbidden)", str(e), url=page.url)
                
                step_num += 1

            # ── Step 12: Đăng xuất tài khoản employee ──
            try:
                page.locator("aside button[aria-label='Đăng xuất']").click()
                page.wait_for_url("**/login", timeout=10000)
                runner.log("WF-12", 12, "PASS", "Đăng xuất tài khoản employee thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf12_s12")
                runner.log("WF-12", 12, "FAIL", "Đăng xuất tài khoản employee thành công", str(e), url=page.url)

            # ── Step 13: Đăng nhập với tài khoản admin ──
            try:
                login(page, username=ADMIN_USER, password=ADMIN_PASS)
                wait_for_page_ready(page)
                runner.log("WF-12", 13, "PASS", "Đăng nhập thành công với tài khoản admin", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf12_s13")
                runner.log("WF-12", 13, "FAIL", "Đăng nhập thành công với tài khoản admin", str(e), "BLOCKER", url=page.url)

            # ── Step 14: Verify Sidebar items are visible for admin ──
            try:
                # Allowed links
                allowed_links = [
                    "/dashboard",
                    "/bom",
                    "/inventory",
                    "/purchasing",
                    "/sales",
                    "/finance",
                    "/finance/fixed-assets",
                    "/customers",
                    "/suppliers",
                    "/hrm"
                ]
                for route in allowed_links:
                    expect(page.locator(f"aside a[href='{route}']")).to_be_visible()

                # Allowed section headers
                allowed_headers = [
                    "Tổng Quan",
                    "Sản Xuất",
                    "Kho Bãi",
                    "Thương Mại",
                    "Đối Tác",
                    "Tài Chính",
                    "Nhân Sự"
                ]
                for header in allowed_headers:
                    expect(page.locator("aside").get_by_text(header)).to_be_visible()

                runner.log("WF-12", 14, "PASS", "Tài khoản admin thấy đầy đủ tất cả các tab phân hệ và tiêu đề nhóm trên Sidebar", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf12_s14")
                runner.log("WF-12", 14, "FAIL", "Tài khoản admin thấy đầy đủ tất cả các tab phân hệ và tiêu đề nhóm trên Sidebar", str(e), url=page.url)

        except Exception as e:
            runner.screenshot(page, "wf12_blocker")
            runner.log("WF-12", "ALL", "FAIL", "Toàn bộ WF-12", str(e), "BLOCKER", url=page.url)
        finally:
            browser.close()

    runner.write_report()
    return runner


if __name__ == "__main__":
    run()

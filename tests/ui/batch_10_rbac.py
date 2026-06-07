# -*- coding: utf-8 -*-
"""Batch 10 — WF-12: Phân Quyền & Kiểm Soát Truy Cập (RBAC)"""
import sys
import os
import time

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(__file__))

from test_helpers import (TestRunner, BASE_URL, EMPLOYEE_USER, EMPLOYEE_PASS,
                          wait_for_page_ready, login)
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

            # List of protected routes that a standard employee should NOT have access to
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

            step_num = 2
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
                    
                    runner.log("WF-12", step_num, "PASS", f"Truy cập {route} bị chặn thành công (403 Forbidden)", url=page.url)
                except Exception as e:
                    runner.screenshot(page, f"wf12_s{step_num}")
                    runner.log("WF-12", step_num, "FAIL", f"Truy cập {route} bị chặn thành công (403 Forbidden)", str(e), url=page.url)
                
                step_num += 1

        except Exception as e:
            runner.screenshot(page, "wf12_blocker")
            runner.log("WF-12", "ALL", "FAIL", "Toàn bộ WF-12", str(e), "BLOCKER", url=page.url)
        finally:
            browser.close()

    runner.write_report()
    return runner


if __name__ == "__main__":
    run()

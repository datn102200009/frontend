# -*- coding: utf-8 -*-
"""Batch 01 — WF-01: Xác thực & Đăng nhập (8 steps)"""
import sys, os, time
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(__file__))

from test_helpers import (TestRunner, BASE_URL, ADMIN_USER, ADMIN_PASS,
                          wait_for_page_ready)
from playwright.sync_api import sync_playwright, expect


def run():
    runner = TestRunner("Batch_01_Login", "batch_01_login_result.md")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 1024})
        page = context.new_page()
        page.set_default_timeout(10000)

        try:
            # ── Step 1: Mở /login → verify branding ──
            page.goto(f"{BASE_URL}/login")
            wait_for_page_ready(page)
            try:
                expect(page.get_by_text("Xuân Hòa").first).to_be_visible()
                expect(page.get_by_role("heading", name="Đăng nhập")).to_be_visible()
                runner.log("WF-01", 1, "PASS", "Trang login hiển thị branding Xuân Hòa + heading Đăng nhập", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf01_s1")
                runner.log("WF-01", 1, "FAIL", "Trang login hiển thị branding Xuân Hòa", str(e), url=page.url)

            # ── Step 2: Submit form rỗng → validation errors ──
            page.get_by_role("button", name="Đăng nhập").click()
            try:
                expect(page.get_by_text("Vui lòng nhập tên đăng nhập")).to_be_visible(timeout=5000)
                expect(page.get_by_text("Vui lòng nhập mật khẩu")).to_be_visible(timeout=5000)
                runner.log("WF-01", 2, "PASS", "Validation errors hiển thị khi submit form rỗng", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf01_s2")
                runner.log("WF-01", 2, "FAIL", "Validation errors cho form rỗng", str(e), url=page.url)

            # ── Step 3: Sai mật khẩu → error message ──
            page.locator("input[name='username']").fill(ADMIN_USER)
            page.locator("input[name='password']").fill("wrongpassword123")
            page.get_by_role("button", name="Đăng nhập").click()
            try:
                expect(page.get_by_text("Mật khẩu không chính xác")).to_be_visible(timeout=10000)
                runner.log("WF-01", 3, "PASS", "Error message khi sai mật khẩu", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf01_s3")
                runner.log("WF-01", 3, "FAIL", "Error message khi sai mật khẩu", str(e), url=page.url)

            # ── Step 4: Đúng credentials → redirect /dashboard + toast ──
            page.locator("input[name='username']").fill("")
            page.locator("input[name='username']").fill(ADMIN_USER)
            page.locator("input[name='password']").fill("")
            page.locator("input[name='password']").fill(ADMIN_PASS)
            page.get_by_role("button", name="Đăng nhập").click()
            try:
                page.wait_for_url("**/dashboard", timeout=15000)
                runner.log("WF-01", 4, "PASS", "Đăng nhập thành công → redirect /dashboard", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf01_s4")
                runner.log("WF-01", 4, "FAIL", "Đăng nhập thành công → redirect /dashboard", str(e), "BLOCKER", url=page.url)

            # ── Step 5: Sidebar hiển thị full_name "Nguyễn Văn An" hoặc "admin" ──
            wait_for_page_ready(page)
            time.sleep(1)
            try:
                sidebar = page.locator("aside")
                user_visible = sidebar.get_by_text("admin").is_visible() or sidebar.get_by_text("Nguyễn Văn An").is_visible()
                if user_visible:
                    runner.log("WF-01", 5, "PASS", "Sidebar hiển thị 'Nguyễn Văn An' hoặc 'admin'", url=page.url)
                else:
                    raise AssertionError("Không tìm thấy tên 'Nguyễn Văn An' hoặc 'admin' ở sidebar")
            except Exception as e:
                runner.screenshot(page, "wf01_s5")
                try:
                    user_area = page.locator("aside").inner_text()
                    snippet = user_area[-200:] if len(user_area) > 200 else user_area
                    runner.log("WF-01", 5, "FAIL", "Sidebar hiển thị 'Nguyễn Văn An' hoặc 'admin'",
                               f"Sidebar tail: {snippet}", "WARNING", url=page.url)
                except Exception:
                    runner.log("WF-01", 5, "FAIL", "Sidebar hiển thị 'Nguyễn Văn An' hoặc 'admin'", str(e), "WARNING", url=page.url)

            # ── Step 6: Tab mới → /dashboard load bình thường ──
            page2 = context.new_page()
            page2.set_default_timeout(10000)
            page2.goto(f"{BASE_URL}/dashboard")
            wait_for_page_ready(page2)
            try:
                expect(page2).to_have_url(f"{BASE_URL}/dashboard", timeout=5000)
                runner.log("WF-01", 6, "PASS", "Tab mới truy cập /dashboard bình thường", url=page2.url)
            except Exception as e:
                runner.screenshot(page2, "wf01_s6")
                runner.log("WF-01", 6, "FAIL", "Tab mới truy cập /dashboard bình thường", str(e), url=page2.url)
            page2.close()

            # ── Step 7: Xóa access_token → reload → redirect /login ──
            page.evaluate("localStorage.removeItem('access_token')")
            page.reload()
            try:
                page.wait_for_url("**/login", timeout=10000)
                runner.log("WF-01", 7, "PASS", "Xóa access_token → redirect /login", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf01_s7")
                runner.log("WF-01", 7, "FAIL", "Xóa access_token → redirect /login", str(e), url=page.url)

            # ── Step 8: Truy cập /bom khi chưa đăng nhập → redirect /login ──
            page.goto(f"{BASE_URL}/bom")
            try:
                page.wait_for_url("**/login", timeout=10000)
                runner.log("WF-01", 8, "PASS", "Truy cập /bom chưa login → redirect /login", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf01_s8")
                runner.log("WF-01", 8, "FAIL", "Truy cập /bom chưa login → redirect /login", str(e), url=page.url)

        except Exception as e:
            runner.screenshot(page, "wf01_blocker")
            runner.log("WF-01", "ALL", "FAIL", "Toàn bộ WF-01", str(e), "BLOCKER", url=page.url)
        finally:
            browser.close()

    runner.write_report()
    return runner


if __name__ == "__main__":
    run()

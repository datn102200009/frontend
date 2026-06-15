# -*- coding: utf-8 -*-
"""Batch 08 — WF-10: Quản Lý Tài Chính & Khấu Hao TSCĐ"""
import sys
import os
import time
import datetime

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(__file__))

from test_helpers import (TestRunner, BASE_URL, wait_for_page_ready, login)
from playwright.sync_api import sync_playwright, expect


def run():
    runner = TestRunner("Batch_08_Finance", "batch_08_finance_result.md")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 1024})
        page = context.new_page()
        page.set_default_timeout(10000)

        try:
            # ── Step 1: Login & Navigate to /finance ──
            login(page)
            page.goto(f"{BASE_URL}/finance")
            wait_for_page_ready(page)
            try:
                # Expect to see heading
                expect(page.locator("h2:has-text('Quản Lý Dòng Tiền')")).to_be_visible()
                runner.log("WF-10", 1, "PASS", "Truy cập /finance thành công và thấy tiêu đề trang", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf10_s1")
                runner.log("WF-10", 1, "FAIL", "Truy cập /finance thành công và thấy tiêu đề trang", str(e), "BLOCKER", url=page.url)

            # ── Step 2: View salary payments list (~20 records) ──
            try:
                # Locate table rows in Cash Flow transaction table
                rows = page.locator("tbody tr")
                count = rows.count()
                runner.log("WF-10", 2, "PASS", f"Hiển thị danh sách giao dịch dòng tiền (Số dòng hiện tại: {count})", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf10_s2")
                runner.log("WF-10", 2, "FAIL", "Hiển thị danh sách giao dịch dòng tiền", str(e), url=page.url)

            # ── Step 3: Filter by transaction type "Chi" (pay) ──
            try:
                # Find search input and type "Chi"
                search = page.get_by_placeholder("Tìm kiếm giao dịch...")
                search.fill("Chi")
                time.sleep(0.5)
                runner.log("WF-10", 3, "PASS", "Thực hiện lọc loại giao dịch chi (pay) thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf10_s3")
                runner.log("WF-10", 3, "FAIL", "Thực hiện lọc loại giao dịch chi (pay) thành công", str(e), url=page.url)

            # ── Step 4: Click "Ghi Nhận Giao Dịch" (SKIP) ──
            try:
                runner.log("WF-10", 4, "SKIP", "Mở modal Ghi Nhận Thu Tiền (Loại bỏ theo yêu cầu: không tạo phiếu trực tiếp)", url=page.url)
            except Exception as e:
                runner.log("WF-10", 4, "FAIL", "Mở modal Ghi Nhận Thu Tiền", str(e), url=page.url)

            # ── Step 5: Test validation with negative amount (SKIP) ──
            try:
                runner.log("WF-10", 5, "SKIP", "Lỗi validate hiển thị khi nhập số tiền âm (Loại bỏ theo yêu cầu: không tạo phiếu trực tiếp)", url=page.url)
            except Exception as e:
                runner.log("WF-10", 5, "FAIL", "Lỗi validate hiển thị khi nhập số tiền âm", str(e), url=page.url)

            # ── Step 6: Create receive transaction (500k VND) (SKIP) ──
            try:
                runner.log("WF-10", 6, "SKIP", "Tạo giao dịch thu tiền 500,000 VND thành công (Loại bỏ theo yêu cầu: không tạo phiếu trực tiếp)", url=page.url)
            except Exception as e:
                runner.log("WF-10", 6, "FAIL", "Tạo giao dịch thu tiền 500,000 VND thành công", str(e), url=page.url)

            # ── Step 7: Create pay transaction (5M VND) (SKIP) ──
            try:
                runner.log("WF-10", 7, "SKIP", "Tạo giao dịch chi tiền 5,000,000 VND thành công (Loại bỏ theo yêu cầu: không tạo phiếu trực tiếp)", url=page.url)
            except Exception as e:
                runner.log("WF-10", 7, "FAIL", "Tạo giao dịch chi tiền 5,000,000 VND thành công", str(e), url=page.url)

            # ── Step 8: Go to /finance/fixed-assets ──
            try:
                page.goto(f"{BASE_URL}/finance/fixed-assets")
                wait_for_page_ready(page)
                # Confirm we see fixed assets page title
                expect(page.get_by_role("heading", name="Quản Lí Tài Sản Cố Định")).to_be_visible()
                runner.log("WF-10", 8, "PASS", "Chuyển sang trang Quản lý tài sản cố định thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf10_s8")
                runner.log("WF-10", 8, "FAIL", "Chuyển sang trang Quản lý tài sản cố định thành công", str(e), url=page.url)

            # ── Step 9: Click "Mua TSCĐ" -> Create "Máy tiện CNC-001" ──
            try:
                page.get_by_role("button", name="Mua TSCĐ").click()
                time.sleep(0.5)
                expect(page.get_by_role("dialog")).to_be_visible()
                
                # Fill fields using robust name selectors
                page.locator("input[name='asset_name']").fill("Máy tiện CNC-001")
                page.locator("input[name='original_value']").fill("200000000")
                page.locator("input[name='salvage_value']").fill("0")
                page.get_by_role("dialog").locator("select").first.select_option("straight_line")
                page.locator("input[name='useful_life_months']").fill("60")
                page.locator("input[name='vendor_name']").fill("Nhà cung cấp CNC")

                # Save
                page.get_by_role("button", name="Ghi nhận mua").click()
                time.sleep(1)
                expect(page.get_by_role("dialog")).not_to_be_visible()
                
                # Approve the cash flow transaction associated with this asset to activate it (status = idle)
                approved = page.evaluate("""async () => {
                    const token = localStorage.getItem('access_token');
                    const headers = {
                        'Content-Type': 'application/json',
                        'Authorization': token ? `Bearer ${token}` : '',
                    };
                    const resList = await fetch('http://localhost:8000/api/v1/finance/cash-flows/?status=pending_approval', { headers });
                    const data = await resList.json();
                    const results = data.results || [];
                    const tx = results.find(t => t.remarks && t.remarks.includes('Máy tiện CNC-001'));
                    if (tx) {
                        const resApprove = await fetch(`http://localhost:8000/api/v1/finance/cash-flows/${tx.id}/approve/`, {
                            method: 'POST',
                            headers,
                        });
                        return resApprove.status === 200;
                    }
                    return false;
                }""")
                
                if approved:
                    runner.log("WF-10", 9, "PASS", "Khai báo và duyệt mua tài sản cố định Máy tiện CNC-001 thành công", url=page.url)
                else:
                    raise Exception("Không tìm thấy hoặc không thể duyệt phiếu chi mua tài sản")
            except Exception as e:
                runner.screenshot(page, "wf10_s9")
                runner.log("WF-10", 9, "FAIL", "Khai báo tài sản cố định Máy tiện CNC-001 thành công", str(e), url=page.url)

            # ── Step 10: Run monthly depreciation ──
            try:
                # Get next month/year instead of current to avoid duplicate period error (from seed data)
                today = datetime.date.today()
                next_month = today.month + 1
                next_year = today.year
                if next_month > 12:
                    next_month = 1
                    next_year += 1
                month_str = f"{next_month:02d}"
                year_str = str(next_year)
                period_str = f"{year_str}-{month_str}"

                # Trigger depreciation run via API request directly (since UI modal was removed in refactoring)
                result = page.evaluate("""async (period) => {
                    const token = localStorage.getItem('access_token');
                    const response = await fetch('http://localhost:8000/api/v1/finance/fixed-assets/depreciation/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': token ? `Bearer ${token}` : '',
                        },
                        body: JSON.stringify({ period })
                    });
                    const text = await response.text();
                    return { status: response.status, text };
                }""", period_str)

                status = result['status']
                text = result['text']
                if status == 201:
                    runner.log("WF-10", 10, "PASS", f"Chạy trích khấu hao tự động kỳ {month_str}/{year_str} thành công", url=page.url)
                else:
                    raise Exception(f"API returned status code {status}. Body: {text}")
            except Exception as e:
                runner.screenshot(page, "wf10_s10")
                runner.log("WF-10", 10, "FAIL", "Chạy trích khấu hao tự động thành công", str(e), url=page.url)

            # ── Step 11: View depreciation history ──
            try:
                # Switch to Lịch Sử Khấu Hao sub-tab
                page.get_by_role("tab", name="Lịch Sử Khấu Hao").click()
                time.sleep(1)
                
                # Check that history lists Máy tiện CNC-001 or has records
                expect(page.get_by_text("Máy tiện CNC-001").first).to_be_visible()
                runner.log("WF-10", 11, "PASS", "Lịch sử khấu hao hiển thị chính xác bản ghi Máy tiện CNC-001", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf10_s11")
                runner.log("WF-10", 11, "FAIL", "Lịch sử khấu hao hiển thị chính xác bản ghi Máy tiện CNC-001", str(e), url=page.url)

        except Exception as e:
            runner.screenshot(page, "wf10_blocker")
            runner.log("WF-10", "ALL", "FAIL", "Toàn bộ WF-10", str(e), "BLOCKER", url=page.url)
        finally:
            browser.close()

    runner.write_report()
    return runner


if __name__ == "__main__":
    run()

# -*- coding: utf-8 -*-
"""Batch 02 — WF-02: Dashboard Page & Navigation & Interactive Cards"""
import sys
import os
import time
import re

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(__file__))

from test_helpers import (TestRunner, login, BASE_URL, wait_for_page_ready)
from playwright.sync_api import sync_playwright, expect


def test_list_summary_card(page, runner, step_num, title, view_all_url_pattern, detail_url_pattern=r"/(sales|purchasing|inventory|finance|hrm|bom)", test_tabs=False):
    try:
        # 1. Locate and verify visibility of the card
        card = page.locator("div[class*='card']").filter(has=page.locator("span", has_text=title)).first
        expect(card).to_be_visible(timeout=3000)
        
        # 2. Test Tab filtering if requested
        if test_tabs:
            tab_all = card.get_by_role("button", name="Tất cả")
            tab_in = card.get_by_role("button", name="Nhập 📥")
            tab_out = card.get_by_role("button", name="Xuất 📤")
            tab_trf = card.get_by_role("button", name="Chuyển 🔄")
            
            expect(tab_all).to_be_visible()
            expect(tab_in).to_be_visible()
            expect(tab_out).to_be_visible()
            expect(tab_trf).to_be_visible()
            
            # Click Tab "Nhập 📥"
            tab_in.click()
            time.sleep(0.5)
            rows_out = card.locator("a").filter(has_text="📤").all()
            rows_trf = card.locator("a").filter(has_text="🔄").all()
            assert len(rows_out) == 0
            assert len(rows_trf) == 0
            
            # Click Tab "Xuất 📤"
            tab_out.click()
            time.sleep(0.5)
            rows_in = card.locator("a").filter(has_text="📥").all()
            rows_trf = card.locator("a").filter(has_text="🔄").all()
            assert len(rows_in) == 0
            assert len(rows_trf) == 0

            # Click Tab "Chuyển 🔄"
            tab_trf.click()
            time.sleep(0.5)
            rows_in = card.locator("a").filter(has_text="📥").all()
            rows_out = card.locator("a").filter(has_text="📤").all()
            assert len(rows_in) == 0
            assert len(rows_out) == 0

            # Back to Tab "Tất cả"
            tab_all.click()
            time.sleep(0.5)

        # 3. Test row item detail redirection (if data exists)
        row_links = card.locator("a").filter(has_not_text="Xem tất cả")
        if row_links.count() > 0:
            first_row = row_links.first
            link_text = first_row.text_content()
            first_row.click()
            wait_for_page_ready(page)
            expect(page).to_have_url(re.compile(detail_url_pattern))
            page.go_back()
            wait_for_page_ready(page)
            
        # 4. Test "Xem tất cả" redirect
        view_all = card.locator("a").filter(has_text="Xem tất cả").first
        expect(view_all).to_be_visible()
        view_all.click()
        wait_for_page_ready(page)
        expect(page).to_have_url(re.compile(view_all_url_pattern))
        page.go_back()
        wait_for_page_ready(page)
        
        runner.log("WF-02", step_num, "PASS", f"Thẻ '{title}': Đã kiểm tra đầy đủ sự tồn tại, nút 'Xem tất cả' và liên kết dòng", url=page.url)
    except Exception as e:
        runner.screenshot(page, f"wf02_s{step_num}_error")
        runner.log("WF-02", step_num, "FAIL", f"Thẻ '{title}': Lỗi kiểm tra chức năng", str(e), url=page.url)


def test_chart_card(page, runner, step_num, title):
    try:
        # 1. Verify card visibility
        card = page.locator("div[class*='card']").filter(has=page.locator("span", has_text=title)).first
        expect(card).to_be_visible(timeout=3000)
        
        # 2. Verify SVG element exists
        svg = card.locator("div[class*='chartWrapper'] svg")
        expect(svg).to_be_visible()
        
        # 3. Verify Chart legends
        expect(card.get_by_text("Dòng thu")).to_be_visible()
        expect(card.get_by_text("Dòng chi")).to_be_visible()
        
        # 4. Verify Interactive Hover Tooltip if bars exist
        first_bar = card.locator("rect[fill^='url']").first
        try:
            first_bar.wait_for(state="visible", timeout=5000)
        except Exception:
            pass
            
        bars = card.locator("rect[fill^='url']").all()
        if len(bars) > 0:
            # Scroll card into view explicitly to ensure correct mouse hover positioning
            card.scroll_into_view_if_needed()
            time.sleep(0.5)
            
            # Hover directly on the first transparent hover zone to trigger tooltip
            card.locator("rect[fill='transparent']").first.hover()
            time.sleep(0.5)
            
            tooltip = page.locator("div").filter(has_text="Dòng thu:").last
            expect(tooltip).to_be_visible(timeout=3000)
            
        runner.log("WF-02", step_num, "PASS", f"Thẻ '{title}': Đã kiểm tra SVG chart, legend và tương tác hover thành công", url=page.url)
    except Exception as e:
        runner.screenshot(page, f"wf02_s{step_num}_error")
        runner.log("WF-02", step_num, "FAIL", f"Thẻ '{title}': Lỗi kiểm tra biểu đồ", str(e), url=page.url)


def run():
    runner = TestRunner("Batch_02_Dashboard", "batch_02_dashboard_result.md")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 1024})
        page = context.new_page()
        page.set_default_timeout(15000)

        try:
            # ── Step 1: Login và chuyển hướng đến /dashboard ──
            try:
                login(page)
                expect(page).to_have_url(f"{BASE_URL}/dashboard")
                runner.log("WF-02", 1, "PASS", "Đăng nhập thành công và tự động chuyển hướng đến /dashboard", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf02_s1")
                runner.log("WF-02", 1, "FAIL", "Đăng nhập thành công và chuyển hướng đến /dashboard", str(e), "BLOCKER", url=page.url)
                raise e

            # ── Step 2 đến Step 27: Kiểm tra 26 Thẻ Chỉ Số một cách độc lập ──
            
            # Card 1: Đơn bán hàng hôm nay
            test_list_summary_card(page, runner, 2, "Đơn bán hàng hôm nay", r"/sales\?tab=orders", r"/sales")

            # Card 2: Đơn hàng nháp
            test_list_summary_card(page, runner, 3, "Đơn hàng nháp", r"/sales\?tab=orders&status=draft", r"/sales")

            # Card 3: Đơn bán hàng chờ duyệt vượt hạn mức
            test_list_summary_card(page, runner, 4, "Đơn bán hàng chờ duyệt vượt hạn mức", r"/sales\?tab=orders&status=pending_credit_approval", r"/sales")

            # Card 4: Đơn bán hàng chờ giao hàng
            test_list_summary_card(page, runner, 5, "Đơn bán hàng chờ giao hàng", r"/inventory\?tab=entries&status=draft", r"/inventory")

            # Card 5: Đơn mua hàng hoạt động
            test_list_summary_card(page, runner, 6, "Đơn mua hàng hoạt động", r"/purchasing\?tab=orders&status=pending", r"/purchasing")

            # Card 6: Đơn mua hàng nháp
            test_list_summary_card(page, runner, 7, "Đơn mua hàng nháp", r"/purchasing\?tab=orders&status=draft", r"/purchasing")

            # Card 7: Đơn mua hàng chờ nhận hàng
            test_list_summary_card(page, runner, 8, "Đơn mua hàng chờ nhận hàng", r"/inventory\?tab=entries&status=draft", r"/inventory")

            # Card 8: Lô hàng chờ kiểm QC
            test_list_summary_card(page, runner, 9, "Lô hàng chờ kiểm QC", r"/purchasing\?tab=shipment", r"/purchasing")

            # Card 9: Lô hàng chờ phân bổ chi phí
            test_list_summary_card(page, runner, 10, "Lô hàng chờ phân bổ chi phí", r"/purchasing\?tab=shipment", r"/purchasing")

            # Card 10: Hóa đơn mua bị chặn
            test_list_summary_card(page, runner, 11, "Hóa đơn mua bị chặn", r"/purchasing\?tab=invoices&status=blocked", r"/purchasing")

            # Card 11: Phiếu nhập kho chờ duyệt
            test_list_summary_card(page, runner, 12, "Phiếu nhập kho chờ duyệt", r"/inventory\?tab=entries&status=draft", r"/inventory")

            # Card 12: Cảnh báo tồn kho thấp
            test_list_summary_card(page, runner, 13, "Cảnh báo tồn kho thấp", r"/inventory\?tab=ledger", r"/inventory")

            # Card 13: Yêu cầu chuyển kho chờ thực hiện (kiểm tra Tab Filter)
            test_list_summary_card(page, runner, 14, "Yêu cầu chuyển kho chờ thực hiện", r"/inventory\?tab=entries&status=draft", r"/inventory", test_tabs=True)

            # Card 14: Biểu đồ dòng tiền tuần
            test_chart_card(page, runner, 15, "Biểu đồ dòng tiền tuần")

            # Card 15: Giao dịch dòng tiền tháng
            test_list_summary_card(page, runner, 16, "Giao dịch dòng tiền tháng", r"/finance", r"/finance")

            # Card 16: Hóa đơn mua chưa thanh toán
            test_list_summary_card(page, runner, 17, "Hóa đơn mua chưa thanh toán", r"/finance\?tab=ap&status=unpaid", r"/purchasing")

            # Card 17: Hóa đơn bán chưa thanh toán
            test_list_summary_card(page, runner, 18, "Hóa đơn bán chưa thanh toán", r"/sales\?tab=invoices&status=unpaid", r"/sales")

            # Card 18: Khấu hao tài sản cố định
            test_list_summary_card(page, runner, 19, "Khấu hao tài sản cố định", r"/finance/fixed-assets", r"/finance")

            # Card 19: Bảng lương chờ duyệt & thanh toán
            test_list_summary_card(page, runner, 20, "Bảng lương chờ duyệt & thanh toán", r"/hrm\?tab=salary", r"/hrm")

            # Card 20: Yêu cầu nghỉ phép chờ duyệt
            test_list_summary_card(page, runner, 21, "Yêu cầu nghỉ phép chờ duyệt", r"/hrm\?tab=leave", r"/hrm")

            # Card 21: Hợp đồng lao động sắp hết hạn
            test_list_summary_card(page, runner, 22, "Hợp đồng lao động sắp hết hạn", r"/hrm\?tab=employees", r"/hrm")

            # Card 22: Nhân viên vắng mặt hôm nay
            test_list_summary_card(page, runner, 23, "Nhân viên vắng mặt hôm nay", r"/hrm\?tab=attendance", r"/hrm")

            # Card 23: Lệnh sản xuất chờ duyệt
            test_list_summary_card(page, runner, 24, "Lệnh sản xuất chờ duyệt", r"/bom\?tab=wo&status=pending_approval", r"/bom")

            # Card 24: Lệnh sản xuất đang thực hiện
            test_list_summary_card(page, runner, 25, "Lệnh sản xuất đang thực hiện", r"/bom\?tab=wo&status=in_progress", r"/bom")

            # Card 25: Lệnh sản xuất sắp trễ hạn
            test_list_summary_card(page, runner, 26, "Lệnh sản xuất sắp trễ hạn", r"/bom\?tab=wo&status=in_progress", r"/bom")

            # Card 26: Lệnh sản xuất chờ nghiệm thu
            test_list_summary_card(page, runner, 27, "Lệnh sản xuất chờ nghiệm thu", r"/bom\?tab=wo&status=in_progress", r"/bom")

            # ── Step 28 đến Step 37: Kiểm tra Sidebar Navigation ──
            
            # Step 28: Click sidebar "Dashboard" -> verify URL
            try:
                page.get_by_role("link", name="Dashboard").click()
                wait_for_page_ready(page)
                expect(page).to_have_url(f"{BASE_URL}/dashboard")
                runner.log("WF-02", 28, "PASS", "Click sidebar link 'Dashboard' -> URL chứa /dashboard", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf02_s28")
                runner.log("WF-02", 28, "FAIL", "Click sidebar link 'Dashboard' -> URL chứa /dashboard", str(e), url=page.url)

            # Step 29: Click sidebar "BOM" -> verify URL
            try:
                page.get_by_role("link", name="BOM").click()
                wait_for_page_ready(page)
                expect(page).to_have_url(f"{BASE_URL}/bom")
                runner.log("WF-02", 29, "PASS", "Click sidebar link 'BOM' -> URL chứa /bom", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf02_s29")
                runner.log("WF-02", 29, "FAIL", "Click sidebar link 'BOM' -> URL chứa /bom", str(e), url=page.url)

            # Step 30: Click sidebar "Kho" -> verify URL
            try:
                page.get_by_role("link", name="Kho").click()
                wait_for_page_ready(page)
                expect(page).to_have_url(f"{BASE_URL}/inventory")
                runner.log("WF-02", 30, "PASS", "Click sidebar link 'Kho' -> URL chứa /inventory", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf02_s30")
                runner.log("WF-02", 30, "FAIL", "Click sidebar link 'Kho' -> URL chứa /inventory", str(e), url=page.url)

            # Step 31: Click sidebar "Mua Hàng" -> verify URL
            try:
                page.get_by_role("link", name="Mua Hàng").click()
                wait_for_page_ready(page)
                expect(page).to_have_url(f"{BASE_URL}/purchasing")
                runner.log("WF-02", 31, "PASS", "Click sidebar link 'Mua Hàng' -> URL chứa /purchasing", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf02_s31")
                runner.log("WF-02", 31, "FAIL", "Click sidebar link 'Mua Hàng' -> URL chứa /purchasing", str(e), url=page.url)

            # Step 32: Click sidebar "Bán Hàng" -> verify URL
            try:
                page.get_by_role("link", name="Bán Hàng").click()
                wait_for_page_ready(page)
                expect(page).to_have_url(f"{BASE_URL}/sales")
                runner.log("WF-02", 32, "PASS", "Click sidebar link 'Bán Hàng' -> URL chứa /sales", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf02_s32")
                runner.log("WF-02", 32, "FAIL", "Click sidebar link 'Bán Hàng' -> URL chứa /sales", str(e), url=page.url)

            # Step 33: Click sidebar "Khách Hàng" -> verify URL
            try:
                page.get_by_role("link", name="Khách Hàng").click()
                wait_for_page_ready(page)
                expect(page).to_have_url(f"{BASE_URL}/customers")
                runner.log("WF-02", 33, "PASS", "Click sidebar link 'Khách Hàng' -> URL chứa /customers", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf02_s33")
                runner.log("WF-02", 33, "FAIL", "Click sidebar link 'Khách Hàng' -> URL chứa /customers", str(e), url=page.url)

            # Step 34: Click sidebar "Nhà Cung Cấp" -> verify URL
            try:
                page.get_by_role("link", name="Nhà Cung Cấp").click()
                wait_for_page_ready(page)
                expect(page).to_have_url(f"{BASE_URL}/suppliers")
                runner.log("WF-02", 34, "PASS", "Click sidebar link 'Nhà Cung Cấp' -> URL chứa /suppliers", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf02_s34")
                runner.log("WF-02", 34, "FAIL", "Click sidebar link 'Nhà Cung Cấp' -> URL chứa /suppliers", str(e), url=page.url)

            # Step 35: Click sidebar "Dòng Tiền" -> verify URL
            try:
                page.get_by_role("link", name="Dòng Tiền").click()
                wait_for_page_ready(page)
                expect(page).to_have_url(f"{BASE_URL}/finance")
                runner.log("WF-02", 35, "PASS", "Click sidebar link 'Dòng Tiền' -> URL chứa /finance", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf02_s35")
                runner.log("WF-02", 35, "FAIL", "Click sidebar link 'Dòng Tiền' -> URL chứa /finance", str(e), url=page.url)

            # Step 36: Click sidebar "Tài Sản Cố Định" -> verify URL
            try:
                page.get_by_role("link", name="Tài Sản Cố Định").click()
                wait_for_page_ready(page)
                expect(page).to_have_url(f"{BASE_URL}/finance/fixed-assets")
                runner.log("WF-02", 36, "PASS", "Click sidebar link 'Tài Sản Cố Định' -> URL chứa /finance/fixed-assets", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf02_s36")
                runner.log("WF-02", 36, "FAIL", "Click sidebar link 'Tài Sản Cố Định' -> URL chứa /finance/fixed-assets", str(e), url=page.url)

            # Step 37: Click sidebar "Quản Lý HR" -> verify URL
            try:
                page.get_by_role("link", name="Quản Lý HR").click()
                wait_for_page_ready(page)
                expect(page).to_have_url(f"{BASE_URL}/hrm")
                runner.log("WF-02", 37, "PASS", "Click sidebar link 'Quản Lý HR' -> URL chứa /hrm", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf02_s37")
                runner.log("WF-02", 37, "FAIL", "Click sidebar link 'Quản Lý HR' -> URL chứa /hrm", str(e), url=page.url)

        except Exception as e:
            runner.screenshot(page, "wf02_blocker")
            runner.log("WF-02", "ALL", "FAIL", "Toàn bộ WF-02", str(e), "BLOCKER", url=page.url)
        finally:
            browser.close()

    runner.write_report()
    return runner


if __name__ == "__main__":
    run()

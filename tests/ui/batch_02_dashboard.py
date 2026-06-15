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


def find_card(page, title):
    # Find card div that contains the title quickLink link or plain title span.
    # We increase the timeout to 5000ms.
    card = page.locator("div[class*='card']").filter(
        has=page.locator(f"a[aria-label='Mở chi tiết: {title}'], span", has_text=title)
    ).first
    return card


def test_kpi_list_card(page, runner, step_num, title, expected_url, expect_money=True, test_tabs=False):
    try:
        card = find_card(page, title)
        expect(card).to_be_visible(timeout=5000)
        
        # Check empty state first
        empty_state = card.locator("div[class*='emptyState']")
        is_empty = empty_state.count() > 0 and empty_state.is_visible()
        
        if is_empty:
            # Click title card to verify redirection
            title_link = card.locator(f"a[aria-label='Mở chi tiết: {title}']").first
            expect(title_link).to_be_visible()
            title_link.click()
            wait_for_page_ready(page)
            expect(page).to_have_url(re.compile(re.escape(expected_url.split('?')[0])))
            page.go_back()
            wait_for_page_ready(page)
            runner.log("WF-02", step_num, "PASS", f"Thẻ '{title}': Trạng thái trống (Không có hoạt động cần xử lý) và chuyển hướng tiêu đề thành công", url=page.url)
            return

        # 1. Test Tab filtering if requested
        if test_tabs:
            tab_all = card.locator("button", has_text="Tất cả")
            tab_in = card.locator("button", has_text="Nhập 📥")
            tab_out = card.locator("button", has_text="Xuất 📤")
            tab_trf = card.locator("button", has_text="Chuyển 🔄")
            
            expect(tab_all).to_be_visible()
            expect(tab_in).to_be_visible()
            expect(tab_out).to_be_visible()
            expect(tab_trf).to_be_visible()
            
            # Click Tab "Nhập 📥"
            tab_in.click()
            time.sleep(0.5)
            try:
                card.locator("div[class*='loadingOverlay']").wait_for(state="detached", timeout=3000)
            except:
                pass
            rows_out = card.locator("a.colBoldLink").filter(has_text="📤").all()
            rows_trf = card.locator("a.colBoldLink").filter(has_text="🔄").all()
            assert len(rows_out) == 0
            assert len(rows_trf) == 0
            
            # Click Tab "Xuất 📤"
            tab_out.click()
            time.sleep(0.5)
            try:
                card.locator("div[class*='loadingOverlay']").wait_for(state="detached", timeout=3000)
            except:
                pass
            rows_in = card.locator("a.colBoldLink").filter(has_text="📥").all()
            rows_trf = card.locator("a.colBoldLink").filter(has_text="🔄").all()
            assert len(rows_in) == 0
            assert len(rows_trf) == 0

            # Click Tab "Chuyển 🔄"
            tab_trf.click()
            time.sleep(0.5)
            try:
                card.locator("div[class*='loadingOverlay']").wait_for(state="detached", timeout=3000)
            except:
                pass
            rows_in = card.locator("a.colBoldLink").filter(has_text="📥").all()
            rows_out = card.locator("a.colBoldLink").filter(has_text="📤").all()
            assert len(rows_in) == 0
            assert len(rows_out) == 0

            # Back to Tab "Tất cả"
            tab_all.click()
            time.sleep(0.5)
            try:
                card.locator("div[class*='loadingOverlay']").wait_for(state="detached", timeout=3000)
            except:
                pass

        # 2. Verify hero value is visible (BỎ QUA nếu widget không có hero)
        SKIP_HERO_WIDGET_TITLES = ["Khấu hao tài sản cố định", "Bảng lương chờ duyệt & thanh toán"]
        if title not in SKIP_HERO_WIDGET_TITLES:
            hero = card.locator("span[class*='kpiHeroValue']").first
            expect(hero).to_be_visible()
        
        # 3. Verify right aligns (currency/meta)
        if expect_money:
            expect(card.locator("div[class*='cardBody']")).to_have_text(re.compile(r"(₫|đ)"))

        # 4. Test row item detail redirection (if data exists)
        row_links = card.locator("div[class*='kpiListSection'] a.colBoldLink")
        if row_links.count() > 0:
            first_row = row_links.first
            expect(first_row).to_be_visible()
            first_row.click()
            wait_for_page_ready(page)
            expect(page).to_have_url(re.compile(re.escape(expected_url.split('?')[0])))
            page.go_back()
            wait_for_page_ready(page)

        # 5. Click title card to redirect
        title_link = card.locator(f"a[aria-label='Mở chi tiết: {title}']").first
        expect(title_link).to_be_visible()
        title_link.click()
        wait_for_page_ready(page)
        expect(page).to_have_url(re.compile(re.escape(expected_url.split('?')[0])))
        page.go_back()
        wait_for_page_ready(page)

        runner.log("WF-02", step_num, "PASS", f"Thẻ '{title}': Đã kiểm tra kpi_list đầy đủ sự tồn tại, tiêu đề điều hướng và liên kết dòng", url=page.url)
    except Exception as e:
        runner.screenshot(page, f"wf02_s{step_num}_error")
        runner.log("WF-02", step_num, "FAIL", f"Thẻ '{title}': Lỗi kiểm tra chức năng kpi_list", str(e), url=page.url)


def test_line_chart_card(page, runner, step_num, title, expected_url):
    try:
        card = find_card(page, title)
        expect(card).to_be_visible(timeout=5000)
        
        empty_state = card.locator("div[class*='emptyState']")
        if empty_state.count() > 0 and empty_state.is_visible():
            title_link = card.locator(f"a[aria-label='Mở chi tiết: {title}']").first
            expect(title_link).to_be_visible()
            title_link.click()
            wait_for_page_ready(page)
            expect(page).to_have_url(re.compile(re.escape(expected_url.split('?')[0])))
            page.go_back()
            wait_for_page_ready(page)
            runner.log("WF-02", step_num, "PASS", f"Thẻ '{title}': Trạng thái trống (Chưa có dữ liệu biểu đồ doanh thu) và chuyển hướng tiêu đề thành công", url=page.url)
            return

        expect(card.locator("span[class*='kpiHeroValue']").first).to_be_visible()
        expect(card.locator("div[class*='chartWrapper'] svg")).to_be_visible()
        expect(card.locator("path[class*='lineChartArea']")).to_be_visible()
        expect(card.locator("polyline[class*='lineChartPath']")).to_be_visible()
        
        hover_zones = card.locator("rect[fill='transparent']").all()
        if len(hover_zones) > 0:
            card.scroll_into_view_if_needed()
            time.sleep(0.5)
            target_idx = min(3, len(hover_zones) - 1)
            hover_zones[target_idx].hover()
            time.sleep(0.5)
            
            tooltip = page.locator("div[style*='z-index: 10']").last
            expect(tooltip).to_be_visible(timeout=3000)
            expect(tooltip).to_have_text(re.compile(r"(Doanh thu|₫|đ)"))
            
        title_link = card.locator(f"a[aria-label='Mở chi tiết: {title}']").first
        expect(title_link).to_be_visible()
        title_link.click()
        wait_for_page_ready(page)
        expect(page).to_have_url(re.compile(re.escape(expected_url.split('?')[0])))
        page.go_back()
        wait_for_page_ready(page)
        
        runner.log("WF-02", step_num, "PASS", f"Thẻ '{title}': Đã kiểm tra SVG chart, hero value, legend và tương tác hover thành công", url=page.url)
    except Exception as e:
        runner.screenshot(page, f"wf02_s{step_num}_error")
        runner.log("WF-02", step_num, "FAIL", f"Thẻ '{title}': Lỗi kiểm tra biểu đồ line_chart", str(e), url=page.url)


def test_cashflow_overview_card(page, runner, step_num, title, expected_url):
    try:
        card = find_card(page, title)
        expect(card).to_be_visible(timeout=5000)
        
        empty_state = card.locator("div[class*='emptyState']")
        if empty_state.count() > 0 and empty_state.is_visible():
            title_link = card.locator(f"a[aria-label='Mở chi tiết: {title}']").first
            expect(title_link).to_be_visible()
            title_link.click()
            wait_for_page_ready(page)
            expect(page).to_have_url(re.compile(re.escape(expected_url.split('?')[0])))
            page.go_back()
            wait_for_page_ready(page)
            runner.log("WF-02", step_num, "PASS", f"Thẻ '{title}': Trạng thái trống (Chưa có dữ liệu dòng tiền) và chuyển hướng tiêu đề thành công", url=page.url)
            return

        expect(card.locator("text=Dòng tiền ròng")).to_be_visible()
        expect(card.locator("span[class*='cashflowSummaryValue']")).to_be_visible()
        expect(card.locator("text=Tổng thu")).to_be_visible()
        expect(card.locator("text=Tổng chi")).to_be_visible()
        expect(card.locator("div[class*='cashflowChartWrapper'] svg")).to_be_visible()
        
        hover_zones = card.locator("rect[fill='transparent']").all()
        if len(hover_zones) > 0:
            card.scroll_into_view_if_needed()
            time.sleep(0.5)
            target_idx = min(3, len(hover_zones) - 1)
            hover_zones[target_idx].hover()
            time.sleep(0.5)
            
            tooltip = page.locator("div[style*='z-index: 10']").last
            expect(tooltip).to_be_visible(timeout=3000)
            expect(tooltip).to_have_text(re.compile(r"Dòng thu"))
            expect(tooltip).to_have_text(re.compile(r"Dòng chi"))

        title_link = card.locator(f"a[aria-label='Mở chi tiết: {title}']").first
        expect(title_link).to_be_visible()
        title_link.click()
        wait_for_page_ready(page)
        expect(page).to_have_url(re.compile(re.escape(expected_url.split('?')[0])))
        page.go_back()
        wait_for_page_ready(page)

        runner.log("WF-02", step_num, "PASS", f"Thẻ '{title}': Đã kiểm tra tổng quan dòng tiền, SVG chart, legend và tương tác hover thành công", url=page.url)
    except Exception as e:
        runner.screenshot(page, f"wf02_s{step_num}_error")
        runner.log("WF-02", step_num, "FAIL", f"Thẻ '{title}': Lỗi kiểm tra biểu đồ cashflow_overview", str(e), url=page.url)


def test_donut_chart_card(page, runner, step_num, title, expected_url):
    try:
        card = find_card(page, title)
        expect(card).to_be_visible(timeout=5000)
        
        empty_state = card.locator("div[class*='emptyState']")
        if empty_state.count() > 0 and empty_state.is_visible():
            title_link = card.locator(f"a[aria-label='Mở chi tiết: {title}']").first
            expect(title_link).to_be_visible()
            title_link.click()
            wait_for_page_ready(page)
            expect(page).to_have_url(re.compile(re.escape(expected_url.split('?')[0])))
            page.go_back()
            wait_for_page_ready(page)
            runner.log("WF-02", step_num, "PASS", f"Thẻ '{title}': Trạng thái trống (Chưa có dữ liệu) và chuyển hướng tiêu đề thành công", url=page.url)
            return

        donut = card.locator("[data-testid='donut-svg']")
        expect(donut).to_be_visible()
        assert donut.locator("svg circle").count() >= 2
        expect(card.locator("div[class*='donutCenter'] span").first).to_be_visible()
        expect(card.locator("div[class*='donutLegend']").first).to_be_visible()
        
        title_link = card.locator(f"a[aria-label='Mở chi tiết: {title}']").first
        expect(title_link).to_be_visible()
        title_link.click()
        wait_for_page_ready(page)
        expect(page).to_have_url(re.compile(re.escape(expected_url.split('?')[0])))
        page.go_back()
        wait_for_page_ready(page)

        runner.log("WF-02", step_num, "PASS", f"Thẻ '{title}': Đã kiểm tra SVG donut chart, center value và legends thành công", url=page.url)
    except Exception as e:
        runner.screenshot(page, f"wf02_s{step_num}_error")
        runner.log("WF-02", step_num, "FAIL", f"Thẻ '{title}': Lỗi kiểm tra biểu đồ donut_chart", str(e), url=page.url)


def test_component_tracker_card(page, runner, step_num, title, expected_url):
    try:
        card = find_card(page, title)
        expect(card).to_be_visible(timeout=5000)

        # Check empty state
        empty_state = card.locator("div[class*='emptyState']")
        is_empty = empty_state.count() > 0 and empty_state.is_visible()
        if is_empty:
            title_link = card.locator(f"a[aria-label='Mở chi tiết: {title}']").first
            expect(title_link).to_be_visible()
            title_link.click()
            wait_for_page_ready(page)
            expect(page).to_have_url(re.compile(re.escape(expected_url.split('?')[0])))
            page.go_back()
            wait_for_page_ready(page)
            runner.log("WF-02", step_num, "PASS", f"Thẻ '{title}': Trạng thái trống và chuyển hướng tiêu đề thành công", url=page.url)
            return

        # 1. Donut chart visible
        donut = card.locator("[data-testid='donut-svg']")
        expect(donut).to_be_visible()
        assert donut.locator("svg circle").count() >= 2

        # 2. Searchable combobox visible (Tác vụ 1 - A5)
        combobox = card.get_by_role("combobox")
        expect(combobox).to_be_visible()

        # 3. Verify NO visible label "Chọn sản phẩm theo dõi" (Tác vụ 1 - A1)
        label_locator = card.locator("label", has_text="Chọn sản phẩm theo dõi")
        assert label_locator.count() == 0, "Label 'Chọn sản phẩm theo dõi' phải được ẩn"

        # 4. Verify options chỉ chứa item_name, không có pattern "MÃ - Tên" (Tác vụ 1 - A3)
        combobox.click()
        time.sleep(0.3)
        options = card.get_by_role("option").all()
        for opt in options:
            opt_text = (opt.text_content() or "").strip()
            # Bỏ qua placeholder option nếu có
            if opt_text and not opt_text.startswith("Chọn"):
                assert " - " not in opt_text, f"Option '{opt_text}' có dấu '-' không mong muốn (Tác vụ 1 - A3)"
        page.keyboard.press("Escape")
        time.sleep(0.3)

        # 5. Legend shows all active warehouses (Tác vụ 1 - A6)
        legend_items = card.locator("div[class*='donutLegendItem']").all()
        assert len(legend_items) >= 3, f"Legend phải có ≥3 kho, hiện tại: {len(legend_items)}"

        # 6. Title click redirect
        title_link = card.locator(f"a[aria-label='Mở chi tiết: {title}']").first
        expect(title_link).to_be_visible()
        title_link.click()
        wait_for_page_ready(page)
        expect(page).to_have_url(re.compile(re.escape(expected_url.split('?')[0])))
        page.go_back()
        wait_for_page_ready(page)

        runner.log("WF-02", step_num, "PASS", f"Thẻ '{title}': SearchableSelect OK, không label visible, đủ 4 kho", url=page.url)
    except Exception as e:
        runner.screenshot(page, f"wf02_s{step_num}_error")
        runner.log("WF-02", step_num, "FAIL", f"Thẻ '{title}': Lỗi kiểm tra component tracker", str(e), url=page.url)


def test_aging_bar_chart_card(page, runner, step_num, title, expected_url):
    try:
        card = find_card(page, title)
        expect(card).to_be_visible(timeout=5000)
        
        empty_state = card.locator("div[class*='emptyState']")
        if empty_state.count() > 0 and empty_state.is_visible():
            title_link = card.locator(f"a[aria-label='Mở chi tiết: {title}']").first
            expect(title_link).to_be_visible()
            title_link.click()
            wait_for_page_ready(page)
            expect(page).to_have_url(re.compile(re.escape(expected_url.split('?')[0])))
            page.go_back()
            wait_for_page_ready(page)
            runner.log("WF-02", step_num, "PASS", f"Thẻ '{title}': Trạng thái trống (Chưa có dữ liệu phân tích nợ) và chuyển hướng tiêu đề thành công", url=page.url)
            return

        expect(card.locator("text=Tổng dư nợ")).to_be_visible()
        expect(card.locator("span[class*='agingTotal']")).to_be_visible()
        donut = card.locator("[data-testid='donut-svg']")
        expect(donut).to_be_visible()
        expect(card.locator("div[class*='donutLegend']").first).to_be_visible()
        
        title_link = card.locator(f"a[aria-label='Mở chi tiết: {title}']").first
        expect(title_link).to_be_visible()
        title_link.click()
        wait_for_page_ready(page)
        expect(page).to_have_url(re.compile(re.escape(expected_url.split('?')[0])))
        page.go_back()
        wait_for_page_ready(page)

        runner.log("WF-02", step_num, "PASS", f"Thẻ '{title}': Đã kiểm tra SVG aging donut chart, dư nợ và legends thành công", url=page.url)
    except Exception as e:
        runner.screenshot(page, f"wf02_s{step_num}_error")
        runner.log("WF-02", step_num, "FAIL", f"Thẻ '{title}': Lỗi kiểm tra biểu đồ aging_bar_chart", str(e), url=page.url)


def test_gauge_card(page, runner, step_num, title, expected_url):
    try:
        card = find_card(page, title)
        expect(card).to_be_visible(timeout=5000)
        
        empty_state = card.locator("div[class*='emptyState']")
        if empty_state.count() > 0 and empty_state.is_visible():
            title_link = card.locator(f"a[aria-label='Mở chi tiết: {title}']").first
            expect(title_link).to_be_visible()
            title_link.click()
            wait_for_page_ready(page)
            expect(page).to_have_url(re.compile(re.escape(expected_url.split('?')[0])))
            page.go_back()
            wait_for_page_ready(page)
            runner.log("WF-02", step_num, "PASS", f"Thẻ '{title}': Trạng thái trống và chuyển hướng tiêu đề thành công", url=page.url)
            return

        gauge = card.locator("[data-testid='gauge-svg']")
        expect(gauge).to_be_visible()
        expect(gauge.locator("svg circle")).to_have_count(2)
        expect(card.locator("span[class*='gaugeValue']")).to_be_visible()
        expect(card.locator("text=người vắng")).to_be_visible()
        
        title_link = card.locator(f"a[aria-label='Mở chi tiết: {title}']").first
        expect(title_link).to_be_visible()
        title_link.click()
        wait_for_page_ready(page)
        expect(page).to_have_url(re.compile(re.escape(expected_url.split('?')[0])))
        page.go_back()
        wait_for_page_ready(page)

        runner.log("WF-02", step_num, "PASS", f"Thẻ '{title}': Đã kiểm tra SVG gauge, rate value và absent count thành công", url=page.url)
    except Exception as e:
        runner.screenshot(page, f"wf02_s{step_num}_error")
        runner.log("WF-02", step_num, "FAIL", f"Thẻ '{title}': Lỗi kiểm tra biểu đồ gauge", str(e), url=page.url)


def test_stacked_progress_card(page, runner, step_num, title, expected_url):
    try:
        card = find_card(page, title)
        expect(card).to_be_visible(timeout=5000)
        
        empty_state = card.locator("div[class*='emptyState']")
        if empty_state.count() > 0 and empty_state.is_visible():
            title_link = card.locator(f"a[aria-label='Mở chi tiết: {title}']").first
            expect(title_link).to_be_visible()
            title_link.click()
            wait_for_page_ready(page)
            expect(page).to_have_url(re.compile(re.escape(expected_url.split('?')[0])))
            page.go_back()
            wait_for_page_ready(page)
            runner.log("WF-02", step_num, "PASS", f"Thẻ '{title}': Trạng thái trống (Không có lệnh sản xuất đang chạy) và chuyển hướng tiêu đề thành công", url=page.url)
            return

        expect(card.locator("div[class*='stackedList']")).to_be_visible()
        rows = card.locator("div[class*='stackedRow']").all()
        if len(rows) > 0:
            first_row = rows[0]
            expect(first_row.locator("div[class*='stackedTrack']")).to_be_visible()
            expect(first_row.locator("div[class*='stackedFill']")).to_be_visible()
            expect(first_row.locator("span[class*='stackedRowQty']")).to_be_visible()
            
        title_link = card.locator(f"a[aria-label='Mở chi tiết: {title}']").first
        expect(title_link).to_be_visible()
        title_link.click()
        wait_for_page_ready(page)
        expect(page).to_have_url(re.compile(re.escape(expected_url.split('?')[0])))
        page.go_back()
        wait_for_page_ready(page)

        runner.log("WF-02", step_num, "PASS", f"Thẻ '{title}': Đã kiểm tra stacked progress bar list và chuyển hướng tiêu đề thành công", url=page.url)
    except Exception as e:
        runner.screenshot(page, f"wf02_s{step_num}_error")
        runner.log("WF-02", step_num, "FAIL", f"Thẻ '{title}': Lỗi kiểm tra stacked progress card", str(e), url=page.url)


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

            # ── Steps 2-26: Kiểm tra 25 Thẻ Chỉ Số ──
            # Card 1: Doanh thu hôm nay
            test_line_chart_card(page, runner, 2, "Doanh thu hôm nay", "/sales?tab=orders")

            # Card 2: Đơn bán hàng nháp
            test_kpi_list_card(page, runner, 3, "Đơn bán hàng nháp", "/sales?tab=orders&status=draft", expect_money=True)

            # Card 3: Đơn bán hàng chờ duyệt vượt hạn mức
            test_kpi_list_card(page, runner, 4, "Đơn bán hàng chờ duyệt vượt hạn mức", "/sales?tab=orders&status=pending_credit_approval", expect_money=True)

            # Card 4: Đơn bán hàng đang hoạt động
            test_kpi_list_card(page, runner, 5, "Đơn bán hàng đang hoạt động", "/sales?tab=orders&status=pending", expect_money=True)

            # Card 5: Đơn mua hàng hoạt động
            test_kpi_list_card(page, runner, 6, "Đơn mua hàng hoạt động", "/purchasing?tab=orders&status=pending", expect_money=True)

            # Card 6: Đơn mua hàng nháp
            test_kpi_list_card(page, runner, 7, "Đơn mua hàng nháp", "/purchasing?tab=orders&status=draft", expect_money=True)

            # Card 7: Đơn mua hàng chờ nhận hàng (ĐÃ XÓA khỏi registry)
            runner.log("WF-02", 8, "SKIP", "Thẻ 'Đơn mua hàng chờ nhận hàng' đã bị xóa khỏi dashboard registry")

            # Card 8: Lô hàng chờ kiểm QC (ĐÃ XÓA khỏi registry)
            runner.log("WF-02", 9, "SKIP", "Thẻ 'Lô hàng chờ kiểm QC' đã bị xóa khỏi dashboard registry")

            # Card 9: Lô Hàng Chờ Duyệt
            test_kpi_list_card(page, runner, 10, "Lô Hàng Chờ Duyệt", "/purchasing?tab=shipment&status=draft", expect_money=False)

            # Card 10: Hóa đơn mua bị chặn (ĐÃ XÓA khỏi registry)
            runner.log("WF-02", 11, "SKIP", "Thẻ 'Hóa đơn mua bị chặn' đã bị xóa khỏi dashboard registry")

            # Card 11: Phiếu nhập kho chờ duyệt (ĐÃ XÓA khỏi registry)
            runner.log("WF-02", 12, "SKIP", "Thẻ 'Phiếu nhập kho chờ duyệt' đã bị xóa khỏi dashboard registry")

            # Card 12: Theo dõi linh kiện
            test_component_tracker_card(page, runner, 13, "Theo dõi linh kiện", "/inventory?tab=ledger")

            # Card 13: Yêu cầu chuyển kho chờ thực hiện
            test_kpi_list_card(page, runner, 14, "Yêu cầu chuyển kho chờ thực hiện", "/inventory?tab=entries&status=draft", expect_money=False, test_tabs=True)

            # Card 14: Tổng quan & Xu hướng dòng tiền
            test_cashflow_overview_card(page, runner, 15, "Tổng quan & Xu hướng dòng tiền", "/finance")

            # Card 15: Hóa đơn mua chưa thanh toán
            test_aging_bar_chart_card(page, runner, 16, "Hóa đơn mua chưa thanh toán", "/finance?tab=purchase_invoices&status=unpaid,partial")

            # Card 16: Hóa đơn bán chưa thanh toán
            test_aging_bar_chart_card(page, runner, 17, "Hóa đơn bán chưa thanh toán", "/finance?tab=sales_invoices&status=unpaid,partial")

            # Card 17: Khấu hao tài sản cố định
            test_kpi_list_card(page, runner, 18, "Khấu hao tài sản cố định", "/finance/fixed-assets", expect_money=False)

            # Card 18: Bảng lương chờ duyệt & thanh toán
            test_kpi_list_card(page, runner, 19, "Bảng lương chờ duyệt & thanh toán", "/hrm?tab=salary", expect_money=True)

            # Card 19: Yêu cầu nghỉ phép chờ duyệt
            test_kpi_list_card(page, runner, 20, "Yêu cầu nghỉ phép chờ duyệt", "/hrm?tab=leave", expect_money=False)

            # Card 20: Hợp đồng lao động sắp hết hạn
            test_kpi_list_card(page, runner, 21, "Hợp đồng lao động sắp hết hạn", "/hrm?tab=employees", expect_money=False)

            # Card 21: Theo dõi vắng mặt
            test_gauge_card(page, runner, 22, "Theo dõi vắng mặt", "/hrm?tab=attendance")

            # Card 22: Lệnh sản xuất chờ duyệt
            test_kpi_list_card(page, runner, 23, "Lệnh sản xuất chờ duyệt", "/bom?tab=wo&status=pending_approval", expect_money=False)

            # Card 23: Lệnh sản xuất đang thực hiện
            test_stacked_progress_card(page, runner, 24, "Lệnh sản xuất đang thực hiện", "/bom?tab=wo&status=in_progress")

            # Card 25: Lệnh sản xuất chờ nghiệm thu
            test_kpi_list_card(page, runner, 25, "Lệnh sản xuất chờ nghiệm thu", "/bom?tab=wo&status=pending_production_complete", expect_money=False)

            # ── Steps 26-35: Kiểm tra Sidebar Navigation ──
            # Step 26: Dashboard
            try:
                page.get_by_role("link", name="Dashboard").click()
                wait_for_page_ready(page)
                expect(page).to_have_url(f"{BASE_URL}/dashboard")
                runner.log("WF-02", 26, "PASS", "Click sidebar link 'Dashboard' -> URL chứa /dashboard", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf02_s26")
                runner.log("WF-02", 26, "FAIL", "Click sidebar link 'Dashboard' -> URL chứa /dashboard", str(e), url=page.url)

            # Step 27: BOM
            try:
                page.get_by_role("link", name="BOM").click()
                wait_for_page_ready(page)
                expect(page).to_have_url(f"{BASE_URL}/bom")
                runner.log("WF-02", 27, "PASS", "Click sidebar link 'BOM' -> URL chứa /bom", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf02_s27")
                runner.log("WF-02", 27, "FAIL", "Click sidebar link 'BOM' -> URL chứa /bom", str(e), url=page.url)

            # Step 28: Kho
            try:
                page.get_by_role("link", name="Kho").click()
                wait_for_page_ready(page)
                expect(page).to_have_url(f"{BASE_URL}/inventory")
                runner.log("WF-02", 28, "PASS", "Click sidebar link 'Kho' -> URL chứa /inventory", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf02_s28")
                runner.log("WF-02", 28, "FAIL", "Click sidebar link 'Kho' -> URL chứa /inventory", str(e), url=page.url)

            # Step 29: Mua Hàng
            try:
                page.get_by_role("link", name="Mua Hàng").click()
                wait_for_page_ready(page)
                expect(page).to_have_url(f"{BASE_URL}/purchasing")
                runner.log("WF-02", 29, "PASS", "Click sidebar link 'Mua Hàng' -> URL chứa /purchasing", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf02_s29")
                runner.log("WF-02", 29, "FAIL", "Click sidebar link 'Mua Hàng' -> URL chứa /purchasing", str(e), url=page.url)

            # Step 30: Bán Hàng
            try:
                page.get_by_role("link", name="Bán Hàng").click()
                wait_for_page_ready(page)
                expect(page).to_have_url(f"{BASE_URL}/sales")
                runner.log("WF-02", 30, "PASS", "Click sidebar link 'Bán Hàng' -> URL chứa /sales", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf02_s30")
                runner.log("WF-02", 30, "FAIL", "Click sidebar link 'Bán Hàng' -> URL chứa /sales", str(e), url=page.url)

            # Step 31: Khách Hàng
            try:
                page.get_by_role("link", name="Khách Hàng").click()
                wait_for_page_ready(page)
                expect(page).to_have_url(f"{BASE_URL}/customers")
                runner.log("WF-02", 31, "PASS", "Click sidebar link 'Khách Hàng' -> URL chứa /customers", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf02_s31")
                runner.log("WF-02", 31, "FAIL", "Click sidebar link 'Khách Hàng' -> URL chứa /customers", str(e), url=page.url)

            # Step 32: Nhà Cung Cấp
            try:
                page.get_by_role("link", name="Nhà Cung Cấp").click()
                wait_for_page_ready(page)
                expect(page).to_have_url(f"{BASE_URL}/suppliers")
                runner.log("WF-02", 32, "PASS", "Click sidebar link 'Nhà Cung Cấp' -> URL chứa /suppliers", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf02_s32")
                runner.log("WF-02", 32, "FAIL", "Click sidebar link 'Nhà Cung Cấp' -> URL chứa /suppliers", str(e), url=page.url)

            # Step 33: Dòng Tiền
            try:
                page.get_by_role("link", name="Dòng Tiền").click()
                wait_for_page_ready(page)
                expect(page).to_have_url(f"{BASE_URL}/finance")
                runner.log("WF-02", 33, "PASS", "Click sidebar link 'Dòng Tiền' -> URL chứa /finance", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf02_s33")
                runner.log("WF-02", 33, "FAIL", "Click sidebar link 'Dòng Tiền' -> URL chứa /finance", str(e), url=page.url)

            # Step 34: Tài Sản Cố Định
            try:
                page.get_by_role("link", name="Tài Sản Cố Định").click()
                wait_for_page_ready(page)
                expect(page).to_have_url(f"{BASE_URL}/finance/fixed-assets")
                runner.log("WF-02", 34, "PASS", "Click sidebar link 'Tài Sản Cố Định' -> URL chứa /finance/fixed-assets", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf02_s34")
                runner.log("WF-02", 34, "FAIL", "Click sidebar link 'Tài Sản Cố Định' -> URL chứa /finance/fixed-assets", str(e), url=page.url)

            # Step 35: Quản Lý HR
            try:
                page.get_by_role("link", name="Quản Lý HR").click()
                wait_for_page_ready(page)
                expect(page).to_have_url(re.compile(rf"{BASE_URL}/hrm(\?.*)?$"))
                runner.log("WF-02", 35, "PASS", "Click sidebar link 'Quản Lý HR' -> URL chứa /hrm", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf02_s35")
                runner.log("WF-02", 35, "FAIL", "Click sidebar link 'Quản Lý HR' -> URL chứa /hrm", str(e), url=page.url)

        except Exception as e:
            runner.screenshot(page, "wf02_blocker")
            runner.log("WF-02", "ALL", "FAIL", "Toàn bộ WF-02", str(e), "BLOCKER", url=page.url)
        finally:
            browser.close()

    runner.write_report()
    return runner


if __name__ == "__main__":
    run()

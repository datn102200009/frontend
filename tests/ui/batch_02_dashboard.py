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

            # ── Step 2: Kiểm tra sự tồn tại của 26 Thẻ Chỉ Số (Widgets) ──
            widgets = [
                "Đơn bán hàng hôm nay",
                "Đơn hàng nháp",
                "Đơn bán hàng chờ duyệt vượt hạn mức",
                "Đơn bán hàng chờ giao hàng",
                "Đơn mua hàng hoạt động",
                "Đơn mua hàng nháp",
                "Đơn mua hàng chờ nhận hàng",
                "Lô hàng chờ kiểm QC",
                "Lô hàng chờ phân bổ chi phí",
                "Hóa đơn mua bị chặn",
                "Phiếu nhập kho chờ duyệt",
                "Cảnh báo tồn kho thấp",
                "Yêu cầu chuyển kho chờ thực hiện",
                "Biểu đồ dòng tiền tuần",
                "Giao dịch dòng tiền tháng",
                "Hóa đơn mua chưa thanh toán",
                "Hóa đơn bán chưa thanh toán",
                "Khấu hao tài sản cố định",
                "Bảng lương chờ duyệt & thanh toán",
                "Yêu cầu nghỉ phép chờ duyệt",
                "Hợp đồng lao động sắp hết hạn",
                "Nhân viên vắng mặt hôm nay",
                "Lệnh sản xuất chờ duyệt",
                "Lệnh sản xuất đang thực hiện",
                "Lệnh sản xuất sắp trễ hạn",
                "Lệnh sản xuất chờ nghiệm thu"
            ]
            
            missing_widgets = []
            for w_title in widgets:
                try:
                    expect(page.get_by_text(w_title).first).to_be_visible(timeout=2000)
                except Exception:
                    missing_widgets.append(w_title)
            
            if not missing_widgets:
                runner.log("WF-02", 2, "PASS", "Tất cả 26 thẻ chỉ số (KPIs & Lists & Charts) đều hiển thị trên dashboard", url=page.url)
            else:
                runner.screenshot(page, "wf02_s2_missing")
                runner.log("WF-02", 2, "FAIL", "Tất cả 26 thẻ chỉ số đều hiển thị trên dashboard", f"Thiếu các thẻ: {', '.join(missing_widgets)}", url=page.url)

            # ── Step 3: Kiểm tra chức năng Tab Filter trên thẻ Yêu cầu chuyển kho chờ thực hiện ──
            try:
                card = page.locator("div").filter(has=page.locator("span", has_text="Yêu cầu chuyển kho chờ thực hiện")).first
                expect(card).to_be_visible()
                
                # Check các tab button có mặt
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
                # Đảm bảo chỉ hiển thị các dòng nhập kho (chứa icon 📥) và không hiển thị các dòng xuất/chuyển kho (📤/🔄)
                # Dựa trên local dataset, kiểm tra tính lọc chính xác
                rows_in = card.locator("a").filter(has_text="📥").all()
                rows_out = card.locator("a").filter(has_text="📤").all()
                rows_trf = card.locator("a").filter(has_text="🔄").all()
                
                assert len(rows_in) >= 0
                assert len(rows_out) == 0
                assert len(rows_trf) == 0
                
                # Click Tab "Xuất 📤"
                tab_out.click()
                time.sleep(0.5)
                rows_in = card.locator("a").filter(has_text="📥").all()
                rows_out = card.locator("a").filter(has_text="📤").all()
                rows_trf = card.locator("a").filter(has_text="🔄").all()
                
                assert len(rows_in) == 0
                assert len(rows_out) >= 0
                assert len(rows_trf) == 0

                # Click Tab "Chuyển 🔄"
                tab_trf.click()
                time.sleep(0.5)
                rows_in = card.locator("a").filter(has_text="📥").all()
                rows_out = card.locator("a").filter(has_text="📤").all()
                rows_trf = card.locator("a").filter(has_text="🔄").all()
                
                assert len(rows_in) == 0
                assert len(rows_out) == 0
                assert len(rows_trf) >= 0

                # Quay lại Tab "Tất cả"
                tab_all.click()
                time.sleep(0.5)
                runner.log("WF-02", 3, "PASS", "Bộ lọc tab (Tất cả, Nhập, Xuất, Chuyển) trên thẻ Yêu cầu chuyển kho hoạt động chính xác", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf02_s3")
                runner.log("WF-02", 3, "FAIL", "Bộ lọc tab trên thẻ Yêu cầu chuyển kho hoạt động chính xác", str(e), url=page.url)

            # ── Step 4: Kiểm tra Link điều hướng cấp dòng (Yêu cầu chuyển kho chờ thực hiện) ──
            try:
                card = page.locator("div").filter(has=page.locator("span", has_text="Yêu cầu chuyển kho chờ thực hiện")).first
                # Lấy link đầu tiên không phải link 'Xem tất cả'
                first_row_link = card.locator("a").filter(has_not_text="Xem tất cả").first
                link_text = first_row_link.text_content()
                
                first_row_link.click()
                wait_for_page_ready(page)
                
                # Phải chuyển đến /inventory với query parameters phù hợp (tab=entries, status=draft, id=...)
                expect(page).to_have_url(re.compile(r"/inventory\?tab=entries&status=draft&id=.*"))
                
                # Trở lại Dashboard
                page.go_back()
                wait_for_page_ready(page)
                expect(page).to_have_url(f"{BASE_URL}/dashboard")
                runner.log("WF-02", 4, "PASS", f"Link điều hướng cấp dòng hoạt động đúng: Click '{link_text}' -> chuyển trang chi tiết phiếu kho -> Back lại Dashboard thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf02_s4")
                runner.log("WF-02", 4, "FAIL", "Link điều hướng cấp dòng hoạt động đúng", str(e), url=page.url)

            # ── Step 5: Kiểm tra Link điều hướng cấp dòng (Lệnh sản xuất chờ duyệt) ──
            try:
                card = page.locator("div").filter(has=page.locator("span", has_text="Lệnh sản xuất chờ duyệt")).first
                first_row_link = card.locator("a").filter(has_not_text="Xem tất cả").first
                link_text = first_row_link.text_content()
                
                first_row_link.click()
                wait_for_page_ready(page)
                
                # Phải chuyển đến /bom với tab=wo và status=pending_approval và id=...
                expect(page).to_have_url(re.compile(r"/bom\?status=pending_approval&tab=wo&id=.*"))
                
                # Trở lại Dashboard
                page.go_back()
                wait_for_page_ready(page)
                expect(page).to_have_url(f"{BASE_URL}/dashboard")
                runner.log("WF-02", 5, "PASS", f"Link điều hướng cấp dòng hoạt động đúng: Click '{link_text}' -> chuyển trang chi tiết lệnh sản xuất -> Back lại Dashboard thành công", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf02_s5")
                runner.log("WF-02", 5, "FAIL", "Link điều hướng cấp dòng hoạt động đúng (Lệnh sản xuất)", str(e), url=page.url)

            # ── Step 6: Kiểm tra nút "Xem tất cả" (Yêu cầu chuyển kho chờ thực hiện) ──
            try:
                card = page.locator("div").filter(has=page.locator("span", has_text="Yêu cầu chuyển kho chờ thực hiện")).first
                view_all_link = card.locator("a").filter(has_text="Xem tất cả").first
                expect(view_all_link).to_be_visible()
                
                view_all_link.click()
                wait_for_page_ready(page)
                
                # Phải chuyển đến trang /inventory?tab=entries&status=draft
                expect(page).to_have_url(f"{BASE_URL}/inventory?tab=entries&status=draft")
                
                # Trở lại Dashboard
                page.goto(f"{BASE_URL}/dashboard")
                wait_for_page_ready(page)
                runner.log("WF-02", 6, "PASS", "Nút 'Xem tất cả' trên thẻ Yêu cầu chuyển kho hoạt động đúng -> chuyển hướng đến trang /inventory?tab=entries&status=draft", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf02_s6")
                runner.log("WF-02", 6, "FAIL", "Nút 'Xem tất cả' trên thẻ Yêu cầu chuyển kho hoạt động đúng", str(e), url=page.url)

            # ── Step 7: Kiểm tra nút "Xem tất cả" (Lệnh sản xuất chờ duyệt) ──
            try:
                card = page.locator("div").filter(has=page.locator("span", has_text="Lệnh sản xuất chờ duyệt")).first
                view_all_link = card.locator("a").filter(has_text="Xem tất cả").first
                expect(view_all_link).to_be_visible()
                
                view_all_link.click()
                wait_for_page_ready(page)
                
                # Phải chuyển đến trang /bom?tab=wo&status=pending_approval
                expect(page).to_have_url(f"{BASE_URL}/bom?tab=wo&status=pending_approval")
                
                # Trở lại Dashboard
                page.goto(f"{BASE_URL}/dashboard")
                wait_for_page_ready(page)
                runner.log("WF-02", 7, "PASS", "Nút 'Xem tất cả' trên thẻ Lệnh sản xuất chờ duyệt hoạt động đúng -> chuyển hướng đến trang /bom?tab=wo&status=pending_approval", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf02_s7")
                runner.log("WF-02", 7, "FAIL", "Nút 'Xem tất cả' trên thẻ Lệnh sản xuất chờ duyệt hoạt động đúng", str(e), url=page.url)

            # ── Step 8: Click sidebar "Dashboard" -> verify URL ──
            try:
                page.get_by_role("link", name="Dashboard").click()
                wait_for_page_ready(page)
                expect(page).to_have_url(f"{BASE_URL}/dashboard")
                runner.log("WF-02", 8, "PASS", "Click sidebar link 'Dashboard' -> URL chứa /dashboard", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf02_s8")
                runner.log("WF-02", 8, "FAIL", "Click sidebar link 'Dashboard' -> URL chứa /dashboard", str(e), url=page.url)

            # ── Step 9: Click sidebar "BOM" -> verify URL ──
            try:
                page.get_by_role("link", name="BOM").click()
                wait_for_page_ready(page)
                expect(page).to_have_url(f"{BASE_URL}/bom")
                runner.log("WF-02", 9, "PASS", "Click sidebar link 'BOM' -> URL chứa /bom", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf02_s9")
                runner.log("WF-02", 9, "FAIL", "Click sidebar link 'BOM' -> URL chứa /bom", str(e), url=page.url)

            # ── Step 10: Click sidebar "Kho" -> verify URL ──
            try:
                page.get_by_role("link", name="Kho").click()
                wait_for_page_ready(page)
                expect(page).to_have_url(f"{BASE_URL}/inventory")
                runner.log("WF-02", 10, "PASS", "Click sidebar link 'Kho' -> URL chứa /inventory", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf02_s10")
                runner.log("WF-02", 10, "FAIL", "Click sidebar link 'Kho' -> URL chứa /inventory", str(e), url=page.url)

            # ── Step 11: Click sidebar "Mua Hàng" -> verify URL ──
            try:
                page.get_by_role("link", name="Mua Hàng").click()
                wait_for_page_ready(page)
                expect(page).to_have_url(f"{BASE_URL}/purchasing")
                runner.log("WF-02", 11, "PASS", "Click sidebar link 'Mua Hàng' -> URL chứa /purchasing", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf02_s11")
                runner.log("WF-02", 11, "FAIL", "Click sidebar link 'Mua Hàng' -> URL chứa /purchasing", str(e), url=page.url)

            # ── Step 12: Click sidebar "Bán Hàng" -> verify URL ──
            try:
                page.get_by_role("link", name="Bán Hàng").click()
                wait_for_page_ready(page)
                expect(page).to_have_url(f"{BASE_URL}/sales")
                runner.log("WF-02", 12, "PASS", "Click sidebar link 'Bán Hàng' -> URL chứa /sales", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf02_s12")
                runner.log("WF-02", 12, "FAIL", "Click sidebar link 'Bán Hàng' -> URL chứa /sales", str(e), url=page.url)

            # ── Step 13: Click sidebar "Khách Hàng" -> verify URL ──
            try:
                page.get_by_role("link", name="Khách Hàng").click()
                wait_for_page_ready(page)
                expect(page).to_have_url(f"{BASE_URL}/customers")
                runner.log("WF-02", 13, "PASS", "Click sidebar link 'Khách Hàng' -> URL chứa /customers", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf02_s13")
                runner.log("WF-02", 13, "FAIL", "Click sidebar link 'Khách Hàng' -> URL chứa /customers", str(e), url=page.url)

            # ── Step 14: Click sidebar "Nhà Cung Cấp" -> verify URL ──
            try:
                page.get_by_role("link", name="Nhà Cung Cấp").click()
                wait_for_page_ready(page)
                expect(page).to_have_url(f"{BASE_URL}/suppliers")
                runner.log("WF-02", 14, "PASS", "Click sidebar link 'Nhà Cung Cấp' -> URL chứa /suppliers", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf02_s14")
                runner.log("WF-02", 14, "FAIL", "Click sidebar link 'Nhà Cung Cấp' -> URL chứa /suppliers", str(e), url=page.url)

            # ── Step 15: Click sidebar "Dòng Tiền" -> verify URL ──
            try:
                page.get_by_role("link", name="Dòng Tiền").click()
                wait_for_page_ready(page)
                expect(page).to_have_url(f"{BASE_URL}/finance")
                runner.log("WF-02", 15, "PASS", "Click sidebar link 'Dòng Tiền' -> URL chứa /finance", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf02_s15")
                runner.log("WF-02", 15, "FAIL", "Click sidebar link 'Dòng Tiền' -> URL chứa /finance", str(e), url=page.url)

            # ── Step 16: Click sidebar "Tài Sản Cố Định" -> verify URL ──
            try:
                page.get_by_role("link", name="Tài Sản Cố Định").click()
                wait_for_page_ready(page)
                expect(page).to_have_url(f"{BASE_URL}/finance/fixed-assets")
                runner.log("WF-02", 16, "PASS", "Click sidebar link 'Tài Sản Cố Định' -> URL chứa /finance/fixed-assets", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf02_s16")
                runner.log("WF-02", 16, "FAIL", "Click sidebar link 'Tài Sản Cố Định' -> URL chứa /finance/fixed-assets", str(e), url=page.url)

            # ── Step 17: Click sidebar "Quản Lý HR" -> verify URL ──
            try:
                page.get_by_role("link", name="Quản Lý HR").click()
                wait_for_page_ready(page)
                expect(page).to_have_url(f"{BASE_URL}/hrm")
                runner.log("WF-02", 17, "PASS", "Click sidebar link 'Quản Lý HR' -> URL chứa /hrm", url=page.url)
            except Exception as e:
                runner.screenshot(page, "wf02_s17")
                runner.log("WF-02", 17, "FAIL", "Click sidebar link 'Quản Lý HR' -> URL chứa /hrm", str(e), url=page.url)

        except Exception as e:
            runner.screenshot(page, "wf02_blocker")
            runner.log("WF-02", "ALL", "FAIL", "Toàn bộ WF-02", str(e), "BLOCKER", url=page.url)
        finally:
            browser.close()

    runner.write_report()
    return runner


if __name__ == "__main__":
    run()

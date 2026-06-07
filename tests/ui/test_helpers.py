# -*- coding: utf-8 -*-
"""
Shared test helpers for UI batch testing.
Provides login, logging, screenshot, and report generation utilities.
"""
import sys
import os
import time
from datetime import datetime

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:5173"
ADMIN_USER = "admin"
ADMIN_PASS = "admin123"  # Khop voi database migration
EMPLOYEE_USER = "employee"
EMPLOYEE_PASS = "employee123"  # Khop voi database migration
REPORT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "report", "error")
SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), "screenshots")


def setup_dirs():
    """Create report and screenshot directories if they don't exist."""
    os.makedirs(REPORT_DIR, exist_ok=True)
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)


def login(page, username=None, password=None):
    """Login to the application. Uses admin credentials by default."""
    username = username or ADMIN_USER
    password = password or ADMIN_PASS
    page.goto(f"{BASE_URL}/login")
    page.wait_for_load_state("networkidle")
    page.locator("input[name='username']").fill(username)
    page.locator("input[name='password']").fill(password)
    page.get_by_role("button", name="Đăng nhập").click()
    page.wait_for_url("**/dashboard", timeout=15000)
    page.wait_for_load_state("networkidle")
    time.sleep(1)


def wait_for_page_ready(page, timeout=5000):
    """Wait for page to be fully loaded."""
    page.wait_for_load_state("networkidle", timeout=timeout)
    time.sleep(0.5)


def safe_click(page, locator, timeout=10000):
    """Click a locator with retry and wait for stability."""
    locator.wait_for(state="visible", timeout=timeout)
    locator.click()


def dismiss_all_toasts(page):
    """Dismiss any visible toast notifications."""
    try:
        dismiss_buttons = page.get_by_role("button", name="Đóng thông báo").all()
        for btn in dismiss_buttons:
            try:
                btn.click(timeout=1000)
            except Exception:
                pass
    except Exception:
        pass


def wait_for_toast(page, text, timeout=10000):
    """Wait for a toast message to appear."""
    return page.get_by_text(text).wait_for(state="visible", timeout=timeout)


def select_searchable(page, label, search_text, option_text=None):
    """Interact with a SearchableSelect component.
    
    Args:
        page: Playwright page
        label: The label/aria-label of the combobox
        search_text: Text to type in search field
        option_text: Text of the option to select (defaults to search_text)
    """
    option_text = option_text or search_text
    combobox = page.get_by_role("combobox", name=label)
    combobox.click()
    time.sleep(0.3)
    # Type in the search field that appears
    search_input = page.get_by_placeholder("Tìm kiếm...")
    search_input.fill(search_text)
    time.sleep(0.5)
    # Click the matching option
    page.get_by_role("option", name=option_text).click()
    time.sleep(0.3)


class TestRunner:
    """Test runner that tracks results and generates reports."""

    def __init__(self, batch_name, report_file):
        self.batch_name = batch_name
        self.report_file = os.path.join(REPORT_DIR, report_file)
        self.results = []
        self.passed = 0
        self.failed = 0
        self.blocked = 0
        self.errors = []
        self.start_time = datetime.now()
        setup_dirs()
        print(f"\n{'='*60}")
        print(f"🚀 Starting {batch_name}")
        print(f"{'='*60}")

    def log(self, wf_id, step, status, expected, actual="OK", severity="ERROR", url=""):
        """Log a test step result."""
        timestamp = datetime.now().strftime("%H:%M:%S")
        result = {
            "wf": wf_id, "step": step, "status": status,
            "expected": expected, "actual": actual,
            "severity": severity, "url": url, "timestamp": timestamp,
        }
        self.results.append(result)

        if status == "PASS":
            self.passed += 1
            print(f"  ✅ [{wf_id}] Step {step}: {expected}")
        elif status == "SKIP":
            print(f"  ⏭️ [{wf_id}] Step {step}: {expected} (SKIPPED)")
        elif severity == "BLOCKER":
            self.blocked += 1
            self.failed += 1
            self.errors.append(result)
            print(f"  🔴 [{wf_id}] Step {step}: {expected} → BLOCKER: {actual}")
        else:
            self.failed += 1
            self.errors.append(result)
            print(f"  ❌ [{wf_id}] Step {step}: {expected} → {actual[:120]}")

    def screenshot(self, page, name):
        """Take a screenshot and return the path."""
        path = os.path.join(SCREENSHOT_DIR, f"{self.batch_name}_{name}.png")
        try:
            page.screenshot(path=path)
        except Exception:
            pass
        return path

    def write_report(self):
        """Write the test report to a markdown file."""
        elapsed = (datetime.now() - self.start_time).total_seconds()
        with open(self.report_file, "w", encoding="utf-8") as f:
            f.write(f"# {self.batch_name} — Test Report\n\n")
            f.write(f"- **Thời gian bắt đầu**: {self.start_time.strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"- **Thời gian chạy**: {elapsed:.1f}s\n")
            f.write(f"- **Kết quả**: ✅ {self.passed} PASS | ❌ {self.failed} FAIL | 🔴 {self.blocked} BLOCKER\n\n")

            if self.errors:
                f.write("## Lỗi chi tiết\n\n")
                for e in self.errors:
                    f.write(f"### [{e['wf']}] Step {e['step']} — {e['severity']}\n")
                    f.write(f"- **Thời gian**: {e['timestamp']}\n")
                    f.write(f"- **URL**: {e['url']}\n")
                    f.write(f"- **Expected**: {e['expected']}\n")
                    f.write(f"- **Actual**: {e['actual']}\n\n")

            f.write("## Tất cả kết quả\n\n")
            f.write("| WF | Step | Status | Expected |\n")
            f.write("|-----|------|--------|----------|\n")
            for r in self.results:
                icon = "✅" if r["status"] == "PASS" else ("⏭️" if r["status"] == "SKIP" else "❌")
                exp = r["expected"][:80]
                f.write(f"| {r['wf']} | {r['step']} | {icon} {r['status']} | {exp} |\n")

        print(f"\n{'='*60}")
        print(f"📊 {self.batch_name} — Kết quả: ✅ {self.passed} PASS | ❌ {self.failed} FAIL")
        print(f"⏱️ Thời gian: {elapsed:.1f}s")
        print(f"📝 Report: {self.report_file}")
        print(f"{'='*60}\n")

        return self.failed == 0

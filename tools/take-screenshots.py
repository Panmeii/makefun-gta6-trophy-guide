#!/usr/bin/env python3
"""Take the entry's screenshots with Playwright (Chromium), exactly per shots.json.

Seeds a believable mid-run tracker state in localStorage (the app's own storage format),
then captures: 1) the checklist, 2) the silver filter with The Shootist open,
3) the bronze filter scrolled 1400px, 4) the roadmap view. Real renders, never edited.
"""
import json
import pathlib
import sys

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "screenshots"
BASE = "http://localhost:8080"
KEY = "leonida-platinum-progress-v1"

SEED = {
    "earned": [2, 3, 4, 5, 8, 9, 20, 21, 22, 24, 26, 39],
    "counts": {
        "15": 137, "16": 7, "17": 31, "18": 9, "19": 12, "25": 5, "28": 6,
        "30": 1, "31": 47, "32": 23, "35": 64, "40": 2, "43": 4, "48": 212,
        "52": 90000, "53": 42000, "54": 3, "55": 4,
    },
    "revealed": [],
    "spoiler": True,
    "hideEarned": False,
}


def shot(page, name):
    path = OUT / name
    page.screenshot(path=str(path), type="jpeg", quality=82)
    size = path.stat().st_size
    print(f"{name}: {size} bytes")
    if size > 262144:
        print(f"  !! over the 256 KiB cap", file=sys.stderr)
        sys.exit(1)


def main():
    OUT.mkdir(exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(BASE, wait_until="networkidle")
        page.evaluate(
            "([k, v]) => localStorage.setItem(k, v)",
            [KEY, json.dumps(SEED)],
        )
        page.reload(wait_until="networkidle")
        page.wait_for_selector(".row")

        # 1 — checklist, all grades, Positive Mental Attitude open in the guide panel
        shot(page, "1-checklist.jpg")

        # 2 — silver filter via the starter's mechanism: the #grade select + change event
        page.select_option("#grade", "silver")
        page.wait_for_selector(".row")
        page.click('.row[data-id="17"]')
        page.wait_for_timeout(250)
        shot(page, "2-silver.jpg")

        # 3 — bronze filter, a mid-list guide open, window scrolled exactly 1400px
        page.select_option("#grade", "bronze")
        page.wait_for_selector(".row")
        page.click('.row[data-id="34"]')
        page.wait_for_timeout(250)
        page.evaluate("window.scrollTo(0, 1400)")
        page.wait_for_timeout(250)
        shot(page, "3-bronze.jpg")

        # 4 — the roadmap view
        page.evaluate("window.scrollTo(0, 0)")
        page.click('.view-tab[data-view="roadmap"]')
        page.wait_for_timeout(300)
        shot(page, "4-roadmap.jpg")

        if errors:
            print("page errors:", errors, file=sys.stderr)
            sys.exit(1)
        browser.close()
    print("screenshots done")


if __name__ == "__main__":
    main()

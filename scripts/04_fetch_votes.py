"""
Stage 4: Fetch legislative voting records from SF Board of Supervisors.

Uses the Legistar HTML export (Export.xls) as an index of legislation,
then uses Playwright to:
  1. Build a file-number → Legistar-URL mapping via bulk search pages
  2. Navigate directly to each detail page
  3. Click "Action details" for BOS actions
  4. Extract individual votes from the HistoryDetail iframe modal

Optimized for speed: avoids per-item search by collecting URLs in bulk.
"""

import json
import os
import re
import time
from html.parser import HTMLParser

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
EXPORT_DIR = os.path.join(DATA_DIR, "legistar_exports")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "data", "supervisors")
LEGISTAR_BASE = "https://sfgov.legistar.com"

RELEVANT_TYPES = {"Ordinance", "Resolution", "Charter Amendment"}
RELEVANT_STATUSES = {"Passed", "Failed"}


class TableParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_table = self.in_row = self.in_cell = False
        self.rows = []
        self.cr = []
        self.cc = ""

    def handle_starttag(self, tag, attrs):
        if tag == "table":
            self.in_table = True
        elif tag == "tr" and self.in_table:
            self.in_row = True
            self.cr = []
        elif tag in ("td", "th") and self.in_row:
            self.in_cell = True
            self.cc = ""

    def handle_endtag(self, tag):
        if tag == "table":
            self.in_table = False
        elif tag == "tr" and self.in_row:
            self.in_row = False
            if self.cr:
                self.rows.append(self.cr)
        elif tag in ("td", "th") and self.in_cell:
            self.in_cell = False
            self.cr.append(self.cc.strip())

    def handle_data(self, data):
        if self.in_cell:
            self.cc += data


def parse_export():
    """Parse the Legistar HTML export file."""
    export_path = os.path.join(EXPORT_DIR, "Export.xls")
    if not os.path.exists(export_path):
        print("Export file not found. Download from sfgov.legistar.com/Legislation.aspx")
        return []

    print("Parsing export file...")
    with open(export_path, "r", encoding="utf-8", errors="replace") as f:
        content = f.read()

    parser = TableParser()
    parser.feed(content)

    items = []
    for row in parser.rows[1:]:
        if len(row) < 8:
            continue

        file_num = row[0]
        leg_type = row[3]
        status = row[4]
        intro_date = row[5]
        title = row[7]

        if intro_date:
            parts = intro_date.split("/")
            if len(parts) == 3 and int(parts[2]) < 2024:
                continue

        if leg_type not in RELEVANT_TYPES or status not in RELEVANT_STATUSES:
            continue

        items.append({
            "file_num": file_num,
            "type": leg_type.lower(),
            "status": status.lower(),
            "intro_date": intro_date,
            "title": title,
        })

    print("  {} relevant items".format(len(items)))
    return items


def _collect_urls_from_search(page, file_nums_needed):
    """Bulk-collect Legistar URLs by searching one file number at a time.
    Returns a dict mapping file_num -> (legistar_id, guid, href)."""
    url_map = {}

    # Load the URL map cache if it exists
    url_cache_path = os.path.join(DATA_DIR, "legistar_url_map.json")
    if os.path.exists(url_cache_path):
        with open(url_cache_path) as f:
            url_map = json.load(f)

    needed = [fn for fn in file_nums_needed if fn not in url_map]
    if not needed:
        return url_map

    print("  Collecting Legistar URLs for {} items...".format(len(needed)))

    for i, file_num in enumerate(needed):
        try:
            page.goto("{}/Legislation.aspx".format(LEGISTAR_BASE), wait_until="networkidle", timeout=15000)
            page.fill("input#ctl00_ContentPlaceHolder1_txtSearch", file_num)
            page.click("text=Search Legislation", timeout=5000)
            page.wait_for_timeout(2000)

            link = page.locator("a[href*='LegislationDetail']").first
            if link.count() > 0:
                href = link.get_attribute("href")
                id_match = re.search(r'ID=(\d+)', href)
                guid_match = re.search(r'GUID=([A-F0-9-]+)', href, re.IGNORECASE)
                if id_match and guid_match:
                    url_map[file_num] = {
                        "id": id_match.group(1),
                        "guid": guid_match.group(1),
                    }
        except Exception:
            pass

        if (i + 1) % 50 == 0:
            print("    {}/{} URLs collected".format(i + 1, len(needed)))
            with open(url_cache_path, "w") as f:
                json.dump(url_map, f)

        time.sleep(0.3)

    with open(url_cache_path, "w") as f:
        json.dump(url_map, f, indent=2)

    print("  Collected {} URLs total".format(len(url_map)))
    return url_map


def fetch_votes():
    """Main entry point."""
    from playwright.sync_api import sync_playwright

    os.makedirs(DATA_DIR, exist_ok=True)

    # Load supervisor name -> district mapping
    supervisors = {}
    name_to_district = {}
    for i in range(1, 12):
        path = os.path.join(OUTPUT_DIR, "district-{}.json".format(i))
        if os.path.exists(path):
            with open(path) as f:
                supervisors[i] = json.load(f)
            last_name = supervisors[i]["name"].split()[-1].lower()
            name_to_district[last_name] = i

    items = parse_export()
    if not items:
        return

    # Load vote cache
    cache_path = os.path.join(DATA_DIR, "vote_scrape_cache.json")
    cache = {}
    if os.path.exists(cache_path):
        with open(cache_path) as f:
            cache = json.load(f)

    to_scrape = [item for item in items if item["file_num"] not in cache or cache[item["file_num"]] is None]
    print("  {} to scrape ({} already cached)".format(len(to_scrape), len(items) - len(to_scrape)))

    if not to_scrape:
        print("  Nothing to scrape!")
    else:
        print("\nStarting Playwright browser...")
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.set_default_timeout(15000)

            # Phase 1: Collect Legistar URLs for items we need
            file_nums_needed = [item["file_num"] for item in to_scrape]
            url_map = _collect_urls_from_search(page, file_nums_needed)

            # Phase 2: Visit each detail page directly (much faster than searching each time)
            print("\n  Scraping vote details...")
            for i, item in enumerate(to_scrape):
                file_num = item["file_num"]
                url_info = url_map.get(file_num)

                if url_info:
                    result = _scrape_detail_page(page, item, url_info)
                else:
                    result = None  # No URL found

                cache[file_num] = result

                if (i + 1) % 25 == 0:
                    with_votes = sum(1 for v in cache.values() if v and v.get("votes"))
                    print("  {}/{} scraped, {} with votes".format(i + 1, len(to_scrape), with_votes))
                    with open(cache_path, "w") as f:
                        json.dump(cache, f)

                time.sleep(0.2)

            browser.close()

        with open(cache_path, "w") as f:
            json.dump(cache, f, indent=2)

    # Collect results and write vote files
    all_legislation = [v for v in cache.values() if v and v.get("votes")]
    print("\nTotal legislation with votes: {}".format(len(all_legislation)))

    district_votes = {i: [] for i in range(1, 12)}

    for leg in all_legislation:
        for vote_entry in leg.get("votes", []):
            person = vote_entry["person"].lower()
            for last_name, district in name_to_district.items():
                if last_name in person:
                    district_votes[district].append({
                        "id": "leg-{}".format(leg["file_num"]),
                        "title": leg["title"],
                        "date": leg.get("date", ""),
                        "type": leg["type"],
                        "vote": vote_entry["vote"],
                        "result": leg.get("result", "unknown"),
                        "legistar_url": "{}/LegislationDetail.aspx?ID={}&GUID={}".format(
                            LEGISTAR_BASE, leg.get("legistar_id", ""), leg.get("legistar_guid", "")
                        ),
                    })
                    break

    for dist in range(1, 12):
        votes = district_votes[dist]
        votes.sort(key=lambda v: v.get("date", ""), reverse=True)
        seen = set()
        unique = [v for v in votes if not (v["id"] in seen or seen.add(v["id"]))]

        outpath = os.path.join(OUTPUT_DIR, "district-{}_votes.json".format(dist))
        with open(outpath, "w") as f:
            json.dump(unique, f, indent=2)
        sup_name = supervisors.get(dist, {}).get("name", "Unknown")
        print("  District {} ({}): {} votes".format(dist, sup_name, len(unique)))

    with open(os.path.join(DATA_DIR, "legistar_legislation_raw.json"), "w") as f:
        json.dump(all_legislation, f, indent=2)

    print("\nDone.")


def _scrape_detail_page(page, item, url_info):
    """Navigate directly to a legislation detail page and extract votes."""
    file_num = item["file_num"]
    legistar_id = url_info["id"]
    legistar_guid = url_info["guid"]

    url = "{}/LegislationDetail.aspx?ID={}&GUID={}".format(LEGISTAR_BASE, legistar_id, legistar_guid)

    try:
        page.goto(url, wait_until="networkidle", timeout=15000)
    except Exception:
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=10000)
            page.wait_for_timeout(2000)
        except Exception:
            return None

    # Pull the full title from the detail page
    full_title = item["title"]
    try:
        title_el = page.locator("#ctl00_ContentPlaceHolder1_lblTitle2")
        if title_el.count() > 0:
            page_title = title_el.first.inner_text(timeout=3000).strip()
            if len(page_title) > len(full_title):
                full_title = page_title
    except Exception:
        pass

    # Find "Action details" links
    action_links = page.locator("a:text-is('Action details')")
    link_count = action_links.count()
    if link_count == 0:
        return None

    # Find Board of Supervisors actions
    bos_action_indices = []
    for idx in range(link_count):
        try:
            row = action_links.nth(idx).locator("xpath=ancestor::tr[1]")
            cells = row.locator("td")
            if cells.count() >= 5:
                action_by = cells.nth(2).inner_text(timeout=2000).strip()
                action_name = cells.nth(3).inner_text(timeout=2000).strip()
                if "Board of Supervisors" in action_by:
                    bos_action_indices.append((idx, action_name))
        except Exception:
            continue

    # Try each BOS action
    for idx, action_name in bos_action_indices:
        try:
            action_links.nth(idx).click()
            page.wait_for_timeout(2000)

            votes = _extract_votes_from_iframe(page)

            # Close modal
            try:
                close_btn = page.locator("[title='Close'], .rwCloseButton")
                if close_btn.count() > 0:
                    close_btn.first.click(timeout=2000)
                else:
                    page.keyboard.press("Escape")
            except Exception:
                page.keyboard.press("Escape")
            page.wait_for_timeout(500)

            if votes:
                result = "passed" if "PASSED" in action_name or "ADOPTED" in action_name else "failed"
                return {
                    "file_num": file_num,
                    "legistar_id": legistar_id,
                    "legistar_guid": legistar_guid,
                    "title": full_title,
                    "date": item["intro_date"],
                    "type": item["type"],
                    "result": result,
                    "votes": votes,
                }

        except Exception:
            try:
                page.keyboard.press("Escape")
                page.wait_for_timeout(300)
            except Exception:
                pass

    return None


def _extract_votes_from_iframe(page):
    """Extract individual votes from the HistoryDetail iframe in the modal."""
    votes = []

    for frame in page.frames:
        if "HistoryDetail" not in frame.url:
            continue

        try:
            body_text = frame.locator("body").inner_text(timeout=5000)
        except Exception:
            continue

        lines = body_text.split("\n")
        in_vote_section = False

        for line in lines:
            stripped = line.strip()

            if "Person Name" in stripped and "Vote" in stripped:
                in_vote_section = True
                continue

            if in_vote_section and stripped:
                parts = stripped.split("\t")
                if len(parts) >= 2:
                    person = parts[0].strip()
                    vote_val = parts[1].strip().lower()

                    if person and vote_val and person not in ("Group", "Export"):
                        votes.append({
                            "person": person,
                            "vote": _map_vote(vote_val),
                        })

        if votes:
            break

    return votes


def _map_vote(value):
    v = value.strip().lower()
    if "aye" in v or "yes" in v:
        return "yea"
    if "no" in v or "nay" in v:
        return "nay"
    if "absent" in v or "not present" in v:
        return "absent"
    if "excused" in v:
        return "excused"
    return "absent"


if __name__ == "__main__":
    fetch_votes()

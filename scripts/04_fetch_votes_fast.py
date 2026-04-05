"""
Stage 4 (fast): Fetch votes using multiple independent processes.

Splits the work into N chunks, launches N subprocesses each with
their own Playwright browser, then merges results.
"""

import json
import os
import re
import sys
import time
import subprocess
from html.parser import HTMLParser

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
EXPORT_DIR = os.path.join(DATA_DIR, "legistar_exports")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "data", "supervisors")
LEGISTAR_BASE = "https://sfgov.legistar.com"

RELEVANT_TYPES = {"Ordinance", "Resolution", "Charter Amendment"}
RELEVANT_STATUSES = {"Passed", "Failed"}
NUM_WORKERS = 4


class TableParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_table = self.in_row = self.in_cell = False
        self.rows = []; self.cr = []; self.cc = ""
    def handle_starttag(self, tag, attrs):
        if tag == "table": self.in_table = True
        elif tag == "tr" and self.in_table: self.in_row = True; self.cr = []
        elif tag in ("td","th") and self.in_row: self.in_cell = True; self.cc = ""
    def handle_endtag(self, tag):
        if tag == "table": self.in_table = False
        elif tag == "tr" and self.in_row: self.in_row = False; self.rows.append(self.cr) if self.cr else None
        elif tag in ("td","th") and self.in_cell: self.in_cell = False; self.cr.append(self.cc.strip())
    def handle_data(self, data):
        if self.in_cell: self.cc += data


def parse_export():
    export_path = os.path.join(EXPORT_DIR, "Export.xls")
    if not os.path.exists(export_path): return []
    with open(export_path, "r", encoding="utf-8", errors="replace") as f:
        content = f.read()
    parser = TableParser()
    parser.feed(content)
    items = []
    for row in parser.rows[1:]:
        if len(row) < 8: continue
        file_num, leg_type, status, intro_date, title = row[0], row[3], row[4], row[5], row[7]
        if intro_date:
            parts = intro_date.split("/")
            if len(parts) == 3 and int(parts[2]) < 2024: continue
        if leg_type not in RELEVANT_TYPES or status not in RELEVANT_STATUSES: continue
        items.append({"file_num": file_num, "type": leg_type.lower(), "status": status.lower(), "intro_date": intro_date, "title": title})
    return items


def worker_main(worker_id, items_json_path, output_path):
    """Entry point for a worker subprocess."""
    from playwright.sync_api import sync_playwright

    with open(items_json_path) as f:
        items = json.load(f)

    print("[W{}] Starting with {} items".format(worker_id, len(items)), flush=True)
    results = {}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_default_timeout(12000)

        for i, item in enumerate(items):
            results[item["file_num"]] = _scrape_item(page, item)
            if (i + 1) % 25 == 0:
                wv = sum(1 for v in results.values() if v and v.get("votes"))
                print("[W{}] {}/{}, {} with votes".format(worker_id, i + 1, len(items), wv), flush=True)
                with open(output_path, "w") as f:
                    json.dump(results, f)

        browser.close()

    with open(output_path, "w") as f:
        json.dump(results, f, indent=2)
    wv = sum(1 for v in results.values() if v and v.get("votes"))
    print("[W{}] Done. {} items, {} with votes".format(worker_id, len(results), wv), flush=True)


def _scrape_item(page, item):
    file_num = item["file_num"]
    try:
        page.goto("{}/Legislation.aspx".format(LEGISTAR_BASE), wait_until="networkidle", timeout=12000)
        page.fill("input#ctl00_ContentPlaceHolder1_txtSearch", file_num)
        page.click("text=Search Legislation", timeout=5000)
        page.wait_for_timeout(2000)

        detail_link = page.locator("a[href*='LegislationDetail']").first
        if detail_link.count() == 0: return None

        href = detail_link.get_attribute("href")
        id_match = re.search(r'ID=(\d+)', href)
        guid_match = re.search(r'GUID=([A-F0-9-]+)', href, re.IGNORECASE)
        legistar_id = id_match.group(1) if id_match else ""
        legistar_guid = guid_match.group(1) if guid_match else ""

        detail_link.click()
        page.wait_for_timeout(2500)

        full_title = item["title"]
        try:
            title_el = page.locator("#ctl00_ContentPlaceHolder1_lblTitle2")
            if title_el.count() > 0:
                pt = title_el.first.inner_text(timeout=3000).strip()
                if len(pt) > len(full_title): full_title = pt
        except: pass

        action_links = page.locator("a:text-is('Action details')")
        if action_links.count() == 0: return None

        bos_actions = []
        for idx in range(action_links.count()):
            try:
                row = action_links.nth(idx).locator("xpath=ancestor::tr[1]")
                cells = row.locator("td")
                if cells.count() >= 5:
                    action_by = cells.nth(2).inner_text(timeout=2000).strip()
                    action_name = cells.nth(3).inner_text(timeout=2000).strip()
                    if "Board of Supervisors" in action_by:
                        bos_actions.append((idx, action_name))
            except: continue

        for idx, action_name in bos_actions:
            try:
                action_links.nth(idx).click()
                page.wait_for_timeout(2000)
                votes = _extract_votes(page)
                try:
                    close = page.locator("[title='Close'], .rwCloseButton")
                    if close.count() > 0: close.first.click(timeout=2000)
                    else: page.keyboard.press("Escape")
                except: page.keyboard.press("Escape")
                page.wait_for_timeout(400)

                if votes:
                    return {
                        "file_num": file_num, "legistar_id": legistar_id,
                        "legistar_guid": legistar_guid, "title": full_title,
                        "date": item["intro_date"], "type": item["type"],
                        "result": "passed" if "PASSED" in action_name or "ADOPTED" in action_name else "failed",
                        "votes": votes,
                    }
            except:
                try: page.keyboard.press("Escape"); page.wait_for_timeout(300)
                except: pass
    except: pass
    return None


def _extract_votes(page):
    for frame in page.frames:
        if "HistoryDetail" not in frame.url: continue
        try: body_text = frame.locator("body").inner_text(timeout=4000)
        except: continue
        votes = []
        in_votes = False
        for line in body_text.split("\n"):
            s = line.strip()
            if "Person Name" in s and "Vote" in s: in_votes = True; continue
            if in_votes and s:
                parts = s.split("\t")
                if len(parts) >= 2:
                    person, vv = parts[0].strip(), parts[1].strip().lower()
                    if person and vv and person not in ("Group", "Export"):
                        v = "yea" if ("aye" in vv or "yes" in vv) else "nay" if ("no" in vv or "nay" in vv) else "absent" if ("absent" in vv or "not present" in vv) else "excused" if "excused" in vv else "absent"
                        votes.append({"person": person, "vote": v})
        if votes: return votes
    return []


def main():
    if len(sys.argv) >= 4 and sys.argv[1] == "--worker":
        worker_id = int(sys.argv[2])
        items_path = sys.argv[3]
        output_path = sys.argv[4]
        worker_main(worker_id, items_path, output_path)
        return

    os.makedirs(DATA_DIR, exist_ok=True)
    items = parse_export()
    print("Parsed {} items".format(len(items)))

    cache_path = os.path.join(DATA_DIR, "vote_scrape_cache.json")
    cache = {}
    if os.path.exists(cache_path):
        with open(cache_path) as f: cache = json.load(f)

    to_scrape = [item for item in items if item["file_num"] not in cache or cache[item["file_num"]] is None]
    print("{} to scrape ({} cached)".format(len(to_scrape), len(items) - len(to_scrape)))

    if to_scrape:
        # Split work into chunks
        chunks = [[] for _ in range(NUM_WORKERS)]
        for i, item in enumerate(to_scrape):
            chunks[i % NUM_WORKERS].append(item)

        # Write chunk files and launch subprocesses
        procs = []
        for w in range(NUM_WORKERS):
            if not chunks[w]: continue
            chunk_path = os.path.join(DATA_DIR, "worker_{}_items.json".format(w))
            output_path = os.path.join(DATA_DIR, "worker_{}_results.json".format(w))
            with open(chunk_path, "w") as f:
                json.dump(chunks[w], f)
            print("Worker {}: {} items".format(w, len(chunks[w])))
            proc = subprocess.Popen(
                [sys.executable, __file__, "--worker", str(w), chunk_path, output_path],
                stdout=sys.stdout, stderr=sys.stderr,
            )
            procs.append((w, proc, output_path))

        # Wait for all workers
        for w, proc, _ in procs:
            proc.wait()
            print("Worker {} exited with code {}".format(w, proc.returncode))

        # Merge results
        for w, _, output_path in procs:
            if os.path.exists(output_path):
                with open(output_path) as f:
                    worker_results = json.load(f)
                cache.update(worker_results)
                os.remove(output_path)

        # Clean up chunk files
        for w in range(NUM_WORKERS):
            p = os.path.join(DATA_DIR, "worker_{}_items.json".format(w))
            if os.path.exists(p): os.remove(p)

        with open(cache_path, "w") as f:
            json.dump(cache, f, indent=2)

    # Write vote files
    supervisors = {}
    name_to_district = {}
    for i in range(1, 12):
        path = os.path.join(OUTPUT_DIR, "district-{}.json".format(i))
        if os.path.exists(path):
            with open(path) as f: supervisors[i] = json.load(f)
            name_to_district[supervisors[i]["name"].split()[-1].lower()] = i

    all_leg = [v for v in cache.values() if v and v.get("votes")]
    print("\nTotal with votes: {}".format(len(all_leg)))

    district_votes = {i: [] for i in range(1, 12)}
    for leg in all_leg:
        for ve in leg.get("votes", []):
            person = ve["person"].lower()
            for ln, dist in name_to_district.items():
                if ln in person:
                    district_votes[dist].append({
                        "id": "leg-{}".format(leg["file_num"]), "title": leg["title"],
                        "date": leg.get("date", ""), "type": leg["type"], "vote": ve["vote"],
                        "result": leg.get("result", "unknown"),
                        "legistar_url": "{}/LegislationDetail.aspx?ID={}&GUID={}".format(
                            LEGISTAR_BASE, leg.get("legistar_id", ""), leg.get("legistar_guid", "")),
                    })
                    break

    for dist in range(1, 12):
        votes = district_votes[dist]
        votes.sort(key=lambda v: v.get("date", ""), reverse=True)
        seen = set()
        unique = [v for v in votes if not (v["id"] in seen or seen.add(v["id"]))]
        with open(os.path.join(OUTPUT_DIR, "district-{}_votes.json".format(dist)), "w") as f:
            json.dump(unique, f, indent=2)
        print("  D{} ({}): {} votes".format(dist, supervisors.get(dist, {}).get("name", "?"), len(unique)))

    print("\nDone.")


if __name__ == "__main__":
    main()

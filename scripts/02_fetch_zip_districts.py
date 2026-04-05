"""
Stage 2: Fetch ZIP-to-district crosswalk from DataSF and process into lookup table.

Source: https://data.sfgov.org/Geographic-Locations-and-Boundaries/Supervisor-District-2022-to-ZIP-Code-Crosswalk/2x22-z5j6
Also downloads and processes district boundary GeoJSON.
"""

import csv
import io
import json
import os

import requests

CROSSWALK_URL = "https://data.sfgov.org/api/views/2x22-z5j6/rows.csv?accessType=DOWNLOAD"
GEOJSON_URL = "https://data.sfgov.org/api/geospatial/f2zs-jevy?method=export&type=GeoJSON&format=geojson"

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
PUBLIC_DATA = os.path.join(os.path.dirname(__file__), "..", "public", "data")


def fetch_zip_districts():
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(PUBLIC_DATA, exist_ok=True)

    # --- ZIP Crosswalk ---
    print("Fetching ZIP-to-district crosswalk...")
    resp = requests.get(CROSSWALK_URL)
    resp.raise_for_status()

    reader = csv.DictReader(io.StringIO(resp.text))
    entries = []
    for row in reader:
        entries.append({
            "zip": row["zip_code"],
            "district": int(row["sup_dist"]),
        })

    # Save raw CSV
    with open(os.path.join(DATA_DIR, "zip_district_crosswalk.csv"), "w") as f:
        f.write(resp.text)

    # Compute ratios (equal split when ZIP spans multiple districts)
    from collections import Counter

    zip_counts = Counter(e["zip"] for e in entries)
    lookup = []
    for entry in entries:
        count = zip_counts[entry["zip"]]
        lookup.append({
            "zip": entry["zip"],
            "district": entry["district"],
            "ratio": round(1.0 / count, 4),
        })

    lookup.sort(key=lambda e: (e["zip"], e["district"]))

    with open(os.path.join(PUBLIC_DATA, "zip_lookup.json"), "w") as f:
        json.dump(lookup, f, indent=2)

    unique_zips = set(e["zip"] for e in lookup)
    print(f"  {len(lookup)} entries covering {len(unique_zips)} unique ZIPs")

    # --- District Boundaries GeoJSON ---
    print("Fetching district boundaries...")
    resp = requests.get(GEOJSON_URL)
    resp.raise_for_status()
    raw = resp.json()

    # Simplify properties
    for feat in raw["features"]:
        props = feat["properties"]
        feat["properties"] = {
            "district": int(props["sup_dist"]),
            "name": props["sup_name"],
        }

    with open(os.path.join(PUBLIC_DATA, "district_boundaries.geojson"), "w") as f:
        json.dump(raw, f)

    print(f"  {len(raw['features'])} district boundaries written")
    print("Done.")


if __name__ == "__main__":
    fetch_zip_districts()

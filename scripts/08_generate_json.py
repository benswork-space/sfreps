"""
Stage 8: Generate final JSON files for the frontend.

This script validates and finalizes all data files, ensuring consistency
and generating any aggregate/summary files needed by the frontend.
"""

import json
import os

PUBLIC_DATA = os.path.join(os.path.dirname(__file__), "..", "public", "data")


def generate_json():
    """Validate and finalize all data files."""
    print("Generating final JSON files...\n")

    # --- Validate supervisor files ---
    supervisors = []
    for i in range(1, 12):
        path = os.path.join(PUBLIC_DATA, "supervisors", f"district-{i}.json")
        if not os.path.exists(path):
            print(f"  WARNING: Missing supervisor file for district {i}")
            continue

        with open(path) as f:
            sup = json.load(f)

        supervisors.append(sup)
        funding = sup.get("funding", {})
        donor_align = sup.get("donor_alignment", {})
        dist_align = sup.get("district_alignment", {})

        print(f"  District {i}: {sup['name']}")
        print(f"    Funding: ${funding.get('total_raised', 0):,.0f}")
        print(f"    Donor alignment: {donor_align.get('overall_pct', 0)}% ({donor_align.get('total_votes_scored', 0)} votes)")
        print(f"    District alignment: {dist_align.get('overall_pct', 0)}% ({dist_align.get('issues_scored', 0)} issues)")

    # --- Validate vote files ---
    total_votes = 0
    for i in range(1, 12):
        path = os.path.join(PUBLIC_DATA, "supervisors", f"district-{i}_votes.json")
        if os.path.exists(path):
            with open(path) as f:
                votes = json.load(f)
            total_votes += len(votes)

    print(f"\n  Total vote records: {total_votes}")

    # --- Validate district files ---
    total_ballot_results = 0
    for i in range(1, 12):
        path = os.path.join(PUBLIC_DATA, "districts", f"district-{i}.json")
        if os.path.exists(path):
            with open(path) as f:
                dist = json.load(f)
            total_ballot_results += len(dist.get("ballot_results", []))

    print(f"  Total ballot results: {total_ballot_results}")

    # --- Validate ZIP lookup ---
    zip_path = os.path.join(PUBLIC_DATA, "zip_lookup.json")
    if os.path.exists(zip_path):
        with open(zip_path) as f:
            zip_data = json.load(f)
        unique_zips = len(set(e["zip"] for e in zip_data))
        print(f"  ZIP lookup: {len(zip_data)} entries, {unique_zips} unique ZIPs")
    else:
        print("  WARNING: Missing zip_lookup.json")

    # --- Validate GeoJSON ---
    geo_path = os.path.join(PUBLIC_DATA, "district_boundaries.geojson")
    if os.path.exists(geo_path):
        with open(geo_path) as f:
            geo = json.load(f)
        print(f"  District boundaries: {len(geo['features'])} features")
    else:
        print("  WARNING: Missing district_boundaries.geojson")

    # --- Generate supervisors index ---
    index = []
    for sup in supervisors:
        index.append({
            "id": sup["id"],
            "district": sup["district"],
            "name": sup["name"],
            "funding_total": sup.get("funding", {}).get("total_raised", 0),
            "donor_alignment_pct": sup.get("donor_alignment", {}).get("overall_pct", 0),
            "district_alignment_pct": sup.get("district_alignment", {}).get("overall_pct", 0),
        })

    with open(os.path.join(PUBLIC_DATA, "supervisors_index.json"), "w") as f:
        json.dump(index, f, indent=2)
    print(f"\n  Wrote supervisors_index.json with {len(index)} entries")

    print("\nData generation complete.")


if __name__ == "__main__":
    generate_json()

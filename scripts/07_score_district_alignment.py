"""
Stage 7: Score district alignment using actual election results.

Compares supervisor positions to how their district actually voted on ballot measures.
Also maps legislative votes to related ballot measure topics.

This uses REAL election data (not surveys), which is a key advantage over
the reference project's MRP-based approach.
"""

import json
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
PUBLIC_DATA = os.path.join(os.path.dirname(__file__), "..", "public", "data")
OUTPUT_DIR = os.path.join(PUBLIC_DATA, "supervisors")
BALLOT_POSITIONS_DIR = os.path.join(DATA_DIR, "ballot_positions")
CACHE_DIR = os.path.join(DATA_DIR, ".cache", "llm_electorate_positions")


def load_ballot_positions() -> dict:
    """
    Load manually curated supervisor positions on ballot measures.

    Expected format in scripts/data/ballot_positions/:
    {
      "positions": [
        {
          "measure_id": "2024-11-prop-a",
          "supervisor_district": 1,
          "position": "support",
          "source": "https://...",
          "confidence": "high"
        }
      ]
    }
    """
    positions = {}  # (measure_id, district) -> position dict
    if not os.path.exists(BALLOT_POSITIONS_DIR):
        os.makedirs(BALLOT_POSITIONS_DIR, exist_ok=True)
        return positions

    for filename in os.listdir(BALLOT_POSITIONS_DIR):
        if not filename.endswith(".json"):
            continue
        with open(os.path.join(BALLOT_POSITIONS_DIR, filename)) as f:
            data = json.load(f)
        for pos in data.get("positions", []):
            key = (pos["measure_id"], pos["supervisor_district"])
            positions[key] = pos

    return positions


def score_district_alignment():
    """Score district alignment for all supervisors."""
    print("Scoring district alignment...")

    # Load ballot measure positions
    positions = load_ballot_positions()
    print(f"  Loaded {len(positions)} supervisor ballot positions")

    # Load district data (ballot results)
    districts = {}
    for dist in range(1, 12):
        path = os.path.join(PUBLIC_DATA, "districts", f"district-{dist}.json")
        if os.path.exists(path):
            with open(path) as f:
                districts[dist] = json.load(f)

    for district in range(1, 12):
        sup_path = os.path.join(OUTPUT_DIR, f"district-{district}.json")
        if not os.path.exists(sup_path):
            continue

        with open(sup_path) as f:
            supervisor = json.load(f)

        print(f"\n  District {district}: {supervisor['name']}")

        dist_data = districts.get(district, {})
        ballot_results = dist_data.get("ballot_results", [])

        if not ballot_results:
            print("    No ballot results available")
            continue

        aligned_count = 0
        total_scored = 0
        highlights = []
        conflicts = []

        for br in ballot_results:
            measure_id = br["measure_id"]
            district_support = br["support_pct"]

            # Check if we have a supervisor position
            key = (measure_id, district)
            sup_position_data = positions.get(key)

            if not sup_position_data:
                continue

            if sup_position_data.get("confidence") == "low":
                continue

            sup_position = sup_position_data["position"]
            if sup_position == "unknown":
                continue

            total_scored += 1

            # District majority position
            district_supports = district_support >= 50
            sup_supports = sup_position == "support"

            is_aligned = district_supports == sup_supports

            if is_aligned:
                aligned_count += 1

            highlight = {
                "topic": f"{br['name']}: {br['title']}",
                "category": br["category"],
                "supervisor_position": sup_position,
                "district_support_pct": district_support,
                "aligned": is_aligned,
                "source": f"{br['name']} ({br['election']})",
                "source_type": "ballot_measure",
            }
            highlights.append(highlight)

            # Check for conflicts with donor interests
            if not is_aligned:
                _check_donor_conflict(
                    supervisor, br, sup_position, district_support, conflicts
                )

        # Calculate overall alignment
        overall_pct = round(aligned_count / max(total_scored, 1) * 100, 1)

        # Sort highlights: misaligned first (more interesting)
        highlights.sort(key=lambda h: (h["aligned"], -abs(h["district_support_pct"] - 50)))

        supervisor["district_alignment"] = {
            "overall_pct": overall_pct,
            "issues_scored": total_scored,
            "highlights": highlights[:10],
            "against_district_with_donors": conflicts[:5],
        }

        with open(sup_path, "w") as f:
            json.dump(supervisor, f, indent=2)

        print(f"    Scored {total_scored} issues, {overall_pct}% aligned with district")
        if conflicts:
            print(f"    Found {len(conflicts)} potential conflicts of interest")

    print("\nDone scoring district alignment.")


def _check_donor_conflict(
    supervisor: dict,
    ballot_result: dict,
    sup_position: str,
    district_support: float,
    conflicts: list,
):
    """Check if a misaligned vote correlates with donor interests."""
    top_industries = supervisor.get("funding", {}).get("top_industries", [])
    if not top_industries:
        return

    # Map ballot measure categories to likely industry interests
    category_industry_map = {
        "housing": ["Real Estate & Development"],
        "business_taxes": ["Tech", "Finance & Insurance", "Hospitality & Tourism"],
        "labor": ["Labor & Unions"],
        "transportation": ["Tech"],  # rideshare companies
        "drug_policy": ["Healthcare"],
        "healthcare": ["Healthcare"],
        "public_safety": ["Labor & Unions"],  # police unions
        "environment": ["Environmental"],
        "parks": ["Real Estate & Development"],
    }

    category = ballot_result["category"]
    related_industries = category_industry_map.get(category, [])

    sup_industry_names = {ind["industry"] for ind in top_industries[:5]}
    overlapping = [ind for ind in related_industries if ind in sup_industry_names]

    if overlapping:
        conflicts.append({
            "topic": f"{ballot_result['name']}: {ballot_result['title']}",
            "category": category,
            "district_support_pct": district_support,
            "supervisor_position": sup_position,
            "donor_interest": overlapping[0],
            "donor_preferred": "oppose" if sup_position == "oppose" else "support",
            "explanation": (
                f"District {supervisor['district']} voted "
                f"{'in favor' if district_support >= 50 else 'against'} "
                f"({district_support:.0f}%), but {supervisor['name']} "
                f"{'supported' if sup_position == 'support' else 'opposed'} this measure. "
                f"Top donor industry {overlapping[0]} likely preferred this outcome."
            ),
        })


if __name__ == "__main__":
    score_district_alignment()

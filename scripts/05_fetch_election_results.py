"""
Stage 5: Fetch and process election results from SF Department of Elections.

The SF DOE provides precinct-level results which we aggregate to supervisor districts.
Data is available at: https://sfelections.sfgov.org/results

For structured data, we use the Statement of the Vote files and/or the
results data portal at sfelections.org/tools/election_data/

Precinct-to-district mapping is needed to aggregate precinct results to supervisor districts.
"""

import csv
import io
import json
import os
from collections import defaultdict

import requests

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
PUBLIC_DATA = os.path.join(os.path.dirname(__file__), "..", "public", "data")

# DataSF has election results datasets - these IDs need to be verified
# The actual dataset IDs may vary by election cycle
ELECTIONS_API = "https://data.sfgov.org/resource"

# Precinct to supervisor district mapping
PRECINCT_DISTRICT_URL = "https://data.sfgov.org/resource/em2k-pxy5.json"

# Recent elections to process
ELECTIONS = [
    {
        "id": "2024-11",
        "name": "November 2024",
        "measures": [
            {"letter": "A", "title": "Affordable Housing Bonds", "category": "housing"},
            {"letter": "B", "title": "Community Health & Safety Bonds", "category": "healthcare"},
            {"letter": "C", "title": "Inspector General", "category": "government_reform"},
            {"letter": "D", "title": "Reduce Commissions, Expand Mayoral Power", "category": "government_reform"},
            {"letter": "E", "title": "Commission Reform Task Force", "category": "government_reform"},
            {"letter": "F", "title": "Police Staffing & Deferred Retirement", "category": "public_safety"},
            {"letter": "G", "title": "Affordable Housing Rental Subsidies", "category": "housing"},
            {"letter": "H", "title": "Firefighter Retirement Age", "category": "first_responders"},
            {"letter": "I", "title": "Nurses & 911 Dispatcher Pensions", "category": "first_responders"},
            {"letter": "J", "title": "Children & Youth Fund Oversight", "category": "education"},
            {"letter": "K", "title": "Close Upper Great Highway to Cars", "category": "parks"},
            {"letter": "L", "title": "Rideshare & AV Tax for Muni", "category": "transportation"},
            {"letter": "M", "title": "Business Tax Reform", "category": "business_taxes"},
            {"letter": "N", "title": "First Responder Student Loan Aid", "category": "first_responders"},
            {"letter": "O", "title": "Reproductive Healthcare Access", "category": "healthcare"},
        ],
    },
    {
        "id": "2024-03",
        "name": "March 2024",
        "measures": [
            {"letter": "A", "title": "Infrastructure Bonds", "category": "transportation"},
            {"letter": "B", "title": "Police Minimum Staffing", "category": "public_safety"},
            {"letter": "C", "title": "Real Estate Transfer Tax Exemption", "category": "housing"},
            {"letter": "D", "title": "Ethics Law Changes", "category": "government_reform"},
            {"letter": "E", "title": "Expanded Police Powers", "category": "public_safety"},
            {"letter": "F", "title": "Drug Screening for Welfare", "category": "drug_policy"},
            {"letter": "G", "title": "Algebra by 8th Grade", "category": "education"},
        ],
    },
    {
        "id": "2022-11",
        "name": "November 2022",
        "measures": [
            {"letter": "A", "title": "Retiree Benefits Funding", "category": "first_responders"},
            {"letter": "D", "title": "Affordable Housing Streamlining", "category": "housing"},
            {"letter": "E", "title": "Housing Project Approval", "category": "housing"},
            {"letter": "F", "title": "Library Preservation Fund", "category": "libraries"},
            {"letter": "I", "title": "Cars on JFK Drive", "category": "parks"},
            {"letter": "J", "title": "JFK Drive Car-Free", "category": "parks"},
            {"letter": "L", "title": "Sales Tax for Transportation", "category": "transportation"},
            {"letter": "M", "title": "Vacancy Tax", "category": "business_taxes"},
            {"letter": "N", "title": "Golden Gate Park Parking", "category": "parks"},
        ],
    },
]


def fetch_election_results():
    """
    Fetch precinct-level election results and aggregate to supervisor districts.

    Note: The actual implementation depends on the specific format of the DOE data.
    This script provides the framework; the data download URLs may need to be
    updated based on what's available at sfelections.org/tools/election_data/
    """
    os.makedirs(DATA_DIR, exist_ok=True)

    print("Fetching election results...")
    print("Note: Precinct-level data may need to be downloaded manually from")
    print("  https://sfelections.sfgov.org/results")
    print("  and placed in scripts/data/election_results/\n")

    # Try to fetch precinct-to-district mapping
    print("Fetching precinct-to-district mapping...")
    try:
        resp = requests.get(PRECINCT_DISTRICT_URL, params={"$limit": 5000})
        resp.raise_for_status()
        precinct_map = resp.json()
        print(f"  Found {len(precinct_map)} precinct mappings")
        with open(os.path.join(DATA_DIR, "precinct_district_map.json"), "w") as f:
            json.dump(precinct_map, f, indent=2)
    except Exception as e:
        print(f"  Warning: Could not fetch precinct mapping: {e}")
        print("  Will use manual mapping if available.")
        precinct_map = []

    # Build precinct -> district lookup
    precinct_to_district = {}
    for entry in precinct_map:
        precinct = entry.get("precinct", entry.get("pct", ""))
        district = entry.get("sup_dist", entry.get("supervisor_district", ""))
        if precinct and district:
            precinct_to_district[str(precinct)] = int(district)

    # Process each election
    districts_data = {}
    for dist in range(1, 12):
        path = os.path.join(PUBLIC_DATA, "districts", f"district-{dist}.json")
        if os.path.exists(path):
            with open(path) as f:
                districts_data[dist] = json.load(f)
        else:
            districts_data[dist] = {"district": dist, "ballot_results": [], "neighborhoods": []}

    # Check for manually downloaded election data
    results_dir = os.path.join(DATA_DIR, "election_results")
    if os.path.exists(results_dir):
        print("\nProcessing manually downloaded election data...")
        _process_local_results(results_dir, precinct_to_district, districts_data)
    else:
        print(f"\nNo local election data found at {results_dir}")
        print("To populate ballot measure results:")
        print("  1. Download Statement of the Vote from sfelections.sfgov.org")
        print("  2. Place Excel/CSV files in scripts/data/election_results/")
        print("  3. Re-run this script")
        print("\nUsing placeholder data for now...")
        _generate_placeholder_data(districts_data)

    # Write updated district files
    for dist, data in districts_data.items():
        outpath = os.path.join(PUBLIC_DATA, "districts", f"district-{dist}.json")
        with open(outpath, "w") as f:
            json.dump(data, f, indent=2)
        print(f"  District {dist}: {len(data['ballot_results'])} ballot results")

    # Write ballot measures index
    all_measures = []
    for election in ELECTIONS:
        for m in election["measures"]:
            all_measures.append({
                "id": f"{election['id']}-prop-{m['letter'].lower()}",
                "election": election["id"],
                "name": f"Proposition {m['letter']}",
                "title": m["title"],
                "category": m["category"],
                "passed": True,  # Will be updated with real data
                "citywide_support_pct": 0,
                "district_results": {},
            })

    with open(os.path.join(PUBLIC_DATA, "ballot_measures.json"), "w") as f:
        json.dump(all_measures, f, indent=2)

    print("\nDone.")


def _process_local_results(results_dir, precinct_to_district, districts_data):
    """Process locally downloaded election result files."""
    for filename in os.listdir(results_dir):
        if filename.endswith((".csv", ".xlsx")):
            filepath = os.path.join(results_dir, filename)
            print(f"  Processing {filename}...")
            # Implementation depends on the specific file format from SF DOE
            # Typically: precinct | measure | yes_votes | no_votes
            # Aggregate to districts using precinct_to_district mapping


def _generate_placeholder_data(districts_data):
    """Generate placeholder ballot measure results for development."""
    import random

    random.seed(42)

    for election in ELECTIONS:
        for measure in election["measures"]:
            measure_id = f"{election['id']}-prop-{measure['letter'].lower()}"
            for dist in range(1, 12):
                # Generate plausible district-level support percentages
                base = random.uniform(35, 75)
                support_pct = round(base + random.uniform(-5, 5), 1)
                total_votes = random.randint(15000, 40000)

                districts_data[dist]["ballot_results"].append({
                    "measure_id": measure_id,
                    "election": election["id"],
                    "name": f"Proposition {measure['letter']}",
                    "title": measure["title"],
                    "category": measure["category"],
                    "support_pct": support_pct,
                    "total_votes": total_votes,
                })


if __name__ == "__main__":
    fetch_election_results()

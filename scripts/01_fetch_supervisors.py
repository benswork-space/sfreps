"""
Stage 1: Fetch current Board of Supervisors roster from DataSF.

The GeoJSON dataset at DataSF includes supervisor names and district numbers.
We also scrape photos from sfbos.org if available.
"""

import json
import os
import requests

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "data", "supervisors")
GEOJSON_URL = "https://data.sfgov.org/api/geospatial/f2zs-jevy?method=export&type=GeoJSON&format=geojson"

# Manually maintained data for fields not available via API
SUPERVISOR_DETAILS = {
    1: {"serving_since": "2021-01-08", "term_ends": "2027-01-08"},
    2: {"serving_since": "2025-01-08", "term_ends": "2029-01-08"},
    3: {"serving_since": "2025-01-08", "term_ends": "2029-01-08"},
    4: {"serving_since": "2025-01-08", "term_ends": "2029-01-08"},
    5: {"serving_since": "2025-01-08", "term_ends": "2029-01-08"},
    6: {"serving_since": "2022-05-16", "term_ends": "2027-01-08"},
    7: {"serving_since": "2021-01-08", "term_ends": "2027-01-08"},
    8: {"serving_since": "2018-07-10", "term_ends": "2027-01-08"},
    9: {"serving_since": "2025-01-08", "term_ends": "2029-01-08"},
    10: {"serving_since": "2019-01-08", "term_ends": "2027-01-08"},
    11: {"serving_since": "2025-01-08", "term_ends": "2029-01-08"},
}

DISTRICT_NEIGHBORHOODS = {
    1: ["Richmond", "Inner Richmond", "Outer Richmond", "Lone Mountain", "USF"],
    2: ["Marina", "Pacific Heights", "Cow Hollow", "Presidio Heights", "Sea Cliff", "Lake Street"],
    3: ["North Beach", "Chinatown", "Financial District", "Nob Hill", "Telegraph Hill", "Union Square"],
    4: ["Sunset", "Outer Sunset", "Inner Sunset", "Parkside"],
    5: ["Haight-Ashbury", "Western Addition", "Fillmore", "Hayes Valley", "Lower Haight", "Japantown"],
    6: ["SoMa", "Tenderloin", "South Beach", "Rincon Hill", "Yerba Buena", "Mid-Market"],
    7: ["West Portal", "Forest Hill", "Miraloma Park", "Ingleside Heights", "Sunnyside", "Glen Park"],
    8: ["Castro", "Noe Valley", "Diamond Heights", "Dolores Heights", "Corona Heights"],
    9: ["Mission", "Bernal Heights", "Portola"],
    10: ["Bayview", "Hunters Point", "Visitacion Valley", "Potrero Hill", "Treasure Island"],
    11: ["Excelsior", "Outer Mission", "Oceanview", "Ingleside", "Crocker-Amazon"],
}


def fetch_supervisors():
    print("Fetching supervisor data from DataSF...")
    resp = requests.get(GEOJSON_URL)
    resp.raise_for_status()
    data = resp.json()

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    supervisors = []
    for feature in data["features"]:
        props = feature["properties"]
        district = int(props["sup_dist"])
        name = props["sup_name"]
        details = SUPERVISOR_DETAILS.get(district, {})

        from datetime import date

        serving = date.fromisoformat(details.get("serving_since", "2025-01-08"))
        years = round((date.today() - serving).days / 365.25, 1)

        supervisor = {
            "id": f"district-{district}",
            "district": district,
            "name": name,
            "photo_url": f"/photos/district-{district}.jpg",
            "party": None,  # SF supervisors are officially nonpartisan
            "serving_since": details.get("serving_since", "2025-01-08"),
            "term_ends": details.get("term_ends", "2029-01-08"),
            "years_in_office": years,
            "bio_url": f"https://sfbos.org/supervisor-{name.lower().replace(' ', '-')}",
            "funding": {
                "total_raised": 0,
                "cycle": "2024",
                "top_industries": [],
                "top_donors": [],
                "top_committees": [],
            },
            "donor_alignment": {
                "overall_pct": 0,
                "total_votes_scored": 0,
                "examples": [],
            },
            "district_alignment": {
                "overall_pct": 0,
                "issues_scored": 0,
                "highlights": [],
                "against_district_with_donors": [],
            },
            "links": {
                "official_page": f"https://sfbos.org/supervisor-district-{district}",
                "ethics_commission": "https://sfethics.org/disclosures/campaign-finance-disclosure",
                "legistar": "https://sfgov.legistar.com/MainBody.aspx",
                "campaign_finance": "https://sfethics.org/disclosures/campaign-finance-disclosure/campaign-finance-dashboards",
            },
        }

        supervisors.append(supervisor)

        # Write individual supervisor file
        outpath = os.path.join(OUTPUT_DIR, f"district-{district}.json")
        with open(outpath, "w") as f:
            json.dump(supervisor, f, indent=2)
        print(f"  District {district}: {name}")

    # Write district data files
    districts_dir = os.path.join(os.path.dirname(__file__), "..", "public", "data", "districts")
    os.makedirs(districts_dir, exist_ok=True)
    for district in range(1, 12):
        dist_data = {
            "district": district,
            "ballot_results": [],
            "neighborhoods": DISTRICT_NEIGHBORHOODS.get(district, []),
        }
        with open(os.path.join(districts_dir, f"district-{district}.json"), "w") as f:
            json.dump(dist_data, f, indent=2)

    print(f"\nWrote {len(supervisors)} supervisor files and 11 district files.")
    return supervisors


if __name__ == "__main__":
    fetch_supervisors()

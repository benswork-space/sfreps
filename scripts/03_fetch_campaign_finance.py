"""
Stage 3: Fetch campaign finance data from SF Ethics Commission via DataSF (Socrata API).

Key datasets:
- Campaign Filers: https://data.sfgov.org/resource/XXX (committee registry)
- Transactions: All contributions from FPPC Forms 460, 461, 496, 497, 450

The Socrata API provides JSON access with filtering via SoQL.
"""

import json
import os
import time
from collections import defaultdict

import requests

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "data", "supervisors")

# DataSF Socrata endpoints (SODA API)
# These are the dataset identifiers - actual IDs need to be verified from data.sfgov.org
TRANSACTIONS_ENDPOINT = "https://data.sfgov.org/resource/pitq-e56w.json"  # Campaign Finance - Transactions
FILERS_ENDPOINT = "https://data.sfgov.org/resource/2cpf-snfb.json"  # Campaign filers

# Industry classification patterns for SF donors
INDUSTRY_PATTERNS = {
    "Real Estate & Development": [
        "real estate", "realty", "property", "developer", "housing", "building",
        "construction", "landlord", "apartment", "condo", "homebuilder",
    ],
    "Tech": [
        "technology", "software", "google", "meta", "salesforce", "stripe",
        "uber", "lyft", "airbnb", "tech", "digital", "computing",
    ],
    "Labor & Unions": [
        "union", "labor", "seiu", "ibew", "ufcw", "teamster", "carpenter",
        "plumber", "firefighter", "teacher", "nurse", "afscme", "afl-cio",
    ],
    "Healthcare": [
        "hospital", "medical", "health", "pharma", "dental", "physician",
        "nurse", "clinic", "healthcare",
    ],
    "Finance & Insurance": [
        "bank", "financial", "insurance", "investment", "credit", "wealth",
        "capital", "securities", "jpmorgan", "wells fargo",
    ],
    "Legal": [
        "law firm", "attorney", "legal", "lawyer", "litigation",
    ],
    "Hospitality & Tourism": [
        "hotel", "restaurant", "hospitality", "tourism", "food service",
        "bar", "nightclub", "entertainment",
    ],
    "Cannabis": [
        "cannabis", "marijuana", "dispensary", "420",
    ],
    "Environmental": [
        "environmental", "clean energy", "solar", "wind", "sierra club",
        "green", "climate", "sustainability",
    ],
    "Education": [
        "school", "university", "education", "teacher", "professor", "academic",
    ],
}


def classify_industry(name: str, employer: str = "") -> str:
    """Classify a donor into an industry based on name and employer."""
    text = f"{name} {employer}".lower()
    for industry, patterns in INDUSTRY_PATTERNS.items():
        if any(p in text for p in patterns):
            return industry
    return "Other"


def fetch_campaign_finance():
    """Fetch campaign finance data for all current supervisors."""
    os.makedirs(DATA_DIR, exist_ok=True)

    # Load current supervisors to know who to query
    supervisors = {}
    for i in range(1, 12):
        path = os.path.join(OUTPUT_DIR, f"district-{i}.json")
        if os.path.exists(path):
            with open(path) as f:
                supervisors[i] = json.load(f)

    if not supervisors:
        print("No supervisor files found. Run 01_fetch_supervisors.py first.")
        return

    print("Fetching campaign finance data from DataSF...")

    # Fetch all campaign filers to find supervisor committees
    all_transactions = {}
    for district, sup in supervisors.items():
        name = sup["name"]
        print(f"\n  District {district}: {name}")

        # Query transactions where the filer name matches the supervisor
        # Using SoQL to filter on the correct column names for this dataset
        last_name = name.split()[-1].upper()
        params = {
            "$where": f"upper(filer_name) like '%{last_name}%' AND record_type='RCPT'",
            "$limit": 5000,
            "$order": "transaction_amount_1 DESC",
        }

        try:
            resp = requests.get(TRANSACTIONS_ENDPOINT, params=params)
            resp.raise_for_status()
            transactions = resp.json()
            print(f"    Found {len(transactions)} transactions")
        except Exception as e:
            print(f"    Error fetching transactions: {e}")
            transactions = []

        if transactions:
            all_transactions[district] = transactions
            _process_transactions(district, transactions, sup)

        time.sleep(0.5)  # Rate limiting

    # Save raw data
    with open(os.path.join(DATA_DIR, "campaign_finance_raw.json"), "w") as f:
        json.dump(all_transactions, f, indent=2)

    print("\nDone fetching campaign finance data.")


def _process_transactions(district: int, transactions: list, supervisor: dict):
    """Process raw transactions into funding summary for a supervisor."""
    total_raised = 0
    donors = defaultdict(lambda: {"amount": 0, "type": "individual", "industry": "Other"})
    industries = defaultdict(float)

    for txn in transactions:
        amount = float(txn.get("transaction_amount_1", 0))
        if amount <= 0:
            continue

        total_raised += amount
        donor_name = txn.get("transaction_last_name", "Unknown")
        donor_first = txn.get("transaction_first_name", "")
        full_name = f"{donor_first} {donor_name}".strip()
        employer = txn.get("transaction_employer", "")

        industry = classify_industry(full_name, employer)

        donor_key = full_name.lower()
        donors[donor_key]["amount"] += amount
        donors[donor_key]["name"] = full_name
        donors[donor_key]["industry"] = industry
        donors[donor_key]["type"] = "committee" if "committee" in full_name.lower() or "pac" in full_name.lower() else "individual"

        industries[industry] += amount

    # Build top lists
    top_industries = sorted(
        [{"industry": k, "amount": round(v, 2), "percentage": round(v / max(total_raised, 1) * 100, 1)}
         for k, v in industries.items()],
        key=lambda x: x["amount"],
        reverse=True,
    )[:10]

    sorted_donors = sorted(donors.values(), key=lambda x: x["amount"], reverse=True)
    top_donors = [
        {"name": d["name"], "amount": round(d["amount"], 2), "type": d["type"], "industry": d["industry"]}
        for d in sorted_donors
        if d["type"] == "individual"
    ][:50]  # Keep top 50 individual donors
    top_committees = [
        {"name": d["name"], "amount": round(d["amount"], 2), "type": d["type"], "industry": d["industry"]}
        for d in sorted_donors
        if d["type"] == "committee"
    ][:20]  # Keep top 20 committees

    # Update supervisor data
    supervisor["funding"] = {
        "total_raised": round(total_raised, 2),
        "cycle": "2024",
        "top_industries": top_industries,
        "top_donors": top_donors,
        "top_committees": top_committees,
    }

    # Write updated supervisor file
    outpath = os.path.join(OUTPUT_DIR, f"district-{district}.json")
    with open(outpath, "w") as f:
        json.dump(supervisor, f, indent=2)

    print(f"    Total raised: ${total_raised:,.0f}")
    print(f"    Top industry: {top_industries[0]['industry'] if top_industries else 'N/A'}")


if __name__ == "__main__":
    fetch_campaign_finance()

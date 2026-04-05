"""
Stage 6: Score donor alignment using AI-assisted classification.

For each vote a supervisor cast, we use Claude to determine:
1. Which donor industry groups does this legislation affect?
2. Would a yea/nay vote benefit or harm each industry?
3. Did the supervisor vote in line with their top donors' interests?

Classifications are cached in .cache/llm_donor_positions/ for auditability.
"""

import json
import os
import hashlib
from collections import defaultdict

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
CACHE_DIR = os.path.join(DATA_DIR, ".cache", "llm_donor_positions")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "data", "supervisors")

# Industry groups that match our donor classification
INDUSTRY_GROUPS = [
    "Real Estate & Development",
    "Tech",
    "Labor & Unions",
    "Healthcare",
    "Finance & Insurance",
    "Legal",
    "Hospitality & Tourism",
    "Cannabis",
    "Environmental",
    "Education",
]


def get_cache_path(vote_id: str) -> str:
    """Get cache file path for a vote classification."""
    safe_id = hashlib.md5(vote_id.encode()).hexdigest()
    return os.path.join(CACHE_DIR, f"{safe_id}.json")


def classify_vote(vote: dict):
    """
    Use Claude API to classify a vote's impact on donor industries.

    Returns a dict with:
    - affected_industries: list of {industry, preferred_vote, confidence, explanation}
    - category: PolicyCategory
    """
    cache_path = get_cache_path(vote["id"])
    if os.path.exists(cache_path):
        with open(cache_path) as f:
            return json.load(f)

    try:
        import anthropic

        client = anthropic.Anthropic()

        prompt = f"""Analyze this San Francisco Board of Supervisors vote and determine its impact on donor industries.

Vote title: {vote['title']}
Vote type: {vote['type']}
Date: {vote['date']}
Result: {vote['result']}

For each of the following industry groups, determine:
1. Is this legislation relevant to this industry? (yes/no)
2. If yes, would the industry prefer a YEA or NAY vote?
3. Confidence level (high/medium/low)
4. Brief explanation

Industry groups: {', '.join(INDUSTRY_GROUPS)}

Also classify this vote into one of these SF policy categories:
housing, homelessness, public_safety, drug_policy, transportation, parks, education,
business_taxes, labor, environment, government_reform, healthcare, first_responders, libraries

Respond in JSON format:
{{
  "category": "the_category",
  "affected_industries": [
    {{
      "industry": "Industry Name",
      "preferred_vote": "yea" or "nay",
      "confidence": "high" or "medium" or "low",
      "explanation": "Why this industry cares about this vote"
    }}
  ]
}}

Only include industries that are clearly affected. If the legislation is procedural or
the impact is unclear, return an empty affected_industries array."""

        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )

        text = response.content[0].text
        # Extract JSON from response
        start = text.find("{")
        end = text.rfind("}") + 1
        if start >= 0 and end > start:
            result = json.loads(text[start:end])
        else:
            result = {"category": "other", "affected_industries": []}

        # Cache the result
        os.makedirs(CACHE_DIR, exist_ok=True)
        cached = {"vote_id": vote["id"], "vote_title": vote["title"], **result}
        with open(cache_path, "w") as f:
            json.dump(cached, f, indent=2)

        return result

    except ImportError:
        print("    anthropic package not installed. Run: pip install anthropic")
        return None
    except Exception as e:
        print(f"    Error classifying vote {vote['id']}: {e}")
        return None


def score_donor_alignment():
    """Score donor alignment for all supervisors."""
    print("Scoring donor alignment...")

    for district in range(1, 12):
        sup_path = os.path.join(OUTPUT_DIR, f"district-{district}.json")
        votes_path = os.path.join(OUTPUT_DIR, f"district-{district}_votes.json")

        if not os.path.exists(sup_path):
            continue

        with open(sup_path) as f:
            supervisor = json.load(f)

        votes = []
        if os.path.exists(votes_path):
            with open(votes_path) as f:
                votes = json.load(f)

        if not votes:
            print(f"  District {district}: No votes to score")
            continue

        print(f"\n  District {district}: {supervisor['name']}")

        # Get top donor industries
        top_industries = {ind["industry"] for ind in supervisor["funding"].get("top_industries", [])[:5]}
        if not top_industries:
            print("    No funding data - skipping")
            continue

        aligned_count = 0
        total_scored = 0
        examples = []

        for vote in votes[:100]:  # Score up to 100 recent votes
            if vote["vote"] in ("absent", "excused"):
                continue

            classification = classify_vote(vote)
            if not classification:
                continue

            affected = classification.get("affected_industries", [])
            category = classification.get("category", "other")

            # Check alignment with donor industries
            for industry_info in affected:
                industry = industry_info["industry"]
                if industry not in top_industries:
                    continue
                if industry_info.get("confidence") == "low":
                    continue

                preferred = industry_info["preferred_vote"]
                actual = vote["vote"]
                is_aligned = actual == preferred

                total_scored += 1
                if is_aligned:
                    aligned_count += 1

                examples.append({
                    "legislation": vote["title"],
                    "legislation_id": vote["id"],
                    "date": vote["date"],
                    "vote": actual,
                    "donor_interest": industry,
                    "donor_preferred": preferred,
                    "aligned": is_aligned,
                    "explanation": industry_info.get("explanation", ""),
                    "category": category,
                })

        # Calculate overall alignment
        overall_pct = round(aligned_count / max(total_scored, 1) * 100, 1)

        # Pick most interesting examples (mix of aligned and not)
        aligned_examples = [e for e in examples if e["aligned"]][:3]
        independent_examples = [e for e in examples if not e["aligned"]][:2]
        top_examples = aligned_examples + independent_examples
        top_examples.sort(key=lambda e: e["date"], reverse=True)

        supervisor["donor_alignment"] = {
            "overall_pct": overall_pct,
            "total_votes_scored": total_scored,
            "examples": top_examples[:5],
        }

        with open(sup_path, "w") as f:
            json.dump(supervisor, f, indent=2)

        print(f"    Scored {total_scored} votes, {overall_pct}% aligned with donors")

    print("\nDone scoring donor alignment.")


if __name__ == "__main__":
    score_donor_alignment()

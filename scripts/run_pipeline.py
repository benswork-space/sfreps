"""
Run the complete data pipeline.

Usage:
  python scripts/run_pipeline.py          # Run all stages
  python scripts/run_pipeline.py 3        # Run stage 3 only
  python scripts/run_pipeline.py 3 5 6    # Run stages 3, 5, and 6
"""

import sys
import importlib
import time

STAGES = {
    1: ("01_fetch_supervisors", "fetch_supervisors"),
    2: ("02_fetch_zip_districts", "fetch_zip_districts"),
    3: ("03_fetch_campaign_finance", "fetch_campaign_finance"),
    4: ("04_fetch_votes", "fetch_votes"),
    5: ("05_fetch_election_results", "fetch_election_results"),
    6: ("06_score_donor_alignment", "score_donor_alignment"),
    7: ("07_score_district_alignment", "score_district_alignment"),
    8: ("08_generate_json", "generate_json"),
}


def run_stage(num: int):
    if num not in STAGES:
        print(f"Unknown stage: {num}")
        return

    module_name, func_name = STAGES[num]
    print(f"\n{'='*60}")
    print(f"Stage {num}: {module_name}")
    print(f"{'='*60}\n")

    start = time.time()
    module = importlib.import_module(module_name)
    func = getattr(module, func_name)
    func()
    elapsed = time.time() - start
    print(f"\nStage {num} completed in {elapsed:.1f}s")


def main():
    if len(sys.argv) > 1:
        stages = [int(s) for s in sys.argv[1:]]
    else:
        stages = list(STAGES.keys())

    print("SFReps Data Pipeline")
    print(f"Running stages: {stages}\n")

    total_start = time.time()
    for stage in stages:
        run_stage(stage)

    total_elapsed = time.time() - total_start
    print(f"\n{'='*60}")
    print(f"Pipeline complete in {total_elapsed:.1f}s")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()

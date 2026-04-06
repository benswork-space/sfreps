
import { useMemo } from "react";
import type { VoteRecord, FundingData } from "@/lib/types";
import { POLICY_CATEGORIES } from "@/lib/types";
import { computeDonorAlignment } from "@/lib/scoring";
import AlignmentSlider from "./AlignmentSlider";
import ExpandableText from "./ExpandableText";

interface Props {
  votes: VoteRecord[];
  funding: FundingData;
  supervisorName: string;
}

export default function DonorAlignmentSection({ votes, funding, supervisorName }: Props) {
  const alignment = useMemo(
    () => computeDonorAlignment(votes, funding),
    [votes, funding]
  );

  if (alignment.total_scored < 3) return null;

  return (
    <section className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
      <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
        Donor Alignment
      </h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5">
        How aligned are {supervisorName}&apos;s votes with their top donors&apos; interests?
      </p>

      {/* Gradient slider */}
      <AlignmentSlider
        pct={alignment.overall_pct}
        leftLabel="Less aligned"
        rightLabel="More aligned"
      />

      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-3">
        Based on {alignment.total_scored} scored votes across {alignment.examples.length > 0
          ? [...new Set(alignment.examples.map((e) => POLICY_CATEGORIES[e.category]?.label))].length
          : 0} policy areas.{" "}
        <a href="/methodology" className="underline hover:text-zinc-600 dark:hover:text-zinc-300">
          Methodology
        </a>
      </p>

      {/* Vote examples */}
      {alignment.examples.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
            Examples
          </h3>
          {alignment.examples.map((ex, i) => (
            <div
              key={i}
              className={`rounded-xl p-4 border ${
                ex.aligned
                  ? "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40"
                  : "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/40"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-snug flex-1">
                  <ExpandableText text={ex.title} maxLength={120} />
                </p>
                <span
                  className={`shrink-0 text-xs font-medium px-2.5 py-0.5 rounded-full ${
                    ex.aligned
                      ? "bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200"
                      : "bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200"
                  }`}
                >
                  {ex.aligned ? "More aligned" : "Less aligned"}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                Voted <strong className="text-zinc-700 dark:text-zinc-200">{ex.vote.toUpperCase()}</strong>
                {" "}&middot;{" "}
                {ex.aligned ? "More" : "Less"} favorable to{" "}
                <strong className="text-zinc-700 dark:text-zinc-200">{ex.donor_industry}</strong>
                {" "}&middot;{" "}
                {POLICY_CATEGORIES[ex.category]?.label ?? ex.category}
              </p>
              {ex.reason && (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 italic">
                  {ex.reason}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

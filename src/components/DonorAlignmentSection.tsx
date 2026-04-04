"use client";

import type { DonorAlignment } from "@/lib/types";
import { formatPercent, alignmentColor, alignmentBgColor } from "@/lib/format";
import { POLICY_CATEGORIES } from "@/lib/types";

interface Props {
  alignment: DonorAlignment;
}

export default function DonorAlignmentSection({ alignment }: Props) {
  return (
    <section className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
      <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">Donor Alignment</h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
        How often does this supervisor vote in line with their top donors&apos; interests?
      </p>

      {/* Score */}
      <div className={`inline-flex items-baseline gap-2 px-4 py-2 rounded-xl ${alignmentBgColor(alignment.overall_pct)}`}>
        <span className={`text-3xl font-bold ${alignmentColor(alignment.overall_pct)}`}>
          {formatPercent(alignment.overall_pct)}
        </span>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          of scored votes aligned with donor interests
        </span>
      </div>

      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
        Based on {alignment.total_votes_scored} scored votes
      </p>

      {/* Examples */}
      {alignment.examples.length > 0 && (
        <div className="mt-6 space-y-4">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
            Examples
          </h3>
          {alignment.examples.slice(0, 5).map((ex, i) => (
            <div
              key={i}
              className={`rounded-xl p-4 border ${
                ex.aligned
                  ? "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20"
                  : "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100 text-sm">
                    {ex.legislation}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {POLICY_CATEGORIES[ex.category]?.label} &middot; {ex.date}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                    ex.aligned
                      ? "bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200"
                      : "bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200"
                  }`}
                >
                  {ex.aligned ? "Aligned with donors" : "Independent"}
                </span>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">{ex.explanation}</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                Voted <strong className="text-zinc-600 dark:text-zinc-300">{ex.vote.toUpperCase()}</strong>{" "}
                &middot; {ex.donor_interest} preferred{" "}
                <strong>{ex.donor_preferred.toUpperCase()}</strong>
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

"use client";

import type { DistrictAlignment } from "@/lib/types";
import { POLICY_CATEGORIES } from "@/lib/types";
import { formatPercent, alignmentColor, alignmentBgColor } from "@/lib/format";

interface Props {
  alignment: DistrictAlignment;
  district: number;
}

export default function DistrictAlignmentSection({ alignment, district }: Props) {
  return (
    <section className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
      <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
        District {district} Alignment
      </h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
        How well does this supervisor&apos;s voting align with how District {district} residents actually voted on ballot measures?
      </p>

      {/* Score */}
      <div className={`inline-flex items-baseline gap-2 px-4 py-2 rounded-xl ${alignmentBgColor(alignment.overall_pct)}`}>
        <span className={`text-3xl font-bold ${alignmentColor(alignment.overall_pct)}`}>
          {formatPercent(alignment.overall_pct)}
        </span>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          alignment with district voters
        </span>
      </div>

      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
        Based on {alignment.issues_scored} scored issues using actual election results
      </p>

      {/* Highlights */}
      {alignment.highlights.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
            Issue Breakdown
          </h3>
          {alignment.highlights.map((h, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{h.topic}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {POLICY_CATEGORIES[h.category]?.label} &middot;{" "}
                  {h.source_type === "ballot_measure" ? "Ballot measure" : "Legislation"}
                </p>
              </div>
              <div className="text-right shrink-0 ml-4">
                <p className="text-sm">
                  <span className="text-zinc-500 dark:text-zinc-400">District: </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {formatPercent(h.district_support_pct)} support
                  </span>
                </p>
                <p className="text-xs mt-0.5">
                  <span className="text-zinc-400">Supervisor: </span>
                  <span
                    className={
                      h.aligned
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }
                  >
                    {h.supervisor_position === "support" ? "Support" : "Oppose"}
                    {h.aligned ? " (aligned)" : " (misaligned)"}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

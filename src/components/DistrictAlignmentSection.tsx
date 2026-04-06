
import { useMemo } from "react";
import type { VoteRecord, FundingData, BallotMeasureResult } from "@/lib/types";
import { POLICY_CATEGORIES } from "@/lib/types";
import { formatPercent } from "@/lib/format";
import { computeDistrictAlignment } from "@/lib/scoring";
import AlignmentSlider from "./AlignmentSlider";
import ExpandableText from "./ExpandableText";

interface Props {
  votes: VoteRecord[];
  ballotResults: BallotMeasureResult[];
  funding: FundingData;
  district: number;
  supervisorName: string;
}

export default function DistrictAlignmentSection({
  votes,
  ballotResults,
  funding,
  district,
  supervisorName,
}: Props) {
  const alignment = useMemo(
    () => computeDistrictAlignment(votes, ballotResults, funding, district),
    [votes, ballotResults, funding, district]
  );

  if (alignment.issues_scored < 2) return null;

  return (
    <section className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
      <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
        District {district} Alignment
      </h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5">
        How well does {supervisorName}&apos;s voting record align with how District {district} residents
        actually voted on ballot measures?
      </p>

      {/* Gradient slider */}
      <AlignmentSlider
        pct={alignment.overall_pct}
        leftLabel="Less aligned"
        rightLabel="More aligned"
      />

      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-3">
        Compared across {alignment.issues_scored} policy categories using actual precinct-level
        election results.{" "}
        <a href="/methodology" className="underline hover:text-zinc-600 dark:hover:text-zinc-300">
          Methodology
        </a>
      </p>

      {/* Issue highlights */}
      {alignment.highlights.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
            Issue Breakdown
          </h3>
          {alignment.highlights.map((h, i) => (
            <div
              key={i}
              className={`rounded-xl p-4 border ${
                h.aligned
                  ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/40"
                  : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {POLICY_CATEGORIES[h.category]?.label ?? h.category}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {h.ballot_measure}: {h.topic}
                  </p>
                  {h.description && (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 leading-relaxed">
                      <ExpandableText text={h.description} maxLength={140} />
                    </p>
                  )}
                </div>
                <span
                  className={`shrink-0 text-xs font-medium px-2.5 py-0.5 rounded-full ${
                    h.aligned
                      ? "bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200"
                      : "bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200"
                  }`}
                >
                  {h.aligned ? "With district" : "Against district"}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs">
                <span className="text-zinc-500 dark:text-zinc-400">
                  District: <strong className="text-zinc-700 dark:text-zinc-200">
                    {formatPercent(h.district_support_pct)} support
                  </strong>
                </span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  {supervisorName}:{" "}
                  <strong
                    className={
                      h.aligned
                        ? "text-green-700 dark:text-green-300"
                        : "text-red-700 dark:text-red-300"
                    }
                  >
                    {h.supervisor_position === "support" ? "Support" : "Oppose"}
                  </strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Conflict detection */}
      {alignment.conflicts.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-red-700 dark:text-red-300 uppercase tracking-wider mb-3">
            Potential Conflicts of Interest
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
            Cases where {supervisorName} voted against their district&apos;s position on issues
            where top campaign donors have a stake.
          </p>
          {alignment.conflicts.map((c, i) => (
            <div
              key={i}
              className="rounded-xl p-4 border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 mb-2"
            >
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {POLICY_CATEGORIES[c.category]?.label}
              </p>
              <div className="grid grid-cols-3 gap-3 mt-2 text-xs">
                <div>
                  <span className="text-zinc-400">District</span>
                  <p className="font-medium text-zinc-700 dark:text-zinc-200">
                    {formatPercent(c.district_support_pct)} support
                  </p>
                </div>
                <div>
                  <span className="text-zinc-400">Supervisor</span>
                  <p className="font-medium text-red-600 dark:text-red-400">
                    {c.supervisor_position === "support" ? "Support" : "Oppose"}
                  </p>
                </div>
                <div>
                  <span className="text-zinc-400">Top donor</span>
                  <p className="font-medium text-amber-600 dark:text-amber-400">
                    {c.donor_industry}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

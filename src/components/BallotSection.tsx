
import type { DistrictData } from "@/lib/types";
import { POLICY_CATEGORIES } from "@/lib/types";
import { formatPercent } from "@/lib/format";
import ExpandableText from "./ExpandableText";

interface Props {
  districtData: DistrictData;
  supervisorId: string;
}

export default function BallotSection({ districtData }: Props) {
  return (
    <section className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
      <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
        Ballot Measures in District {districtData.district}
      </h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
        How District {districtData.district} voted on recent propositions and ballot measures.
      </p>

      <div className="space-y-3">
        {districtData.ballot_results.map((br) => (
          <div
            key={br.measure_id}
            className="flex items-start gap-4 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
          >
            {/* Support percentage badge */}
            <div className="shrink-0 w-14 text-center">
              <span
                className={`text-lg font-bold font-mono ${
                  br.support_pct >= 50
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {formatPercent(br.support_pct)}
              </span>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">support</p>
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                  {br.name}
                </span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  {br.election}
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                  {POLICY_CATEGORIES[br.category]?.label ?? br.category}
                </span>
              </div>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-0.5">
                {br.title}
              </p>
              {br.description && (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 leading-relaxed">
                  <ExpandableText text={br.description} maxLength={160} />
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

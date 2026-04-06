
import { useState, useMemo } from "react";
import type { FundingData } from "@/lib/types";
import { formatMoney, formatMoneyFull } from "@/lib/format";
import { reclassifyIndustries, reclassifyDonor } from "@/lib/reclassify";
import FundingChart from "./FundingChart";

interface Props {
  funding: FundingData;
  supervisorName: string;
}

export default function FundingSection({ funding, supervisorName }: Props) {
  const [tab, setTab] = useState<"donors" | "industries" | "committees">("donors");
  const [donorLimit, setDonorLimit] = useState(5);
  const DONOR_INCREMENT = 10;

  const reclassifiedIndustries = useMemo(
    () => reclassifyIndustries(funding.top_industries, funding.top_donors, supervisorName),
    [funding.top_industries, funding.top_donors, supervisorName]
  );

  return (
    <section className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Campaign Finance</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {formatMoneyFull(funding.total_raised)} raised ({funding.cycle} cycle)
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1 mb-4">
        {(["donors", "industries", "committees"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-colors ${
              tab === t
                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            {t === "donors" ? "Top Donors" : t === "industries" ? "Donors by Industry" : "Committees"}
          </button>
        ))}
      </div>

      {tab === "donors" && (
        <div className="space-y-2">
          {funding.top_donors.length === 0 ? (
            <p className="text-sm text-zinc-400">Donor data will be populated by the data pipeline.</p>
          ) : (
            <>
              {funding.top_donors.slice(0, donorLimit).map((d, i) => {
                const category = reclassifyDonor(d, supervisorName);
                return (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="min-w-0 flex-1 mr-3">
                      <span className="text-zinc-700 dark:text-zinc-300 truncate block">{d.name}</span>
                      <span className="text-zinc-400 dark:text-zinc-500 text-xs">
                        {category}
                      </span>
                    </div>
                    <span className="font-mono text-zinc-900 dark:text-zinc-100 shrink-0">
                      {formatMoney(d.amount)}
                    </span>
                  </div>
                );
              })}
              {donorLimit < funding.top_donors.length && (
                <button
                  onClick={() => setDonorLimit((prev) => Math.min(prev + DONOR_INCREMENT, funding.top_donors.length))}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2"
                >
                  See more donors ({funding.top_donors.length - donorLimit} remaining)
                </button>
              )}
              {donorLimit > 5 && (
                <button
                  onClick={() => setDonorLimit(5)}
                  className="text-sm text-zinc-400 dark:text-zinc-500 hover:underline mt-1 ml-3"
                >
                  Show less
                </button>
              )}
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
                Showing largest individual contributions. Total raised includes many smaller donations.
              </p>
            </>
          )}
        </div>
      )}

      {tab === "industries" && (
        <>
          <FundingChart industries={reclassifiedIndustries} />
          <div className="mt-4 space-y-2">
            {reclassifiedIndustries.map((ind) => (
              <div key={ind.industry} className="flex items-center justify-between text-sm">
                <span className="text-zinc-700 dark:text-zinc-300">{ind.industry}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">{ind.percentage}%</span>
                  <span className="font-mono text-zinc-900 dark:text-zinc-100">
                    {formatMoney(ind.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "committees" && (
        <div className="space-y-2">
          {funding.top_committees.length === 0 ? (
            <p className="text-sm text-zinc-400">Committee data will be populated by the data pipeline.</p>
          ) : (
            funding.top_committees.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-zinc-700 dark:text-zinc-300">{c.name}</span>
                <span className="font-mono text-zinc-900 dark:text-zinc-100">
                  {formatMoney(c.amount)}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
}

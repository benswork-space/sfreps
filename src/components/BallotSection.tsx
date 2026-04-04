import type { DistrictData } from "@/lib/types";
import { POLICY_CATEGORIES } from "@/lib/types";
import { formatPercent } from "@/lib/format";

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

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-700">
              <th className="text-left py-2 pr-4 font-medium text-zinc-500 dark:text-zinc-400">Measure</th>
              <th className="text-left py-2 pr-4 font-medium text-zinc-500 dark:text-zinc-400">Topic</th>
              <th className="text-right py-2 pr-4 font-medium text-zinc-500 dark:text-zinc-400">District Support</th>
              <th className="text-right py-2 font-medium text-zinc-500 dark:text-zinc-400">Votes</th>
            </tr>
          </thead>
          <tbody>
            {districtData.ballot_results.map((br) => (
              <tr
                key={br.measure_id}
                className="border-b border-zinc-100 dark:border-zinc-800 last:border-0"
              >
                <td className="py-2 pr-4">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{br.name}</span>
                  <span className="block text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                    {br.title}
                  </span>
                </td>
                <td className="py-2 pr-4 text-zinc-500 dark:text-zinc-400 text-xs">
                  {POLICY_CATEGORIES[br.category]?.label ?? br.category}
                </td>
                <td className="py-2 pr-4 text-right">
                  <span
                    className={`font-mono font-medium ${
                      br.support_pct >= 50
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {formatPercent(br.support_pct)}
                  </span>
                </td>
                <td className="py-2 text-right text-zinc-400 dark:text-zinc-500 font-mono text-xs">
                  {br.total_votes.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

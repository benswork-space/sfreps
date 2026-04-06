import type { ConflictExample } from "@/lib/types";
import { POLICY_CATEGORIES } from "@/lib/types";
import { formatPercent } from "@/lib/format";

interface Props {
  conflicts: ConflictExample[];
}

export default function ConflictSection({ conflicts }: Props) {
  return (
    <section className="bg-red-50 rounded-2xl p-6 shadow-sm border border-red-200">
      <h2 className="text-xl font-bold text-red-900 mb-1">
        Potential Conflicts of Interest
      </h2>
      <p className="text-sm text-red-700/70 mb-4">
        Cases where the supervisor voted against their district&apos;s position but in line with top donor interests.
      </p>

      <div className="space-y-4">
        {conflicts.map((c, i) => (
          <div
            key={i}
            className="bg-white rounded-xl p-4 border border-red-200"
          >
            <p className="font-medium text-zinc-900">{c.topic}</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              {POLICY_CATEGORIES[c.category]?.label}
            </p>
            <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
              <div>
                <p className="text-zinc-400 text-xs">District</p>
                <p className="font-medium text-zinc-900">
                  {formatPercent(c.district_support_pct)} support
                </p>
              </div>
              <div>
                <p className="text-zinc-400 text-xs">Supervisor</p>
                <p className="font-medium text-red-600">
                  {c.supervisor_position === "support" ? "Support" : "Oppose"}
                </p>
              </div>
              <div>
                <p className="text-zinc-400 text-xs">Top Donor</p>
                <p className="font-medium text-amber-600">
                  {c.donor_interest} ({c.donor_preferred})
                </p>
              </div>
            </div>
            <p className="text-sm text-zinc-600 mt-3">{c.explanation}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

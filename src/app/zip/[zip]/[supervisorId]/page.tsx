import { notFound } from "next/navigation";
import { getSupervisor, getSupervisorVotes, getDistrict, getZipLookup } from "@/lib/data";
import SupervisorHeader from "@/components/SupervisorHeader";
import FundingSection from "@/components/FundingSection";
import DonorAlignmentSection from "@/components/DonorAlignmentSection";
import DistrictAlignmentSection from "@/components/DistrictAlignmentSection";
import VotingSection from "@/components/VotingSection";
import BallotSection from "@/components/BallotSection";
import SourceLinks from "@/components/SourceLinks";
import BackToSearch from "@/components/BackToSearch";
import DistrictMapInset from "@/components/DistrictMapInset";
import ShareButton from "@/components/ShareButton";

interface PageProps {
  params: Promise<{ zip: string; supervisorId: string }>;
}

export function generateStaticParams() {
  const zipLookup = getZipLookup();
  const params: { zip: string; supervisorId: string }[] = [];
  const seen = new Set<string>();

  for (const entry of zipLookup) {
    const supervisorId = `district-${entry.district}`;
    const key = `${entry.zip}/${supervisorId}`;
    if (!seen.has(key)) {
      seen.add(key);
      params.push({ zip: entry.zip, supervisorId });
    }
  }

  return params;
}

export default async function SupervisorPage({ params }: PageProps) {
  const { zip, supervisorId } = await params;
  const supervisor = getSupervisor(supervisorId);
  if (!supervisor) notFound();

  const votes = getSupervisorVotes(supervisorId);
  const district = getDistrict(supervisor.district);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <BackToSearch />
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              ZIP {zip} &middot; District {supervisor.district}
            </span>
            <ShareButton supervisorName={supervisor.name} district={supervisor.district} />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Supervisor header with map inset */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6">
          <SupervisorHeader supervisor={supervisor} neighborhoods={district?.neighborhoods ?? []} />
          <DistrictMapInset district={supervisor.district} />
        </div>

        {/* Campaign Finance */}
        {supervisor.funding.total_raised > 0 && (
          <FundingSection funding={supervisor.funding} supervisorName={supervisor.name} />
        )}

        {/* Donor Alignment — computed client-side from votes + funding data */}
        <DonorAlignmentSection
          votes={votes}
          funding={supervisor.funding}
          supervisorName={supervisor.name}
        />

        {/* District Alignment — computed client-side from votes + ballot results */}
        <DistrictAlignmentSection
          votes={votes}
          ballotResults={district?.ballot_results ?? []}
          funding={supervisor.funding}
          district={supervisor.district}
          supervisorName={supervisor.name}
        />

        {/* Ballot Measure Positions */}
        {district && district.ballot_results.length > 0 && (
          <BallotSection districtData={district} supervisorId={supervisorId} />
        )}

        {/* Recent Voting Record */}
        {votes.length > 0 && (
          <VotingSection votes={votes} />
        )}

        {/* Source Links */}
        <SourceLinks links={supervisor.links} district={supervisor.district} />

        {/* Data freshness note */}
        <p className="text-xs text-zinc-400 dark:text-zinc-600 text-center pb-4">
          Data sourced from SF Ethics Commission, Legistar, and SF Dept of Elections.{" "}
          <a href={`${process.env.__NEXT_ROUTER_BASEPATH || ""}/methodology`} className="underline hover:text-zinc-600 dark:hover:text-zinc-400">
            Methodology
          </a>
        </p>
      </main>
    </div>
  );
}

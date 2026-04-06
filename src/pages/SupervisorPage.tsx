import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSupervisor, getSupervisorVotes, getDistrict, lookupZip } from "@/lib/data-client";
import type { SupervisorData, VoteRecord, DistrictData } from "@/lib/types";
import SupervisorHeader from "@/components/SupervisorHeader";
import FundingSection from "@/components/FundingSection";
import DonorAlignmentSection from "@/components/DonorAlignmentSection";
import DistrictAlignmentSection from "@/components/DistrictAlignmentSection";
import VotingSection from "@/components/VotingSection";
import BallotSection from "@/components/BallotSection";
import SourceLinks from "@/components/SourceLinks";
import BackToSearch from "@/components/BackToSearch";
import ShareButton from "@/components/ShareButton";

export default function SupervisorPage() {
  const { zip, supervisorId } = useParams<{ zip: string; supervisorId?: string }>();
  const navigate = useNavigate();
  const [supervisor, setSupervisor] = useState<SupervisorData | null>(null);
  const [votes, setVotes] = useState<VoteRecord[]>([]);
  const [district, setDistrict] = useState<DistrictData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!zip) return;

    async function load() {
      // If no supervisorId, look up the ZIP and redirect
      if (!supervisorId) {
        const result = await lookupZip(zip);
        if (result) {
          navigate(`/zip/${zip}/${result.supervisorId}`, { replace: true });
        } else {
          navigate("/", { replace: true });
        }
        return;
      }

      const [sup, v, dist] = await Promise.all([
        getSupervisor(supervisorId),
        getSupervisorVotes(supervisorId),
        getDistrict(parseInt(supervisorId.replace("district-", ""), 10)),
      ]);

      if (!sup) {
        navigate("/", { replace: true });
        return;
      }

      setSupervisor(sup);
      setVotes(v);
      setDistrict(dist);
      setLoading(false);
      document.title = `${sup.name} — SFReps`;
    }

    load();
  }, [zip, supervisorId, navigate]);

  if (loading || !supervisor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <p className="text-zinc-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-zinc-200">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <BackToSearch />
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-500">
              ZIP {zip} &middot; District {supervisor.district}
            </span>
            <ShareButton supervisorName={supervisor.name} district={supervisor.district} />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-8">
        <SupervisorHeader supervisor={supervisor} neighborhoods={district?.neighborhoods ?? []} />

        {supervisor.funding.total_raised > 0 && (
          <FundingSection funding={supervisor.funding} supervisorName={supervisor.name} />
        )}

        <DonorAlignmentSection
          votes={votes}
          funding={supervisor.funding}
          supervisorName={supervisor.name}
        />

        <DistrictAlignmentSection
          votes={votes}
          ballotResults={district?.ballot_results ?? []}
          funding={supervisor.funding}
          district={supervisor.district}
          supervisorName={supervisor.name}
        />

        {district && district.ballot_results.length > 0 && (
          <BallotSection districtData={district} supervisorId={supervisorId!} />
        )}

        {votes.length > 0 && (
          <VotingSection votes={votes} />
        )}

        <SourceLinks links={supervisor.links} district={supervisor.district} />

        <p className="text-xs text-zinc-400 text-center pb-4">
          Data sourced from SF Ethics Commission, Legistar, and SF Dept of Elections.{" "}
          <a href="/methodology" className="underline hover:text-zinc-600">Methodology</a>
        </p>
      </main>
    </div>
  );
}

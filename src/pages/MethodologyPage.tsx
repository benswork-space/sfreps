import { useEffect } from "react";
import { Link } from "react-router-dom";

export default function MethodologyPage() {
  useEffect(() => { document.title = "Methodology — SFReps"; }, []);

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-zinc-200">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center">
          <Link to="/" className="text-sm text-zinc-500 hover:text-zinc-700">&larr; Back to SFReps</Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-zinc-900 mb-8">Methodology & Data Sources</h1>
        <div className="prose max-w-none space-y-8">
          <section>
            <h2>Overview</h2>
            <p>SFReps combines publicly available data from multiple San Francisco government sources to show how your district supervisor votes, who funds their campaigns, and how well they represent your neighborhood.</p>
          </section>
          <section>
            <h2>Data Sources</h2>
            <h3>Campaign Finance</h3>
            <p>Campaign contribution data comes from the <a href="https://sfethics.org/disclosures/campaign-finance-disclosure" target="_blank" rel="noopener noreferrer">San Francisco Ethics Commission</a>, accessed via the <a href="https://data.sfgov.org" target="_blank" rel="noopener noreferrer">DataSF Open Data Portal</a> (Socrata API).</p>
            <h3>Legislative Voting Records</h3>
            <p>Supervisor votes on ordinances, resolutions, and motions come from <a href="https://sfgov.legistar.com" target="_blank" rel="noopener noreferrer">San Francisco&apos;s Legistar system</a>. We currently include 161 roll call votes from 2024-2026.</p>
            <h3>Election Results</h3>
            <p>Ballot measure results come from the <a href="https://sfelections.sfgov.org" target="_blank" rel="noopener noreferrer">San Francisco Department of Elections</a> District-level Statement of Vote files. We include 31 local ballot measures across three elections.</p>
            <h3>District Boundaries</h3>
            <p>Supervisor district boundaries are from <a href="https://data.sfgov.org/Geographic-Locations-and-Boundaries/Supervisor-Districts-2022-/f2zs-jevy" target="_blank" rel="noopener noreferrer">DataSF</a>, reflecting the 2022 redistricting.</p>
          </section>
          <section>
            <h2>Scoring Methodology</h2>
            <h3>Donor Alignment Score</h3>
            <p>Measures how often a supervisor&apos;s votes align with their top campaign donors&apos; likely preferences. Each vote is classified by policy category and matched against donor industry interests.</p>
            <h3>District Alignment Score</h3>
            <p>Compares supervisor positions to how their district actually voted on ballot measures, using real precinct-level election results — not surveys or estimates.</p>
            <h3>Conflict Detection</h3>
            <p>Flags cases where a supervisor votes against their district&apos;s clear majority and in line with top donor interests.</p>
          </section>
          <section>
            <h2>Limitations</h2>
            <ul>
              <li><strong>Correlation is not causation</strong> — a high donor alignment score does not prove corruption.</li>
              <li><strong>Ballot measure positions</strong> — compiled from voter guides and news, not a single authoritative database.</li>
              <li><strong>Industry classification</strong> — categorizing donors involves judgment calls.</li>
              <li><strong>SF supervisors are officially nonpartisan.</strong></li>
            </ul>
          </section>
          <section>
            <h2>Feedback</h2>
            <p>If you find an error, please <a href="https://github.com/benswork-space/sfreps/issues" target="_blank" rel="noopener noreferrer">open an issue on GitHub</a>.</p>
          </section>
        </div>
      </main>
    </div>
  );
}

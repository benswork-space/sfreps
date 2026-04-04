import Link from "next/link";

export const metadata = {
  title: "Methodology — SFReps",
  description: "How SFReps collects, processes, and scores data about San Francisco supervisors.",
};

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center">
          <Link
            href="/"
            className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            &larr; Back to SFReps
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-8">
          Methodology & Data Sources
        </h1>

        <div className="prose dark:prose-invert prose-zinc max-w-none space-y-8">
          {/* Overview */}
          <section>
            <h2>Overview</h2>
            <p>
              SFReps combines publicly available data from multiple San Francisco government sources to
              show how your district supervisor votes, who funds their campaigns, and how well they
              represent your neighborhood. All data is sourced from official public records.
            </p>
          </section>

          {/* Data Sources */}
          <section>
            <h2>Data Sources</h2>

            <h3>Campaign Finance</h3>
            <p>
              Campaign contribution data comes from the{" "}
              <a href="https://sfethics.org/disclosures/campaign-finance-disclosure" target="_blank" rel="noopener noreferrer">
                San Francisco Ethics Commission
              </a>
              , accessed via the{" "}
              <a href="https://data.sfgov.org" target="_blank" rel="noopener noreferrer">
                DataSF Open Data Portal
              </a>{" "}
              (Socrata API). This includes all campaign committee filings, individual and committee
              contributions, and summary financial data. The data is updated nightly from the latest
              Ethics Commission filings.
            </p>
            <p>
              Donors are categorized into industry groups (e.g., real estate, tech, labor, healthcare)
              using a combination of employer information, committee names, and AI-assisted classification.
            </p>

            <h3>Legislative Voting Records</h3>
            <p>
              Supervisor votes on ordinances, resolutions, and motions come from{" "}
              <a href="https://sfgov.legistar.com" target="_blank" rel="noopener noreferrer">
                San Francisco&apos;s Legistar system
              </a>
              , the official legislative information management system used by the Board of Supervisors.
              Each vote is recorded as yea, nay, absent, or excused.
            </p>

            <h3>Election Results</h3>
            <p>
              Ballot measure results by precinct come from the{" "}
              <a href="https://sfelections.sfgov.org" target="_blank" rel="noopener noreferrer">
                San Francisco Department of Elections
              </a>
              . Precinct-level data is aggregated to supervisor districts using official precinct-to-district
              mappings. This gives us actual vote totals showing how each district voted on every
              proposition and ballot measure — not estimates or surveys, but real election results.
            </p>

            <h3>District Boundaries</h3>
            <p>
              Supervisor district boundaries are from{" "}
              <a href="https://data.sfgov.org/Geographic-Locations-and-Boundaries/Supervisor-Districts-2022-/f2zs-jevy" target="_blank" rel="noopener noreferrer">
                DataSF
              </a>
              , reflecting the 2022 redistricting. ZIP code to district mappings use the official{" "}
              <a href="https://data.sfgov.org/Geographic-Locations-and-Boundaries/Supervisor-District-2022-to-ZIP-Code-Crosswalk/2x22-z5j6" target="_blank" rel="noopener noreferrer">
                crosswalk dataset
              </a>
              .
            </p>

            <h3>Supervisor Positions on Ballot Measures</h3>
            <p>
              Supervisor endorsements and positions on ballot propositions are compiled from official
              voter guides, supervisor websites, and reporting from local news outlets including the
              SF Chronicle, Mission Local, and SF Examiner. Each position is attributed to a specific
              source and assigned a confidence level (high, medium, or low) based on the directness
              of the source.
            </p>
          </section>

          {/* Scoring Methodology */}
          <section>
            <h2>Scoring Methodology</h2>

            <h3>Donor Alignment Score</h3>
            <p>
              The donor alignment score measures how often a supervisor&apos;s votes align with the
              likely preferences of their top campaign donors. The process works as follows:
            </p>
            <ol>
              <li>
                <strong>Identify top donors:</strong> We compile the supervisor&apos;s top individual
                donors and committees, categorized by industry.
              </li>
              <li>
                <strong>Classify legislation:</strong> For each vote the supervisor cast, we use
                AI-assisted analysis to determine which industry groups the legislation most directly
                affects and what outcome (yea or nay) each industry would likely prefer.
              </li>
              <li>
                <strong>Score alignment:</strong> We check whether the supervisor&apos;s actual vote
                matches the predicted preference of their top donor industries. The overall score is
                the percentage of scored votes where the supervisor voted in line with donor interests.
              </li>
            </ol>
            <p>
              Important caveats: A high donor alignment score does not prove corruption or quid pro quo.
              Donors often support candidates who already share their policy views. The score simply
              highlights the correlation for transparency. Legislation where the industry impact is
              unclear or where the AI classification has low confidence is excluded from scoring.
            </p>

            <h3>District Alignment Score</h3>
            <p>
              The district alignment score measures how well a supervisor&apos;s positions match their
              constituents&apos; expressed preferences. Unlike national-level tools that must rely on
              survey estimates, SFReps uses <strong>actual election results</strong>.
            </p>
            <p>The process:</p>
            <ol>
              <li>
                <strong>Aggregate election results:</strong> We take precinct-level results from the
                SF Department of Elections and aggregate them to supervisor districts, giving us the
                exact percentage of each district that voted for or against each ballot measure.
              </li>
              <li>
                <strong>Map legislation to issues:</strong> For supervisor votes on legislation, we
                use AI-assisted analysis to identify related ballot measures or policy topics, then
                compare the supervisor&apos;s vote to how their district voted on similar issues.
              </li>
              <li>
                <strong>Direct comparison on ballot measures:</strong> When a supervisor takes a public
                position on a ballot measure, we directly compare their position to their district&apos;s
                actual vote on that measure.
              </li>
              <li>
                <strong>Score alignment:</strong> The overall score is the percentage of issues where
                the supervisor&apos;s position matches the majority position of their district.
              </li>
            </ol>
            <p>
              This approach is significantly more accurate than survey-based methods because it uses
              real voting behavior rather than estimated opinions.
            </p>

            <h3>Conflict Detection</h3>
            <p>
              We flag cases where a supervisor votes <em>against</em> the clear majority of their
              district&apos;s voters <em>and</em> in line with their top campaign donors&apos; interests.
              These are highlighted as potential conflicts of interest. Again, correlation does not
              imply causation — there may be legitimate policy reasons for a supervisor&apos;s position.
              We present the data for voters to evaluate.
            </p>
          </section>

          {/* Policy Categories */}
          <section>
            <h2>Policy Categories</h2>
            <p>
              We classify issues into 14 categories specific to San Francisco city politics. These
              were derived from analysis of ballot measures and Board of Supervisors legislation from
              2020-2025:
            </p>
            <ul>
              <li><strong>Housing & Development</strong> — affordability, rent control, zoning, density</li>
              <li><strong>Homelessness</strong> — shelter capacity, supportive services, housing-first</li>
              <li><strong>Public Safety & Policing</strong> — police staffing, surveillance, accountability</li>
              <li><strong>Drug Policy</strong> — fentanyl response, harm reduction, treatment</li>
              <li><strong>Transportation & Transit</strong> — Muni funding, rideshare taxes, bike infrastructure</li>
              <li><strong>Parks & Public Space</strong> — car-free parks, Great Highway, open space</li>
              <li><strong>Education & Youth</strong> — school bonds, youth programs, student nutrition</li>
              <li><strong>Business Taxes & Economy</strong> — gross receipts tax, small business exemptions</li>
              <li><strong>Workers&apos; Rights & Labor</strong> — minimum wage, paid time off, union contracts</li>
              <li><strong>Environment & Climate</strong> — emissions, sea level rise, renewable energy</li>
              <li><strong>Government Reform</strong> — mayoral power, commissions, ethics</li>
              <li><strong>Healthcare & Reproductive Rights</strong> — healthcare access, abortion protections</li>
              <li><strong>First Responder Benefits</strong> — police/fire pensions, recruitment</li>
              <li><strong>Libraries & Culture</strong> — library funding, digital access</li>
            </ul>
          </section>

          {/* AI Classification */}
          <section>
            <h2>AI-Assisted Classification</h2>
            <p>
              We use AI (Claude by Anthropic) to classify legislation and determine likely industry
              preferences. This is necessary because:
            </p>
            <ul>
              <li>
                Legislation titles can be misleading — the actual policy impact may differ from what
                the title suggests.
              </li>
              <li>
                The volume of votes requires automated analysis, though all classifications are
                cached and available for human review.
              </li>
              <li>
                Each classification includes a confidence score. Low-confidence classifications are
                excluded from scoring.
              </li>
            </ul>
            <p>
              All AI classifications are cached as JSON files for auditability. Each classification
              includes the full reasoning and a confidence score, allowing reviewers to verify the
              analysis.
            </p>
          </section>

          {/* Limitations */}
          <section>
            <h2>Limitations</h2>
            <ul>
              <li>
                <strong>Correlation is not causation:</strong> A high donor alignment score does not
                mean a supervisor is &quot;bought&quot; — they may genuinely share policy views with their
                donors.
              </li>
              <li>
                <strong>Ballot measure positions:</strong> Supervisor endorsements on ballot measures
                are compiled from voter guides and news coverage, not a single authoritative database.
                Some positions may be missing or based on secondary sources.
              </li>
              <li>
                <strong>Industry classification:</strong> Categorizing donors into industries involves
                judgment calls. Some donors could reasonably fit multiple categories.
              </li>
              <li>
                <strong>Data freshness:</strong> Campaign finance data is updated nightly from the
                Ethics Commission, but there may be a lag in filings. Voting records depend on
                Legistar&apos;s publication schedule.
              </li>
              <li>
                <strong>ZIP-to-district mapping:</strong> Some ZIP codes span multiple supervisor
                districts. When this occurs, we assign users to the district that contains the largest
                share of that ZIP code&apos;s area.
              </li>
              <li>
                <strong>San Francisco supervisors are officially nonpartisan:</strong> While supervisors
                may have known political affiliations, their official positions are nonpartisan. We
                focus on their actual votes and funding rather than party labels.
              </li>
            </ul>
          </section>

          {/* Contact */}
          <section>
            <h2>Feedback & Corrections</h2>
            <p>
              If you find an error in our data or have suggestions for improvement, please{" "}
              <a href="https://github.com/benswork-space/sfreps/issues" target="_blank" rel="noopener noreferrer">
                open an issue on GitHub
              </a>
              . We take data accuracy seriously and will investigate and correct any errors promptly.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

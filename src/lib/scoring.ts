/**
 * Client-side alignment scoring.
 *
 * Computes donor alignment and district alignment from raw data so the
 * sections display immediately without requiring the AI pipeline.
 *
 * Donor alignment: maps each vote's policy category to donor industries,
 * then checks if the supervisor voted with or against those interests.
 *
 * District alignment: compares the supervisor's votes on legislation to how
 * their district voted on related ballot measures (by policy category).
 */

import type {
  VoteRecord,
  FundingData,
  IndustryFunding,
  BallotMeasureResult,
  PolicyCategory,
} from "./types";
import { classifyVoteTitle } from "./classify";
import classificationsData from "../../scripts/data/vote_classifications.json";

// AI classifications keyed by file number (from the vote ID format "leg-XXXXXX")
const AI_CLASSIFICATIONS: Record<string, {
  category: PolicyCategory | null;
  affected_industries?: Array<{ industry: string; preferred: string; reason: string }>;
}> = classificationsData as Record<string, unknown> as typeof AI_CLASSIFICATIONS;

// ---------------------------------------------------------------------------
// Donor alignment
// ---------------------------------------------------------------------------

/** Which industries care about which policy categories, and which direction */
const INDUSTRY_CATEGORY_POSITIONS: Record<string, Partial<Record<PolicyCategory, "yea" | "nay">>> = {
  "Real Estate & Development": {
    housing: "nay",          // typically oppose rent control / affordable housing mandates
    business_taxes: "nay",   // oppose taxes
    environment: "nay",      // oppose regulations that slow development
  },
  "Tech": {
    business_taxes: "nay",
    transportation: "yea",   // support transit (employee commutes)
    housing: "yea",          // generally pro-housing supply
  },
  "Labor & Unions": {
    labor: "yea",
    housing: "yea",          // support affordable housing
    public_safety: "yea",    // police/fire unions support staffing
    first_responders: "yea",
  },
  "Healthcare": {
    healthcare: "yea",
    drug_policy: "yea",      // support treatment funding
  },
  "Finance & Insurance": {
    business_taxes: "nay",
    government_reform: "nay", // prefer stability
  },
  "Hospitality & Tourism": {
    business_taxes: "nay",
    parks: "yea",            // support tourism-friendly spaces
    transportation: "yea",
  },
  "Environmental": {
    environment: "yea",
    parks: "yea",
    transportation: "yea",   // support transit over cars
  },
  "PACs & Political Orgs": {},
  "Government / Public": {},
  "Individual Donors": {},
  "Self-Funding": {},
  "Legal": {},
  "Cannabis": { business_taxes: "nay" },
  "Education": { education: "yea" },
  "Media & Advertising": {},
  "Other": {},
};

export interface DonorAlignmentResult {
  overall_pct: number;
  total_scored: number;
  examples: DonorAlignmentExample[];
}

export interface DonorAlignmentExample {
  title: string;
  date: string;
  vote: string;
  category: PolicyCategory;
  donor_industry: string;
  donor_preferred: "yea" | "nay";
  aligned: boolean;
  reason?: string;
}

export function computeDonorAlignment(
  votes: VoteRecord[],
  funding: FundingData
): DonorAlignmentResult {
  // Get the supervisor's top donor industries (by amount, excluding generic categories)
  const skipIndustries = new Set([
    "Other", "Individual Donors", "Self-Funding", "Government / Public", "PACs & Political Orgs",
  ]);
  const topIndustries = funding.top_industries
    .filter((i) => !skipIndustries.has(i.industry))
    .slice(0, 5);

  if (topIndustries.length === 0) {
    return { overall_pct: 0, total_scored: 0, examples: [] };
  }

  let aligned = 0;
  let scored = 0;
  const examples: DonorAlignmentExample[] = [];

  for (const vote of votes) {
    if (vote.vote === "absent" || vote.vote === "excused") continue;

    // Extract file number from vote ID (format: "leg-XXXXXX")
    const fileNum = vote.id.replace("leg-", "");
    const aiClass = AI_CLASSIFICATIONS[fileNum];

    // Use AI classification if available
    if (aiClass?.affected_industries && aiClass.affected_industries.length > 0) {
      const category = aiClass.category;
      if (!category) continue;

      // Check if any AI-identified industry matches the supervisor's top donors
      for (const aiInd of aiClass.affected_industries) {
        const matchingDonorIndustry = topIndustries.find(
          (ti) => ti.industry === aiInd.industry
        );
        if (!matchingDonorIndustry) continue;

        const preferred = aiInd.preferred as "yea" | "nay";
        scored++;
        const isAligned = vote.vote === preferred;
        if (isAligned) aligned++;

        examples.push({
          title: vote.title,
          date: vote.date,
          vote: vote.vote,
          category,
          donor_industry: aiInd.industry,
          donor_preferred: preferred,
          aligned: isAligned,
          reason: aiInd.reason,
        });

        break; // Only score once per vote
      }
      continue;
    }

    // Fallback: keyword classification + static industry positions
    const category = vote.category || classifyVoteTitle(vote.title);
    if (!category) continue;

    for (const industry of topIndustries) {
      const positions = INDUSTRY_CATEGORY_POSITIONS[industry.industry];
      if (!positions) continue;

      const preferred = positions[category];
      if (!preferred) continue;

      scored++;
      const isAligned = vote.vote === preferred;
      if (isAligned) aligned++;

      examples.push({
        title: vote.title,
        date: vote.date,
        vote: vote.vote,
        category: category,
        donor_industry: industry.industry,
        donor_preferred: preferred,
        aligned: isAligned,
      });

      break;
    }
  }

  // Pick the most interesting examples: mix of aligned and not, prefer recent
  const alignedExamples = examples.filter((e) => e.aligned).slice(0, 3);
  const independentExamples = examples.filter((e) => !e.aligned).slice(0, 3);
  const topExamples = [...independentExamples, ...alignedExamples]
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .slice(0, 5);

  return {
    overall_pct: scored > 0 ? Math.round((aligned / scored) * 100) : 0,
    total_scored: scored,
    examples: topExamples,
  };
}

// ---------------------------------------------------------------------------
// District alignment
// ---------------------------------------------------------------------------

export interface DistrictAlignmentResult {
  overall_pct: number;
  issues_scored: number;
  highlights: DistrictAlignmentHighlight[];
  conflicts: DistrictConflict[];
}

export interface DistrictAlignmentHighlight {
  topic: string;
  description: string;
  category: PolicyCategory;
  ballot_measure: string;
  district_support_pct: number;
  supervisor_position: "support" | "oppose";
  aligned: boolean;
}

export interface DistrictConflict {
  topic: string;
  category: PolicyCategory;
  ballot_measure: string;
  district_support_pct: number;
  supervisor_position: "support" | "oppose";
  donor_industry: string;
}

/**
 * Compute district alignment by comparing the supervisor's voting pattern
 * (by category) to how their district voted on ballot measures in that category.
 *
 * For each policy category, we:
 *  1. Look at how the district voted on ballot measures in that category
 *  2. Look at how the supervisor voted on legislation in that category
 *  3. If the district supported (>50%) measures in a category and the supervisor
 *     mostly voted yea on legislation in that category, they're aligned
 */
export function computeDistrictAlignment(
  votes: VoteRecord[],
  ballotResults: BallotMeasureResult[],
  funding: FundingData
): DistrictAlignmentResult {
  if (ballotResults.length === 0) {
    return { overall_pct: 0, issues_scored: 0, highlights: [], conflicts: [] };
  }

  // Group ballot results by category → average district support
  const categoryBallot: Record<string, { support: number; count: number; measures: BallotMeasureResult[] }> = {};
  for (const br of ballotResults) {
    if (!categoryBallot[br.category]) {
      categoryBallot[br.category] = { support: 0, count: 0, measures: [] };
    }
    categoryBallot[br.category].support += br.support_pct;
    categoryBallot[br.category].count++;
    categoryBallot[br.category].measures.push(br);
  }

  // Group supervisor votes by category → yea rate
  const categoryVotes: Record<string, { yeas: number; total: number }> = {};
  for (const v of votes) {
    if (v.vote === "absent" || v.vote === "excused") continue;
    // Prefer AI classification, then vote category, then keyword fallback
    const fileNum = v.id.replace("leg-", "");
    const aiClass = AI_CLASSIFICATIONS[fileNum];
    const cat = aiClass?.category || v.category || classifyVoteTitle(v.title);
    if (!cat) continue;
    if (!categoryVotes[cat]) {
      categoryVotes[cat] = { yeas: 0, total: 0 };
    }
    categoryVotes[cat].total++;
    if (v.vote === "yea") categoryVotes[cat].yeas++;
  }

  let alignedCount = 0;
  let scoredCount = 0;
  const highlights: DistrictAlignmentHighlight[] = [];
  const conflicts: DistrictConflict[] = [];

  // Compare category by category
  for (const [cat, ballot] of Object.entries(categoryBallot)) {
    const supVotes = categoryVotes[cat];
    if (!supVotes || supVotes.total === 0) continue;

    const avgDistrictSupport = ballot.support / ballot.count;
    const districtSupports = avgDistrictSupport >= 50;

    const supYeaRate = supVotes.yeas / supVotes.total;
    const supSupports = supYeaRate >= 0.5;

    const isAligned = districtSupports === supSupports;
    scoredCount++;
    if (isAligned) alignedCount++;

    // Create a highlight for the most representative ballot measure
    const representativeMeasure = ballot.measures[0];
    highlights.push({
      topic: representativeMeasure.title,
      description: representativeMeasure.description ?? "",
      category: cat as PolicyCategory,
      ballot_measure: representativeMeasure.name,
      district_support_pct: Math.round(avgDistrictSupport * 10) / 10,
      supervisor_position: supSupports ? "support" : "oppose",
      aligned: isAligned,
    });

    // Check for donor conflict on misaligned issues
    if (!isAligned) {
      const topIndustries = funding.top_industries.filter(
        (i) => !["Other", "Individual Donors", "Self-Funding", "Government / Public", "PACs & Political Orgs"].includes(i.industry)
      );

      for (const ind of topIndustries.slice(0, 3)) {
        const positions = INDUSTRY_CATEGORY_POSITIONS[ind.industry];
        if (positions && positions[cat as PolicyCategory]) {
          conflicts.push({
            topic: representativeMeasure.title,
            category: cat as PolicyCategory,
            ballot_measure: representativeMeasure.name,
            district_support_pct: Math.round(avgDistrictSupport * 10) / 10,
            supervisor_position: supSupports ? "support" : "oppose",
            donor_industry: ind.industry,
          });
          break;
        }
      }
    }
  }

  // Sort highlights: misaligned first
  highlights.sort((a, b) => {
    if (a.aligned !== b.aligned) return a.aligned ? 1 : -1;
    return Math.abs(b.district_support_pct - 50) - Math.abs(a.district_support_pct - 50);
  });

  return {
    overall_pct: scoredCount > 0 ? Math.round((alignedCount / scoredCount) * 100) : 0,
    issues_scored: scoredCount,
    highlights,
    conflicts,
  };
}

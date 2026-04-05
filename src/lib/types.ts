// ==========================================
// Core Data Types for SFReps
// ==========================================

// --- Supervisor Profile ---

export interface SupervisorData {
  id: string; // e.g., "district-1"
  district: number;
  name: string;
  photo_url: string;
  party: string | null; // SF supervisors are officially nonpartisan
  serving_since: string; // e.g., "2021-01-08"
  term_ends: string; // e.g., "2025-01-08"
  years_in_office: number;
  bio_url: string;
  funding: FundingData;
  donor_alignment: DonorAlignment;
  district_alignment: DistrictAlignment;
  links: SupervisorLinks;
}

export interface SupervisorLinks {
  official_page: string;
  ethics_commission: string;
  legistar: string;
  campaign_finance: string;
}

// --- Campaign Finance ---

export interface FundingData {
  total_raised: number;
  cycle: string; // e.g., "2024"
  top_industries: IndustryFunding[];
  top_donors: DonorDetail[];
  top_committees: DonorDetail[];
}

export interface IndustryFunding {
  industry: string;
  amount: number;
  percentage: number;
}

export interface DonorDetail {
  name: string;
  amount: number;
  type: "individual" | "committee" | "pac" | "other";
  industry?: string;
}

// --- Donor Alignment ---

export interface DonorAlignment {
  overall_pct: number; // 0-100, how often they vote with top donor interests
  total_votes_scored: number;
  examples: AlignmentExample[];
}

export interface AlignmentExample {
  legislation: string; // ordinance/resolution title
  legislation_id: string;
  date: string;
  vote: "yea" | "nay" | "absent" | "excused";
  donor_interest: string; // e.g., "Real estate developers"
  donor_preferred: "yea" | "nay";
  aligned: boolean;
  explanation: string;
  category: PolicyCategory;
}

// --- District Alignment ---

export interface DistrictAlignment {
  overall_pct: number; // 0-100, how often they align with district voters
  issues_scored: number;
  highlights: DistrictHighlight[];
  against_district_with_donors: ConflictExample[];
}

export interface DistrictHighlight {
  topic: string;
  category: PolicyCategory;
  supervisor_position: "support" | "oppose";
  district_support_pct: number;
  aligned: boolean;
  source: string; // ballot measure or legislative vote
  source_type: "ballot_measure" | "legislation";
}

export interface ConflictExample {
  topic: string;
  category: PolicyCategory;
  district_support_pct: number;
  supervisor_position: "support" | "oppose";
  donor_interest: string;
  donor_preferred: "support" | "oppose";
  explanation: string;
}

// --- Voting Record ---

export interface VoteRecord {
  id: string;
  title: string;
  date: string;
  type: "ordinance" | "resolution" | "motion" | "other";
  vote: "yea" | "nay" | "absent" | "excused";
  result: "passed" | "failed";
  category?: PolicyCategory;
  legistar_url?: string;
}

// --- Ballot Measure ---

export interface BallotMeasure {
  id: string; // e.g., "2024-prop-a"
  election: string; // e.g., "2024-11"
  name: string; // e.g., "Proposition A"
  title: string; // e.g., "Affordable Housing Bonds"
  category: PolicyCategory;
  passed: boolean;
  citywide_support_pct: number;
  district_results: Record<number, number>; // district number → support percentage
}

export interface SupervisorBallotPosition {
  measure_id: string;
  position: "support" | "oppose" | "neutral" | "unknown";
  source: string;
  confidence: "high" | "medium" | "low";
}

// --- District Data ---

export interface DistrictData {
  district: number;
  ballot_results: BallotMeasureResult[];
  neighborhoods: string[];
}

export interface BallotMeasureResult {
  measure_id: string;
  election: string;
  name: string;
  title: string;
  description?: string;
  category: PolicyCategory;
  support_pct: number;
  total_votes: number;
}

// --- ZIP Lookup ---

export interface ZipLookupEntry {
  zip: string;
  district: number;
  ratio: number; // percentage of ZIP population in this district
}

// --- Policy Categories ---

export type PolicyCategory =
  | "housing"
  | "homelessness"
  | "public_safety"
  | "drug_policy"
  | "transportation"
  | "parks"
  | "education"
  | "business_taxes"
  | "labor"
  | "environment"
  | "government_reform"
  | "healthcare"
  | "first_responders"
  | "libraries";

export const POLICY_CATEGORIES: Record<PolicyCategory, { label: string; description: string }> = {
  housing: { label: "Housing & Development", description: "Affordability, rent control, zoning, density" },
  homelessness: { label: "Homelessness", description: "Shelter capacity, supportive services, housing-first" },
  public_safety: { label: "Public Safety & Policing", description: "Police staffing, surveillance, accountability" },
  drug_policy: { label: "Drug Policy", description: "Fentanyl response, harm reduction, treatment" },
  transportation: { label: "Transportation & Transit", description: "Muni funding, rideshare taxes, bike infrastructure" },
  parks: { label: "Parks & Public Space", description: "Car-free parks, Great Highway, open space" },
  education: { label: "Education & Youth", description: "School bonds, youth programs, student nutrition" },
  business_taxes: { label: "Business Taxes & Economy", description: "Gross receipts tax, small business exemptions" },
  labor: { label: "Workers' Rights & Labor", description: "Minimum wage, paid time off, union contracts" },
  environment: { label: "Environment & Climate", description: "Emissions, sea level rise, renewable energy" },
  government_reform: { label: "Government Reform", description: "Mayoral power, commissions, ethics" },
  healthcare: { label: "Healthcare & Reproductive Rights", description: "Healthcare access, abortion protections" },
  first_responders: { label: "First Responder Benefits", description: "Police/fire pensions, recruitment" },
  libraries: { label: "Libraries & Culture", description: "Library funding, digital access" },
};

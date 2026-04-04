import type { IndustryFunding, DonorDetail } from "./types";

/**
 * Reclassify donors currently labeled "Other" into more meaningful categories
 * based on name pattern matching, then rebuild industry totals.
 */

const GOVERNMENT_PATTERNS = [
  /city\s*(?:and|&)\s*county\s*of\s*san\s*francisco/i,
  /san\s*francisco\s*controller/i,
  /^sf\s+(?:dept|department)/i,
];

const PAC_PATTERNS = [
  /progress\s*san\s*francisco/i,
  /families\s*for\s*a\s*vibrant/i,
  /safe\s*(?:&|and)\s*affordable/i,
  /standing\s*up\s*to\s*save/i,
  /sponsored\s*by/i,
  /committee/i,
  /\bpac\b/i,
  /democratic\s*club/i,
  /social\s*justice\s*democrats/i,
];

const REAL_ESTATE_PATTERNS = [
  /realtors?/i,
  /real\s*estate/i,
  /\bllc\b/i,
  /holdings?,?\s*inc/i,
  /retail,?\s*inc/i,
  /development/i,
  /property/i,
];

const LABOR_PATTERNS = [
  /\bunion\b/i,
  /\blocal\s*\d+/i,
  /\bifpte\b/i,
  /\bseiu\b/i,
  /\bafl[\s-]?cio\b/i,
  /labor/i,
];

const MEDIA_PATTERNS = [
  /clear\s*channel/i,
  /outdoor/i,
  /media\s*group/i,
];

const TECH_DONOR_NAMES = new Set([
  "CHRIS LARSEN",
  "JEREMY STOPPELMAN",
  "RON CONWAY",
  "CHRISTOPHER CONWAY",
  "EMMETT SHEAR",
  "PAUL BUCHHEIT",
  "JESSICA LIVINGSTON",
  "JEREMY LIEW",
  "NICHOLAS JOSEFOWITZ",
]);

function matchesAny(name: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(name));
}

export function reclassifyDonor(donor: DonorDetail, supervisorName: string): string {
  if (donor.industry !== "Other") return donor.industry ?? "Other";

  const name = donor.name.trim();
  const upper = name.toUpperCase();

  // Government / public financing
  if (matchesAny(name, GOVERNMENT_PATTERNS)) return "Government / Public";

  // Self-funding (candidate donating to themselves)
  const supervisorParts = supervisorName.toLowerCase().split(/\s+/);
  const donorLower = name.toLowerCase();
  if (
    supervisorParts.length >= 2 &&
    supervisorParts.every((part) => donorLower.includes(part))
  ) {
    return "Self-Funding";
  }

  // PACs and political orgs
  if (matchesAny(name, PAC_PATTERNS)) return "PACs & Political Orgs";

  // Labor
  if (matchesAny(name, LABOR_PATTERNS)) return "Labor & Unions";

  // Real estate
  if (matchesAny(name, REAL_ESTATE_PATTERNS)) return "Real Estate & Development";

  // Media / advertising
  if (matchesAny(name, MEDIA_PATTERNS)) return "Media & Advertising";

  // Known tech donors
  if (TECH_DONOR_NAMES.has(upper)) return "Tech";

  // Individual donors (most remaining "Other" are individual contributions)
  return "Individual Donors";
}

export function reclassifyIndustries(
  originalIndustries: IndustryFunding[],
  donors: DonorDetail[],
  supervisorName: string
): IndustryFunding[] {
  // Start with non-Other industries
  const totals = new Map<string, number>();
  for (const ind of originalIndustries) {
    if (ind.industry !== "Other") {
      totals.set(ind.industry, (totals.get(ind.industry) ?? 0) + ind.amount);
    }
  }

  // Reclassify "Other" donors
  for (const donor of donors) {
    if (donor.industry === "Other") {
      const newCategory = reclassifyDonor(donor, supervisorName);
      totals.set(newCategory, (totals.get(newCategory) ?? 0) + donor.amount);
    }
  }

  // Also add any remaining "Other" amount not accounted for by individual donors
  const otherIndustry = originalIndustries.find((i) => i.industry === "Other");
  const reclassifiedOtherTotal = donors
    .filter((d) => d.industry === "Other")
    .reduce((sum, d) => sum + d.amount, 0);

  if (otherIndustry && reclassifiedOtherTotal < otherIndustry.amount) {
    const remainder = otherIndustry.amount - reclassifiedOtherTotal;
    totals.set("Individual Donors", (totals.get("Individual Donors") ?? 0) + remainder);
  }

  // Build sorted result
  const grandTotal = Array.from(totals.values()).reduce((a, b) => a + b, 0);
  const result: IndustryFunding[] = Array.from(totals.entries())
    .map(([industry, amount]) => ({
      industry,
      amount: Math.round(amount * 100) / 100,
      percentage: Math.round((amount / grandTotal) * 1000) / 10,
    }))
    .sort((a, b) => b.amount - a.amount);

  return result;
}

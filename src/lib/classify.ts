/**
 * Simple keyword-based policy category classifier for legislation titles.
 *
 * This runs client-side to tag votes with categories so the alignment
 * sections can work without the AI pipeline. The AI pipeline (stage 6)
 * will produce more accurate classifications later.
 */

import type { PolicyCategory } from "./types";

const CATEGORY_KEYWORDS: Record<PolicyCategory, string[]> = {
  housing: [
    "housing", "rent", "tenant", "landlord", "eviction", "zoning", "residential",
    "affordable", "dwelling", "building code", "condominium", "density",
    "planning code", "inclusionary", "accessory dwelling",
  ],
  homelessness: [
    "homeless", "shelter", "encampment", "supportive housing", "transitional",
    "unhoused", "unsheltered",
  ],
  public_safety: [
    "police", "sheriff", "public safety", "crime", "surveillance", "law enforcement",
    "probation", "detention", "jail", "gun", "firearm", "emergency management",
  ],
  drug_policy: [
    "drug", "substance", "fentanyl", "overdose", "narcotics", "treatment",
    "harm reduction", "recovery", "syringe", "opioid",
  ],
  transportation: [
    "transit", "muni", "transportation", "parking", "bicycle", "bike", "pedestrian",
    "traffic", "sfmta", "rideshare", "autonomous vehicle", "bus", "street",
    "sidewalk", "curb",
  ],
  parks: [
    "park", "recreation", "open space", "great highway", "golden gate",
    "playground", "garden", "beach", "waterfront",
  ],
  education: [
    "school", "education", "student", "youth", "children", "child", "library",
    "literacy", "sfusd", "after-school", "childcare",
  ],
  business_taxes: [
    "business tax", "gross receipts", "commercial", "small business", "economic",
    "business registration", "payroll tax", "transfer tax", "tax rate",
  ],
  labor: [
    "minimum wage", "worker", "labor", "wage", "employee", "paid leave",
    "prevailing wage", "workforce", "job training", "union",
  ],
  environment: [
    "environment", "climate", "emission", "renewable", "energy", "sustainability",
    "water", "sewer", "pollution", "clean air", "solar", "carbon",
  ],
  government_reform: [
    "charter amendment", "commission", "ethics", "transparency", "inspector general",
    "government", "civil service", "ballot measure", "election", "campaign finance",
    "sunshine", "oversight",
  ],
  healthcare: [
    "health", "hospital", "medical", "reproductive", "abortion", "mental health",
    "behavioral health", "clinic", "public health", "dph",
  ],
  first_responders: [
    "firefighter", "fire department", "911", "dispatcher", "pension",
    "retirement", "first responder", "ems", "paramedic",
  ],
  libraries: [
    "library", "libraries", "cultural", "arts", "museum",
  ],
};

export function classifyVoteTitle(title: string): PolicyCategory | undefined {
  const lower = title.toLowerCase();

  // Score each category by how many keywords match
  let bestCategory: PolicyCategory | undefined;
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        score++;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category as PolicyCategory;
    }
  }

  return bestScore > 0 ? bestCategory : undefined;
}

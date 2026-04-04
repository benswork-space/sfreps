import fs from "fs";
import path from "path";
import type { SupervisorData, VoteRecord, DistrictData, ZipLookupEntry, BallotMeasure } from "./types";

const DATA_DIR = path.join(process.cwd(), "public", "data");

function readJSON<T>(filePath: string): T | null {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function getSupervisor(supervisorId: string): SupervisorData | null {
  return readJSON<SupervisorData>(path.join(DATA_DIR, "supervisors", `${supervisorId}.json`));
}

export function getSupervisorVotes(supervisorId: string): VoteRecord[] {
  return readJSON<VoteRecord[]>(path.join(DATA_DIR, "supervisors", `${supervisorId}_votes.json`)) ?? [];
}

export function getAllSupervisors(): SupervisorData[] {
  const dir = path.join(DATA_DIR, "supervisors");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.match(/^district-\d+\.json$/))
    .map((f) => readJSON<SupervisorData>(path.join(dir, f)))
    .filter((s): s is SupervisorData => s !== null)
    .sort((a, b) => a.district - b.district);
}

export function getDistrict(districtNumber: number): DistrictData | null {
  return readJSON<DistrictData>(path.join(DATA_DIR, "districts", `district-${districtNumber}.json`));
}

export function getBallotMeasures(): BallotMeasure[] {
  return readJSON<BallotMeasure[]>(path.join(DATA_DIR, "ballot_measures.json")) ?? [];
}

let zipLookupCache: ZipLookupEntry[] | null = null;

export function getZipLookup(): ZipLookupEntry[] {
  if (zipLookupCache) return zipLookupCache;
  zipLookupCache = readJSON<ZipLookupEntry[]>(path.join(DATA_DIR, "zip_lookup.json")) ?? [];
  return zipLookupCache;
}

export function lookupZip(zip: string): { district: number; supervisorId: string } | null {
  const entries = getZipLookup().filter((e) => e.zip === zip);
  if (entries.length === 0) return null;
  // Pick the district with the highest population ratio for this ZIP
  const best = entries.reduce((a, b) => (a.ratio > b.ratio ? a : b));
  return { district: best.district, supervisorId: `district-${best.district}` };
}

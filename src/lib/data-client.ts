import type { SupervisorData, VoteRecord, DistrictData, ZipLookupEntry } from "./types";

async function fetchJSON<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function getSupervisor(supervisorId: string): Promise<SupervisorData | null> {
  return fetchJSON<SupervisorData>(`/data/supervisors/${supervisorId}.json`);
}

export async function getSupervisorVotes(supervisorId: string): Promise<VoteRecord[]> {
  return (await fetchJSON<VoteRecord[]>(`/data/supervisors/${supervisorId}_votes.json`)) ?? [];
}

export async function getDistrict(districtNumber: number): Promise<DistrictData | null> {
  return fetchJSON<DistrictData>(`/data/districts/district-${districtNumber}.json`);
}

let zipCache: ZipLookupEntry[] | null = null;

export async function getZipLookup(): Promise<ZipLookupEntry[]> {
  if (zipCache) return zipCache;
  zipCache = (await fetchJSON<ZipLookupEntry[]>("/data/zip_lookup.json")) ?? [];
  return zipCache;
}

export async function lookupZip(zip: string): Promise<{ district: number; supervisorId: string } | null> {
  const entries = (await getZipLookup()).filter((e) => e.zip === zip);
  if (entries.length === 0) return null;
  const best = entries.reduce((a, b) => (a.ratio > b.ratio ? a : b));
  return { district: best.district, supervisorId: `district-${best.district}` };
}

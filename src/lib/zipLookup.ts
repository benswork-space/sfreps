import type { ZipLookupEntry } from "./types";

// Client-side ZIP lookup for the API route
let cache: ZipLookupEntry[] | null = null;

export async function loadZipLookup(): Promise<ZipLookupEntry[]> {
  if (cache) return cache;
  const fs = await import("fs");
  const path = await import("path");
  const filePath = path.join(process.cwd(), "public", "data", "zip_lookup.json");
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    cache = JSON.parse(raw) as ZipLookupEntry[];
  } catch {
    cache = [];
  }
  return cache;
}

export async function resolveZip(zip: string): Promise<{
  district: number;
  supervisorId: string;
  ratio: number;
} | null> {
  const entries = (await loadZipLookup()).filter((e) => e.zip === zip);
  if (entries.length === 0) return null;
  const best = entries.reduce((a, b) => (a.ratio > b.ratio ? a : b));
  return {
    district: best.district,
    supervisorId: `district-${best.district}`,
    ratio: best.ratio,
  };
}

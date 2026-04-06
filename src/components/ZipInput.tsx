"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ZipEntry {
  zip: string;
  district: number;
  ratio: number;
}

interface ZipResult {
  zip: string;
  supervisorId: string;
  district: number;
  supervisorName: string;
  photoUrl: string | null;
}

interface ZipInputProps {
  onResult?: (result: ZipResult) => void;
}

export default function ZipInput({ onResult }: ZipInputProps) {
  const [zip, setZip] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [zipLookup, setZipLookup] = useState<ZipEntry[] | null>(null);
  const [supervisorNames, setSupervisorNames] = useState<Record<number, { name: string; photo_url: string }>>({});
  const router = useRouter();

  // Load ZIP lookup and supervisor index on mount
  useEffect(() => {
    fetch("/data/zip_lookup.json")
      .then((r) => r.json())
      .then((data) => setZipLookup(data))
      .catch(() => {});

    fetch("/data/supervisors_index.json")
      .then((r) => r.json())
      .then((data: Array<{ district: number; name: string }>) => {
        const map: Record<number, { name: string; photo_url: string }> = {};
        for (const sup of data) {
          map[sup.district] = { name: sup.name, photo_url: `/photos/district-${sup.district}.png` };
        }
        setSupervisorNames(map);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!/^\d{5}$/.test(zip)) {
        setError("Please enter a valid 5-digit ZIP code.");
        return;
      }

      if (!zipLookup) {
        setError("Loading data, please try again.");
        return;
      }

      setLoading(true);

      // Client-side ZIP lookup
      const matches = zipLookup.filter((entry) => entry.zip === zip);
      if (matches.length === 0) {
        setError("ZIP code not found. Please enter a San Francisco ZIP code (94xxx).");
        setLoading(false);
        return;
      }

      // Pick the district with the highest ratio
      const best = matches.reduce((a, b) => (a.ratio > b.ratio ? a : b));
      const supervisorId = `district-${best.district}`;
      const sup = supervisorNames[best.district];

      if (onResult) {
        onResult({
          zip,
          supervisorId,
          district: best.district,
          supervisorName: sup?.name ?? "Your Supervisor",
          photoUrl: sup?.photo_url ?? null,
        });
      } else {
        router.push(`/zip/${zip}/${supervisorId}`);
      }
    },
    [zip, router, onResult, zipLookup, supervisorNames]
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3 w-full max-w-xs">
      <div className="flex w-full rounded-full border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 overflow-hidden shadow-sm">
        <input
          id="zip-input"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={5}
          value={zip}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, "").slice(0, 5);
            setZip(val);
            if (error) setError(null);
          }}
          placeholder="Enter ZIP code"
          className="flex-1 min-w-0 h-12 px-5 text-base text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 bg-transparent focus:outline-none"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || zip.length !== 5}
          className="shrink-0 h-12 px-5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold text-sm transition-colors hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="inline-block animate-spin">&#8635;</span>
          ) : (
            "Go"
          )}
        </button>
      </div>
      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm text-center" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

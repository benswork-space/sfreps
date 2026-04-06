
import { useState, useEffect, type FormEvent } from "react";

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
  onResult: (result: ZipResult) => void;
}

export default function ZipInput({ onResult }: ZipInputProps) {
  const [zip, setZip] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [zipLookup, setZipLookup] = useState<ZipEntry[] | null>(null);
  const [supervisorNames, setSupervisorNames] = useState<Record<number, { name: string; photo_url: string }>>({});

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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = zip.trim();

    if (!/^\d{5}$/.test(trimmed)) {
      setError("Please enter a 5-digit ZIP code.");
      return;
    }

    if (!zipLookup) {
      setError("Loading data, please try again.");
      return;
    }

    setError("");
    setLoading(true);

    const matches = zipLookup.filter((entry) => entry.zip === trimmed);
    if (matches.length === 0) {
      setError("Couldn\u2019t find that ZIP code. Please enter a San Francisco ZIP (94xxx).");
      setLoading(false);
      return;
    }

    const best = matches.reduce((a, b) => (a.ratio > b.ratio ? a : b));
    const supervisorId = `district-${best.district}`;
    const sup = supervisorNames[best.district];

    onResult({
      zip: trimmed,
      supervisorId,
      district: best.district,
      supervisorName: sup?.name ?? "Your Supervisor",
      photoUrl: sup?.photo_url ?? null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3">
      <div className="flex w-full max-w-xs gap-2">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={5}
          placeholder="Enter ZIP code"
          value={zip}
          onChange={(e) => {
            setZip(e.target.value.replace(/\D/g, "").slice(0, 5));
            setError("");
          }}
          className="flex-1 rounded-full border border-zinc-300 bg-white px-5 py-3 text-center text-lg font-medium tracking-widest outline-none transition-colors placeholder:tracking-normal focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
          aria-label="ZIP code"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-zinc-900 px-6 py-3 font-medium text-white transition-colors hover:bg-zinc-800"
        >
          Go
        </button>
      </div>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

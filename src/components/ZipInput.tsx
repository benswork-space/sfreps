"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!/^\d{5}$/.test(zip)) {
        setError("Please enter a valid 5-digit ZIP code.");
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/zip-lookup/${zip}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "ZIP code not found.");
          setLoading(false);
          return;
        }

        if (onResult) {
          onResult({
            zip,
            supervisorId: data.supervisorId,
            district: data.district,
            supervisorName: data.supervisorName,
            photoUrl: data.photoUrl ?? null,
          });
        } else {
          router.push(`/zip/${zip}/${data.supervisorId}`);
        }
      } catch {
        setError("Something went wrong. Please try again.");
        setLoading(false);
      }
    },
    [zip, router, onResult]
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 w-full max-w-sm">
      <label htmlFor="zip-input" className="text-lg font-medium text-white">
        Enter your San Francisco ZIP code
      </label>
      <div className="flex w-full gap-2">
        <input
          id="zip-input"
          type="text"
          inputMode="numeric"
          pattern="\d{5}"
          maxLength={5}
          value={zip}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, "").slice(0, 5);
            setZip(val);
            if (error) setError(null);
          }}
          placeholder="94102"
          className="flex-1 h-14 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 px-4 text-center text-2xl font-mono text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
          autoFocus
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || zip.length !== 5}
          className="h-14 px-6 rounded-xl bg-white text-zinc-900 font-semibold text-lg transition-all hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="inline-block animate-spin">&#8635;</span>
          ) : (
            "Go"
          )}
        </button>
      </div>
      {error && (
        <p className="text-red-300 text-sm text-center" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

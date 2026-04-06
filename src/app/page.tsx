"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [zip, setZip] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{5}$/.test(zip)) { setError("Please enter a 5-digit ZIP code."); return; }
    router.push(`/zip/${zip}/district-6`);
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4 bg-white">
      <div className="relative z-20 w-full max-w-md text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-zinc-900">SF Supervisors</h1>
        <p className="mt-3 text-lg text-zinc-600">Get to know your supervisor.</p>
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col items-center gap-3">
          <div className="flex w-full max-w-xs gap-2">
            <input
              type="text" inputMode="numeric" maxLength={5}
              placeholder="Enter ZIP code" value={zip}
              onChange={(e) => { setZip(e.target.value.replace(/\D/g, "").slice(0, 5)); setError(""); }}
              className="flex-1 rounded-full border border-zinc-300 bg-white px-5 py-3 text-center text-lg"
            />
            <button type="submit" className="rounded-full bg-zinc-900 px-6 py-3 text-white">Go</button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      </div>
    </main>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import ZipInput from "./ZipInput";

const SFMap = dynamic(() => import("./SFMap"), { ssr: false });
const MapTransition = dynamic(() => import("./MapTransition"), { ssr: false });

interface TransitionData {
  zip: string;
  supervisorId: string;
  district: number;
  supervisorName: string;
  photoUrl: string | null;
}

export default function HomeContent() {
  const router = useRouter();
  const [transition, setTransition] = useState<TransitionData | null>(null);

  return (
    <>
      <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden">
        {/* Background map — no dark overlay */}
        <div className="absolute inset-0 z-0">
          <SFMap />
        </div>

        {/* Content overlay */}
        <main className="relative z-10 flex flex-col items-center gap-8 px-6 py-12 text-center">
          <div className="bg-black/50 backdrop-blur-md rounded-3xl px-8 py-10 flex flex-col items-center gap-6 max-w-md w-full">
            <div className="flex flex-col items-center gap-3">
              <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight drop-shadow-lg">
                SFReps
              </h1>
              <p className="text-lg sm:text-xl text-white/90 max-w-md leading-relaxed drop-shadow-md">
                See how your supervisor votes, who funds them, and whether they represent <em>you</em>.
              </p>
            </div>

            <ZipInput
              onResult={(result) => setTransition(result)}
            />

            <p className="text-sm text-white/60 max-w-sm">
              Enter your San Francisco ZIP code to see your district supervisor, their campaign donors,
              voting record, and how well they align with your neighborhood.
            </p>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 pb-6 text-xs text-white/60 drop-shadow-md">
          Data from SF Ethics Commission, Legistar, and SF Dept of Elections
        </footer>
      </div>

      {/* Map transition overlay — outside overflow-hidden container */}
      {transition && (
        <MapTransition
          district={transition.district}
          supervisorName={transition.supervisorName}
          photoUrl={transition.photoUrl}
          onComplete={() => {
            router.push(`/zip/${transition.zip}/${transition.supervisorId}`);
          }}
        />
      )}
    </>
  );
}

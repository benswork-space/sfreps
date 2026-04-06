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

  // When transition starts, the background map unmounts (transition is truthy
  // so showBgMap becomes false), ensuring only one WebGL context at a time.
  const showBgMap = !transition;

  return (
    <>
      <div className="relative flex flex-col items-center justify-center min-h-[100dvh] overflow-hidden">
        {/* Background map — unmounts when transition starts */}
        <div className="absolute inset-0 z-0">
          {showBgMap ? (
            <SFMap />
          ) : (
            <div className="w-full h-full bg-zinc-200 dark:bg-zinc-900" />
          )}
        </div>

        {/* Content overlay */}
        <main className="relative z-10 flex flex-col items-center px-4 sm:px-6 py-6 sm:py-12 text-center w-full">
          <div className="bg-black/50 backdrop-blur-md rounded-2xl sm:rounded-3xl px-5 sm:px-8 py-6 sm:py-10 flex flex-col items-center gap-4 sm:gap-6 max-w-md w-full">
            <div className="flex flex-col items-center gap-2 sm:gap-3">
              <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight drop-shadow-lg">
                SF Supervisors
              </h1>
              <p className="text-base sm:text-xl text-white/90 max-w-sm leading-relaxed drop-shadow-md">
                Get to know your supervisor: who funds them, how they vote, and whether they represent you.
              </p>
            </div>

            <ZipInput onResult={(result) => setTransition(result)} />

            <p className="text-xs sm:text-sm text-white/60 max-w-sm hidden sm:block">
              Enter your San Francisco ZIP code to see your district supervisor, their campaign donors,
              voting record, and how well they align with your neighborhood.
            </p>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 pb-4 sm:pb-6 text-[10px] sm:text-xs text-white/60 drop-shadow-md">
          Data from SF Ethics Commission, Legistar, and SF Dept of Elections
        </footer>
      </div>

      {/* Map transition overlay — background map is already destroyed */}
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

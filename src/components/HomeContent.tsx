"use client";

import { useState, useEffect } from "react";
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
  const [isMobile, setIsMobile] = useState(true); // default true to avoid flash

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  return (
    <>
      <div className="relative flex flex-col items-center justify-center min-h-[100dvh] overflow-hidden">
        {/* Background — static gradient on mobile, Mapbox on desktop */}
        <div className="absolute inset-0 z-0">
          {!isMobile && !transition ? (
            <SFMap />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-sky-100 via-blue-50 to-emerald-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900" />
          )}
        </div>

        {/* Content overlay */}
        <main className="relative z-10 flex flex-col items-center px-4 sm:px-6 py-6 sm:py-12 text-center w-full">
          <div className="bg-zinc-800/80 sm:bg-black/50 sm:backdrop-blur-md rounded-2xl sm:rounded-3xl px-5 sm:px-8 py-6 sm:py-10 flex flex-col items-center gap-4 sm:gap-6 max-w-md w-full">
            <div className="flex flex-col items-center gap-2 sm:gap-3">
              <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight">
                SF Supervisors
              </h1>
              <p className="text-base sm:text-xl text-white/90 max-w-sm leading-relaxed">
                Get to know your supervisor: who funds them, how they vote, and whether they represent you.
              </p>
            </div>

            <ZipInput onResult={(result) => {
              if (isMobile) {
                router.push(`/zip/${result.zip}/${result.supervisorId}`);
              } else {
                setTransition(result);
              }
            }} />

            <p className="text-xs sm:text-sm text-white/60 max-w-sm hidden sm:block">
              Enter your San Francisco ZIP code to see your district supervisor, their campaign donors,
              voting record, and how well they align with your neighborhood.
            </p>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 pb-4 sm:pb-6 text-[10px] sm:text-xs text-white/60">
          Data from SF Ethics Commission, Legistar, and SF Dept of Elections
        </footer>
      </div>

      {/* Map transition — desktop only */}
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

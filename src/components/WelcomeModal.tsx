"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "sfreps-welcome-dismissed";

export default function WelcomeModal() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show once per browser
    if (typeof window !== "undefined" && !localStorage.getItem(STORAGE_KEY)) {
      setShow(true);
    }
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(STORAGE_KEY, "1");
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Welcome to SFReps
        </h2>

        <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          <p>
            SFReps shows you how your San Francisco supervisor votes, who funds their
            campaigns, and whether they represent <em>your</em> district.
          </p>

          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5 shrink-0">&#9679;</span>
              <span><strong className="text-zinc-900 dark:text-zinc-100">Campaign Finance</strong> — See who funds your supervisor and which industries contribute the most.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5 shrink-0">&#9679;</span>
              <span><strong className="text-zinc-900 dark:text-zinc-100">Donor Alignment</strong> — How often does your supervisor vote in line with their top donors&apos; interests?</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5 shrink-0">&#9679;</span>
              <span><strong className="text-zinc-900 dark:text-zinc-100">District Alignment</strong> — Compare your supervisor&apos;s positions to how your district actually voted on ballot measures, using real election data.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-500 mt-0.5 shrink-0">&#9679;</span>
              <span><strong className="text-zinc-900 dark:text-zinc-100">Conflict Detection</strong> — Cases where your supervisor voted against your district but in line with their donors are flagged.</span>
            </div>
          </div>

          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            All data comes from public sources: SF Ethics Commission, Legistar, and the SF
            Department of Elections.{" "}
            <a href="/methodology" className="underline">Learn more</a>
          </p>
        </div>

        <button
          onClick={dismiss}
          className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}

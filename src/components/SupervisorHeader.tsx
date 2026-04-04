"use client";

import { useState } from "react";
import type { SupervisorData } from "@/lib/types";
import { districtLabel } from "@/lib/format";

interface Props {
  supervisor: SupervisorData;
  neighborhoods: string[];
}

export default function SupervisorHeader({ supervisor, neighborhoods }: Props) {
  const [imgError, setImgError] = useState(false);
  const initials = supervisor.name
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
      <div className="flex items-start gap-5">
        {/* Photo */}
        <div className="shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          {!imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={supervisor.photo_url}
              alt={supervisor.name}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {initials}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 truncate">
            {supervisor.name}
          </h1>
          <p className="text-blue-600 dark:text-blue-400 font-medium">
            {districtLabel(supervisor.district)} Supervisor
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            In office since {new Date(supervisor.serving_since).getFullYear()} &middot;{" "}
            {supervisor.years_in_office} years
          </p>
          {neighborhoods.length > 0 && (
            <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1 truncate">
              {neighborhoods.join(", ")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

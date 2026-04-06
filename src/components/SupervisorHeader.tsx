
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
    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-zinc-200">
      <div className="flex items-start gap-3 sm:gap-5">
        {/* Photo */}
        <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-blue-100 flex items-center justify-center">
          {!imgError ? (
            
            <img
              src={supervisor.photo_url}
              alt={supervisor.name}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="text-xl sm:text-2xl font-bold text-blue-600">
              {initials}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 truncate">
            {supervisor.name}
          </h1>
          <p className="text-sm sm:text-base text-blue-600 font-medium">
            {districtLabel(supervisor.district)} Supervisor
          </p>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            In office since {new Date(supervisor.serving_since).getFullYear()} &middot;{" "}
            {supervisor.years_in_office} years
          </p>
          {neighborhoods.length > 0 && (
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 line-clamp-2 sm:truncate">
              {neighborhoods.join(", ")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

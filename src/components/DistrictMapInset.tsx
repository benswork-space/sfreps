"use client";

import dynamic from "next/dynamic";

const SFMap = dynamic(() => import("./SFMap"), { ssr: false });

interface Props {
  district: number;
}

export default function DistrictMapInset({ district }: Props) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm border border-zinc-200 dark:border-zinc-800 h-[200px] md:h-full relative">
      <SFMap highlightDistrict={district} />
      <div className="absolute bottom-2 left-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-md px-2 py-0.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
        District {district}
      </div>
    </div>
  );
}

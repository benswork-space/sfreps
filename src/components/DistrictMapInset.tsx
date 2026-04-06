
import { useState, useEffect, lazy, Suspense } from "react";

const SFMap = lazy(() => import("./SFMap"));

interface Props {
  district: number;
}

export default function DistrictMapInset({ district }: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only load the map on desktop-sized screens
    if (window.innerWidth >= 768) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm border border-zinc-200 dark:border-zinc-800 h-full min-h-[200px] relative">
      <Suspense fallback={<div className="w-full h-full bg-zinc-100 dark:bg-zinc-900" />}>
        <SFMap highlightDistrict={district} />
      </Suspense>
      <div className="absolute bottom-2 left-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-md px-2 py-0.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
        District {district}
      </div>
    </div>
  );
}

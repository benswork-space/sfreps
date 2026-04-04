"use client";

import { useRouter } from "next/navigation";

export default function BackToSearch() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/")}
      className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
    >
      <span>&larr;</span>
      <span>New search</span>
    </button>
  );
}

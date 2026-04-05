"use client";

import { useState } from "react";
import type { VoteRecord } from "@/lib/types";
import { POLICY_CATEGORIES } from "@/lib/types";
import { formatDate, voteColor } from "@/lib/format";
import ExpandableText from "./ExpandableText";

const INITIAL_SHOW = 10;

interface Props {
  votes: VoteRecord[];
}

export default function VotingSection({ votes }: Props) {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? votes : votes.slice(0, INITIAL_SHOW);

  return (
    <section className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
      <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">Recent Votes</h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
        Legislative voting record from the Board of Supervisors.
      </p>

      <div className="space-y-2">
        {displayed.map((v) => (
          <div
            key={v.id}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            {/* Vote badge */}
            <span
              className={`shrink-0 mt-0.5 w-12 text-center text-xs font-bold uppercase rounded-md py-1 ${voteColor(
                v.vote
              )} bg-zinc-100 dark:bg-zinc-800`}
            >
              {v.vote}
            </span>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-snug">
                <ExpandableText text={v.title} maxLength={120} />
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                {formatDate(v.date)}
                {v.category && ` · ${POLICY_CATEGORIES[v.category]?.label ?? v.category}`}
                {` · ${v.result}`}
                {v.type !== "other" && ` · ${v.type}`}
              </p>
            </div>

            {v.legistar_url && (
              <a
                href={v.legistar_url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400"
              >
                View
              </a>
            )}
          </div>
        ))}
      </div>

      {votes.length > INITIAL_SHOW && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-4 w-full text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
        >
          {showAll ? "Show fewer" : `Show all ${votes.length} votes`}
        </button>
      )}
    </section>
  );
}

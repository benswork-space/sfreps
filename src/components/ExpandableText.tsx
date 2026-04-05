"use client";

import { useState } from "react";

interface Props {
  text: string;
  maxLength?: number;
  className?: string;
}

export default function ExpandableText({ text, maxLength = 150, className = "" }: Props) {
  const [expanded, setExpanded] = useState(false);
  const needsTruncation = text.length > maxLength;

  // Don't offer "see more" if the full text itself looks truncated
  // (ends mid-word or mid-sentence, likely from data truncation)
  const looksComplete = /[.!?)"']$/.test(text.trimEnd());

  if (!needsTruncation) {
    return <span className={className}>{text}</span>;
  }

  if (expanded || !looksComplete) {
    // Show the full text we have. If the text looks incomplete,
    // don't offer a toggle since there's nothing more to show.
    return <span className={className}>{text}</span>;
  }

  // Find a good break point near maxLength (at a word boundary)
  let breakAt = maxLength;
  const spaceIndex = text.lastIndexOf(" ", maxLength);
  if (spaceIndex > maxLength * 0.7) {
    breakAt = spaceIndex;
  }

  return (
    <span className={className}>
      {text.slice(0, breakAt).trimEnd()}&hellip;{" "}
      <button
        onClick={() => setExpanded(true)}
        className="text-blue-600 dark:text-blue-400 hover:underline text-xs font-medium"
      >
        see more
      </button>
    </span>
  );
}

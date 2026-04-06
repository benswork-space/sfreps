
import { useState } from "react";

interface Props {
  supervisorName: string;
  district: number;
}

export default function ShareButton({ supervisorName, district }: Props) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = `See how District ${district} Supervisor ${supervisorName} votes, who funds them, and whether they represent their district — SFReps`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "SFReps", text, url });
        return;
      } catch {
        // User cancelled or share failed, fall through to clipboard
      }
    }

    // Fallback: copy URL to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard failed
    }
  };

  return (
    <button
      onClick={handleShare}
      className="text-xs px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition-colors"
      title="Share this page"
    >
      {copied ? "Copied!" : "Share"}
    </button>
  );
}

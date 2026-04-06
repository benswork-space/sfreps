export function formatMoney(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

export function formatMoneyFull(amount: number): string {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatPercent(pct: number): string {
  return `${Math.round(pct)}%`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function districtLabel(district: number): string {
  return `District ${district}`;
}

export function voteColor(vote: string): string {
  switch (vote) {
    case "yea":
      return "text-green-600";
    case "nay":
      return "text-red-600";
    case "absent":
    case "excused":
      return "text-zinc-400";
    default:
      return "text-zinc-600";
  }
}

export function alignmentColor(pct: number): string {
  if (pct >= 70) return "text-green-600";
  if (pct >= 40) return "text-amber-600";
  return "text-red-600";
}

export function alignmentBgColor(pct: number): string {
  if (pct >= 70) return "bg-green-100";
  if (pct >= 40) return "bg-amber-100";
  return "bg-red-100";
}

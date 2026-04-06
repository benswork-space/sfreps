
interface Props {
  pct: number; // 0-100
  leftLabel?: string;
  rightLabel?: string;
}

/**
 * Gradient alignment slider matching the reference project's design.
 * Green (0% / less aligned) → Yellow/Gold (100% / more aligned).
 * A triangle marker indicates the current alignment percentage.
 */
export default function AlignmentSlider({ pct, leftLabel = "Less aligned", rightLabel = "More aligned" }: Props) {
  const clampedPct = Math.max(0, Math.min(100, pct));

  return (
    <div className="w-full">
      {/* Percentage + triangle marker */}
      <div className="relative h-8 mb-1">
        <div
          className="absolute flex flex-col items-center -translate-x-1/2"
          style={{ left: `${clampedPct}%` }}
        >
          <span className="text-lg font-bold text-zinc-900">
            {Math.round(clampedPct)}%
          </span>
          <span className="text-[10px] leading-none text-zinc-500 -mt-0.5">
            &#9660;
          </span>
        </div>
      </div>

      {/* Gradient bar */}
      <div
        className="h-3 rounded-full w-full"
        style={{
          background: "linear-gradient(to right, #22c55e, #84cc16, #eab308)",
        }}
      />

      {/* Labels */}
      <div className="flex justify-between mt-1.5">
        <span className="text-xs text-zinc-400">{leftLabel}</span>
        <span className="text-xs text-zinc-400">{rightLabel}</span>
      </div>
    </div>
  );
}

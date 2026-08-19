import { BAND_HEX } from "@/lib/band-ui";
import type { Band } from "@/lib/types";

type ScoreDialProps = {
  score: number;
  band: Band;
  size?: "sm" | "lg";
};

export function ScoreDial({ score, band, size = "lg" }: ScoreDialProps) {
  const px = size === "sm" ? 56 : 132;
  const stroke = size === "sm" ? 5 : 8;
  const radius = (px - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const dash = (clamped / 100) * circumference;
  const color = BAND_HEX[band];
  const cx = px / 2;

  return (
    <div className="inline-flex flex-col items-center">
      <div className="relative" style={{ width: px, height: px }}>
        <svg
          width={px}
          height={px}
          viewBox={`0 0 ${px} ${px}`}
          aria-hidden="true"
          className="block"
        >
          <circle
            cx={cx}
            cy={cx}
            r={radius}
            fill="none"
            stroke="#1e2738"
            strokeWidth={stroke}
          />
          <circle
            cx={cx}
            cy={cx}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cx})`}
          />
        </svg>
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <span
            className={`tabular-nums text-ivory ${
              size === "sm"
                ? "text-sm font-medium"
                : "font-display text-3xl leading-none"
            }`}
          >
            {score}
          </span>
        </div>
      </div>
      <p
        className={`mt-1.5 uppercase tracking-[0.16em] ${
          size === "sm"
            ? "text-[9px] text-ink-faint"
            : "text-[11px] text-ink-muted"
        }`}
      >
        {band}
      </p>
    </div>
  );
}

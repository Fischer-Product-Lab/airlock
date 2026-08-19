import { SealChip } from "@/components/SealChip";
import type { Band } from "@/lib/types";

const BANDS: Band[] = ["Sealed", "Conditional", "Leaking", "Stopped"];

const GLOSS: Record<Band, string> = {
  Sealed: "May start",
  Conditional: "May start, capped",
  Leaking: "Do not start",
  Stopped: "Already stopped",
};

export function BandKey() {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {BANDS.map((band) => (
        <li key={band} className="flex items-center gap-2">
          <SealChip band={band} size="sm" />
          <span className="text-[11px] text-ink-faint">{GLOSS[band]}</span>
        </li>
      ))}
    </ul>
  );
}

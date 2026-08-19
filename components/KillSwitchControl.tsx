import { Octagon } from "lucide-react";
import type { KillSwitchState } from "@/lib/types";
import { titleCase } from "@/lib/format";

const FACE: Record<KillSwitchState, string> = {
  armed:
    "border-sealed/60 bg-sealed/10 text-sealed",
  fired: "border-danger/50 bg-danger/10 text-danger",
  missing: "border-hairline-strong bg-canvas text-ink-faint",
};

export function KillSwitchControl({ state }: { state: KillSwitchState }) {
  const label = titleCase(state);

  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-faint">
        Kill switch
      </p>
      <button
        type="button"
        disabled
        aria-disabled="true"
        title="Disabled in the public demo."
        aria-label={`Kill switch ${label}. Disabled in the public demo.`}
        className={`mt-3 flex w-full cursor-not-allowed items-center justify-center gap-3 rounded-lg border px-4 py-3 ${FACE[state]}`}
      >
        <Octagon className="size-5 shrink-0" strokeWidth={1.5} />
        <span className="text-left">
          <span className="block text-[10px] uppercase tracking-[0.18em] opacity-70">
            Kill switch
          </span>
          <span className="font-display text-xl leading-tight">{label}</span>
        </span>
      </button>
      <p className="mt-2 text-xs text-ink-faint">Disabled in the public demo.</p>
    </div>
  );
}

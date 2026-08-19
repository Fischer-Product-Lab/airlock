import { SealChip } from "@/components/SealChip";
import { evaluateCell, killSwitchAt } from "@/lib/containment";
import { formatUtc, titleCase } from "@/lib/format";
import type { Cell } from "@/lib/types";

export function CellTimeline({ cell }: { cell: Cell }) {
  const events = cell.timeline;
  if (!events || events.length === 0) return null;

  return (
    <section>
      <h2 className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-faint">
        Timeline
      </h2>
      <ol className="mt-3 space-y-3">
        {events.map((event) => {
          const at = new Date(event.at);
          const verdict = evaluateCell(cell, at);
          const kill = killSwitchAt(cell, at);
          return (
            <li
              key={`${event.at}-${event.label}`}
              className="rounded-lg border border-hairline bg-canvas px-3 py-2.5"
            >
              <p className="text-sm text-ivory">{event.label}</p>
              <p className="mt-1 text-xs tabular-nums text-ink-faint">
                {formatUtc(event.at)}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-ink-muted">
                  Kill switch {titleCase(kill)}
                </span>
                <SealChip band={verdict.band} size="sm" />
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

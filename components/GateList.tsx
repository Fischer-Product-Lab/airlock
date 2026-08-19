import type { GateResult } from "@/lib/types";

type GateListProps = {
  gates: GateResult[];
};

export function GateList({ gates }: GateListProps) {
  return (
    <ol className="space-y-2.5">
      {gates.map((gate) => {
        if (gate.passed) {
          return (
            <li
              key={gate.id}
              className="flex gap-3 border-l border-hairline pl-3 text-ink-faint"
            >
              <span className="w-14 shrink-0 font-mono text-[10px] uppercase tracking-wider">
                {gate.id}
              </span>
              <span className="text-xs">{gate.name}</span>
            </li>
          );
        }

        return (
          <li
            key={gate.id}
            className="border-l border-danger/50 bg-danger/[0.04] py-2 pl-3 pr-2"
          >
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-danger">
                {gate.id}
              </span>
              <span className="text-sm text-ivory">{gate.name}</span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
              {gate.reason}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

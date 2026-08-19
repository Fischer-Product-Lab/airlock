import type { Cell, ToolReach } from "@/lib/types";

const REACH_ORDER: ToolReach[] = ["allowlisted", "unknown", "drifted"];

const REACH_LABEL: Record<ToolReach, string> = {
  allowlisted: "Allowlisted",
  unknown: "Unknown",
  drifted: "Drifted",
};

export function ToolsPanel({ cell }: { cell: Cell }) {
  const tools = cell.tools;

  return (
    <section>
      <h2 className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-faint">
        Tools this cell can reach
      </h2>
      {!tools || tools.length === 0 ? (
        <p className="mt-3 text-sm text-ink-muted">No tool inventory recorded.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {REACH_ORDER.map((reach) => {
            const group = tools.filter((tool) => tool.reach === reach);
            if (group.length === 0) return null;
            return (
              <li key={reach}>
                <p className="text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                  {REACH_LABEL[reach]}
                </p>
                <ul className="mt-1 space-y-0.5">
                  {group.map((tool) => (
                    <li
                      key={tool.name}
                      className="font-mono text-xs text-ivory"
                    >
                      {tool.name}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

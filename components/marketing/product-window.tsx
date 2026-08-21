import { GateList } from "@/components/GateList";
import { ScoreDial } from "@/components/ScoreDial";
import { SealChip } from "@/components/SealChip";
import { cellById } from "@/data/cells";
import { evaluateCell } from "@/lib/containment";

const CELL_ID = "cell-s1-open-prompt";

const DESKS = [
  "Why Airlock",
  "Range board",
  "Collision desk",
  "Incident strip",
  "Harness scorecard",
] as const;

/**
 * Faithful in-page chrome of Scene 1 — the real cell, the real engine,
 * the real leaking verdict. Not a generic dashboard.
 */
export function ProductWindow() {
  const cell = cellById(CELL_ID);
  if (!cell) return null;

  const verdict = evaluateCell(cell);

  return (
    <div className="product-window overflow-hidden rounded-xl bg-canvas font-sans text-ink">
      <div className="flex items-center gap-3 border-b border-hairline bg-surface px-3 py-2.5">
        <div className="flex items-center gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-ivory/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-ivory/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-ivory/15" />
        </div>
        <div className="mx-auto flex h-7 max-w-md flex-1 items-center justify-center rounded-md border border-hairline bg-canvas px-3 font-mono text-[11px] tracking-normal text-ink-faint">
          airlock · cells / {cell.id}
        </div>
      </div>

      <div className="flex min-h-[28rem] bg-canvas">
        <aside className="hidden w-44 shrink-0 border-r border-hairline bg-surface p-3 sm:block">
          <div className="flex items-start gap-2 px-1 py-1">
            <AirlockMark />
            <span className="flex flex-col leading-tight">
              <span className="font-display text-lg leading-none text-ivory">
                Airlock
              </span>
              <span className="mt-1 text-[9px] uppercase tracking-[0.16em] text-ink-faint">
                FPL
              </span>
            </span>
          </div>
          <div className="mt-4 px-1 text-[9px] font-medium uppercase tracking-[0.16em] text-ink-faint">
            Desks
          </div>
          <ul className="mt-2 space-y-0.5 text-[12px]">
            {DESKS.map((label) => (
              <li
                key={label}
                className={`relative rounded-md px-2.5 py-1.5 ${
                  label === "Range board"
                    ? "bg-gold/10 text-ivory"
                    : "text-ink-muted"
                }`}
              >
                {label === "Range board" ? (
                  <span
                    className="absolute left-0 top-1/2 h-3.5 w-0.5 -translate-y-1/2 rounded-full bg-gold"
                    aria-hidden
                  />
                ) : null}
                {label}
              </li>
            ))}
          </ul>
        </aside>

        <div className="min-w-0 flex-1 space-y-4 p-4 sm:p-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-gold">
            Cell
          </p>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="font-display text-2xl tracking-tight text-ivory sm:text-3xl">
                {cell.name}
              </h3>
              <p className="mt-1.5 text-xs text-ink-faint">
                {cell.id}
                {cell.scene !== undefined ? ` · Scene ${cell.scene}` : ""}
                {" · "}
                Verdict computed at view time.
              </p>
            </div>
            <SealChip band={verdict.band} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(220px,260px)]">
            <section className="rounded-xl border border-hairline bg-surface p-4">
              <dl className="space-y-4">
                <Field label="Agent">
                  <p className="font-display text-lg text-ivory">
                    {cell.agent.name}
                  </p>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    {cell.agent.version}
                    <span className="text-ink-faint"> · safeguards </span>
                    {cell.agent.safeguards}
                  </p>
                </Field>
                <Field label="Harness">
                  <p className="text-ivory">{cell.harness.name}</p>
                  <p className="mt-0.5 text-sm text-ink-faint">
                    {cell.harness.kind}
                  </p>
                </Field>
                <Field label="Egress">
                  <p className="text-sm text-ivory">
                    Intended {cell.egress.intended}. Probed {cell.egress.probed}.
                  </p>
                  {cell.scope.promptClaimsNoInternet ? (
                    <p className="mt-1 text-xs text-ink-faint">
                      Prompt claims no internet.
                    </p>
                  ) : null}
                </Field>
                <Field label="IR owner">
                  <p className="text-ivory">{cell.irOwner ?? "—"}</p>
                </Field>
              </dl>
            </section>

            <section className="space-y-4 rounded-xl border border-hairline bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <ScoreDial score={verdict.score} band={verdict.band} />
                <SealChip band={verdict.band} size="sm" />
              </div>
              <div>
                <h4 className="mb-3 text-[11px] font-medium uppercase tracking-[0.16em] text-ink-faint">
                  Gates
                </h4>
                <GateList gates={verdict.gates} />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
        {label}
      </dt>
      <dd className="mt-1">{children}</dd>
    </div>
  );
}

function AirlockMark() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 28 28"
      aria-hidden="true"
      className="mt-0.5 shrink-0"
    >
      <circle
        cx="14"
        cy="14"
        r="11"
        fill="none"
        stroke="#c4a35a"
        strokeWidth="1.25"
      />
      <circle
        cx="14"
        cy="14"
        r="6.5"
        fill="rgba(196,163,90,0.12)"
        stroke="#c4a35a"
        strokeWidth="1.25"
      />
      <path
        d="M14 8.2v11.6M8.2 14h11.6"
        stroke="#c4a35a"
        strokeWidth="1.1"
        opacity="0.55"
      />
    </svg>
  );
}

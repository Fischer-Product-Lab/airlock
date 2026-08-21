import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { CellTimeline } from "@/components/CellTimeline";
import { EgressGraph } from "@/components/EgressGraph";
import { GateList } from "@/components/GateList";
import { KillSwitchControl } from "@/components/KillSwitchControl";
import { PageFooter } from "@/components/PageFooter";
import { ScoreDial } from "@/components/ScoreDial";
import { SealChip } from "@/components/SealChip";
import { ToolsPanel } from "@/components/ToolsPanel";
import { cellById, cells } from "@/data/cells";
import { gatedBandNote } from "@/lib/band-ui";
import { AS_OF, evaluateCell, killSwitchAt } from "@/lib/containment";
import { formatUtc } from "@/lib/format";
import type { Cell } from "@/lib/types";

export function generateStaticParams() {
  return cells.map((cell) => ({ id: cell.id }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const cell = cellById(id);
  if (!cell) return { title: "Cell" };
  return { title: cell.name };
}

export default async function CellPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cell = cellById(id);
  if (!cell) notFound();

  const verdict = evaluateCell(cell);
  const kill = killSwitchAt(cell, AS_OF);
  const craft = gatedBandNote(verdict, kill);

  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-gold">
        Cell
      </p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl tracking-tight text-ivory sm:text-4xl">
            {cell.name}
          </h1>
          <p className="mt-2 text-sm text-ink-faint">
            {cell.id}
            {cell.scene !== undefined ? ` · Scene ${cell.scene}` : ""}
            {" · "}
            Verdict as of {formatUtc(AS_OF)}. Computed at view time.
          </p>
        </div>
        <SealChip band={verdict.band} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(240px,280px)_minmax(0,1fr)_minmax(280px,340px)]">
        <section className="rounded-xl border border-hairline bg-surface p-5">
          <Identity cell={cell} />
        </section>

        <section className="rounded-xl border border-hairline bg-surface p-5">
          <h2 className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-faint">
            Egress
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Intended egress versus what the last probe saw.
          </p>
          <div className="mt-5">
            <EgressGraph cell={cell} />
          </div>
        </section>

        <section className="space-y-6 rounded-xl border border-hairline bg-surface p-5">
          <div className="flex items-start justify-between gap-4">
            <ScoreDial score={verdict.score} band={verdict.band} />
            <SealChip band={verdict.band} />
          </div>
          {craft ? (
            <p className="text-sm leading-relaxed text-conditional">{craft}</p>
          ) : (
            <p className="text-sm text-ink-faint">
              Score and gates agree on the band.
            </p>
          )}
          <div>
            <h2 className="mb-3 text-[11px] font-medium uppercase tracking-[0.16em] text-ink-faint">
              Gates
            </h2>
            <GateList gates={verdict.gates} />
          </div>
          <KillSwitchControl state={kill} />
          <ToolsPanel cell={cell} />
          <CellTimeline cell={cell} />
        </section>
      </div>

      <PageFooter />
    </div>
  );
}

function Identity({ cell }: { cell: Cell }) {
  return (
    <dl className="space-y-5">
      <Field label="Agent">
        <p className="font-display text-xl text-ivory">{cell.agent.name}</p>
        <p className="mt-1 text-sm text-ink-muted">
          {cell.agent.version}
          <span className="text-ink-faint"> · safeguards </span>
          {cell.agent.safeguards}
        </p>
      </Field>

      <Field label="Harness">
        <p className="text-ivory">{cell.harness.name}</p>
        <p className="mt-1 text-sm text-ink-faint">{cell.harness.kind}</p>
      </Field>

      <Field label="Written scope">
        <ScopeLine label="In-scope" values={cell.scope.inScopeNets} />
        <ScopeLine label="Out-of-scope" values={cell.scope.outOfScopeNets} />
        <ScopeLine label="Names" values={cell.scope.fictionalNames} />
        <p className="mt-2 text-xs text-ink-faint">
          {cell.scope.promptClaimsNoInternet
            ? "Prompt claims no internet."
            : "Prompt does not claim isolation."}
        </p>
      </Field>

      <Field label="Human sponsor">
        <p className="text-ivory">{cell.humanSponsor.name}</p>
        {cell.humanSponsor.role ? (
          <p className="mt-1 text-sm text-ink-faint">{cell.humanSponsor.role}</p>
        ) : null}
      </Field>

      <Field label="IR owner">
        {cell.irOwner ? (
          <p className="text-ivory">{cell.irOwner}</p>
        ) : (
          <p className="text-ink-faint">—</p>
        )}
      </Field>

      {cell.agentOpsInitiativeId || cell.productPulseInitiativeId ? (
        <Field label="Initiatives">
          <ul className="space-y-1.5 text-sm">
            {cell.agentOpsInitiativeId ? (
              <li>
                <Link
                  href={`/agentops/${cell.agentOpsInitiativeId}`}
                  className="text-data underline-offset-4 hover:underline"
                >
                  AgentOps initiative {cell.agentOpsInitiativeId}
                </Link>
              </li>
            ) : null}
            {cell.productPulseInitiativeId ? (
              <li>
                <Link
                  href={`/productpulse/${cell.productPulseInitiativeId}`}
                  className="text-data underline-offset-4 hover:underline"
                >
                  ProductPulse initiative {cell.productPulseInitiativeId}
                </Link>
              </li>
            ) : null}
          </ul>
        </Field>
      ) : null}
    </dl>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
        {label}
      </dt>
      <dd className="mt-1.5">{children}</dd>
    </div>
  );
}

function ScopeLine({ label, values }: { label: string; values: string[] }) {
  return (
    <p className="text-sm leading-relaxed">
      <span className="text-ink-faint">{label} </span>
      <span className="font-mono text-xs text-ivory">
        {values.length > 0 ? values.join(", ") : "—"}
      </span>
    </p>
  );
}

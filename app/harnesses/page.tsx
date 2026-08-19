import type { Metadata } from "next";
import Link from "next/link";
import { PageFooter } from "@/components/PageFooter";
import { SealChip } from "@/components/SealChip";
import { PELLUCID_RANGE_VENDOR_ID } from "@/data/harnesses";
import { formatAge, titleCase } from "@/lib/format";
import {
  harnessScorecards,
  thirdPartyConcentration,
} from "@/lib/harness-scorecard";
import type { HarnessCard } from "@/lib/harness-scorecard";

export const metadata: Metadata = {
  title: "Harness scorecard",
  description:
    "Internal range versus named third parties. Concentration is the supply-chain risk.",
};

export default function HarnessesPage() {
  const scorecards = harnessScorecards();
  const cards = scorecards.filter((card) => card.cells.length > 0);
  const concentration = thirdPartyConcentration(scorecards);

  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-gold">
        Harness
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight text-ivory">
        Harness scorecard
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-muted">
        Internal range versus named third parties. The risk is one evaluator
        used by several labs. The vendor names here are fictional.
      </p>
      {concentration ? (
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-conditional">
          {concentration}.
        </p>
      ) : null}

      <ul className="mt-10 space-y-6">
        {cards.map((card) => (
          <li key={card.vendorId}>
            <HarnessPanel card={card} />
          </li>
        ))}
      </ul>

      <PageFooter />
    </div>
  );
}

function HarnessPanel({ card }: { card: HarnessCard }) {
  const pellucid = card.vendorId === PELLUCID_RANGE_VENDOR_ID;
  const empty = card.cells.length === 0;

  return (
    <article
      className={`rounded-xl border bg-surface px-5 py-6 sm:px-6 ${
        pellucid ? "border-gold/40" : "border-hairline"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
            {titleCase(card.kind)}
            {card.kind === "internal" ? " · default" : ""}
          </p>
          <h2 className="mt-1 font-display text-2xl text-ivory">{card.name}</h2>
        </div>
        <p className="text-sm text-ink-muted">
          <span className="font-display text-2xl tabular-nums text-ivory">
            {card.share.count}
          </span>
          <span className="ml-2 text-ink-faint">
            of {card.share.total} cells
          </span>
        </p>
      </div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <Meta
          label="Newest attestation"
          value={formatAge(card.newestAttestationAgeMs)}
        />
        <Meta
          label="Last isolation probe"
          value={formatAge(card.lastProbeAgeMs)}
        />
      </dl>

      {empty ? (
        <p className="mt-6 text-sm text-ink-faint">
          No cells sit on this bench.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
            <caption className="sr-only">
              Cells on {card.name}, with computed seal and GATE-7
            </caption>
            <thead>
              <tr className="border-b border-hairline text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                <th scope="col" className="py-2 pr-4 font-medium">
                  Cell
                </th>
                <th scope="col" className="py-2 pr-4 font-medium">
                  Seal
                </th>
                <th scope="col" className="py-2 pr-4 font-medium">
                  GATE-7
                </th>
                <th scope="col" className="py-2 font-medium">
                  Attestation
                </th>
              </tr>
            </thead>
            <tbody>
              {card.cells.map((cell) => (
                <tr
                  key={cell.id}
                  className="border-b border-hairline last:border-0"
                >
                  <th scope="row" className="py-3 pr-4 font-normal">
                    <Link
                      href={`/cells/${cell.id}`}
                      className="text-data underline-offset-4 hover:underline"
                    >
                      {cell.name}
                    </Link>
                  </th>
                  <td className="py-3 pr-4">
                    <SealChip band={cell.band} size="sm" />
                  </td>
                  <td className="py-3 pr-4 text-ink-muted">
                    {cell.gate7.passed ? (
                      <span className="text-sealed">Pass</span>
                    ) : (
                      <span className="text-conditional">Fail · Conditional</span>
                    )}
                  </td>
                  <td className="py-3 text-ink-muted">
                    {formatAge(cell.attestationAgeMs)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-ivory">{value}</dd>
    </div>
  );
}

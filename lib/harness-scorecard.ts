/**
 * Derived harness scorecard. Facts live on cells; this file only groups them.
 * Band, GATE-7, and ages are computed at asOf. Never stored.
 */

import { cells } from "@/data/cells";
import {
  harnesses,
  type HarnessCatalogEntry,
} from "@/data/harnesses";
import {
  AS_OF,
  attestationAgeMs,
  evaluateCell,
  probeAgeMs,
} from "./containment";
import type { Band, Cell, GateResult, HarnessKind } from "./types";

export type HarnessCellRef = {
  id: string;
  name: string;
  band: Band;
  gate7: GateResult;
  attestationAgeMs: number | null;
  probeAgeMs: number | null;
};

export type HarnessCard = {
  vendorId: string;
  name: string;
  kind: HarnessKind;
  cells: HarnessCellRef[];
  newestAttestationAgeMs: number | null;
  lastProbeAgeMs: number | null;
  share: { count: number; total: number };
};

const KIND_ORDER: Record<HarnessKind, number> = {
  internal: 0,
  "third-party": 1,
  unknown: 2,
};

function catalogKeyForCell(cell: Cell, catalog: HarnessCatalogEntry[]): string {
  if (cell.harness.vendorId) return cell.harness.vendorId;
  const byName = catalog.find((entry) => entry.name === cell.harness.name);
  return byName?.vendorId ?? cell.harness.name;
}

function minAge(ages: Array<number | null>): number | null {
  const known = ages.filter((age): age is number => age !== null);
  if (known.length === 0) return null;
  return Math.min(...known);
}

function requireGate7(cellId: string, gates: GateResult[]): GateResult {
  const gate = gates.find((item) => item.id === "GATE-7");
  if (!gate) {
    throw new Error(`evaluateCell must emit GATE-7 for ${cellId}`);
  }
  return gate;
}

export function harnessScorecards(
  catalog: HarnessCatalogEntry[] = harnesses,
  roster: Cell[] = cells,
  asOf: Date = AS_OF,
): HarnessCard[] {
  const total = roster.length;
  const grouped = new Map<string, Cell[]>();

  for (const cell of roster) {
    const key = catalogKeyForCell(cell, catalog);
    const list = grouped.get(key) ?? [];
    list.push(cell);
    grouped.set(key, list);
  }

  const cards: HarnessCard[] = catalog.map((entry) => {
    const members = grouped.get(entry.vendorId) ?? [];
    const refs: HarnessCellRef[] = members
      .map((cell) => {
        const verdict = evaluateCell(cell, asOf);
        return {
          id: cell.id,
          name: cell.name,
          band: verdict.band,
          gate7: requireGate7(cell.id, verdict.gates),
          attestationAgeMs: attestationAgeMs(cell, asOf),
          probeAgeMs: probeAgeMs(cell, asOf),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      vendorId: entry.vendorId,
      name: entry.name,
      kind: entry.kind,
      cells: refs,
      newestAttestationAgeMs: minAge(refs.map((ref) => ref.attestationAgeMs)),
      lastProbeAgeMs: minAge(refs.map((ref) => ref.probeAgeMs)),
      share: { count: refs.length, total },
    };
  });

  return cards.sort((a, b) => {
    const kind = KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
    if (kind !== 0) return kind;
    return a.name.localeCompare(b.name);
  });
}

/** Plain-language concentration line for the largest third-party bench. */
export function thirdPartyConcentration(cards: HarnessCard[]): string | null {
  const parties = cards.filter(
    (card) => card.kind === "third-party" && card.cells.length > 0,
  );
  if (parties.length === 0) return null;
  const top = parties.reduce((best, card) =>
    card.cells.length > best.cells.length ? card : best,
  );
  return `${top.share.count} of ${top.share.total} cells sit on one third-party range`;
}

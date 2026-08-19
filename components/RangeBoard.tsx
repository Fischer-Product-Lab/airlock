"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BandKey } from "@/components/BandKey";
import { PageFooter } from "@/components/PageFooter";
import { ScoreDial } from "@/components/ScoreDial";
import { SealChip } from "@/components/SealChip";
import { bandBoardRank, isStartAllowed } from "@/lib/band-ui";
import type { Band, SceneId } from "@/lib/types";

export type RangeRow = {
  id: string;
  name: string;
  scene?: SceneId;
  agentName: string;
  agentVersion: string;
  harnessName: string;
  sponsorName: string;
  irOwner: string | null;
  band: Band;
  score: number;
};

const EMPTY = "";

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function sortRows(rows: RangeRow[]): RangeRow[] {
  return [...rows].sort((a, b) => {
    const rank = bandBoardRank(a.band) - bandBoardRank(b.band);
    if (rank !== 0) return rank;
    if (a.score !== b.score) return a.score - b.score;
    return a.name.localeCompare(b.name);
  });
}

export function RangeBoard({
  rows,
  frozenClock,
}: {
  rows: RangeRow[];
  frozenClock: string;
}) {
  const [harness, setHarness] = useState(EMPTY);
  const [agent, setAgent] = useState(EMPTY);
  const [sponsor, setSponsor] = useState(EMPTY);

  const harnesses = useMemo(
    () => uniqueSorted(rows.map((row) => row.harnessName)),
    [rows],
  );
  const agents = useMemo(
    () => uniqueSorted(rows.map((row) => row.agentName)),
    [rows],
  );
  const sponsors = useMemo(
    () => uniqueSorted(rows.map((row) => row.sponsorName)),
    [rows],
  );

  const counts = useMemo(() => {
    const tally: Record<Band, number> = {
      Sealed: 0,
      Conditional: 0,
      Leaking: 0,
      Stopped: 0,
    };
    for (const row of rows) tally[row.band] += 1;
    return tally;
  }, [rows]);

  const allowed = counts.Sealed + counts.Conditional;

  const filtered = useMemo(() => {
    return sortRows(
      rows.filter((row) => {
        if (harness && row.harnessName !== harness) return false;
        if (agent && row.agentName !== agent) return false;
        if (sponsor && row.sponsorName !== sponsor) return false;
        return true;
      }),
    );
  }, [rows, harness, agent, sponsor]);

  const filtering = harness !== EMPTY || agent !== EMPTY || sponsor !== EMPTY;

  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-gold">
        Range
      </p>

      <h1 className="mt-3">
        <span className="block font-display text-7xl leading-none tracking-tight text-ivory sm:text-8xl">
          {allowed}
        </span>
        <span className="mt-4 block max-w-xl text-lg text-ink-muted sm:text-xl">
          cells that would have been allowed to start today
        </span>
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-faint">
        Sealed or Conditional as of {frozenClock}. A prompt that says the
        cell is isolated is not a control.
      </p>

      <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ["Sealed", counts.Sealed],
            ["Conditional", counts.Conditional],
            ["Leaking", counts.Leaking],
            ["Stopped", counts.Stopped],
          ] as const
        ).map(([band, count]) => (
          <li
            key={band}
            className="rounded-xl border border-hairline bg-surface px-4 py-3"
          >
            <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
              {band}
            </p>
            <p className="mt-1 font-display text-2xl tabular-nums text-ivory">
              {count}
            </p>
            <p className="mt-1 text-[11px] text-ink-faint">
              {isStartAllowed(band) ? "May start" : "Would not start"}
            </p>
          </li>
        ))}
      </ul>

      <section className="mt-10 rounded-xl border border-hairline bg-surface p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid flex-1 gap-3 sm:grid-cols-3">
            <FilterSelect
              id="filter-harness"
              label="Harness"
              value={harness}
              onChange={setHarness}
              options={harnesses}
            />
            <FilterSelect
              id="filter-agent"
              label="Model / agent"
              value={agent}
              onChange={setAgent}
              options={agents}
            />
            <FilterSelect
              id="filter-sponsor"
              label="Sponsor"
              value={sponsor}
              onChange={setSponsor}
              options={sponsors}
            />
          </div>
          {filtering ? (
            <button
              type="button"
              className="self-start text-xs text-ink-muted underline-offset-4 hover:text-ivory hover:underline"
              onClick={() => {
                setHarness(EMPTY);
                setAgent(EMPTY);
                setSponsor(EMPTY);
              }}
            >
              Clear filters
            </button>
          ) : null}
        </div>
        <div className="mt-4 border-t border-hairline pt-4">
          <BandKey />
        </div>
      </section>

      <p className="mt-6 text-xs text-ink-faint">
        {filtered.length} of {rows.length} cells
        {filtering ? " matching filters" : ""}
        . Leaking and Stopped listed first.
      </p>

      <div
        className="mt-3 hidden grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto_5.5rem] gap-x-4 px-4 text-[10px] uppercase tracking-[0.14em] text-ink-faint md:grid"
        aria-hidden="true"
      >
        <span>Cell</span>
        <span>Agent</span>
        <span>Harness</span>
        <span>Sponsor / IR</span>
        <span>Seal</span>
        <span className="text-right">Score</span>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-4 rounded-xl border border-hairline bg-surface px-4 py-8 text-sm text-ink-muted">
          No cells match these filters.
        </p>
      ) : (
        <ul className="mt-2 space-y-2">
          {filtered.map((row) => (
            <li key={row.id}>
              <Link
                href={`/cells/${row.id}`}
                className="relative grid grid-cols-1 items-center gap-3 overflow-hidden rounded-xl border border-hairline bg-surface px-4 py-3.5 transition-colors hover:border-hairline-strong hover:bg-surface-2 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto_5.5rem] md:gap-x-4"
              >
                <span
                  className={`absolute inset-y-0 left-0 w-0.5 ${bandRail(row.band)}`}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {row.scene !== undefined ? (
                      <span className="text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                        Scene {row.scene}
                      </span>
                    ) : null}
                    <span className="truncate text-sm text-ivory">{row.name}</span>
                  </div>
                </div>
                <div className="min-w-0 text-sm text-ink-muted">
                  <span className="text-ivory">{row.agentName}</span>
                  <span className="ml-1.5 text-ink-faint">{row.agentVersion}</span>
                </div>
                <div className="truncate text-sm text-ink-muted">
                  {row.harnessName}
                </div>
                <div className="min-w-0 text-sm text-ink-muted">
                  <p className="truncate">{row.sponsorName}</p>
                  <p className="truncate text-xs text-ink-faint">
                    IR {row.irOwner ?? "Unassigned"}
                  </p>
                </div>
                <SealChip band={row.band} size="sm" />
                <div className="flex justify-end">
                  <ScoreDial score={row.score} band={row.band} size="sm" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <PageFooter />
    </div>
  );
}

function bandRail(band: Band): string {
  if (band === "Sealed") return "bg-sealed";
  if (band === "Conditional") return "bg-conditional";
  if (band === "Stopped") return "bg-danger/50";
  return "bg-danger";
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
        {label}
      </span>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm text-ivory"
      >
        <option value={EMPTY}>All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

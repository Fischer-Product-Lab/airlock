"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageFooter } from "@/components/PageFooter";
import { SealChip } from "@/components/SealChip";
import {
  CONTRAST_IDENTIFIER,
  HERO_IDENTIFIER,
  isContrastCollision,
  isHeroCollision,
} from "@/lib/collisions";
import { titleCase } from "@/lib/format";
import type { Band, CollisionKind, CollisionResolution, SceneId } from "@/lib/types";

export type CollisionDeskRow = {
  value: string;
  kind: CollisionKind;
  resolution: CollisionResolution;
  mitigated: boolean;
  registryLabel: string;
  cellId: string;
  cellName: string;
  scene?: SceneId;
  band: Band;
};

const EMPTY = "";

const KINDS: CollisionKind[] = ["domain", "package", "repo", "org"];
const RESOLUTIONS: CollisionResolution[] = ["clean", "live", "unresolved"];

function mitigatedLabel(row: CollisionDeskRow): string {
  if (row.resolution !== "live") return "—";
  return row.mitigated ? "Yes" : "No";
}

export function CollisionDesk({ rows }: { rows: CollisionDeskRow[] }) {
  const [kind, setKind] = useState(EMPTY);
  const [resolution, setResolution] = useState(EMPTY);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (kind && row.kind !== kind) return false;
      if (resolution && row.resolution !== resolution) return false;
      return true;
    });
  }, [rows, kind, resolution]);

  const filtering = kind !== EMPTY || resolution !== EMPTY;
  const hero = filtered.find((row) => isHeroCollision(row));
  const contrast = filtered.find((row) => isContrastCollision(row));

  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-gold">
        Collision
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight text-ivory">
        Collision desk
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-muted">
        If a scenario name resolves, the cell is already on the public
        internet.
      </p>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-faint">
        DNS, package, source, and org results are stored on each identifier.
        Nothing is fetched at view time.
      </p>

      {hero ? (
        <aside className="relative mt-8 overflow-hidden rounded-xl border border-danger/40 bg-surface px-5 py-5">
          <span
            className="absolute inset-y-0 left-0 w-0.5 bg-danger"
            aria-hidden="true"
          />
          <p className="text-[10px] uppercase tracking-[0.16em] text-danger">
            Live registration
          </p>
          <p className="mt-2 font-mono text-xl text-ivory">{hero.value}</p>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted">
            The CTF used this as a fictional company. It is a registered
            domain.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <SealChip band={hero.band} size="sm" />
            <Link
              href={`/cells/${hero.cellId}`}
              className="text-sm text-data underline-offset-4 hover:underline"
            >
              {hero.cellName}
            </Link>
            {hero.scene !== undefined ? (
              <span className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">
                Scene {hero.scene}
              </span>
            ) : null}
          </div>
        </aside>
      ) : null}

      {contrast ? (
        <p className="mt-4 text-sm text-ink-faint">
          For comparison,{" "}
          <span className="font-mono text-ivory">{CONTRAST_IDENTIFIER}</span> is
          clean. It is a reserved test name and does not resolve.
        </p>
      ) : null}

      <section className="mt-8 rounded-xl border border-hairline bg-surface p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid flex-1 gap-3 sm:grid-cols-2">
            <FilterSelect
              id="filter-kind"
              label="Kind"
              value={kind}
              onChange={setKind}
              options={KINDS}
            />
            <FilterSelect
              id="filter-resolution"
              label="Resolution"
              value={resolution}
              onChange={setResolution}
              options={RESOLUTIONS}
            />
          </div>
          {filtering ? (
            <button
              type="button"
              className="self-start text-xs text-ink-muted underline-offset-4 hover:text-ivory hover:underline"
              onClick={() => {
                setKind(EMPTY);
                setResolution(EMPTY);
              }}
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </section>

      <p className="mt-6 text-xs text-ink-faint">
        {filtered.length} of {rows.length} identifiers
        {filtering ? " matching filters" : ""}. {HERO_IDENTIFIER} listed first.
      </p>

      <div className="mt-3 overflow-x-auto rounded-xl border border-hairline bg-surface">
        <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
          <caption className="sr-only">
            Collision identifiers across all cells, with synthetic registry
            resolution
          </caption>
          <thead>
            <tr className="border-b border-hairline text-[10px] uppercase tracking-[0.14em] text-ink-faint">
              <th scope="col" className="px-4 py-3 font-medium">
                Identifier
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Kind
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Registry
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Resolution
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Mitigated
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Cell
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Seal
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-ink-muted">
                  No identifiers match these filters.
                </td>
              </tr>
            ) : (
              filtered.map((row) => {
                const heroRow = isHeroCollision(row);
                const contrastRow = isContrastCollision(row);
                return (
                  <tr
                    key={`${row.cellId}:${row.kind}:${row.value}`}
                    className={`border-b border-hairline last:border-0 ${
                      heroRow
                        ? "bg-danger/[0.06]"
                        : contrastRow
                          ? "bg-conditional/[0.06]"
                          : ""
                    }`}
                  >
                    <th
                      scope="row"
                      className="px-4 py-3 font-mono text-xs font-normal text-ivory"
                    >
                      <span className="block">{row.value}</span>
                      {heroRow ? (
                        <span className="mt-1 block text-[10px] uppercase tracking-[0.14em] text-danger">
                          Live registration
                        </span>
                      ) : null}
                      {contrastRow ? (
                        <span className="mt-1 block text-[10px] uppercase tracking-[0.14em] text-conditional">
                          Clean contrast
                        </span>
                      ) : null}
                    </th>
                    <td className="px-4 py-3 text-ink-muted">{row.kind}</td>
                    <td className="px-4 py-3 text-ink-muted">
                      {row.registryLabel}
                    </td>
                    <td className="px-4 py-3">
                      <ResolutionMark resolution={row.resolution} />
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {mitigatedLabel(row)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/cells/${row.cellId}`}
                        className="text-data underline-offset-4 hover:underline"
                      >
                        {row.cellName}
                      </Link>
                      {row.scene !== undefined ? (
                        <span className="mt-1 block text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                          Scene {row.scene}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <SealChip band={row.band} size="sm" />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <PageFooter />
    </div>
  );
}

function ResolutionMark({ resolution }: { resolution: CollisionResolution }) {
  const tone =
    resolution === "clean"
      ? "text-sealed"
      : resolution === "live"
        ? "text-danger"
        : "text-conditional";
  return <span className={tone}>{resolution}</span>;
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
            {titleCase(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

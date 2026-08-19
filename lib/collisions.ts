/**
 * Flatten cell collision scans for the Collision desk.
 *
 * Pure: no I/O, no evaluateCell, no asOf. Band is computed by the page.
 * Registry labels are derived from kind. Never fetched.
 */

import type {
  Cell,
  CollisionKind,
  CollisionResolution,
  SceneId,
} from "./types";

export const HERO_IDENTIFIER = "harborline.com";
export const CONTRAST_IDENTIFIER = "northwind-ledger.test";

export type CollisionIndexRow = {
  value: string;
  kind: CollisionKind;
  resolution: CollisionResolution;
  mitigated: boolean;
  cellId: string;
  cellName: string;
  scene?: SceneId;
};

export function registryLabel(kind: CollisionKind): string {
  switch (kind) {
    case "domain":
      return "DNS";
    case "package":
      return "package registry";
    case "repo":
      return "source registry";
    case "org":
      return "org index";
  }
}

export function isHeroCollision(row: Pick<CollisionIndexRow, "value" | "resolution">): boolean {
  return row.value === HERO_IDENTIFIER && row.resolution === "live";
}

export function isContrastCollision(
  row: Pick<CollisionIndexRow, "value" | "resolution">,
): boolean {
  return row.value === CONTRAST_IDENTIFIER && row.resolution === "clean";
}

export function flattenCollisionScan(roster: Cell[]): CollisionIndexRow[] {
  const rows: CollisionIndexRow[] = [];
  for (const cell of roster) {
    for (const item of cell.collisionScan) {
      rows.push({
        value: item.value,
        kind: item.kind,
        resolution: item.resolution,
        mitigated: Boolean(item.mitigated),
        cellId: cell.id,
        cellName: cell.name,
        scene: cell.scene,
      });
    }
  }
  return rows;
}

function pinRank(row: CollisionIndexRow): number {
  if (isHeroCollision(row)) return 0;
  if (isContrastCollision(row)) return 1;
  return 2;
}

const RESOLUTION_RANK: Record<CollisionResolution, number> = {
  live: 0,
  unresolved: 1,
  clean: 2,
};

export function sortCollisionRows(rows: CollisionIndexRow[]): CollisionIndexRow[] {
  return [...rows].sort((a, b) => {
    const pin = pinRank(a) - pinRank(b);
    if (pin !== 0) return pin;
    const res = RESOLUTION_RANK[a.resolution] - RESOLUTION_RANK[b.resolution];
    if (res !== 0) return res;
    const kind = a.kind.localeCompare(b.kind);
    if (kind !== 0) return kind;
    const value = a.value.localeCompare(b.value);
    if (value !== 0) return value;
    return a.cellName.localeCompare(b.cellName);
  });
}

import { describe, expect, it } from "vitest";
import { cells } from "../data/cells";
import {
  CONTRAST_IDENTIFIER,
  flattenCollisionScan,
  HERO_IDENTIFIER,
  isContrastCollision,
  isHeroCollision,
  registryLabel,
  sortCollisionRows,
} from "./collisions";

describe("collision index", () => {
  it("flattens every identifier and derives registry labels without fetching", () => {
    const rows = flattenCollisionScan(cells);
    expect(rows.length).toBeGreaterThan(cells.length);
    expect(registryLabel("domain")).toBe("DNS");
    expect(registryLabel("package")).toBe("package registry");
    expect(registryLabel("repo")).toBe("source registry");
    expect(registryLabel("org")).toBe("org index");
    expect(rows.some((row) => row.kind === "package")).toBe(true);
    expect(rows.some((row) => row.kind === "repo")).toBe(true);
    expect(rows.some((row) => row.kind === "org")).toBe(true);
  });

  it("pins harborline.com live first and northwind-ledger.test as the clean contrast", () => {
    const sorted = sortCollisionRows(flattenCollisionScan(cells));
    const first = sorted[0];
    expect(first.value).toBe(HERO_IDENTIFIER);
    expect(first.resolution).toBe("live");
    expect(isHeroCollision(first)).toBe(true);

    const contrast = sorted.find((row) => isContrastCollision(row));
    expect(contrast).toBeDefined();
    expect(contrast!.value).toBe(CONTRAST_IDENTIFIER);
    expect(contrast!.resolution).toBe("clean");
    expect(sorted.findIndex((row) => isContrastCollision(row))).toBeGreaterThan(0);
  });
});

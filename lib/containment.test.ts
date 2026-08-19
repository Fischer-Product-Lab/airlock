import { describe, expect, it } from "vitest";
import { cellById, cells, sceneCells, SCENE3_CLOCK } from "../data/cells";
import { PELLUCID_RANGE_VENDOR_ID } from "../data/harnesses";
import {
  AS_OF,
  attestationAgeMs,
  bandForScore,
  evaluateCell,
  killSwitchAt,
  probeAgeMs,
} from "./containment";
import type { Cell, GateId, IsolationProbe } from "./types";

const FRESH_PROBE: IsolationProbe = {
  result: "pass",
  at: "2026-08-17T17:49:00.000Z",
};

function sealedCell(overrides: Partial<Cell> = {}): Cell {
  return {
    id: "synth-sealed",
    name: "Synthetic sealed",
    agent: { name: "Lampblack-2", version: "2.4.1", safeguards: "on" },
    harness: { kind: "internal", name: "Airlock Internal Harness" },
    scope: {
      inScopeNets: ["10.80.12.0/24"],
      outOfScopeNets: ["0.0.0.0/0"],
      fictionalNames: ["northwind-ledger.test"],
      promptClaimsNoInternet: false,
    },
    egress: { intended: "deny-default", probed: "deny-default" },
    lastIsolationProbe: FRESH_PROBE,
    credentialClass: "synthetic-scoped",
    humanSponsor: { name: "Helena Crowe", role: "Eval sponsor" },
    irOwner: "Marcus Quill",
    killSwitch: "armed",
    collisionScan: [
      { value: "northwind-ledger.test", kind: "domain", resolution: "clean" },
    ],
    internetAdjacent: false,
    elicitationTierApproved: false,
    ...overrides,
  };
}

function gate(verdict: ReturnType<typeof evaluateCell>, id: GateId) {
  const found = verdict.gates.find((item) => item.id === id);
  expect(found, `expected ${id} to be emitted`).toBeDefined();
  return found!;
}

function failedIds(cell: Cell, asOf?: Date): GateId[] {
  return evaluateCell(cell, asOf).failedGates.map((item) => item.id);
}

function requireCell(id: string): Cell {
  const cell = cellById(id);
  expect(cell, `fixture ${id} must exist`).toBeDefined();
  return cell!;
}

describe("bandForScore", () => {
  it("maps the published boundaries", () => {
    expect(bandForScore(85)).toBe("Sealed");
    expect(bandForScore(84)).toBe("Conditional");
    expect(bandForScore(65)).toBe("Conditional");
    expect(bandForScore(64)).toBe("Leaking");
    expect(bandForScore(45)).toBe("Leaking");
    expect(bandForScore(44)).toBe("Stopped");
  });
});

describe("helpers", () => {
  it("computes probe and attestation age from asOf, not Date.now", () => {
    const cell = sealedCell({
      lastIsolationProbe: { result: "pass", at: "2026-08-17T17:00:00.000Z" },
      harness: {
        kind: "third-party",
        name: "Pellucid Range",
        vendorId: PELLUCID_RANGE_VENDOR_ID,
        attestationSignedAt: "2026-08-16T18:00:00.000Z",
      },
    });
    expect(probeAgeMs(cell, AS_OF)).toBe(60 * 60 * 1000);
    expect(attestationAgeMs(cell, AS_OF)).toBe(24 * 60 * 60 * 1000);
    expect(probeAgeMs(sealedCell({ lastIsolationProbe: null }), AS_OF)).toBeNull();
  });

  it("resolves kill-switch state from the latest timeline mark at or before asOf", () => {
    const cell = requireCell("cell-s3-stale-probe");
    expect(killSwitchAt(cell, new Date(SCENE3_CLOCK.start))).toBe("armed");
    expect(killSwitchAt(cell, new Date(SCENE3_CLOCK.stale))).toBe("armed");
    expect(killSwitchAt(cell, new Date(SCENE3_CLOCK.killFired))).toBe("fired");
    expect(killSwitchAt(cell, AS_OF)).toBe("fired");
    expect(killSwitchAt(sealedCell({ killSwitch: "missing" }), AS_OF)).toBe(
      "missing",
    );
  });
});

describe("GATE-1 Prompt is not a control", () => {
  it("passes when the prompt does not claim isolation", () => {
    const verdict = evaluateCell(sealedCell());
    expect(gate(verdict, "GATE-1").passed).toBe(true);
  });

  it("passes when the prompt claims isolation and the probed path is deny-default", () => {
    const verdict = evaluateCell(
      sealedCell({
        scope: {
          inScopeNets: ["10.80.12.0/24"],
          outOfScopeNets: ["0.0.0.0/0"],
          fictionalNames: ["northwind-ledger.test"],
          promptClaimsNoInternet: true,
        },
      }),
    );
    expect(gate(verdict, "GATE-1").passed).toBe(true);
  });

  it("fails with cap-Leaking when the prompt claimed isolation and the path was open", () => {
    const verdict = evaluateCell(
      sealedCell({
        scope: {
          inScopeNets: ["10.80.12.0/24"],
          outOfScopeNets: ["0.0.0.0/0"],
          fictionalNames: ["northwind-ledger.test"],
          promptClaimsNoInternet: true,
        },
        egress: { intended: "deny-default", probed: "open" },
      }),
    );
    const g1 = gate(verdict, "GATE-1");
    expect(g1.passed).toBe(false);
    expect(g1.effect).toBe("cap-Leaking");
    expect(g1.reason.toLowerCase()).toMatch(/prompt claimed isolation/);
    expect(g1.reason.toLowerCase()).toMatch(/open\/unverified/);
  });

  it("fails when the prompt claimed isolation and the path was unverified", () => {
    const verdict = evaluateCell(
      sealedCell({
        scope: {
          inScopeNets: ["10.80.12.0/24"],
          outOfScopeNets: ["0.0.0.0/0"],
          fictionalNames: ["northwind-ledger.test"],
          promptClaimsNoInternet: true,
        },
        egress: { intended: "deny-default", probed: "unverified" },
      }),
    );
    expect(gate(verdict, "GATE-1").passed).toBe(false);
    expect(gate(verdict, "GATE-1").effect).toBe("cap-Leaking");
  });
});

describe("GATE-2 Collision", () => {
  it("passes when every identifier is clean, including northwind-ledger.test", () => {
    const verdict = evaluateCell(
      sealedCell({
        collisionScan: [
          { value: "northwind-ledger.test", kind: "domain", resolution: "clean" },
        ],
      }),
    );
    expect(gate(verdict, "GATE-2").passed).toBe(true);
    expect(verdict.band).toBe("Sealed");
  });

  it("fails with cap-Leaking on an unresolved identifier", () => {
    const verdict = evaluateCell(
      sealedCell({
        collisionScan: [
          { value: "ghost-org.example", kind: "org", resolution: "unresolved" },
        ],
      }),
    );
    expect(gate(verdict, "GATE-2").passed).toBe(false);
    expect(gate(verdict, "GATE-2").effect).toBe("cap-Leaking");
    expect(verdict.band).toBe("Leaking");
  });

  it("fails with cap-Leaking on a live unmitigated identifier", () => {
    const verdict = evaluateCell(
      sealedCell({
        collisionScan: [
          { value: "harborline.com", kind: "domain", resolution: "live" },
        ],
      }),
    );
    expect(gate(verdict, "GATE-2").passed).toBe(false);
    expect(gate(verdict, "GATE-2").effect).toBe("cap-Leaking");
  });

  it("fails with cap-Conditional on a live but mitigated identifier", () => {
    const verdict = evaluateCell(
      sealedCell({
        collisionScan: [
          {
            value: "harborline.com",
            kind: "domain",
            resolution: "live",
            mitigated: true,
          },
        ],
      }),
    );
    expect(gate(verdict, "GATE-2").passed).toBe(false);
    expect(gate(verdict, "GATE-2").effect).toBe("cap-Conditional");
    expect(verdict.band).toBe("Conditional");
  });
});

describe("GATE-3 No IR owner", () => {
  it("passes for a named person", () => {
    expect(gate(evaluateCell(sealedCell()), "GATE-3").passed).toBe(true);
  });

  it("fails with cap-Conditional when IR owner is null or blank", () => {
    expect(gate(evaluateCell(sealedCell({ irOwner: null })), "GATE-3")).toMatchObject(
      { passed: false, effect: "cap-Conditional" },
    );
    expect(gate(evaluateCell(sealedCell({ irOwner: "   " })), "GATE-3").passed).toBe(
      false,
    );
    expect(evaluateCell(sealedCell({ irOwner: null })).band).toBe("Conditional");
  });
});

describe("GATE-4 Isolation probe", () => {
  it("passes when the probe passed and is ≤ 24h old", () => {
    expect(gate(evaluateCell(sealedCell()), "GATE-4").passed).toBe(true);
  });

  it("fails with cap-Conditional when the probe is missing and not internet-adjacent", () => {
    const verdict = evaluateCell(
      sealedCell({ lastIsolationProbe: null, internetAdjacent: false }),
    );
    expect(gate(verdict, "GATE-4")).toMatchObject({
      passed: false,
      effect: "cap-Conditional",
    });
    expect(verdict.band).toBe("Conditional");
  });

  it("fails with cap-Conditional when the probe failed and not internet-adjacent", () => {
    const verdict = evaluateCell(
      sealedCell({
        lastIsolationProbe: { result: "fail", at: "2026-08-17T17:49:00.000Z" },
        internetAdjacent: false,
      }),
    );
    expect(gate(verdict, "GATE-4").effect).toBe("cap-Conditional");
  });

  it("fails with cap-Conditional when the probe is stale and not internet-adjacent", () => {
    const verdict = evaluateCell(
      sealedCell({
        lastIsolationProbe: { result: "pass", at: "2026-08-16T17:00:00.000Z" },
        internetAdjacent: false,
      }),
    );
    expect(gate(verdict, "GATE-4").effect).toBe("cap-Conditional");
  });

  it("raises to cap-Leaking when a stale/missing/failed probe is also internet-adjacent", () => {
    const stale = evaluateCell(
      sealedCell({
        lastIsolationProbe: { result: "pass", at: "2026-08-16T17:00:00.000Z" },
        internetAdjacent: true,
      }),
    );
    expect(gate(stale, "GATE-4").effect).toBe("cap-Leaking");
    expect(gate(stale, "GATE-4").reason).toContain(
      "stale probe caps Conditional; internet-adjacent raises to Leaking",
    );
    expect(stale.band).toBe("Leaking");

    const missing = evaluateCell(
      sealedCell({ lastIsolationProbe: null, internetAdjacent: true }),
    );
    expect(gate(missing, "GATE-4").effect).toBe("cap-Leaking");
  });
});

describe("GATE-5 Credentials", () => {
  it("passes for synthetic-scoped credentials", () => {
    expect(gate(evaluateCell(sealedCell()), "GATE-5").passed).toBe(true);
  });

  it("fails with cap-Leaking for inherited and god-mode", () => {
    const inherited = evaluateCell(sealedCell({ credentialClass: "inherited" }));
    const god = evaluateCell(sealedCell({ credentialClass: "god-mode" }));
    expect(gate(inherited, "GATE-5")).toMatchObject({
      passed: false,
      effect: "cap-Leaking",
    });
    expect(gate(god, "GATE-5")).toMatchObject({
      passed: false,
      effect: "cap-Leaking",
    });
    expect(inherited.band).toBe("Leaking");
    expect(god.band).toBe("Leaking");
  });
});

describe("GATE-6 Classifiers off", () => {
  it("passes when safeguards are on", () => {
    expect(gate(evaluateCell(sealedCell()), "GATE-6").passed).toBe(true);
  });

  it("passes for approved elicitation (off + tier + deny-default + armed)", () => {
    const verdict = evaluateCell(
      sealedCell({
        agent: { name: "Meridian-7", version: "7.0.2", safeguards: "off" },
        elicitationTierApproved: true,
      }),
    );
    expect(gate(verdict, "GATE-6").passed).toBe(true);
    expect(verdict.failedGates.map((item) => item.id)).not.toContain("GATE-6");
  });

  it("fails with cap-Leaking when safeguards are off without the full approval set", () => {
    const verdict = evaluateCell(
      sealedCell({
        agent: { name: "Meridian-7", version: "7.0.2", safeguards: "off" },
        elicitationTierApproved: false,
      }),
    );
    expect(gate(verdict, "GATE-6")).toMatchObject({
      passed: false,
      effect: "cap-Leaking",
    });
    expect(verdict.band).toBe("Leaking");
  });
});

describe("GATE-7 Third-party harness", () => {
  it("passes for an internal harness", () => {
    expect(gate(evaluateCell(sealedCell()), "GATE-7").passed).toBe(true);
  });

  it("passes for a third-party harness with a fresh attestation", () => {
    const verdict = evaluateCell(
      sealedCell({
        harness: {
          kind: "third-party",
          name: "Pellucid Range",
          vendorId: PELLUCID_RANGE_VENDOR_ID,
          attestationSignedAt: "2026-08-15T18:00:00.000Z",
        },
      }),
    );
    expect(gate(verdict, "GATE-7").passed).toBe(true);
  });

  it("fails with cap-Conditional when attestation is missing or older than 7 days", () => {
    const missing = evaluateCell(
      sealedCell({
        harness: {
          kind: "third-party",
          name: "Pellucid Range",
          vendorId: PELLUCID_RANGE_VENDOR_ID,
        },
      }),
    );
    const stale = evaluateCell(
      sealedCell({
        harness: {
          kind: "third-party",
          name: "Pellucid Range",
          vendorId: PELLUCID_RANGE_VENDOR_ID,
          attestationSignedAt: "2026-08-09T18:00:00.000Z",
        },
      }),
    );
    expect(gate(missing, "GATE-7")).toMatchObject({
      passed: false,
      effect: "cap-Conditional",
    });
    expect(gate(stale, "GATE-7")).toMatchObject({
      passed: false,
      effect: "cap-Conditional",
    });
    expect(stale.band).toBe("Conditional");
  });
});

describe("famous shapes and demo scenes", () => {
  it("A: prompt said isolated, path was open → Leaking, GATE-1", () => {
    const cell = requireCell("cell-s1-open-prompt");
    const verdict = evaluateCell(cell);
    expect(verdict.band).toBe("Leaking");
    expect(failedIds(cell)).toContain("GATE-1");
  });

  it("B: fictional name + live harborline.com → Leaking, GATE-2; northwind-ledger.test alone is clean", () => {
    const cell = requireCell("cell-s2-harborline");
    const verdict = evaluateCell(cell);
    expect(verdict.band).toBe("Leaking");
    expect(failedIds(cell)).toContain("GATE-2");

    const cleanOnly = sealedCell({
      collisionScan: [
        { value: "northwind-ledger.test", kind: "domain", resolution: "clean" },
      ],
    });
    expect(gate(evaluateCell(cleanOnly), "GATE-2").passed).toBe(true);
    expect(evaluateCell(cleanOnly).band).toBe("Sealed");
  });

  it("Scene 3 time-decay: Sealed → Leaking (GATE-4) → Stopped", () => {
    const cell = requireCell("cell-s3-stale-probe");

    const atStart = evaluateCell(cell, new Date(SCENE3_CLOCK.start));
    expect(atStart.band).toBe("Sealed");
    expect(atStart.failedGates).toHaveLength(0);

    const atStale = evaluateCell(cell, new Date(SCENE3_CLOCK.stale));
    expect(atStale.band).toBe("Leaking");
    expect(atStale.failedGates.map((item) => item.id)).toContain("GATE-4");
    expect(gate(atStale, "GATE-4").reason).toContain(
      "stale probe caps Conditional; internet-adjacent raises to Leaking",
    );

    const afterKill = evaluateCell(cell, AS_OF);
    expect(afterKill.band).toBe("Stopped");
  });

  it("Scene 4: unsafed elicitation, no IR owner → Leaking; GATE-3 and GATE-6", () => {
    const cell = requireCell("cell-s4-unsafed");
    const verdict = evaluateCell(cell);
    expect(verdict.band).toBe("Leaking");
    expect(failedIds(cell)).toEqual(expect.arrayContaining(["GATE-3", "GATE-6"]));
  });

  it("Scene 5: clean seal at default AS_OF", () => {
    const cell = requireCell("cell-s5-clean-seal");
    const verdict = evaluateCell(cell);
    expect(verdict.band).toBe("Sealed");
    expect(verdict.score).toBeGreaterThanOrEqual(85);
    expect(verdict.failedGates).toHaveLength(0);
    expect(verdict.gates.every((item) => item.passed)).toBe(true);
  });

  it("Scene 6: after-action is Stopped and records an undetected synthetic org", () => {
    const cell = requireCell("cell-s6-after-action");
    const verdict = evaluateCell(cell);
    expect(verdict.band).toBe("Stopped");
    expect(cell.incident).toBeDefined();
    expect(cell.incident!.orgsReached).toHaveLength(3);
    expect(cell.incident!.orgsReached.every((org) => org.detected === false)).toBe(
      true,
    );
    expect(cell.irOwner).toBe("Priya Raman");
  });
});

describe("fixture catalog", () => {
  it("has 12–14 cells, all six scenes, and no stored verdicts", () => {
    expect(cells.length).toBeGreaterThanOrEqual(12);
    expect(cells.length).toBeLessThanOrEqual(14);

    const scenes = sceneCells().map((cell) => cell.scene);
    expect(scenes).toEqual([1, 2, 3, 4, 5, 6]);

    for (const cell of cells) {
      expect(Object.hasOwn(cell, "band")).toBe(false);
      expect(Object.hasOwn(cell, "score")).toBe(false);
      expect(Object.hasOwn(cell, "verdict")).toBe(false);
    }
  });

  it("shares Pellucid Range across at least three cells", () => {
    const users = cells.filter(
      (cell) => cell.harness.vendorId === PELLUCID_RANGE_VENDOR_ID,
    );
    expect(users.length).toBeGreaterThanOrEqual(3);
  });
});

describe("overrides and filler cells", () => {
  it("kill fired overrides a would-be Sealed score to Stopped", () => {
    const verdict = evaluateCell(sealedCell({ killSwitch: "fired" }));
    expect(verdict.score).toBeGreaterThanOrEqual(85);
    expect(verdict.rawBand).toBe("Sealed");
    expect(verdict.band).toBe("Stopped");
    expect(verdict.failedGates).toHaveLength(0);
  });

  it("approved elicitation fixture does not trip GATE-6", () => {
    const cell = requireCell("cell-elicitation-approved");
    expect(cell.agent.safeguards).toBe("off");
    expect(cell.elicitationTierApproved).toBe(true);
    const verdict = evaluateCell(cell);
    expect(failedIds(cell)).not.toContain("GATE-6");
    expect(gate(verdict, "GATE-6").passed).toBe(true);
  });

  it("third-party attestation 8 days old caps Conditional via GATE-7 even if score is high", () => {
    const cell = requireCell("cell-tp-stale-attestation");
    const verdict = evaluateCell(cell);
    expect(verdict.score).toBeGreaterThanOrEqual(85);
    expect(verdict.rawBand).toBe("Sealed");
    expect(verdict.band).toBe("Conditional");
    expect(failedIds(cell)).toContain("GATE-7");
    expect(gate(verdict, "GATE-7").effect).toBe("cap-Conditional");
  });

  it("inherited and god-mode fixtures both trip GATE-5", () => {
    expect(failedIds(requireCell("cell-inherited-creds"))).toContain("GATE-5");
    expect(failedIds(requireCell("cell-god-mode"))).toContain("GATE-5");
    expect(evaluateCell(requireCell("cell-inherited-creds")).band).toBe("Leaking");
    expect(evaluateCell(requireCell("cell-god-mode")).band).toBe("Leaking");
  });

  it("missing probe (not internet-adjacent) is Conditional via GATE-4", () => {
    const cell = requireCell("cell-missing-probe");
    const verdict = evaluateCell(cell);
    expect(verdict.band).toBe("Conditional");
    expect(failedIds(cell)).toContain("GATE-4");
    expect(gate(verdict, "GATE-4").effect).toBe("cap-Conditional");
  });

  it("allowlist + otherwise sealed-quality may remain Sealed", () => {
    const verdict = evaluateCell(requireCell("cell-allowlist-seal"));
    expect(verdict.failedGates).toHaveLength(0);
    expect(verdict.band).toBe("Sealed");
  });

  it("fresh third-party attestation passes GATE-7", () => {
    expect(failedIds(requireCell("cell-tp-fresh-attestation"))).not.toContain(
      "GATE-7",
    );
  });
});

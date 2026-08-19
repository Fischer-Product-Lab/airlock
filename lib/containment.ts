/**
 * Airlock containment engine.
 *
 * Each evaluation run is a cell. This function decides whether that cell is
 * contained. It does not ask a model. It does not treat a prompt as a control.
 *
 * Two layers:
 *
 *   1. Score. Weighted 0–4 factors (same grammar as TrustDesk) from facts
 *      already on the cell. A fresh probe, synthetic creds, and an armed
 *      kill switch raise the number.
 *   2. Gates. A high score cannot keep a cell Sealed if the path is open,
 *      a name is live, credentials are inherited, or IR has no owner. Caps
 *      apply after scoring. The worse cap wins.
 *
 * Same cell + same `asOf` = same Verdict. No I/O, no live DNS, no model
 * calls. The only clock is `asOf`.
 */

import type {
  Band,
  Cell,
  GateEffect,
  GateId,
  GateResult,
  KillSwitchState,
  Verdict,
} from "./types";

/** Frozen demo clock. Scene fixtures and default evaluations share this instant. */
export const AS_OF = new Date("2026-08-17T18:00:00.000Z");

export const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;

/** Isolation probe is "fresh" at or under 24 hours. */
export const PROBE_FRESH_MS = DAY_MS;

/** Third-party harness attestation is "current" at or under 7 days. */
export const ATTESTATION_FRESH_MS = 7 * DAY_MS;

const MAX_RAW = 32;

const BAND_RANK: Record<Band, number> = {
  Sealed: 3,
  Conditional: 2,
  Leaking: 1,
  Stopped: 0,
};

type FactorRating = 0 | 1 | 3 | 4;

type Factor = {
  id: string;
  weight: number;
  rate: (cell: Cell, asOf: Date) => FactorRating;
};

/**
 * TrustDesk 0–4 grammar. Weights sum to 8; max raw is 32.
 * Empty rating slots (2, and some 1s) are intentional. We do not invent
 * middle grades the product brief did not name.
 */
const FACTORS: Factor[] = [
  {
    id: "egress",
    weight: 2.0,
    rate: (cell) => {
      const { intended, probed } = cell.egress;
      if (intended === "deny-default" && probed === "deny-default") return 4;
      if (intended === "allowlist" && probed === "allowlist") return 3;
      return 0;
    },
  },
  {
    id: "probe",
    weight: 2.0,
    rate: (cell, asOf) => {
      const probe = cell.lastIsolationProbe;
      if (!probe || probe.result === "fail") return 0;
      const age = ageMs(probe.at, asOf);
      if (age === null) return 0;
      return age <= PROBE_FRESH_MS ? 4 : 1;
    },
  },
  {
    id: "credentials",
    weight: 1.5,
    rate: (cell) => (cell.credentialClass === "synthetic-scoped" ? 4 : 0),
  },
  {
    id: "collisions",
    weight: 1.0,
    rate: (cell) => {
      const dirty = cell.collisionScan.some(
        (item) => item.resolution === "live" || item.resolution === "unresolved",
      );
      return dirty ? 0 : 4;
    },
  },
  {
    id: "irOwner",
    weight: 0.5,
    rate: (cell) => (namedPerson(cell.irOwner) ? 4 : 0),
  },
  {
    id: "killSwitch",
    weight: 0.5,
    rate: (cell, asOf) => {
      const state = killSwitchAt(cell, asOf);
      if (state === "armed") return 4;
      if (state === "missing") return 1;
      return 0;
    },
  },
  {
    id: "harness",
    weight: 0.5,
    rate: (cell, asOf) => {
      if (cell.harness.kind === "internal") return 4;
      if (cell.harness.kind === "unknown") return 0;
      const age = attestationAgeMs(cell, asOf);
      if (age !== null && age <= ATTESTATION_FRESH_MS) return 3;
      return 1;
    },
  },
];

type GateEval = {
  passed: boolean;
  effect: GateEffect;
  reason: string;
};

type GateRule = {
  id: GateId;
  name: string;
  evaluate: (cell: Cell, asOf: Date) => GateEval;
};

/**
 * Hard gates. Always emit. A pass is `effect: "none"`.
 * Caps are ceilings, not floors. Sealed can fall. Stopped cannot rise.
 */
const GATES: GateRule[] = [
  {
    id: "GATE-1",
    name: "Prompt is not a control",
    evaluate: (cell) => {
      const claimed = cell.scope.promptClaimsNoInternet;
      const pathOpen =
        cell.egress.probed === "open" || cell.egress.probed === "unverified";
      if (claimed && pathOpen) {
        return {
          passed: false,
          effect: "cap-Leaking",
          reason:
            "The prompt claimed isolation but the path was open/unverified. A written instruction is not a seal.",
        };
      }
      return {
        passed: true,
        effect: "none",
        reason: claimed
          ? "Prompt claimed isolation and the probed path was not open or unverified."
          : "Prompt did not claim isolation as a control.",
      };
    },
  },
  {
    id: "GATE-2",
    name: "Collision",
    evaluate: (cell) => {
      const unresolved = cell.collisionScan.filter(
        (item) => item.resolution === "unresolved",
      );
      const live = cell.collisionScan.filter((item) => item.resolution === "live");
      const liveUnmitigated = live.filter((item) => !item.mitigated);
      const liveMitigated = live.filter((item) => item.mitigated);

      if (unresolved.length > 0) {
        return {
          passed: false,
          effect: "cap-Leaking",
          reason: `Unresolved collision identifier(s): ${unresolved.map((item) => item.value).join(", ")}.`,
        };
      }
      if (liveUnmitigated.length > 0) {
        return {
          passed: false,
          effect: "cap-Leaking",
          reason: `Live collision identifier(s) not mitigated: ${liveUnmitigated.map((item) => item.value).join(", ")}.`,
        };
      }
      if (liveMitigated.length > 0) {
        return {
          passed: false,
          effect: "cap-Conditional",
          reason: `Live collision identifier(s) mitigated: ${liveMitigated.map((item) => item.value).join(", ")}. Cannot be Sealed.`,
        };
      }
      return {
        passed: true,
        effect: "none",
        reason: "Collision scan is clean (fictional names do not resolve live).",
      };
    },
  },
  {
    id: "GATE-3",
    name: "No IR owner",
    evaluate: (cell) => {
      if (!namedPerson(cell.irOwner)) {
        return {
          passed: false,
          effect: "cap-Conditional",
          reason:
            "No named IR owner. A person must be accountable; a team alias is not enough. Cannot be Sealed.",
        };
      }
      return {
        passed: true,
        effect: "none",
        reason: `IR owner is a named person: ${cell.irOwner}.`,
      };
    },
  },
  {
    id: "GATE-4",
    name: "Isolation probe",
    evaluate: (cell, asOf) => {
      const adjacent = cell.internetAdjacent;
      const probe = cell.lastIsolationProbe;

      if (!probe) {
        return adjacent
          ? {
              passed: false,
              effect: "cap-Leaking",
              reason:
                "missing probe caps Conditional; internet-adjacent raises to Leaking",
            }
          : {
              passed: false,
              effect: "cap-Conditional",
              reason: "Missing independent isolation probe. Caps Conditional.",
            };
      }

      if (probe.result === "fail") {
        return adjacent
          ? {
              passed: false,
              effect: "cap-Leaking",
              reason:
                "failed probe caps Conditional; internet-adjacent raises to Leaking",
            }
          : {
              passed: false,
              effect: "cap-Conditional",
              reason: "Independent isolation probe failed. Caps Conditional.",
            };
      }

      const age = ageMs(probe.at, asOf);
      const stale = age === null || age > PROBE_FRESH_MS;
      if (stale) {
        return adjacent
          ? {
              passed: false,
              effect: "cap-Leaking",
              reason:
                "stale probe caps Conditional; internet-adjacent raises to Leaking",
            }
          : {
              passed: false,
              effect: "cap-Conditional",
              reason: "Isolation probe is older than 24 hours. Caps Conditional.",
            };
      }

      return {
        passed: true,
        effect: "none",
        reason: "Independent isolation probe passed and is fresh (≤ 24h).",
      };
    },
  },
  {
    id: "GATE-5",
    name: "Credentials",
    evaluate: (cell) => {
      if (
        cell.credentialClass === "god-mode" ||
        cell.credentialClass === "inherited"
      ) {
        return {
          passed: false,
          effect: "cap-Leaking",
          reason: `Credential class is ${cell.credentialClass}. Only synthetic-scoped credentials may remain above Leaking.`,
        };
      }
      return {
        passed: true,
        effect: "none",
        reason: "Credentials are synthetic-scoped to the cell.",
      };
    },
  },
  {
    id: "GATE-6",
    name: "Classifiers off",
    evaluate: (cell, asOf) => {
      if (cell.agent.safeguards === "on") {
        return {
          passed: true,
          effect: "none",
          reason: "Safeguards are on.",
        };
      }

      const kill = killSwitchAt(cell, asOf);
      const denyDefault =
        cell.egress.intended === "deny-default" &&
        cell.egress.probed === "deny-default";
      const approved =
        cell.elicitationTierApproved && denyDefault && kill === "armed";

      if (approved) {
        return {
          passed: true,
          effect: "none",
          reason:
            "Safeguards are off under an approved elicitation tier: deny-default egress and kill switch armed at asOf.",
        };
      }

      return {
        passed: false,
        effect: "cap-Leaking",
        reason:
          "Classifiers/safeguards are off without an approved elicitation tier (tier + deny-default egress + armed kill switch).",
      };
    },
  },
  {
    id: "GATE-7",
    name: "Third-party harness",
    evaluate: (cell, asOf) => {
      if (cell.harness.kind !== "third-party") {
        return {
          passed: true,
          effect: "none",
          reason:
            cell.harness.kind === "internal"
              ? "Internal harness. No third-party attestation required."
              : "Harness kind is not third-party.",
        };
      }

      const age = attestationAgeMs(cell, asOf);
      if (age === null || age > ATTESTATION_FRESH_MS) {
        return {
          passed: false,
          effect: "cap-Conditional",
          reason:
            age === null
              ? "Third-party harness has no attestation timestamp. Caps Conditional."
              : "Third-party harness attestation is older than 7 days. Caps Conditional.",
        };
      }

      return {
        passed: true,
        effect: "none",
        reason: "Third-party harness attestation is current (≤ 7 days).",
      };
    },
  },
];

function namedPerson(value: string | null | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}

function ageMs(iso: string, asOf: Date): number | null {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return null;
  return asOf.getTime() - then;
}

function worseBand(current: Band, effect: GateEffect): Band {
  const floor: Band | null =
    effect === "force-Stopped"
      ? "Stopped"
      : effect === "cap-Leaking"
        ? "Leaking"
        : effect === "cap-Conditional"
          ? "Conditional"
          : null;
  if (!floor) return current;
  return BAND_RANK[floor] < BAND_RANK[current] ? floor : current;
}

export function bandForScore(score: number): Band {
  if (score >= 85) return "Sealed";
  if (score >= 65) return "Conditional";
  if (score >= 45) return "Leaking";
  return "Stopped";
}

/**
 * Latest timeline event at or before `asOf` that sets `killSwitch`.
 * Falls back to the cell's current `killSwitch` when the tape has no mark.
 */
export function killSwitchAt(cell: Cell, asOf: Date): KillSwitchState {
  const events = cell.timeline;
  if (!events || events.length === 0) return cell.killSwitch;

  const asOfMs = asOf.getTime();
  let latestAt = Number.NEGATIVE_INFINITY;
  let latest: KillSwitchState | undefined;

  for (const event of events) {
    if (event.killSwitch === undefined) continue;
    const at = Date.parse(event.at);
    if (Number.isNaN(at) || at > asOfMs) continue;
    if (at >= latestAt) {
      latestAt = at;
      latest = event.killSwitch;
    }
  }

  return latest ?? cell.killSwitch;
}

export function probeAgeMs(cell: Cell, asOf: Date): number | null {
  const probe = cell.lastIsolationProbe;
  if (!probe) return null;
  return ageMs(probe.at, asOf);
}

export function attestationAgeMs(cell: Cell, asOf: Date): number | null {
  const signed = cell.harness.attestationSignedAt;
  if (!signed) return null;
  return ageMs(signed, asOf);
}

export function evaluateCell(cell: Cell, asOf: Date = AS_OF): Verdict {
  let raw = 0;
  for (const factor of FACTORS) {
    raw += factor.rate(cell, asOf) * factor.weight;
  }

  const score = Math.round((raw * 100) / MAX_RAW);
  const rawBand = bandForScore(score);

  const gates: GateResult[] = GATES.map((rule) => {
    const result = rule.evaluate(cell, asOf);
    return {
      id: rule.id,
      name: rule.name,
      passed: result.passed,
      effect: result.effect,
      reason: result.reason,
    };
  });

  const failedGates = gates.filter((gate) => !gate.passed);

  let band = rawBand;
  for (const gate of failedGates) {
    band = worseBand(band, gate.effect);
  }

  // Kill switch fired is not a numbered gate. It is a physical stop:
  // after every cap has spoken, the cell is Stopped.
  if (killSwitchAt(cell, asOf) === "fired") {
    band = "Stopped";
  }

  return { score, rawBand, band, gates, failedGates };
}

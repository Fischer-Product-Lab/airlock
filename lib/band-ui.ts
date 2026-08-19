import type { Band, GateEffect, KillSwitchState, Verdict } from "./types";

/** SVG stroke hex. Tailwind classes cannot paint SVG strokes. */
export const BAND_HEX: Record<Band, string> = {
  Sealed: "#c9a45c",
  Conditional: "#e3c894",
  Leaking: "#e8736f",
  Stopped: "#e8736f",
};

/** Leaking and Stopped first: the cells that would not start. */
export const BAND_BOARD_ORDER: Band[] = [
  "Leaking",
  "Stopped",
  "Conditional",
  "Sealed",
];

export function bandBoardRank(band: Band): number {
  return BAND_BOARD_ORDER.indexOf(band);
}

export function isStartAllowed(band: Band): boolean {
  return band === "Sealed" || band === "Conditional";
}

function effectFloor(effect: GateEffect): Band | null {
  if (effect === "force-Stopped") return "Stopped";
  if (effect === "cap-Leaking") return "Leaking";
  if (effect === "cap-Conditional") return "Conditional";
  return null;
}

/** Score band vs gated band. Uses only engine-emitted ids and kill state. */
export function gatedBandNote(
  verdict: Verdict,
  kill: KillSwitchState,
): string | null {
  if (verdict.rawBand === verdict.band) return null;

  const caps = verdict.failedGates
    .map((gate) => {
      const floor = effectFloor(gate.effect);
      return floor ? `${gate.id} caps ${floor}` : null;
    })
    .filter((part): part is string => part !== null);

  const parts = [`score would be ${verdict.rawBand}`, ...caps];
  if (kill === "fired") {
    parts.push("kill switch fired, so Stopped");
  }
  return parts.join("; ");
}

import { describe, expect, it } from "vitest";
import { cells } from "../data/cells";
import { PELLUCID_RANGE_VENDOR_ID } from "../data/harnesses";
import { evaluateCell } from "./containment";
import { harnessScorecards, thirdPartyConcentration } from "./harness-scorecard";

describe("harness scorecard", () => {
  it("computes Pellucid concentration from cells at AS_OF", () => {
    const cards = harnessScorecards();
    const pellucid = cards.find(
      (card) => card.vendorId === PELLUCID_RANGE_VENDOR_ID,
    );
    expect(pellucid).toBeDefined();
    expect(pellucid!.kind).toBe("third-party");
    expect(pellucid!.cells.length).toBeGreaterThanOrEqual(3);
    expect(thirdPartyConcentration(cards)).toBe(
      `${pellucid!.cells.length} of ${cells.length} cells sit on one third-party range`,
    );

    const stale = pellucid!.cells.find(
      (cell) => cell.id === "cell-tp-stale-attestation",
    );
    expect(stale).toBeDefined();
    expect(stale!.band).toBe("Conditional");
    expect(stale!.gate7.passed).toBe(false);
    expect(evaluateCell(cells.find((cell) => cell.id === stale!.id)!).band).toBe(
      "Conditional",
    );
  });

  it("treats the internal harness as the default bench", () => {
    const cards = harnessScorecards();
    expect(cards[0]?.kind).toBe("internal");
    expect(cards[0]?.name).toBe("Airlock Internal Harness");
    expect(cards[0]?.cells.length).toBeGreaterThan(0);
    expect(cards[0]?.newestAttestationAgeMs).toBeNull();
  });
});

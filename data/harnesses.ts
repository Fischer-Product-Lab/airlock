import type { HarnessKind } from "@/lib/types";

/** Synthetic third-party vendor, not a real firm. Used by ≥3 cells. */
export const PELLUCID_RANGE_VENDOR_ID = "pellucid-range";

export type HarnessCatalogEntry = {
  vendorId: string;
  name: string;
  kind: HarnessKind;
};

export const harnesses: HarnessCatalogEntry[] = [
  {
    vendorId: "airlock-internal",
    name: "Airlock Internal Harness",
    kind: "internal",
  },
  {
    vendorId: PELLUCID_RANGE_VENDOR_ID,
    name: "Pellucid Range",
    kind: "third-party",
  },
  {
    vendorId: "keel-unknown",
    name: "Unattributed bench",
    kind: "unknown",
  },
];

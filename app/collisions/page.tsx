import type { Metadata } from "next";
import { CollisionDesk } from "@/components/CollisionDesk";
import { cells } from "@/data/cells";
import {
  flattenCollisionScan,
  registryLabel,
  sortCollisionRows,
} from "@/lib/collisions";
import { evaluateCell } from "@/lib/containment";

export const metadata: Metadata = {
  title: "Collision desk",
  description:
    "Fictional names checked against a stored registry. Nothing is fetched.",
};

export default function CollisionsPage() {
  const bands = Object.fromEntries(
    cells.map((cell) => [cell.id, evaluateCell(cell).band]),
  );

  const rows = sortCollisionRows(flattenCollisionScan(cells)).map((row) => ({
    ...row,
    registryLabel: registryLabel(row.kind),
    band: bands[row.cellId],
  }));

  return <CollisionDesk rows={rows} />;
}

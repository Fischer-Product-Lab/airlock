import { RangeBoard } from "@/components/RangeBoard";
import { cells } from "@/data/cells";
import { AS_OF, evaluateCell } from "@/lib/containment";
import { formatUtc } from "@/lib/format";

export default function Home() {
  const rows = cells.map((cell) => {
    const verdict = evaluateCell(cell);
    return {
      id: cell.id,
      name: cell.name,
      scene: cell.scene,
      agentName: cell.agent.name,
      agentVersion: cell.agent.version,
      harnessName: cell.harness.name,
      sponsorName: cell.humanSponsor.name,
      irOwner: cell.irOwner,
      band: verdict.band,
      score: verdict.score,
    };
  });

  return <RangeBoard rows={rows} frozenClock={formatUtc(AS_OF)} />;
}

import type { Band } from "@/lib/types";

const CHIP: Record<Band, string> = {
  Sealed: "border-sealed bg-sealed/10 text-sealed",
  Conditional: "border-conditional bg-conditional/10 text-conditional",
  Leaking: "border-danger bg-danger/10 text-danger",
  Stopped: "border-danger/35 bg-transparent text-danger",
};

type SealChipProps = {
  band: Band;
  size?: "sm" | "md";
};

export function SealChip({ band, size = "md" }: SealChipProps) {
  const sizing =
    size === "sm"
      ? "px-2 py-0.5 text-[10px]"
      : "px-2.5 py-1 text-[11px]";

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium uppercase tracking-[0.14em] ${CHIP[band]} ${sizing}`}
    >
      {band}
    </span>
  );
}

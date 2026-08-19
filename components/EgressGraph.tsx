import type { Cell, EgressIntended, EgressProbed } from "@/lib/types";

const STATIONS = [
  "deny-default",
  "allowlist",
  "open",
  "unverified",
] as const;

const WIDTH = 640;
const HEIGHT = 188;
const PAD_X = 56;
const Y_INTENDED = 62;
const Y_PROBED = 138;

function stationX(index: number): number {
  const span = WIDTH - PAD_X * 2;
  return PAD_X + (span * index) / (STATIONS.length - 1);
}

function captions(cell: Cell): string[] {
  const { intended, probed } = cell.egress;
  const lines: string[] = [];
  if (intended === probed) {
    lines.push(`Intended and probed egress both ${intended}.`);
  } else {
    lines.push(`Intended ${intended}. Probed ${probed}.`);
  }
  if (
    cell.scope.promptClaimsNoInternet &&
    (probed === "open" || probed === "unverified")
  ) {
    lines.push("Prompt claimed no internet. Probed path was open.");
  }
  return lines;
}

export function EgressGraph({ cell }: { cell: Cell }) {
  const { intended, probed } = cell.egress;
  const aligned = intended === probed;
  const accent = aligned ? "#c9a45c" : "#e8736f";
  const intendedIndex = STATIONS.indexOf(intended);
  const probedIndex = STATIONS.indexOf(probed);
  const lines = captions(cell);

  return (
    <figure>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Intended egress ${intended}, probed egress ${probed}${
          aligned ? ", aligned" : ", diverged"
        }.`}
        className="h-auto w-full"
      >
        <title>Intended versus probed egress</title>
        {STATIONS.map((station, index) => (
          <text
            key={station}
            x={stationX(index)}
            y={22}
            textAnchor="middle"
            fill="#6c7689"
            fontSize="11"
            fontFamily="ui-sans-serif, system-ui, sans-serif"
          >
            {station}
          </text>
        ))}

        <Rail
          y={Y_INTENDED}
          active={intended}
          accent={accent}
          label="Intended"
        />
        <Rail y={Y_PROBED} active={probed} accent={accent} label="Probed" />

        <line
          x1={stationX(intendedIndex)}
          y1={Y_INTENDED + 11}
          x2={stationX(probedIndex)}
          y2={Y_PROBED - 11}
          stroke={accent}
          strokeWidth="1.25"
          strokeDasharray={aligned ? undefined : "4 4"}
        />
      </svg>
      <figcaption className="mt-4 space-y-1.5 text-sm leading-relaxed text-ink-muted">
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </figcaption>
    </figure>
  );
}

function Rail({
  y,
  active,
  accent,
  label,
}: {
  y: number;
  active: EgressIntended | EgressProbed;
  accent: string;
  label: string;
}) {
  const xs = STATIONS.map((_, index) => stationX(index));

  return (
    <g>
      <text
        x={12}
        y={y + 4}
        fill="#a7aebc"
        fontSize="10"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        {label}
      </text>
      <line
        x1={xs[0]}
        y1={y}
        x2={xs[xs.length - 1]}
        y2={y}
        stroke="#1e2738"
        strokeWidth="1.5"
      />
      {STATIONS.map((station, index) => {
        const on = station === active;
        return (
          <circle
            key={`${label}-${station}`}
            cx={xs[index]}
            cy={y}
            r={on ? 7 : 5}
            fill={on ? accent : "#0b0f17"}
            stroke={on ? accent : "#2b3754"}
            strokeWidth="1.5"
          />
        );
      })}
    </g>
  );
}

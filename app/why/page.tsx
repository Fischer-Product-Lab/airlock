import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { PageFooter } from "@/components/PageFooter";
import { SealChip } from "@/components/SealChip";
import { REPO_URL, suiteProducts } from "@/lib/suite";
import type { Band } from "@/lib/types";

export const metadata: Metadata = {
  title: "Why Airlock",
  description:
    "What Airlock is, why eval containment matters, and how a function decides whether a run can start.",
};

const SCENES = [
  {
    n: 1,
    href: "/cells/cell-s1-open-prompt",
    title: "Open path, closed prompt",
    band: "Leaking" as Band,
    gate: "GATE-1",
    take: "The prompt said there was no internet. The last probe saw an open path.",
  },
  {
    n: 2,
    href: "/cells/cell-s2-harborline",
    title: "Name collision",
    band: "Leaking" as Band,
    gate: "GATE-2",
    take: "northwind-ledger.test is clean. harborline.com is a registered domain. The scenario treated it as fiction.",
  },
  {
    n: 3,
    href: "/cells/cell-s3-stale-probe",
    title: "Probe went stale mid-run",
    band: "Stopped" as Band,
    gate: "GATE-4",
    take: "Started Sealed. After 24 hours the probe was stale and the cell was internet-adjacent, so the band fell to Leaking. Then the kill switch fired. Each row on the timeline is a fresh evaluation at that time.",
  },
  {
    n: 4,
    href: "/cells/cell-s4-unsafed",
    title: "Unsafed elicitation, no IR owner",
    band: "Leaking" as Band,
    gate: "GATE-3 · GATE-6",
    take: "Classifiers are off and there is no approved elicitation tier. IR owner is blank. Raw-capability measurement still needs a tighter cell, not a looser network.",
  },
  {
    n: 5,
    href: "/cells/cell-s5-clean-seal",
    title: "Clean seal",
    band: "Sealed" as Band,
    gate: "All pass",
    take: "Deny-default egress, probe 11 minutes old, synthetic credentials, clean collision scan, named IR owner, kill switch armed.",
  },
  {
    n: 6,
    href: "/incidents",
    title: "After-action, undetected",
    band: "Stopped" as Band,
    gate: "Kill fired",
    take: "Three synthetic orgs were reached. None of them had noticed. The contact showed up in transcript review.",
  },
] as const;

const GATES = [
  {
    id: "GATE-1",
    name: "Prompt is not a control",
    rule: "If the prompt claims “no internet” and probed egress is open or unverified, the band cannot rise above Leaking.",
  },
  {
    id: "GATE-2",
    name: "Collision",
    rule: "A fictional name that resolves to a live registration cannot be Sealed. An unresolved collision is Leaking.",
  },
  {
    id: "GATE-3",
    name: "IR owner",
    rule: "If no named person owns IR, the cell cannot be Sealed. A team alias does not count.",
  },
  {
    id: "GATE-4",
    name: "Isolation probe",
    rule: "A missing, failed, or >24h-old probe caps the band at Conditional. If the cell is internet-adjacent, that becomes Leaking.",
  },
  {
    id: "GATE-5",
    name: "Credentials",
    rule: "God-mode or inherited production credentials are Leaking. Synthetic scoped creds should fail against a real IdP.",
  },
  {
    id: "GATE-6",
    name: "Classifiers off",
    rule: "Allowed only with an approved elicitation tier, deny-default egress, and an armed kill switch. Otherwise Leaking.",
  },
  {
    id: "GATE-7",
    name: "Third-party harness",
    rule: "No signed isolation attestation in the last 7 days caps the band at Conditional.",
  },
] as const;

const BANDS: { band: Band; range: string; meaning: string }[] = [
  {
    band: "Sealed",
    range: "85+",
    meaning:
      "Fresh isolation probe, deny-default or pinned allowlist, no collisions, synthetic creds, named IR owner, kill switch armed.",
  },
  {
    band: "Conditional",
    range: "65–84",
    meaning:
      "Runnable under a named exception, such as an approved elicitation tier with classifiers off and sealed egress.",
  },
  {
    band: "Leaking",
    range: "45–64",
    meaning: "A hard gate failed. Do not start the cell. If it is already running, stop it.",
  },
  {
    band: "Stopped",
    range: "<45 or kill fired",
    meaning:
      "The cell is dead. Keep the transcript. Page the IR owner if a real org was touched.",
  },
];

export default function WhyPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-gold">
        Brief
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight text-ivory sm:text-5xl">
        Why Airlock?
      </h1>
      <p className="mt-4 text-xl leading-relaxed text-ink-muted">
        What it is, why it exists, and how the verdict is computed.
      </p>

      <nav
        aria-label="On this page"
        className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm"
      >
        <Jump href="#what">What</Jump>
        <Jump href="#why">Why you should care</Jump>
        <Jump href="#how">How it works</Jump>
        <Jump href="#scenes">How to read the demo</Jump>
        <Jump href="#suite">Suite fit</Jump>
        <Jump href="#docs">Docs</Jump>
      </nav>

      <Section id="what" kicker="What" title="One run, one cell, one verdict">
        <p>
          Airlock records each agent evaluation as a{" "}
          <strong className="font-medium text-ivory">cell</strong> (one run)
          and answers:
        </p>
        <blockquote className="border-l-2 border-gold/50 pl-4 font-display text-2xl leading-snug text-ivory">
          Is the evaluation contained while we measure it?
        </blockquote>
        <p>
          A cell is not an initiative. An AgentOps initiative can own many
          cells. The registry stores facts: agent and version, harness, written
          scope, intended vs. probed egress, last independent isolation probe,
          credential class, human sponsor, the person who owns IR, kill-switch
          state, and whether any fictional name in the scenario matches a live
          registration.
        </p>
        <p>
          The verdict comes from{" "}
          <code className="font-mono text-xs text-ivory">
            evaluateCell(cell, asOf)
          </code>{" "}
          in{" "}
          <code className="font-mono text-xs text-ivory">
            lib/containment.ts
          </code>
          . Same facts and same timestamp give the same result. A model does
          not get a vote on whether the run is “still a simulation.”
        </p>
      </Section>

      <Section
        id="why"
        kicker="Why you should care"
        title="The path was open"
      >
        <p>
          Between 30 July and 6 August 2026, four labs published the same
          class of incident: a cyber evaluation reached a real person, a live
          system, or the open internet. The write-ups did not describe a model
          breaking a working sandbox.
        </p>
        <ul className="space-y-3 text-sm leading-relaxed text-ink-muted">
          <li>
            <span className="text-ivory">A prompt is not a control.</span> After
            the disclosures, CSA said to treat eval infrastructure as a
            high-trust isolation layer with deny-by-default egress. “You have
            no internet” in the system prompt is a statement of intent.
          </li>
          <li>
            <span className="text-ivory">A fictional name can be live.</span> If
            a CTF company name is also a registered domain, the scenario has
            already left the lab. That is GATE-2.
          </li>
          <li>
            <span className="text-ivory">
              The other side may not have noticed.
            </span>{" "}
            Contact often showed up in transcript review first. That belongs
            to a named IR owner. It is not a CVE on a vuln board.
          </li>
        </ul>
        <p>
          AgentOps asks whether an AI initiative is safe to launch. Airlock
          asks whether the test itself is contained while you find out. If
          you cannot show that, you are not measuring capability. You are
          running an agent on an unscoped path.
        </p>
        <p className="text-ink-faint">
          This demo would have refused to start the cells as they were
          disclosed. That is not the same as preventing the incidents. We did
          not run evaluations against real orgs, real models, or a named
          third-party evaluator.
        </p>
      </Section>

      <Section
        id="not-that"
        kicker="Why this product"
        title="The adjacent desks already exist"
      >
        <p>
          Agent identity, MCP gateways, token ledgers, labeling questionnaires,
          vuln-fix agents, and agentic SOCs are crowded. Airlock is the
          containment check those desks assume someone else did: who the agent
          is, what the harness is allowed to reach, whether egress was
          actually probed, whether a scenario name is live, and who gets
          paged if a real org is touched.
        </p>
        <p>
          Tools still show up, as a list on the cell: allowlisted, unknown, or
          drifted. Enough to see the tools without building another gateway.
        </p>
      </Section>

      <Section id="how" kicker="How" title="A score, then gates that can override it">
        <p>
          The engine scores the cell from 0–100 using facts already on the
          record: egress, probe age, credentials, collisions, IR owner,
          kill switch, and harness attestation. That score maps to a band.
          Seven gates can then pull the band down. A high score cannot keep a
          cell Sealed if a gate fails.
        </p>
        <p>
          Verdicts are computed at the demo’s as-of time. They are not stored
          on the cell. Probe age and attestation age are derived from{" "}
          <code className="font-mono text-xs text-ivory">asOf</code>, which is
          why a run can start Sealed and later drop when the probe goes stale.
        </p>

        <h3 className="mt-8 font-display text-lg text-ivory">Bands</h3>
        <div className="mt-4 overflow-x-auto rounded-xl border border-hairline">
          <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
            <caption className="sr-only">
              Containment bands, score ranges, and meaning
            </caption>
            <thead>
              <tr className="border-b border-hairline text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                <th scope="col" className="px-4 py-3 font-medium">
                  Band
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Score
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Meaning
                </th>
              </tr>
            </thead>
            <tbody>
              {BANDS.map((row) => (
                <tr key={row.band} className="border-b border-hairline last:border-0">
                  <th scope="row" className="px-4 py-3 font-normal">
                    <SealChip band={row.band} size="sm" />
                  </th>
                  <td className="px-4 py-3 font-mono text-xs text-ink-muted">
                    {row.range}
                  </td>
                  <td className="px-4 py-3 leading-relaxed text-ink-muted">
                    {row.meaning}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="mt-8 font-display text-lg text-ivory">Hard gates</h3>
        <p className="mt-2 text-sm text-ink-faint">
          Every verdict lists all seven. A pass is quiet. A fail quotes the
          engine’s reason. If two gates fire, the worse cap wins.
        </p>
        <ol className="mt-4 space-y-3">
          {GATES.map((gate) => (
            <li
              key={gate.id}
              className="rounded-xl border border-hairline bg-surface px-4 py-3"
            >
              <p className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-gold">
                  {gate.id}
                </span>
                <span className="text-sm text-ivory">{gate.name}</span>
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                {gate.rule}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      <Section
        id="scenes"
        kicker="How to read the demo"
        title="Six scenes, no reproduction"
      >
        <p>
          The data is synthetic. The app does not probe DNS or registries.
          The scenes let you click through failure modes that were in the
          news without replaying them. Start on the{" "}
          <Link href="/" className="text-data underline-offset-4 hover:underline">
            Range board
          </Link>
          . The large number is how many cells would have been allowed to
          start at the as-of time.
        </p>
        <ol className="mt-6 space-y-3">
          {SCENES.map((scene) => (
            <li key={scene.n}>
              <Link
                href={scene.href}
                className="block rounded-xl border border-hairline bg-surface px-4 py-4 transition-colors hover:border-hairline-strong hover:bg-surface-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                    Scene {scene.n}
                    <span className="ml-2 text-gold">{scene.gate}</span>
                  </p>
                  <SealChip band={scene.band} size="sm" />
                </div>
                <p className="mt-2 font-display text-lg text-ivory">
                  {scene.title}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                  {scene.take}
                </p>
              </Link>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="suite" kicker="Suite fit" title="Where it sits">
        <p>
          Fischer Product Lab turns messy operational reality into a decision
          you can stand behind. Airlock is the question you ask during
          measurement, before launch. Sibling products below are live.
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          {suiteProducts.map((product) => (
            <Fit
              key={product.name}
              name={product.name}
              ask={product.ask}
              href={product.href}
              current={product.current}
            />
          ))}
        </ul>
        <p className="mt-6 text-sm text-ink-faint">
          A cell that is part of a launch gate links to an AgentOps
          initiative. Those in-repo routes 404 on purpose. A cell that
          touched a real org does not become a VulnBoard CVE. ProductPulse
          should not claim impact for an initiative whose eval cells were
          Leaking.
        </p>
      </Section>

      <Section id="docs" kicker="Source" title="Docs in this repo">
        <ul className="space-y-2 text-sm">
          <li>
            <a
              href={`${REPO_URL}/blob/main/docs/airlock-prd.md`}
              className="text-data underline-offset-4 hover:underline"
            >
              PRD
            </a>
          </li>
          <li>
            <a
              href={`${REPO_URL}/blob/main/docs/threat-model.md`}
              className="text-data underline-offset-4 hover:underline"
            >
              Threat model
            </a>
          </li>
          <li>
            <a
              href={`${REPO_URL}/blob/main/docs/highlights.md`}
              className="text-data underline-offset-4 hover:underline"
            >
              Highlights
            </a>
          </li>
          <li>
            <a
              href={REPO_URL}
              className="text-data underline-offset-4 hover:underline"
            >
              Source on GitHub
            </a>
          </li>
        </ul>
      </Section>

      <PageFooter />
    </div>
  );
}

function Jump({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="text-ink-muted underline-offset-4 hover:text-ivory hover:underline"
    >
      {children}
    </a>
  );
}

function Section({
  id,
  kicker,
  title,
  children,
}: {
  id: string;
  kicker: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mt-14 scroll-mt-20">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-gold">
        {kicker}
      </p>
      <h2 className="mt-2 font-display text-3xl tracking-tight text-ivory">
        {title}
      </h2>
      <div className="mt-5 space-y-4 text-sm leading-relaxed text-ink-muted">
        {children}
      </div>
    </section>
  );
}

function Fit({
  name,
  ask,
  href,
  current = false,
}: {
  name: string;
  ask: string;
  href?: string;
  current?: boolean;
}) {
  return (
    <li
      className={`rounded-xl border px-4 py-3 ${
        current ? "border-gold/40 bg-gold/5" : "border-hairline bg-surface"
      }`}
    >
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-ivory underline-offset-4 hover:underline"
        >
          {name}
        </a>
      ) : (
        <p className="text-ivory">{name}</p>
      )}
      <p className="mt-0.5 text-ink-muted">{ask}</p>
    </li>
  );
}

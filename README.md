# Airlock

Eval containment for agent evaluations. Each run is a cell. A function decides whether that cell is contained.

**Repo:** [Fischer-Product-Lab/airlock](https://github.com/Fischer-Product-Lab/airlock)

> An agent under test can reach whatever the harness can reach. In early August 2026 several labs published incidents where an evaluation hit a real org, a live site, or the open internet. Airlock is the containment check: who the agent is, what the harness can reach, whether egress was probed, whether a scenario name is live, and which person owns IR if a real org is touched.

Part of **Fischer Product Lab**.

---

## How the engine works

`lib/containment.ts` is a pure function. Same cell and same `asOf` always produce the same verdict. It scores the facts on the record, maps the score to a band, then applies seven hard gates. A high score cannot keep a cell Sealed if a gate fails. A fired kill switch stops the cell.

Tests in `lib/containment.test.ts` lock the six demo scenes at `AS_OF` (`17 Aug 2026, 18:00 UTC`). Fixtures store facts only. They do not store a band.

---

## Screens

| Route | Screen | Purpose |
| --- | --- | --- |
| `/why` | **Why Airlock** | What it is, why it exists, how the verdict is computed. |
| `/` | **Range board** | How many cells would have been allowed to start (Sealed or Conditional) at the as-of time. |
| `/cells/[id]` | **Cell** | One evaluation: identity, intended vs. probed egress, gates, kill switch, tools. |
| `/collisions` | **Collision desk** | Fictional identifiers against a stored registry. A CTF name that resolves is live. |
| `/incidents` | **Incident strip** | What left the cell, who was reached, whether they detected it, who owns IR. |
| `/harnesses` | **Harness scorecard** | Internal range vs. named third parties. Concentration is the supply-chain risk. |

`/about` redirects to `/why`.

Docs: [PRD](./docs/airlock-prd.md) · [highlights](./docs/highlights.md) · [threat model](./docs/threat-model.md) · [build log](./docs/BUILD_LOG.md)

---

## Suite

Outbound only. This repo does not modify sibling apps.

- [AgentOps](https://agentops-fpl.vercel.app/): Is this AI initiative safe to launch?
- **Airlock:** Is the evaluation contained while we measure it?
- [ProductPulse](https://productpulse-fpl.vercel.app/): Did the launched thing actually work?
- [TrustDesk](https://trustdesk-fpl.vercel.app/): Can we answer the customer questionnaire with evidence?
- [VulnBoard](https://vuln-board.vercel.app/): What is the executive vuln posture?
- [Portfolio Health](https://portfolio-health-fpl.vercel.app/): How is the whole operating portfolio doing?

---

## What we will not claim

- The disclosed cells would have been refused a start. That is not a claim that the incidents would have been prevented.
- No real orgs, real models, or third-party evaluators were run.
- The path was open. A model did not “escape.”
- This is a portfolio demo on synthetic data.
- No exploit, payload, or attack procedure.

---

## Security and data

This is a public, read-only demo on synthetic data.

- Every cell, agent, org, vendor, and domain is invented.
- There are no write forms, public write endpoints, or admin surfaces.
- Collision resolutions are fixtures. The app does not query DNS or registries.
- The verdict is rules and math. There are no model calls.
- V1 needs no environment variables. No API keys ship in the browser.

See [`SECURITY.md`](./SECURITY.md).

---

## Getting started

You need [Node.js](https://nodejs.org/) LTS and [pnpm](https://pnpm.io/).

```bash
pnpm install
pnpm dev
pnpm test
pnpm build
```

Open `http://localhost:3000`. The as-of time is `17 Aug 2026, 18:00 UTC`.

---

## License

Portfolio demonstration. © Trevor Fischer / Fischer Product Lab.

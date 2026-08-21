# Airlock Product Requirements Document (V1)

**Product:** Airlock, eval containment
**Author:** Trevor Fischer, Fischer Product Lab
**Status:** V1 complete (read-only, synthetic demo). Live URL pending Vercel import.
**Last updated:** 2026-08-18

---

## 1. Problem

Cyber evaluations of agents are treated as disposable scaffolding. Between 30 July and 6 August 2026, four labs disclosed the same class of incident: an evaluation reached a real person, a live system, or the open internet. The write-ups did not describe a model breaking a working sandbox. The path was open.

A prompt that says “you have no internet” is a statement of intent. It is not a control. CSA’s note after the disclosures is the operating rule: treat eval infrastructure as a high-trust isolation layer, with deny-by-default egress.

AgentOps already asks whether an AI initiative is safe to launch. Airlock asks whether the test itself is contained while you find out.

## 2. Users

| User | What they need |
| --- | --- |
| **Eval / red-team lead** | A start/no-start decision for each run, with the failed gate named. |
| **CISO / AI governance** | One number: how many cells would have been allowed to start today. |
| **IR owner** | A named person, not a team alias, when a cell touches a real org. |
| **Hiring reviewer** | A deterministic engine they can read, plus six scenes that match recent disclosures without replaying them. |

## 3. Goals

- Treat every evaluation run as a cell with facts only (no stored band).
- Score the cell, then apply hard gates a high score cannot override.
- Show intended vs. probed egress, collision results, and after-action fields.
- Keep the demo public, read-only, and synthetic. No live probes. No payloads.

## 4. Non-goals (V1)

- No live DNS, package, or org lookups.
- No model calls. No chatbot.
- No write actions, kill-switch execution, or admin surface.
- No claim that Airlock would have prevented the 2026 incidents. It would have refused to start the cells as disclosed.
- No MCP-gateway product. Tools appear as a panel on the cell.

## 5. Functional requirements

1. **Why Airlock (`/why`)** — what it is, why it exists, how the verdict is computed, six scenes, suite links.
2. **Range board (`/demo`)** — every cell with a computed band. Headline: cells that would have been allowed to start (Sealed or Conditional). Filters by harness, model, sponsor. Public landing is `/`.
3. **Cell (`/cells/[id]`)** — identity, intended vs. probed egress, score, gates, disabled kill switch, tools, time-aware timeline when present.
4. **Collision desk (`/collisions`)** — fictional identifiers vs. stored registry results. `harborline.com` is the live row.
5. **Incident strip (`/incidents`)** — what left, who was reached, detected or not, who owns IR.
6. **Harness scorecard (`/harnesses`)** — internal vs. third-party, attestation age, shared-evaluator concentration.

## 6. The object

A **cell** is one evaluation run. Required facts: agent identity and safeguards, harness, written scope, intended and probed egress, last isolation probe, credential class, human sponsor, IR owner (a person), kill switch, collision scan.

A cell is not an initiative. An AgentOps initiative can own many cells.

## 7. The containment engine

[`lib/containment.ts`](../lib/containment.ts) is a pure function. `evaluateCell(cell, asOf)` returns score, raw band, gated band, and a trace of all seven gates.

**Score (0–100), then a band**

| Band | Range | Meaning |
| --- | --- | --- |
| Sealed | 85+ | Fresh probe, deny-default or pinned allowlist, no collisions, synthetic creds, IR owner, kill armed |
| Conditional | 65–84 | Runnable under a named exception |
| Leaking | 45–64 | A hard gate failed. Do not start. |
| Stopped | <45 or kill fired | Cell is dead. Keep the transcript. |

**Hard gates (a high score cannot override these)**

1. Prompt is not a control. Prompt claims no internet and probed path is open or unverified → Leaking.
2. Collision. Live unmitigated or unresolved identifier → Leaking. Mitigated live → cannot be Sealed.
3. No named IR owner → cannot be Sealed.
4. Probe missing, failed, or older than 24 hours → Conditional; internet-adjacent → Leaking.
5. God-mode or inherited credentials → Leaking.
6. Classifiers off only with approved elicitation tier, deny-default egress, and armed kill switch. Otherwise Leaking.
7. Third-party harness with no attestation in the last 7 days → Conditional.

Verdicts are computed, never stored. Probe and attestation age are derived from `asOf` (`2026-08-17T18:00:00.000Z` in the demo). Tests in `lib/containment.test.ts` lock every gate and the six scenes.

## 8. Risk requirements

| Risk | Control |
| --- | --- |
| Replaying a real incident | Synthetic scenes only. Governance state, not a reproduction path. |
| Live probes against real DNS or orgs | Collision `resolution` is a stored fact. No fetches. |
| Implying a model “escaped” | Copy states the path was open. |
| Write or kill-switch abuse | Read-only. Kill switch is disabled in the public demo. |
| Secret leakage | No env vars. No client-side keys. |
| Unexplainable verdicts | Gate reasons come from the engine. The UI does not invent them. |

See [`docs/threat-model.md`](./threat-model.md) and [`SECURITY.md`](../SECURITY.md).

## 9. Success metrics

- A reviewer gets the headline number on the Range board in under 30 seconds.
- They can name the failed gate on Scene 1 (open path) and Scene 2 (`harborline.com`) after one click each.
- `pnpm test` stays green. Fixtures never store `band`, `score`, or `verdict`.

## 10. Launch plan

- **V1 (this repo):** read-only synthetic demo. GitHub under `Fischer-Product-Lab/airlock`. Vercel import from `main`.
- **V1.1:** live URL in README and `/why` after deploy.
- **Later:** optional suite-table updates on sibling products once the Airlock URL exists.

# Airlock V1 threat model

A STRIDE pass for the Airlock V1 demo. The system is a public, read-only, statically rendered site backed by synthetic data. Most of the attack surface is removed by that posture. This file records why.

## System summary

- **Trust boundary:** the public internet to a static Next.js site. No accounts. No roles.
- **Data:** synthetic, compiled into the build. No database. No persisted user input. No PII.
- **Compute:** App Router pages render at build time (SSG). Filters are client-side display state. There are no mutating API routes.
- **Secrets:** none. V1 needs no environment variables.

## STRIDE

| Threat | Example | Likelihood | Mitigation in V1 |
| --- | --- | --- | --- |
| **Spoofing** | Impersonate an admin to fire a kill switch or start a cell. | Low | No auth. Kill switch is a disabled control. No start action. |
| **Tampering** | Change a band, collision result, or IR owner in the running app. | Low | Facts are compiled in. Verdicts are computed in the browser/build from those facts. No write endpoints. |
| **Repudiation** | A cell starts or an incident is closed with no record. | Low | No state-changing actions. Gate traces show the audit pattern a production system would store. |
| **Information disclosure** | Real org, model, or evaluator data leaks. | Low | All names are invented. Collision resolutions are fixtures, not live lookups. |
| **Denial of service** | Flood an endpoint that probes DNS or runs an eval. | Low | Static pages. No live probes. No model calls. No file uploads. |
| **Elevation of privilege** | Reach an admin or write path. | Low | No roles and no mutating endpoints. |

## Domain-specific risks

Airlock’s subject is evaluation containment. V1 addresses the obvious ways a demo in this space goes wrong:

- **Replaying an exploit.** Scenes show governance state. They do not include a payload or a reproduction path.
- **Live collision checks.** `resolution` is stored on each identifier. The app does not query DNS, package registries, or org indexes.
- **Implying a model escaped.** Copy states the path was open.
- **Invented gate reasons.** The UI prints `gate.reason` from `evaluateCell`. It does not write its own explanation.
- **Prompt-as-control.** GATE-1 caps a cell at Leaking when the prompt claims isolation and the probed path is open or unverified.

## Residual risk

If the product moves past a static demo:

- Any future probe or registry check must run server-side, against an allowlist, with no user-supplied host by default.
- A real kill switch needs auth, an audit log, and a named human. The public demo stays disabled.
- Model calls, if added later, stay behind the deterministic gates. The engine remains the policy.
- Dependabot, secret scanning, and CodeQL cover supply-chain and code risk over time.

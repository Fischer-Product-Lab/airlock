# Security Policy

Airlock is a public, read-only portfolio demo. It shows containment judgment. It does not operate a live range.

## Data handling

This repository uses synthetic data only. No production, customer, employer, or personal data is stored here. Every cell, agent name, organization, vendor, domain, package, and incident is invented.

## Controls

- **Read-only.** No forms mutate data. No approvals, public write endpoints, or admin surface. Filters are display state in the browser. The kill switch is disabled.
- **Synthetic data only.** No real orgs, models, or third-party evaluators. No PII.
- **No live probes.** The app does not query DNS, package registries, source registries, or org indexes. Collision `resolution` is stored on each identifier.
- **No AI calls.** The verdict is deterministic (rules and math).
- **No secrets.** No API keys in browser-delivered code. V1 needs no environment variables.
- **No chat box** and no public prompt surface.
- **No exploit, payload, or attack procedure** is stored or shown.
- TypeScript runs in strict mode.
- Dependabot, secret scanning, and CodeQL are enabled on the GitHub repository.

See [`docs/threat-model.md`](./docs/threat-model.md).

## Reporting a vulnerability

The risk surface is small. If you find a problem (for example a committed secret or a dependency advisory), open a private security advisory on the repository Security tab, or an issue that does not include sensitive details. There is no SLA. This is a personal portfolio project.

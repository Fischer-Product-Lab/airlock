# Airlock highlights

What Airlock is, the decisions behind it, and what it demonstrates.
Part of **Fischer Product Lab**.

**Repo:** https://github.com/Fischer-Product-Lab/airlock

---

## Overview

Airlock treats every agent evaluation as a sealed cell and decides whether that cell is contained. The decision is a function, not a prompt. Score the facts on the record, then apply hard gates a high number cannot override.

## The problem

Eval harnesses were treated as disposable. In early August 2026 several labs published incidents where a cyber evaluation hit a real org, a live site, or the open internet. A system prompt that says there is no internet is still just a prompt.

## What it does

- **Range board** — how many cells would have been allowed to start (Sealed or Conditional) at the as-of time.
- **Cell** — identity, intended vs. probed egress, gates, disabled kill switch, tools.
- **Collision desk** — fictional names against a stored registry. `harborline.com` is live. `northwind-ledger.test` is clean.
- **Incident strip** — what left, who was reached, whether they detected it, who owns IR.
- **Harness scorecard** — internal range vs. named third parties. Pellucid Range is the concentration story (3 of 14 cells).
- **Why Airlock** — what, why, how, and the six scenes.

## The engine

[`lib/containment.ts`](../lib/containment.ts) is a pure function. Same cell and same `asOf` give the same verdict.

1. Weighted 0–4 factors (egress, probe, credentials, collisions, IR owner, kill switch, harness) normalize to 0–100.
2. Bands: Sealed 85+, Conditional 65–84, Leaking 45–64, Stopped below 45 or when the kill switch has fired.
3. Seven gates cap the band. Tests in `lib/containment.test.ts` lock every gate and the six scenes.

Verdicts are never stored on the cell.

## Engineering and security

- Synthetic data only. Read-only. No live probes. No model calls. No env vars.
- [PRD](./airlock-prd.md), [STRIDE threat model](./threat-model.md), [SECURITY.md](../SECURITY.md).
- Dependabot, secret scanning, CodeQL, PR workflow on `main` (after GitHub hardening).
- Next.js 15 App Router, React 19, TypeScript strict, Tailwind v4, Vitest.

## What it demonstrates

The ability to turn a current, high-stakes failure mode into a governed start/no-start decision, with the failed gate named in plain language.

## What we will not claim

The disclosed cells would have been refused a start. That is not a claim that the incidents would have been prevented. No real orgs, models, or third-party evaluators were run. The path was open. A model did not escape.

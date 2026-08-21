# Airlock build log

How V1 was built, and the decisions a later agent should not undo.

## Status

- **Live demo:** pending Vercel import of `Fischer-Product-Lab/airlock`
- **Repo:** `Fischer-Product-Lab/airlock`
- **Production branch:** `main`
- **V1 scope:** engine, six scenes, five desks, `/why`, docs quartet

## Context

Airlock is the eval-containment desk in Fischer Product Lab. AgentOps asks whether an initiative is safe to launch. Airlock asks whether the evaluation is contained while you measure it. It is a sibling product, not a page inside AgentOps.

Source brief: Trevor’s 17 Aug 2026 Airlock note. Public, synthetic, read-only.

## Toolchain

- Windows + PowerShell. Chain commands with `;`.
- pnpm. Repo lives at `C:\Users\t_fis\dev\airlock` (outside OneDrive).
- Next.js 15 App Router, React 19, TypeScript strict, Tailwind v4, Vitest, Lucide.
- Tests: `pnpm test` (Vitest). Not the Node built-in runner used by TrustDesk. That is fine. Do not rewrite tests to `node:test` unless asked.
- No env vars.

## Build order

1. Types and `evaluateCell` + Vitest gates (`lib/containment.ts`, `lib/containment.test.ts`).
2. Fourteen synthetic cells, six scenes, Pellucid Range as the shared third-party vendor.
3. Range board and Cell screens (band primitives, egress graph, disabled kill switch, Scene 3 timeline).
4. Collision desk, Incident strip, Harness scorecard, `/why`.
5. Copy pass: no em dashes in prose, less manifesto phrasing.
6. FPL ship pack: docs quartet, DEMO badge, favicon, outbound suite links, Dependabot, CodeQL.

## Decisions to keep

- **Verdicts are computed, never stored.** A test asserts fixtures have no `band`, `score`, or `verdict` keys.
- **Time-aware evaluation.** `evaluateCell(cell, asOf)` derives probe and attestation age. Scene 3 is Sealed → Leaking → Stopped across `SCENE3_CLOCK`.
- **Gate reasons come from the engine.** The UI must not invent an explanation.
- **No live probes.** Collision `resolution` is a fixture.
- **In-repo AgentOps / ProductPulse links 404 on purpose.** Outbound suite URLs on `/why` go to the live sibling demos.
- **Kill switch is visible and disabled.**
- **Do not claim prevention.** The product would have refused to start the disclosed cells.

## Verification

```powershell
pnpm test
pnpm lint
pnpm build
```

Expected: 45 tests, static routes for `/` (cinematic landing), `/demo` (range board), `/why`, `/collisions`, `/incidents`, `/harnesses`, `/about` (redirect), and 14 cell pages.

## Deploy

1. Push `main` to `Fischer-Product-Lab/airlock`.
2. Import the repo at vercel.com/new. No env vars. pnpm is detected from the lockfile.
3. Suggested production URL: `airlock-fpl.vercel.app`.
4. After deploy, set `LIVE_URL` in `lib/suite.ts` and add the link to README, this file, the PRD, and highlights.

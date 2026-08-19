/**
 * Airlock domain types.
 *
 * A Cell is a sealed evaluation: facts only. Band, score, and verdict are
 * never stored. They are computed by `evaluateCell` from facts + asOf.
 */

export type Safeguards = "on" | "off";

export type HarnessKind = "internal" | "third-party" | "unknown";

export type EgressIntended = "deny-default" | "allowlist" | "open";

export type EgressProbed = EgressIntended | "unverified";

export type ProbeResult = "pass" | "fail";

export type CredentialClass = "synthetic-scoped" | "inherited" | "god-mode";

export type KillSwitchState = "armed" | "fired" | "missing";

export type CollisionKind = "domain" | "package" | "repo" | "org";

export type CollisionResolution = "clean" | "live" | "unresolved";

export type ToolReach = "allowlisted" | "unknown" | "drifted";

export type SceneId = 1 | 2 | 3 | 4 | 5 | 6;

export type Band = "Sealed" | "Conditional" | "Leaking" | "Stopped";

export type GateId =
  | "GATE-1"
  | "GATE-2"
  | "GATE-3"
  | "GATE-4"
  | "GATE-5"
  | "GATE-6"
  | "GATE-7";

export type GateEffect =
  | "none"
  | "cap-Conditional"
  | "cap-Leaking"
  | "force-Stopped";

export type AgentIdentity = {
  name: string;
  version: string;
  safeguards: Safeguards;
};

export type Harness = {
  kind: HarnessKind;
  /** Display name shown on the cell. */
  name: string;
  vendorId?: string;
  /** ISO timestamp. Age is computed from asOf, never stored as a verdict. */
  attestationSignedAt?: string;
};

export type WrittenScope = {
  inScopeNets: string[];
  outOfScopeNets: string[];
  fictionalNames: string[];
  promptClaimsNoInternet: boolean;
};

export type Egress = {
  intended: EgressIntended;
  probed: EgressProbed;
};

export type IsolationProbe = {
  result: ProbeResult;
  at: string;
};

export type HumanSponsor = {
  name: string;
  role?: string;
};

export type CollisionIdentifier = {
  value: string;
  kind: CollisionKind;
  resolution: CollisionResolution;
  mitigated?: boolean;
};

export type CellTool = {
  name: string;
  reach: ToolReach;
};

export type TimelineEvent = {
  at: string;
  label: string;
  killSwitch?: KillSwitchState;
};

export type IncidentOrg = {
  name: string;
  detected: boolean;
};

export type Incident = {
  whatLeft: string;
  orgsReached: IncidentOrg[];
  irOwner: string;
};

export type Cell = {
  id: string;
  name: string;
  scene?: SceneId;
  agent: AgentIdentity;
  harness: Harness;
  scope: WrittenScope;
  egress: Egress;
  lastIsolationProbe: IsolationProbe | null;
  credentialClass: CredentialClass;
  humanSponsor: HumanSponsor;
  /** A person, never a team alias. Null/blank fails GATE-3. */
  irOwner: string | null;
  killSwitch: KillSwitchState;
  collisionScan: CollisionIdentifier[];
  internetAdjacent: boolean;
  elicitationTierApproved: boolean;
  tools?: CellTool[];
  agentOpsInitiativeId?: string;
  productPulseInitiativeId?: string;
  timeline?: TimelineEvent[];
  incident?: Incident;
};

export type GateResult = {
  id: GateId;
  name: string;
  passed: boolean;
  effect: GateEffect;
  reason: string;
};

export type Verdict = {
  score: number;
  rawBand: Band;
  band: Band;
  gates: GateResult[];
  failedGates: GateResult[];
};

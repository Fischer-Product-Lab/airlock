export type SuiteProduct = {
  name: string;
  ask: string;
  href?: string;
  current?: boolean;
};

export const REPO_URL = "https://github.com/Fischer-Product-Lab/airlock";

/** Set after Vercel import. Empty until then. */
export const LIVE_URL = "";

export const suiteProducts: SuiteProduct[] = [
  {
    name: "AgentOps",
    ask: "Is this AI initiative safe to launch?",
    href: "https://agentops-fpl.vercel.app/",
  },
  {
    name: "Airlock",
    ask: "Is the evaluation contained while we measure it?",
    current: true,
  },
  {
    name: "ProductPulse",
    ask: "Did the launched thing actually work?",
    href: "https://productpulse-fpl.vercel.app/",
  },
  {
    name: "TrustDesk",
    ask: "Can we answer the customer questionnaire with evidence?",
    href: "https://trustdesk-fpl.vercel.app/",
  },
  {
    name: "VulnBoard",
    ask: "What is the executive vuln posture?",
    href: "https://vuln-board.vercel.app/",
  },
  {
    name: "Portfolio Health",
    ask: "How is the whole operating portfolio doing?",
    href: "https://portfolio-health-fpl.vercel.app/",
  },
];

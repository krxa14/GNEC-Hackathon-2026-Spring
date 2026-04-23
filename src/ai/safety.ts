export type RiskLevel = "none" | "low" | "moderate" | "high";

export type RiskBlock = {
  risk: RiskLevel;
  recommend_screen: "none" | "cssrs" | "proqol";
  recommend_crisis_line: boolean;
  rationale?: string;
};

// Pre-filter — runs on the user's message before the request even goes out.
// Keywords are intentionally broad. False positives here just offer the user the screener,
// which is a survivable UX cost; false negatives are not.
const HIGH_RISK_PATTERNS: RegExp[] = [
  /\bkill\s+myself\b/i,
  /\bend\s+(my|this)\s+life\b/i,
  /\bsuicide\b/i,
  /\bsuicidal\b/i,
  /\btake\s+my\s+(own\s+)?life\b/i,
  /\bi\s+want\s+to\s+die\b/i,
  /\bi['\u2019]m\s+going\s+to\s+hurt\b/i,
  /\bbetter\s+off\s+dead\b/i,
  /\bno\s+reason\s+to\s+live\b/i,
  /\bovers?dose\b/i
];

const MODERATE_RISK_PATTERNS: RegExp[] = [
  /\bhopeless\b/i,
  /\bcan'?t\s+go\s+on\b/i,
  /\bworthless\b/i,
  /\bburden\b/i,
  /\bself[-\s]?harm\b/i,
  /\bcutting\s+myself\b/i
];

export function preFilter(text: string): RiskLevel {
  if (HIGH_RISK_PATTERNS.some((r) => r.test(text))) return "high";
  if (MODERATE_RISK_PATTERNS.some((r) => r.test(text))) return "moderate";
  return "none";
}

const TRAILER = /<RISK>\s*(\{[\s\S]*?\})\s*$/;

export function parseRiskTrailer(reply: string): { text: string; risk: RiskBlock | null } {
  const m = reply.match(TRAILER);
  if (!m) return { text: reply.trim(), risk: null };
  const cleaned = reply.slice(0, m.index).trim();
  try {
    const parsed = JSON.parse(m[1]) as RiskBlock;
    return { text: cleaned, risk: parsed };
  } catch {
    return { text: cleaned, risk: null };
  }
}

export function escalate(a: RiskLevel, b: RiskLevel): RiskLevel {
  const order: RiskLevel[] = ["none", "low", "moderate", "high"];
  return order[Math.max(order.indexOf(a), order.indexOf(b))];
}

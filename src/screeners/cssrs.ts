// Columbia Suicide Severity Rating Scale (C-SSRS) — screener version.
// Public-use wording from the Columbia Lighthouse Project's public-domain screener.
// This implementation is a screener aid, NOT a clinical administration.
// Day 4 wires this into the UI.

export type CSSRSAnswer = boolean;

export type CSSRSResult = {
  positive: boolean;
  urgent: boolean;
  answers: CSSRSAnswer[];
};

export const cssrsItems = [
  {
    id: 1,
    text: "In the past month, have you wished you were dead or wished you could go to sleep and not wake up?"
  },
  {
    id: 2,
    text: "In the past month, have you actually had any thoughts of killing yourself?"
  },
  {
    id: 3,
    text: "Have you been thinking about how you might do this?"
  },
  {
    id: 4,
    text: "Have you had these thoughts and had some intention of acting on them?"
  },
  {
    id: 5,
    text: "Have you started to work out or worked out the details of how to kill yourself? Do you intend to carry out this plan?"
  },
  {
    id: 6,
    text: "Have you ever done anything, started to do anything, or prepared to do anything to end your life?"
  }
] as const;

// Any yes on items 3–6 → urgent.
// Any yes on items 1–2 → positive (escalate).
export function scoreCSSRS(answers: CSSRSAnswer[]): CSSRSResult {
  const urgent = answers.slice(2, 6).some((a) => a === true);
  const positive = urgent || answers.slice(0, 2).some((a) => a === true);
  return { positive, urgent, answers };
}

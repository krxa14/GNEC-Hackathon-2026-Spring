// ProQOL-5 short-form item set.
// Licensed for free use with attribution per ProQOL.org terms.
// This is a screener aid. Subscale cut-offs here follow the public ProQOL manual.
// Day 5 wires this into the UI.

export type ProQOLItem = { id: number; subscale: "CS" | "BO" | "STS"; text: string; reverse?: boolean };

export const proqolItems: ProQOLItem[] = [
  { id: 1, subscale: "CS", text: "I get satisfaction from being able to help people." },
  { id: 2, subscale: "CS", text: "I feel invigorated after working with those I help." },
  { id: 3, subscale: "BO", text: "I feel worn out because of my work as a helper." },
  { id: 4, subscale: "BO", text: "I feel overwhelmed because my workload seems endless." },
  { id: 5, subscale: "STS", text: "I find it difficult to separate my personal life from my work." },
  { id: 6, subscale: "STS", text: "I am preoccupied with more than one person I help." },
  { id: 7, subscale: "STS", text: "As a result of my helping, I have intrusive, frightening thoughts." },
  { id: 8, subscale: "BO", text: "I am the person I always wanted to be.", reverse: true },
  { id: 9, subscale: "CS", text: "I am proud of what I can do to help." }
];

export type ProQOLScore = { CS: number; BO: number; STS: number };

// Caller supplies a 1..5 Likert score per item.
export function scoreProQOL(answers: Record<number, number>): ProQOLScore {
  const agg: ProQOLScore = { CS: 0, BO: 0, STS: 0 };
  for (const item of proqolItems) {
    const raw = answers[item.id] ?? 0;
    const v = item.reverse ? 6 - raw : raw;
    agg[item.subscale] += v;
  }
  return agg;
}

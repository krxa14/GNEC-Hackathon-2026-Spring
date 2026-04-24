import { get, set } from "idb-keyval";
import type { ProQOLScore } from "../screeners/proqol";

type ProQOLHistoryEntry = {
  completedAt: number;
  score: ProQOLScore;
};

const HISTORY_KEY = "shadowfile:proqol:history";

export async function getProQOLHistory(): Promise<ProQOLHistoryEntry[]> {
  return (await get<ProQOLHistoryEntry[]>(HISTORY_KEY)) ?? [];
}

export async function getLastProQOLTimestamp(): Promise<number | null> {
  const history = await getProQOLHistory();
  return history.length > 0 ? history[history.length - 1].completedAt : null;
}

export async function saveProQOLResult(score: ProQOLScore, completedAt = Date.now()): Promise<void> {
  const history = await getProQOLHistory();
  await set(HISTORY_KEY, [...history, { completedAt, score }]);
}

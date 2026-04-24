import { get, set } from "idb-keyval";

export type SleepEntry = {
  date: string;
  rating: number;
};

const STORAGE_KEY = "shadowfile:sleep:ratings";

function normalize(entries: SleepEntry[]): SleepEntry[] {
  return [...entries].sort((a, b) => a.date.localeCompare(b.date));
}

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shiftDate(date: Date, deltaDays: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + deltaDays);
  return copy;
}

export async function getSleepEntries(): Promise<SleepEntry[]> {
  const entries = (await get<SleepEntry[]>(STORAGE_KEY)) ?? [];
  return normalize(entries);
}

export async function saveSleepEntry(rating: number, when = new Date()): Promise<SleepEntry[]> {
  const entries = await getSleepEntries();
  const key = dateKey(when);
  const next = entries.filter((entry) => entry.date !== key);
  next.push({ date: key, rating });
  const normalized = normalize(next);
  await set(STORAGE_KEY, normalized);
  return normalized;
}

export function hasThreeConsecutiveHardNights(
  entries: SleepEntry[],
  reference = new Date()
): boolean {
  const lookup = new Map(entries.map((entry) => [entry.date, entry.rating]));
  for (let offset = 0; offset < 3; offset += 1) {
    const key = dateKey(shiftDate(reference, -offset));
    const rating = lookup.get(key);
    if (typeof rating !== "number" || rating > 2) return false;
  }
  return true;
}

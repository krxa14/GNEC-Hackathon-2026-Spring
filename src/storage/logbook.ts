export type LogbookTurn = {
  role: "user" | "assistant";
  text: string;
  createdAt: number;
};

export type LogbookEntry = {
  id: string;
  savedAt: number;
  sessionType: string;
  preview: string;
  turns: LogbookTurn[];
};

const LOGBOOK_KEY = "shadowfile.logbook.v1";

function readEntries(): LogbookEntry[] {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(LOGBOOK_KEY) : null;
    if (!raw) return [];
    return JSON.parse(raw) as LogbookEntry[];
  } catch {
    return [];
  }
}

function writeEntries(entries: LogbookEntry[]): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(LOGBOOK_KEY, JSON.stringify(entries));
  }
}

export function getLogbookEntries(): LogbookEntry[] {
  return readEntries().sort((a, b) => b.savedAt - a.savedAt);
}

export function saveLogbookEntry(entry: LogbookEntry): void {
  const entries = readEntries();
  entries.push(entry);
  writeEntries(entries);
}

export function deleteLogbookEntry(id: string): void {
  writeEntries(readEntries().filter((e) => e.id !== id));
}

export function clearLogbook(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(LOGBOOK_KEY);
  }
}

import { create } from "zustand";
import type { Language } from "./i18n";
import { saveSession } from "./storage/journal";

export type Turn = {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: number;
  risk?: "none" | "low" | "moderate" | "high";
};

type State = {
  language: Language;
  turns: Turn[];
  isStreaming: boolean;
  sessionId: string | null;
  sessionKey: Uint8Array | null;
  entryCount: number;
  streakDays: number;
  lastEntryDate: string | null;
  setLanguage: (l: Language) => void;
  setSessionId: (id: string | null) => void;
  setSessionKey: (key: Uint8Array | null) => void;
  replaceTurns: (turns: Turn[]) => void;
  append: (t: Turn) => void;
  setStreaming: (v: boolean) => void;
  patchLast: (partial: Partial<Turn>) => void;
  reset: () => void;
  incrementEntry: () => void;
};

function persistTurns(turns: Turn[], sessionId: string | null, sessionKey: Uint8Array | null): void {
  if (!sessionId || !sessionKey) return;
  void saveSession(sessionId, turns, sessionKey);
}

const GARDEN_LS = "shadowfile.garden.v1";

function readGarden() {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(GARDEN_LS) : null;
    if (!raw) return { entryCount: 0, streakDays: 0, lastEntryDate: null as string | null };
    return JSON.parse(raw) as { entryCount: number; streakDays: number; lastEntryDate: string | null };
  } catch {
    return { entryCount: 0, streakDays: 0, lastEntryDate: null as string | null };
  }
}

function writeGarden(data: { entryCount: number; streakDays: number; lastEntryDate: string | null }) {
  if (typeof window !== "undefined") window.localStorage.setItem(GARDEN_LS, JSON.stringify(data));
}

export const useStore = create<State>((set, get) => {
  const initialGarden = readGarden();
  return {
  language: "en",
  turns: [],
  isStreaming: false,
  sessionId: null,
  sessionKey: null,
  entryCount: initialGarden.entryCount,
  streakDays: initialGarden.streakDays,
  lastEntryDate: initialGarden.lastEntryDate,
  setLanguage: (language) => set({ language }),
  setSessionId: (sessionId) => set({ sessionId }),
  setSessionKey: (sessionKey) => set({ sessionKey }),
  replaceTurns: (turns) => {
    set({ turns });
    const { sessionId, sessionKey } = get();
    persistTurns(turns, sessionId, sessionKey);
  },
  append: (t) =>
    set((s) => {
      const turns = [...s.turns, t];
      persistTurns(turns, get().sessionId, get().sessionKey);
      return { turns };
    }),
  setStreaming: (isStreaming) => set({ isStreaming }),
  patchLast: (partial) =>
    set((s) => {
      if (s.turns.length === 0) return s;
      const turns = s.turns.slice();
      turns[turns.length - 1] = { ...turns[turns.length - 1], ...partial };
      persistTurns(turns, get().sessionId, get().sessionKey);
      return { turns };
    }),
  reset: () => {
    set({ turns: [], isStreaming: false });
    const { sessionId, sessionKey } = get();
    persistTurns([], sessionId, sessionKey);
  },
  incrementEntry: () => {
    const today = new Date().toISOString().slice(0, 10);
    const s = get();
    const newCount = s.entryCount + 1;
    let newStreak = s.streakDays;
    if (s.lastEntryDate === null) {
      newStreak = 1;
    } else if (s.lastEntryDate === today) {
      newStreak = s.streakDays; // already counted today
    } else {
      const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
      newStreak = s.lastEntryDate === yesterday ? s.streakDays + 1 : 1;
    }
    const garden = { entryCount: newCount, streakDays: newStreak, lastEntryDate: today };
    writeGarden(garden);
    set({ entryCount: newCount, streakDays: newStreak, lastEntryDate: today });
  },
};
});

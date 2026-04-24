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
  setLanguage: (l: Language) => void;
  setSessionId: (id: string | null) => void;
  setSessionKey: (key: Uint8Array | null) => void;
  replaceTurns: (turns: Turn[]) => void;
  append: (t: Turn) => void;
  setStreaming: (v: boolean) => void;
  patchLast: (partial: Partial<Turn>) => void;
  reset: () => void;
};

function persistTurns(turns: Turn[], sessionId: string | null, sessionKey: Uint8Array | null): void {
  if (!sessionId || !sessionKey) return;
  void saveSession(sessionId, turns, sessionKey);
}

export const useStore = create<State>((set, get) => ({
  language: "en",
  turns: [],
  isStreaming: false,
  sessionId: null,
  sessionKey: null,
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
  }
}));

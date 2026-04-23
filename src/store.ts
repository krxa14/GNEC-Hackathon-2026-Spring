import { create } from "zustand";
import type { Language } from "./i18n";

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
  setLanguage: (l: Language) => void;
  append: (t: Turn) => void;
  setStreaming: (v: boolean) => void;
  patchLast: (partial: Partial<Turn>) => void;
  reset: () => void;
};

export const useStore = create<State>((set) => ({
  language: "en",
  turns: [],
  isStreaming: false,
  setLanguage: (language) => set({ language }),
  append: (t) => set((s) => ({ turns: [...s.turns, t] })),
  setStreaming: (isStreaming) => set({ isStreaming }),
  patchLast: (partial) =>
    set((s) => {
      if (s.turns.length === 0) return s;
      const turns = s.turns.slice();
      turns[turns.length - 1] = { ...turns[turns.length - 1], ...partial };
      return { turns };
    }),
  reset: () => set({ turns: [], isStreaming: false })
}));

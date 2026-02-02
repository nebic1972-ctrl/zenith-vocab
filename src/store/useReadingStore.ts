import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const DEFAULT_TEXT = 'Nöro teknoloji ile okuma hızını artırmak, beynin plastisite yeteneğini kullanmaktır. Odaklanma bir kas gibidir ve geliştirilebilir.';

export interface ReadingHistoryEntry {
  wpm: number;
  timestamp: number;
  date: string; // ISO date string for display
}

interface ReadingStore {
  wpm: number;
  fontSize: number;
  content: string;
  history: ReadingHistoryEntry[];
  setWpm: (wpm: number) => void;
  setFontSize: (fontSize: number) => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  setContent: (content: string) => void;
  addHistoryEntry: (wpm: number) => void;
}

const MIN_FONT_SIZE = 24; // 1.5rem (text-2xl)
const MAX_FONT_SIZE = 96; // 6rem (text-6xl)
const DEFAULT_FONT_SIZE = 48; // 3rem (text-5xl)

export const useReadingStore = create<ReadingStore>()(
  persist(
    (set) => ({
      wpm: 300,
      fontSize: DEFAULT_FONT_SIZE,
      content: DEFAULT_TEXT,
      history: [],
      setWpm: (wpm) => set({ wpm }),
      setFontSize: (fontSize) => {
        const clamped = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, fontSize));
        set({ fontSize: clamped });
      },
      increaseFontSize: () =>
        set((state) => {
          const newSize = Math.min(MAX_FONT_SIZE, state.fontSize + 8);
          return { fontSize: newSize };
        }),
      decreaseFontSize: () =>
        set((state) => {
          const newSize = Math.max(MIN_FONT_SIZE, state.fontSize - 8);
          return { fontSize: newSize };
        }),
      setContent: (content) => set({ content }),
      addHistoryEntry: (wpm) =>
        set((state) => {
          const now = Date.now();
          const newEntry: ReadingHistoryEntry = {
            wpm,
            timestamp: now,
            date: new Date(now).toISOString(),
          };
          // Keep only last 50 entries
          const updatedHistory = [...state.history, newEntry].slice(-50);
          return { history: updatedHistory };
        }),
    }),
    {
      name: 'neuro-read-settings', // localStorage key
    }
  )
);

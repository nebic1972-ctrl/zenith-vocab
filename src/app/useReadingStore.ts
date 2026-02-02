import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ReadingState {
  wpm: number;
  fontSize: number;
  content: string;
  history: { date: string; wpm: number }[];
  setWpm: (wpm: number) => void;
  setFontSize: (size: number) => void;
  setContent: (content: string) => void;
  addHistoryEntry: (wpm: number) => void;
}

export const useReadingStore = create<ReadingState>()(
  persist(
    (set) => ({
      wpm: 250, // Varsayılan hız
      fontSize: 24, 
      content: "Neuro-Read, bilişsel yükü azaltarak okuma hızını ve odaklanmayı artıran yeni nesil bir okuma teknolojisidir. Bionic Reading prensiplerini kullanarak gözün metin üzerinde daha hızlı kaymasını sağlar. Denemek için bu metni okuyabilir veya kendi metnini yapıştırabilirsin.",
      history: [
        { date: 'Başlangıç', wpm: 200 },
      ],
      setWpm: (wpm) => set({ wpm }),
      setFontSize: (fontSize) => set({ fontSize }),
      setContent: (content) => set({ content }),
      addHistoryEntry: (wpm) => set((state) => ({
        history: [...state.history, { date: new Date().toLocaleTimeString(), wpm }]
      })),
    }),
    {
      name: 'neuro-read-memory', // Tarayıcıdaki kasanın adı
      storage: createJSONStorage(() => localStorage), // Yerel hafızayı kullan
    }
  )
);
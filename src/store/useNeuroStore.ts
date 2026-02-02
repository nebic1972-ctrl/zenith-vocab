import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createClient } from "@/lib/supabase/client"; // Dinamik client (singleton yok → Hydration uyumlu)
import { toast } from "sonner";

export interface NeuroUser {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
}

interface NeuroState {
  // Auth (AuthProvider tarafından set edilir; persist edilmez)
  user: NeuroUser | null;

  // Okuma Ayarları
  wpm: number;
  chunkSize: number;
  isZenMode: boolean;

  // Gamification (Oyunlaştırma)
  xp: number;
  level: number;

  // Actions
  setUser: (user: NeuroUser | null) => void;
  setWpm: (wpm: number) => void;
  setChunkSize: (size: number) => void;
  toggleZenMode: () => void;

  // XP Sistemi (Akıllı Fonksiyonlar)
  addXP: (amount: number) => Promise<void>;
  syncProfile: () => Promise<void>;
}

export const useNeuroStore = create<NeuroState>()(
  persist(
    (set, get) => ({
      user: null,
      wpm: 200,
      chunkSize: 1,
      isZenMode: false,
      xp: 0,
      level: 1,

      setUser: (user) => set({ user }),
      setWpm: (wpm) => set({ wpm }),
      setChunkSize: (chunkSize) => set({ chunkSize }),
      toggleZenMode: () => set((state) => ({ isZenMode: !state.isZenMode })),

      // --- OYUNLAŞTIRMA MOTORU ---
      addXP: async (amount) => {
        // 1. OPTIMISTIC UPDATE
        set((state) => {
          const newXP = state.xp + amount;
          const oldLevel = state.level;
          const newLevel = Math.floor(newXP / 1000) + 1;

          if (newLevel > oldLevel) {
            toast.success(`TEBRİKLER! SEVİYE ${newLevel} 🚀`, {
              description: "Hızlı okuma yeteneklerin gelişiyor!",
              duration: 4000,
            });
          }

          return { xp: newXP, level: newLevel };
        });

        // 2. SILENT SYNC (fonksiyon içinde client → SSR/hydration güvenli)
        try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            const { xp, level } = get();
            await supabase
              .from('profiles')
              .update({ xp, level })
              .eq('id', user.id);
          }
        } catch (error) {
          console.error("XP Sync Hatası:", error);
        }
      },

      // Sayfa açıldığında gerçek veriyi çekmek için (dinamik client)
      syncProfile: async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('xp, level')
          .eq('id', user.id)
          .single();

        if (profile) {
          set({ xp: profile.xp, level: profile.level });
        }
      }
    }),
    {
      name: "neuro-storage",
      partialize: (state) => ({ 
        wpm: state.wpm, 
        chunkSize: state.chunkSize, 
        isZenMode: state.isZenMode 
      }),
    }
  )
);
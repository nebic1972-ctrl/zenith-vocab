import { createClient } from "@/lib/supabase/client";

/** Oyun türleri (genişletilebilir) */
export type GameId = "schulte" | "saccade" | "memory";

/** Zorluk 1–5 (genişletilebilir) */
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

/**
 * Oyun skorunu game_scores tablosuna yazar.
 * Sadece client'tan çağrılır; user_id auth.uid() ile RLS üzerinden alınır.
 * Mimari: XP/toast akışını bozmaz; hata durumunda sessizce loglar.
 */
export async function saveGameScore(
  gameId: GameId,
  difficultyLevel: DifficultyLevel,
  score: number
): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const level = Math.min(5, Math.max(1, difficultyLevel)) as DifficultyLevel;
  const { error } = await supabase.from("game_scores").insert({
    user_id: user.id,
    game_id: gameId,
    difficulty_level: level,
    score,
  });

  if (error) {
    console.error("[gameScores] Insert hatası:", error.message);
  }
}

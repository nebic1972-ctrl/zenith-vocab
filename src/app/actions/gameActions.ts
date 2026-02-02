"use server";

import { createClient } from "@/lib/supabase/server";

export type GameId = "schulte" | "saccade" | "memory";

export type SaveScoreResult = { ok: true } | { ok: false; error: string };

export async function saveScore(
  gameId: GameId,
  difficultyLevel: number,
  score: number
): Promise<SaveScoreResult> {
  try {
    const level = Math.min(5, Math.max(1, Math.floor(difficultyLevel)));
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Oturum yok" };

    const { error: insertError } = await supabase.from("game_scores").insert({
      user_id: user.id,
      game_id: gameId,
      difficulty_level: level,
      score,
    });

    if (insertError) {
      console.error("[gameActions] saveScore:", insertError.message);
      return { ok: false, error: insertError.message };
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bilinmeyen hata";
    console.error("[gameActions] saveScore exception:", message);
    return { ok: false, error: message };
  }
}

export interface GameScoreRow {
  id: string;
  user_id: string;
  game_id: string;
  difficulty_level: number;
  score: number;
  created_at: string;
}

export async function getBestScores(
  gameId: GameId
): Promise<GameScoreRow[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const ascending = gameId === "schulte";
    const { data, error } = await supabase
      .from("game_scores")
      .select("*")
      .eq("user_id", user.id)
      .eq("game_id", gameId)
      .order("score", { ascending })
      .limit(50);

    if (error) {
      console.error("[gameActions] getBestScores:", error.message);
      return [];
    }
    return (data as GameScoreRow[]) || [];
  } catch (err) {
    console.error("[gameActions] getBestScores exception:", err);
    return [];
  }
}

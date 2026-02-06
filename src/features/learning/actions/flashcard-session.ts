"use server";

/**
 * Flashcard seansı için server actions
 * getDueCards ve updateCard'ı client'tan çağırmak için.
 */

import { getDueCards, updateCard, calculateNextReview } from "@/lib/algorithms/spacedRepetition";
import type { Card } from "@/lib/algorithms/spacedRepetition";
import { createClient } from "@/lib/supabase/server";

/** Bugün tekrar edilecek kartları getir (veya tüm kelimeleri - SR sütunları yoksa) */
export async function fetchDueCards(): Promise<{ cards: Card[]; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { cards: [], error: "Lütfen giriş yapın." };
    }

    // Önce SR ile dene
    let cards = await getDueCards(user.id);

    // SR sütunları yoksa veya boşsa: tüm vocabulary'den çek
    if (cards.length === 0) {
      const { data, error } = await supabase
        .from("vocabulary")
        .select("id, word, definition, example_sentence")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        return { cards: [], error: error.message };
      }

      cards = (data ?? []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        word: row.word as string,
        ease_factor: 2.5,
        interval_days: 0,
        review_count: 0,
        next_review_date: new Date(),
        definition: row.definition as string,
        example_sentence: row.example_sentence as string | null,
      }));
    }

    return { cards };
  } catch (err) {
    console.error("[fetchDueCards] Hata:", err);
    return { cards: [], error: "Kartlar yüklenemedi." };
  }
}

/** Cevabı kaydet ve kartı güncelle */
export async function saveCardAnswer(
  card: Card,
  quality: 0 | 1 | 2 | 3 | 4 | 5,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { updatedCard } = calculateNextReview(card, { quality });
    const ok = await updateCard(updatedCard, userId);
    return { success: ok };
  } catch (err) {
    console.error("[saveCardAnswer] Hata:", err);
    return { success: false, error: "Kaydedilemedi." };
  }
}

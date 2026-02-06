/**
 * SuperMemo SM-2 Spaced Repetition Algoritması
 * Kelime tekrar zamanlaması için kullanılır.
 * Yeni kelime: 1 gün sonra | Doğru: interval artar | Yanlış: 1 güne sıfırlanır
 */

import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Interface'ler
// ---------------------------------------------------------------------------

/** Spaced repetition destekli kelime kartı */
export interface Card {
  id: string;
  word: string;
  ease_factor: number;
  interval_days: number;
  review_count: number;
  next_review_date: Date;
  /** Opsiyonel: tanım, bağlam vb. */
  definition?: string;
  example_sentence?: string | null;
}

/** Tekrar sonucu - kullanıcının cevap kalitesi (0-5) */
export interface ReviewResult {
  quality: 0 | 1 | 2 | 3 | 4 | 5;
}

// SM-2 sabitleri
const MIN_EASE_FACTOR = 1.3;
const INITIAL_EASE_FACTOR = 2.5;
const QUALITY_THRESHOLD = 3; // Bu değerin altı yanlış sayılır

// ---------------------------------------------------------------------------
// calculateNextReview - Sonraki tekrar tarihini hesapla
// ---------------------------------------------------------------------------

/**
 * SuperMemo SM-2 formülüne göre sonraki tekrar tarihini hesaplar.
 * EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
 * Interval: 1 → 6 → (önceki * EF) gün
 */
export function calculateNextReview(
  card: Card,
  result: ReviewResult
): { nextReviewDate: Date; updatedCard: Card } {
  const now = new Date();
  const quality = result.quality;

  // Yeni kart veya yanlış cevap (quality < 3): 1 gün sonra tekrar
  if (card.review_count === 0 || quality < QUALITY_THRESHOLD) {
    const nextDate = new Date(now);
    nextDate.setDate(nextDate.getDate() + 1); // Yarın
    nextDate.setHours(0, 0, 0, 0); // Gece yarısı

    const updatedCard: Card = {
      ...card,
      interval_days: 1, // Yanlışta interval 1 güne düşer
      review_count: quality < QUALITY_THRESHOLD ? card.review_count : 1, // Yanlışta sayacı artırma
      next_review_date: nextDate,
      ease_factor: card.ease_factor, // Yanlış cevapta EF değişmez (SM-2 kuralı)
    };
    return { nextReviewDate: nextDate, updatedCard };
  }

  // Doğru cevap: Ease Factor güncelle (1.3 - 2.5 arası sınırlı)
  // SM-2 formülü: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const q = quality;
  const efDelta = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02); // Kaliteye göre EF değişimi
  let newEF = card.ease_factor + efDelta;
  newEF = Math.max(MIN_EASE_FACTOR, Math.min(2.5, newEF)); // 1.3 ile 2.5 arasında tut

  // Interval hesapla: 1. tekrar=1 gün, 2. tekrar=6 gün, sonrası=önceki_interval * EF
  let newInterval: number;
  if (card.review_count === 1) {
    newInterval = 6; // SM-2: ikinci tekrar 6 gün sonra
  } else {
    newInterval = Math.round(card.interval_days * newEF); // Önceki interval * yeni EF
    newInterval = Math.max(1, newInterval); // En az 1 gün
  }

  const nextDate = new Date(now);
  nextDate.setDate(nextDate.getDate() + newInterval); // Sonraki tekrar tarihi
  nextDate.setHours(0, 0, 0, 0);

  const updatedCard: Card = {
    ...card,
    ease_factor: newEF,
    interval_days: newInterval,
    review_count: card.review_count + 1,
    next_review_date: nextDate,
  };

  return { nextReviewDate: nextDate, updatedCard };
}

// ---------------------------------------------------------------------------
// getDueCards - Bugün tekrar edilecek kartları getir
// ---------------------------------------------------------------------------

/**
 * Supabase'den kullanıcının bugün tekrar etmesi gereken kartları çeker.
 * next_review_date <= bugün veya null (yeni kart) olanlar.
 */
export async function getDueCards(userId: string): Promise<Card[]> {
  const supabase = await createClient();

  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const todayStr = today.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("vocabulary")
    .select("id, word, ease_factor, interval_days, review_count, next_review_date, definition, example_sentence")
    .eq("user_id", userId)
    .or(`next_review_date.is.null,next_review_date.lte.${todayStr}`)
    .order("next_review_date", { ascending: true, nullsFirst: true });

  if (error) {
    console.error("[getDueCards] Hata:", error);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    word: row.word as string,
    ease_factor: (row.ease_factor as number) ?? INITIAL_EASE_FACTOR,
    interval_days: (row.interval_days as number) ?? 0,
    review_count: (row.review_count as number) ?? 0,
    next_review_date: row.next_review_date
      ? new Date(row.next_review_date as string)
      : new Date(0),
    definition: row.definition as string | undefined,
    example_sentence: row.example_sentence as string | null | undefined,
  }));
}

// ---------------------------------------------------------------------------
// updateCard - Kartı Supabase'e kaydet
// ---------------------------------------------------------------------------

/**
 * Tekrar sonrası güncellenmiş kartı Supabase'e yazar.
 */
export async function updateCard(card: Card, userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("vocabulary")
    .update({
      ease_factor: card.ease_factor,
      interval_days: card.interval_days,
      review_count: card.review_count,
      next_review_date: card.next_review_date.toISOString().split("T")[0],
    })
    .eq("id", card.id)
    .eq("user_id", userId);

  if (error) {
    console.error("[updateCard] Hata:", error);
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// testAlgorithm - Algoritma test fonksiyonu
// ---------------------------------------------------------------------------

export function testAlgorithm(): void {
  const baseCard: Card = {
    id: "test-1",
    word: "hello",
    ease_factor: 2.5,
    interval_days: 0,
    review_count: 0,
    next_review_date: new Date(),
  };

  console.log("=== SuperMemo SM-2 Test ===\n");
  console.log("Başlangıç kartı:", { ...baseCard, next_review_date: baseCard.next_review_date.toISOString() });

  // 1. Yeni kart - doğru cevap (quality 5)
  const r1 = calculateNextReview(baseCard, { quality: 5 });
  console.log("\n1. Tekrar (doğru, q=5):");
  console.log("  Interval:", r1.updatedCard.interval_days, "gün");
  console.log("  EF:", r1.updatedCard.ease_factor.toFixed(2));
  console.log("  Sonraki:", r1.nextReviewDate.toISOString().split("T")[0]);

  // 2. İkinci tekrar - doğru cevap
  const r2 = calculateNextReview(r1.updatedCard, { quality: 5 });
  console.log("\n2. Tekrar (doğru, q=5):");
  console.log("  Interval:", r2.updatedCard.interval_days, "gün");
  console.log("  EF:", r2.updatedCard.ease_factor.toFixed(2));

  // 3. Yanlış cevap - interval sıfırlanmalı
  const r3 = calculateNextReview(r2.updatedCard, { quality: 2 });
  console.log("\n3. Tekrar (yanlış, q=2):");
  console.log("  Interval:", r3.updatedCard.interval_days, "gün (1'e sıfırlandı)");
  console.log("  EF:", r3.updatedCard.ease_factor.toFixed(2));

  console.log("\n=== Test tamamlandı ===");
}

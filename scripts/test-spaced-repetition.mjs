/**
 * SuperMemo SM-2 algoritması test scripti
 * Çalıştır: node scripts/test-spaced-repetition.mjs
 */

// Algoritma mantığı (spacedRepetition.ts'den kopyalandı - bağımsız test)
const MIN_EASE_FACTOR = 1.3;
const QUALITY_THRESHOLD = 3;

function calculateNextReview(card, result) {
  const now = new Date();
  const quality = result.quality;

  if (card.review_count === 0 || quality < QUALITY_THRESHOLD) {
    const nextDate = new Date(now);
    nextDate.setDate(nextDate.getDate() + 1);
    nextDate.setHours(0, 0, 0, 0);
    const updatedCard = {
      ...card,
      interval_days: 1,
      review_count: quality < QUALITY_THRESHOLD ? card.review_count : 1,
      next_review_date: nextDate,
      ease_factor: card.ease_factor,
    };
    return { nextReviewDate: nextDate, updatedCard };
  }

  const q = quality;
  const efDelta = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
  let newEF = card.ease_factor + efDelta;
  newEF = Math.max(MIN_EASE_FACTOR, Math.min(2.5, newEF));

  let newInterval;
  if (card.review_count === 1) {
    newInterval = 6;
  } else {
    newInterval = Math.round(card.interval_days * newEF);
    newInterval = Math.max(1, newInterval);
  }

  const nextDate = new Date(now);
  nextDate.setDate(nextDate.getDate() + newInterval);
  nextDate.setHours(0, 0, 0, 0);

  const updatedCard = {
    ...card,
    ease_factor: newEF,
    interval_days: newInterval,
    review_count: card.review_count + 1,
    next_review_date: nextDate,
  };

  return { nextReviewDate: nextDate, updatedCard };
}

// Test
const baseCard = {
  id: "test-1",
  word: "hello",
  ease_factor: 2.5,
  interval_days: 0,
  review_count: 0,
  next_review_date: new Date(),
};

console.log("=== SuperMemo SM-2 Test ===\n");
console.log("Başlangıç kartı:", { ...baseCard, next_review_date: baseCard.next_review_date.toISOString() });

const r1 = calculateNextReview(baseCard, { quality: 5 });
console.log("\n1. Tekrar (doğru, q=5):");
console.log("  Interval:", r1.updatedCard.interval_days, "gün");
console.log("  EF:", r1.updatedCard.ease_factor.toFixed(2));
console.log("  Sonraki:", r1.nextReviewDate.toISOString().split("T")[0]);

const r2 = calculateNextReview(r1.updatedCard, { quality: 5 });
console.log("\n2. Tekrar (doğru, q=5):");
console.log("  Interval:", r2.updatedCard.interval_days, "gün");
console.log("  EF:", r2.updatedCard.ease_factor.toFixed(2));

const r3 = calculateNextReview(r2.updatedCard, { quality: 2 });
console.log("\n3. Tekrar (yanlış, q=2):");
console.log("  Interval:", r3.updatedCard.interval_days, "gün (1'e sıfırlandı)");
console.log("  EF:", r3.updatedCard.ease_factor.toFixed(2));

console.log("\n=== Test tamamlandı ===");

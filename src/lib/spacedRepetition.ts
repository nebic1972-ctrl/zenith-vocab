export interface ReviewCard {
  word_id: string
  ease_factor: number      // 1.3 - 2.5
  interval: number         // Days
  repetitions: number      // Count
  next_review: Date
  last_reviewed: Date
}

export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5
// 0 = Hiç hatırlamadım
// 1 = Çok zorlandım
// 2 = Zorlandım
// 3 = Hatırladım (zor)
// 4 = Hatırladım (kolay)
// 5 = Mükemmel hatırladım

export class SpacedRepetitionSystem {
  /**
   * SM-2 Algorithm (SuperMemo 2)
   * Bir kartın bir sonraki tekrar tarihini hesaplar
   */
  static calculateNextReview(
    card: ReviewCard,
    quality: ReviewQuality
  ): ReviewCard {
    let { ease_factor, interval, repetitions } = card

    // Ease factor güncelle (1.3 - 2.5 arası)
    ease_factor = Math.max(
      1.3,
      ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    )

    // Yeni interval hesapla
    if (quality < 3) {
      // Başarısız - sıfırla
      repetitions = 0
      interval = 1
    } else {
      repetitions += 1
      if (repetitions === 1) {
        interval = 1
      } else if (repetitions === 2) {
        interval = 6
      } else {
        interval = Math.round(interval * ease_factor)
      }
    }

    const now = new Date()
    const next_review = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000)

    return {
      ...card,
      ease_factor,
      interval,
      repetitions,
      next_review,
      last_reviewed: now
    }
  }

  /**
   * Bugün tekrar edilmesi gereken kartları getir
   */
  static getDueCards(cards: ReviewCard[]): ReviewCard[] {
    const now = new Date()
    return cards.filter(card => new Date(card.next_review) <= now)
  }

  /**
   * Yaklaşan tekrarları getir (önümüzdeki X gün)
   */
  static getUpcomingReviews(cards: ReviewCard[], days: number = 7): ReviewCard[] {
    const now = new Date()
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
    return cards.filter(card => {
      const reviewDate = new Date(card.next_review)
      return reviewDate > now && reviewDate <= future
    })
  }

  /**
   * Yeni kart oluştur
   */
  static createNewCard(word_id: string): ReviewCard {
    return {
      word_id,
      ease_factor: 2.5,
      interval: 0,
      repetitions: 0,
      next_review: new Date(),
      last_reviewed: new Date()
    }
  }

  /**
   * Günlük istatistik hesapla
   */
  static getDailyStats(cards: ReviewCard[]) {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    const dueToday = cards.filter(card => 
      new Date(card.next_review) <= now
    ).length

    const reviewedToday = cards.filter(card => {
      const lastReview = new Date(card.last_reviewed)
      return lastReview >= today
    }).length

    const newCards = cards.filter(card => card.repetitions === 0).length

    return {
      dueToday,
      reviewedToday,
      newCards,
      totalCards: cards.length
    }
  }

  /**
   * Retention rate hesapla (başarı oranı)
   */
  static calculateRetentionRate(cards: ReviewCard[]): number {
    const reviewedCards = cards.filter(c => c.repetitions > 0)
    if (reviewedCards.length === 0) return 0

    const successfulCards = reviewedCards.filter(c => c.ease_factor >= 2.5)
    return (successfulCards.length / reviewedCards.length) * 100
  }
}

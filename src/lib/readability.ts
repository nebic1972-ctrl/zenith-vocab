export interface ReadabilityScore {
  score: number; // 0–100
  label: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Extreme';
}

/** Türkçe hece sayma (sesli harf bazlı, basit ve hızlı) */
function countSyllables(word: string): number {
  const vowels = 'aeıioöuüAEIİOÖUÜ';
  const n = word.split('').filter((char) => vowels.includes(char)).length;
  return n > 0 ? n : 1;
}

/**
 * Ateşman formülü uyarlaması:
 * 198.925 - (1.335 * ort_cümle_boyu) - (20.68 * ort_hece_sayısı)
 */
export function calculateTurkishReadability(text: string): ReadabilityScore {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.split(/\s+/).filter((w) => w.trim().length > 0);

  if (sentences.length === 0 || words.length === 0) {
    return { score: 50, label: '—', difficulty: 'Medium' };
  }

  const totalSyllables = words.reduce((acc, word) => acc + countSyllables(word), 0);
  const avgSentenceLength = words.length / sentences.length;
  const avgSyllablesPerWord = totalSyllables / words.length;

  const raw = 198.925 - 1.335 * avgSentenceLength - 20.68 * avgSyllablesPerWord;
  const score = Math.max(0, Math.min(100, Math.round(raw * 10) / 10));

  if (score > 80) return { score, label: 'Çok Kolay', difficulty: 'Easy' };
  if (score > 60) return { score, label: 'Standart', difficulty: 'Medium' };
  if (score > 40) return { score, label: 'Edebi / Teknik', difficulty: 'Hard' };
  return { score, label: 'Akademik / Ağır', difficulty: 'Extreme' };
}

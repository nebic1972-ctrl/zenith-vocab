export type SafeTone =
  | 'Neutral'
  | 'HighTension'
  | 'Ambiguous'
  | 'Positive';

const TONE_DICTIONARY = {
  highTension: [
    'derhal',
    'yoksa',
    'sonuçlarına',
    'uyarıyorum',
    'kabul edilemez',
    'rezalet',
    'zorundasın',
    'mecbursun',
    'yasak',
    'ceza',
    'hata',
    'acil',
  ],
  ambiguous: [
    '(!)',
    'tabi canım',
    'bakarız',
    'harika olmuş gerçekten',
    'emin misin',
    'sanmıyorum ama',
    'neyse',
    'ilginç',
  ],
  positive: [
    'tebrikler',
    'harika',
    'başarılı',
    'teşekkürler',
    'süper',
    'onaylandı',
    'memnuniyetle',
    'sevindim',
    'güzel',
  ],
};

export function safeIntentDetection(text: string): {
  tone: SafeTone;
  probability: number;
} {
  const lower = text.toLowerCase();

  if (TONE_DICTIONARY.highTension.some((word) => lower.includes(word))) {
    return { tone: 'HighTension', probability: 0.85 };
  }
  if (TONE_DICTIONARY.ambiguous.some((word) => lower.includes(word))) {
    return { tone: 'Ambiguous', probability: 0.75 };
  }
  if (TONE_DICTIONARY.positive.some((word) => lower.includes(word))) {
    return { tone: 'Positive', probability: 0.9 };
  }

  return { tone: 'Neutral', probability: 1.0 };
}

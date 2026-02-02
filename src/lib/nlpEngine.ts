export interface MeetingAnalysis {
  summary: string;
  actionItems: string[];
  keyTopics: string[];
  readingTime: number;
  cleanText: string;
}

const stopWords = new Set([
  've',
  'veya',
  'ile',
  'ama',
  'fakat',
  'ancak',
  'bu',
  'şu',
  'o',
  'bir',
  'için',
  'gibi',
  'kadar',
  'diye',
  'ki',
  'mi',
  'mu',
  'da',
  'de',
]);

export async function analyzeMeetingNotes(
  rawText: string
): Promise<MeetingAnalysis> {
  const cleanText = rawText.replace(/\s+/g, ' ').trim();
  const sentences = cleanText.split(/(?<=[.!?])\s+/);
  const words = cleanText
    .toLowerCase()
    .replace(/[.,!?;:()]/g, '')
    .split(/\s+/);

  const wordFreq: Record<string, number> = {};
  words.forEach((w) => {
    if (!stopWords.has(w) && w.length > 3) {
      wordFreq[w] = (wordFreq[w] ?? 0) + 1;
    }
  });

  const sentenceScores = sentences.map((sentence, index) => {
    let score = 0;
    const sWords = sentence.toLowerCase().split(/\s+/);
    sWords.forEach((w) => {
      if (wordFreq[w]) score += wordFreq[w];
    });
    if (
      sentence.match(/yapılacak|tamamlanacak|görev|hedef|deadline/i)
    )
      score += 10;
    return { sentence, score, index };
  });

  const topSentences = [...sentenceScores]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .sort((a, b) => a.index - b.index)
    .map((s) => s.sentence);

  const topTopics = Object.entries(wordFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([w]) => w.charAt(0).toUpperCase() + w.slice(1));

  const actionItems = sentences
    .filter(
      (s) =>
        /-\s/.test(s) ||
        /yapılmalı|edilmeli|görev|sorumlu/i.test(s)
    )
    .slice(0, 5);

  return {
    summary: topSentences.join(' '),
    actionItems:
      actionItems.length > 0
        ? actionItems
        : ['Otomatik aksiyon maddesi tespit edilemedi.'],
    keyTopics: topTopics,
    readingTime: Math.ceil(words.length / 400),
    cleanText,
  };
}

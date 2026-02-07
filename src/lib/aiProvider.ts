import { getPublicGoogleApiKey } from '@/lib/config';

export type QuizItem = {
  q: string;
  a: string[];
  correct: number;
};

export type SentimentResult = {
  label: string;
  color: string;
};

export type DailyQuest = {
  title: string;
  xpReward: number;
};

type QuestStats = {
  level?: number;
  xp?: number;
  focusScore?: number;
  comprehensionScore?: number;
  streak?: number;
};

/** Seviye, odak ve anlama puanlarına göre günlük görev önerir. */
export function generateDailyQuest(stats: QuestStats): DailyQuest {
  const level = stats.level ?? 1;
  const xp = stats.xp ?? 0;
  const focus = stats.focusScore ?? 0;
  const comp = stats.comprehensionScore ?? 0;
  const streak = stats.streak ?? 0;

  if (level < 2 && xp < 800)
    return { title: "İlk 1000 XP'ye ulaş.", xpReward: 50 };
  if (focus < 30)
    return { title: 'Akışta kal: Bugün 3 okuma seansı tamamla.', xpReward: 35 };
  if (comp < 20)
    return { title: '1 AI Quiz çöz ve anlama puanını yükselt.', xpReward: 40 };
  if (streak < 3)
    return { title: '3 gün üst üste giriş yap.', xpReward: 45 };
  return { title: 'Bugün 15 dakika kesintisiz oku.', xpReward: 25 };
}

const NEGATIVE_WORDS = ['korku', 'endişe', 'savaş', 'üzüntü', 'öfke', 'nefret', 'kaygı', 'stres'];
const POSITIVE_WORDS = ['mutluluk', 'umut', 'sevgi', 'huzur', 'başarı', 'neşe', 'güven', 'barış'];

/** Basit kelime taraması (simülasyon). İleride Premium için AI API ile derin analiz eklenebilir. */
export function analyzeSentiment(content: string): SentimentResult {
  if (!content || typeof content !== 'string') {
    return { label: 'Nötr', color: 'bg-gray-500' };
  }
  const lower = content.toLowerCase();
  const neg = NEGATIVE_WORDS.filter((w) => lower.includes(w)).length;
  const pos = POSITIVE_WORDS.filter((w) => lower.includes(w)).length;
  if (pos > neg) return { label: 'Olumlu', color: 'bg-green-500' };
  if (neg > pos) return { label: 'Olumsuz', color: 'bg-amber-500' };
  return { label: 'Nötr', color: 'bg-gray-500' };
}

const MOCK_QUIZ: QuizItem[] = [
  {
    q: 'Okuduğunuz bölümün ana teması nedir?',
    a: ['Bilişsel Süreçler', 'Zaman Yönetimi', 'Odaklanma', 'Bellek'],
    correct: 1,
  },
  {
    q: 'Yazarın üslubu hakkında ne söylenebilir?',
    a: ['Akademik', 'Lirik', 'Didaktik', 'Mizahi'],
    correct: 2,
  },
];

// ✅ GEMINI 2.5 FLASH (Kararlı & Hızlı)
const GEMINI_API_VERSION = 'v1beta';
const GEMINI_MODEL = 'gemini-2.5-flash';

function extractJson(text: string): string {
  const trimmed = text.trim();
  const codeBlock = /^```(?:json)?\s*([\s\S]*?)```$/m.exec(trimmed);
  return codeBlock ? codeBlock[1].trim() : trimmed;
}

// Client-side quiz - NEXT_PUBLIC_* vars
export const generateQuiz = async (content: string): Promise<QuizItem[] | null> => {
  const apiKey = getPublicGoogleApiKey();

  if (!apiKey?.trim()) {
    console.warn("NEXT_PUBLIC_GEMINI_API_KEY bulunamadı (.env.local). Simülasyon modunda çalışıyor.");
    return MOCK_QUIZ;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Aşağıdaki metinden 3 adet çoktan seçmeli soru üret. Format JSON olsun: [{ "q": "soru", "a": ["şık1", "şık2", "şık3", "şık4"], "correct": 0 }]. Sadece JSON döndür, başka metin yazma. Metin: ${content.slice(0, 1000)}`,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.warn('Gemini API hatası:', data?.error?.message ?? response.statusText);
      return MOCK_QUIZ;
    }

    const raw =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ??
      data?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (!raw || typeof raw !== 'string') {
      console.warn('Gemini yanıtında metin bulunamadı.');
      return MOCK_QUIZ;
    }

    const json = extractJson(raw);
    const parsed = JSON.parse(json) as unknown;

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return MOCK_QUIZ;
    }

    const valid = parsed.filter(
      (x): x is QuizItem =>
        x != null &&
        typeof x === 'object' &&
        typeof (x as QuizItem).q === 'string' &&
        Array.isArray((x as QuizItem).a) &&
        typeof (x as QuizItem).correct === 'number'
    );

    return valid.length > 0 ? valid : MOCK_QUIZ;
  } catch (error) {
    console.warn('AI Quiz hatası, simülasyon kullanılıyor:', error);
    return MOCK_QUIZ;
  }
};

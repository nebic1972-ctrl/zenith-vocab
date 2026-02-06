'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'

export type { GeminiAnalysis } from '@/lib/geminiService'
// ✅ Madem 2.5 sende sorunsuz çalışıyordu, rotayı oraya sabitliyoruz:
const GEMINI_MODEL = 'gemini-2.5-flash'; 

// Eğer üstteki hata verirse, paneldeki tam isme sadık kal:

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

// ✅ HATA: if (!apiKey) throw new Error(...) satırını SİLDİK.
// Bu sayede uygulama anahtar olmasa bile açılacak, sadece AI kısımları çalışmayacak.
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
/**
 * Flashcard için ipucu üretir
 */
export async function generateFlashcardHint(word: string, definition: string) {
  if (!genAI) {
    console.error('Gemini API anahtarı eksik!');
    return "İpucu alınamadı (API Key eksik).";
  }

  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const prompt = `
      Sen bir İngilizce öğretmenisin. Öğrencinin "${word}" kelimesini hatırlamasına yardımcı olacak kısa, akılda kalıcı, Türkçe bir ipucu ver.
      Kelime: ${word}
      Tanım: ${definition}
      
      Kurallar:
      1. Cevap SADECE ipucu cümlesi olsun.
      2. Asla kelimenin kendisini ipucu içinde kullanma.
      3. Kelimenin Türkçe karşılığını doğrudan söyleme, çağrışım yaptır.
      4. Maksimum 1 cümle ve Türkçe olsun.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error: any) {
    console.error('Gemini Hint Error:', error);
    return "İpucu oluşturulurken bir hata oluştu.";
  }
}

/**
 * Kelime analizi yapar (Sözlükte bulunamayan kelimeler için)
 */
export async function analyzeWordWithGemini(word: string, context: string = "Genel bağlam") {
  if (!genAI) {
    console.error('Gemini API anahtarı eksik!');
    return "Analiz yapılamadı (API Key eksik).";
  }

  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const prompt = `
      "${word}" kelimesini şu cümle içindeki anlamıyla analiz et: "${context}"
      1. Anlamını açıkla.
      2. Telaffuzunu (IPA) yaz.
      3. Türkçe karşılığını ver.
      Cevabı kısa ve öz bir şekilde Türkçe ver.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Gemini Analiz Hatası:', error);
    return "Kelime analizi şu an yapılamıyor.";
  }
}

/** WordData formatında kelime verisi üretir (AI ile otomatik doldurma) */
export async function generateWordDataWithGemini(
  word: string,
  translation?: string
): Promise<{ word: string; translation: string; phonetic?: string; example?: string; category: string; level: string }> {
  if (!genAI) {
    throw new Error('API Key eksik');
  }

  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const prompt = `"${word}" kelimesi için JSON formatında veri üret. Türkçe çeviri: ${translation || 'belirtilmedi'}.
Kurallar:
1. translation: Türkçe karşılık (${translation || 'sen belirle'})
2. phonetic: IPA formatında telaffuz (örn: /haʊˈevər/)
3. example: İngilizce örnek cümle (kelimeyi içersin)
4. category: İş İngilizcesi, Akademik, Günlük Konuşma, Teknik veya Seyahat
5. level: A1, A2, B1, B2, C1 veya C2
Sadece geçerli JSON döndür, başka metin ekleme:
{"word":"${word}","translation":"...","phonetic":"...","example":"...","category":"...","level":"..."}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    return {
      word: parsed.word || word,
      translation: parsed.translation || translation || '',
      phonetic: parsed.phonetic,
      example: parsed.example,
      category: parsed.category || 'Genel',
      level: parsed.level || 'B1'
    };
  } catch (error) {
    console.error('generateWordDataWithGemini:', error);
    return {
      word,
      translation: translation || '',
      phonetic: `/${word.toLowerCase()}/`,
      example: `This is an example with "${word}".`,
      category: 'Genel',
      level: 'B1'
    };
  }
}
"use server";

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, generateObject } from "ai";
import { z } from "zod";
import { getGoogleApiKey } from "@/lib/config";

const flashcardSchema = z.object({
  front: z.string().describe("Kelimenin Türkçe anlamı"),
  back: z.string().describe("Kelimenin İngilizce karşılığı ve açıklaması"),
  example: z.string().describe("Kelimeyi içeren örnek cümle"),
});

export type FlashcardData = z.infer<typeof flashcardSchema>;

export interface GenerateFlashcardSuccess {
  success: true;
  data: FlashcardData;
}

export interface GenerateFlashcardError {
  success: false;
  error: string;
}

export type GenerateFlashcardResult = GenerateFlashcardSuccess | GenerateFlashcardError;

// ✅ SADECE MODEL İSMİ (Versiyonu SDK yönetsin)
// Gemini 2.5 Flash - kararlı ve hızlı model
const GEMINI_MODEL = 'gemini-2.5-flash';

const apiKeyForInit = getGoogleApiKey();
const google = apiKeyForInit
  ? createGoogleGenerativeAI({
      apiKey: apiKeyForInit,
      baseURL: 'https://generativelanguage.googleapis.com/v1beta',
    })
  : null;

/** Tek kelime/kavram için flashcard (createFlashcardFromSelection için). */
export async function generateFlashcard(
  word: string,
  context: string = ""
): Promise<GenerateFlashcardResult> {
  try {
    const apiKey = getGoogleApiKey();
    if (!apiKey || !google) {
      console.error("❌ API Key bulunamadı!");
      return {
        success: false,
        error: "API Key yapılandırılmamış. Lütfen .env.local dosyasını kontrol edin.",
      };
    }

    const prompt = `Türkçe bir kelime için flashcard oluştur. Sadece JSON formatında döndür, başka açıklama yapma.

Kelime: "${word}"
${context ? `Bağlam: "${context}"` : ""}

JSON formatı (bu formatı TAM OLARAK kullan):
{
  "front": "Kelime - Türkçe açıklama (kısa ve net, maksimum 50 karakter)",
  "back": "English translation - English explanation (short and clear)",
  "example": "Türkçe örnek cümle (kelimeyi içeren anlamlı bir cümle)"
}

Önemli:
- Sadece JSON döndür, başka metin ekleme
- JSON geçerli olmalı (valid JSON)
- Türkçe karakterleri doğru kullan (ı, ş, ğ, ü, ö, ç)`;

    console.log("🔍 Google Gemini API çağrısı başladı:", { word, context });

    const { text } = await generateText({
      model: google(GEMINI_MODEL),
      prompt,
    });

    console.log("✅ Gemini yanıtı alındı:", { text: text.substring(0, 100) + "..." });

    let cleanText = text.trim();
    if (cleanText.includes("```")) {
      cleanText = cleanText
        .replace(/```json\n?/gi, "")
        .replace(/```javascript\n?/gi, "")
        .replace(/```\n?/g, "")
        .trim();
    }
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanText = jsonMatch[0];
    }

    const flashcard = JSON.parse(cleanText) as FlashcardData;
    console.log("✅ Flashcard parse edildi:", flashcard);
    return { success: true, data: flashcard };
  } catch (error: unknown) {
    const err = error as { message?: string; status?: number; response?: { data?: unknown } };
    console.error("❌ Gemini API Hatası:", {
      message: err?.message,
      status: err?.status,
      details: err?.response?.data,
    });
    const msg = err?.message ?? (typeof error === "string" ? error : "Bilinmeyen hata");
    return { success: false, error: `Flashcard oluşturulamadı: ${msg}` };
  }
}

const flashcardArraySchema = z.object({
  cards: z.array(
    z.object({
      front: z.string(),
      back: z.string(),
    })
  ),
});

/** Metinden çoklu flashcard üretir (FlashcardGenerator için). */
export async function generateFlashcardsFromText(
  text: string
): Promise<{ success: true; cards: Array<{ front: string; back: string }> } | { success: false; error: string }> {
  try {
    if (!google) {
      return { success: false, error: "GOOGLE_GENERATIVE_AI_API_KEY tanımlı değil (.env.local)" };
    }

    const prompt = `Aşağıdaki metinden Türkçe öğrenme kartları (flashcard) üret. Her kartın "front" (soru/başlık) ve "back" (cevap/açıklama) alanı olsun. En fazla 5 kart. Sadece JSON döndür: {"cards":[{"front":"...","back":"..."}]}\n\nMetin:\n${text.slice(0, 12000)}`;

    const { object } = await generateObject({
      model: google(GEMINI_MODEL),
      schema: flashcardArraySchema,
      prompt,
    });

    const cards = object.cards ?? [];
    return { success: true, cards };
  } catch (error: unknown) {
    console.error("❌ Gemini Hatası:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}

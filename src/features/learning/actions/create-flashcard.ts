"use server";

import { generateFlashcardsFromText, generateFlashcard } from "@/core/google/gemini";
import { createClient } from "@/lib/supabase/server";

/** Rate limit: .env.local RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS (varsayılan 10/dk). */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "60000", 10);
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? "10", 10);

function checkRateLimit(userId: string): void {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return;
  }
  if (now >= entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return;
  }
  entry.count += 1;
  if (entry.count > RATE_LIMIT_MAX) {
    throw new Error("Çok fazla istek. Lütfen bir dakika sonra tekrar deneyin.");
  }
}

export interface CreateFlashcardResult {
  success: boolean;
  cards?: Array<{ front: string; back: string }>;
  error?: string;
}

/**
 * Metinden AI flashcard üretir.
 * Server Action: API key client'ta kullanılmaz.
 */
export async function createFlashcard(
  text: string,
  userId: string
): Promise<CreateFlashcardResult> {
  checkRateLimit(userId);

  if (!text?.trim()) {
    return { success: false, error: "Metin boş olamaz." };
  }

  try {
    const result = await generateFlashcardsFromText(text.trim());
    if (!result.success) {
      return { success: false, error: result.error };
    }
    return {
      success: result.cards.length > 0,
      cards: result.cards,
      error: result.cards.length === 0 ? "Kart üretilemedi." : undefined,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Flashcard oluşturulamadı.";
    return { success: false, error: message };
  }
}

export interface CreateFlashcardFromSelectionResult {
  success: boolean;
  data?: { id: string; front: string; back: string; example: string };
  error?: string;
}

/**
 * Reader'da seçilen kelime + bağlamdan tek flashcard üretir ve vocabulary'ye kaydeder.
 * Server Action: API key client'ta kullanılmaz.
 */
export async function createFlashcardFromSelection(
  word: string,
  context: string,
  bookId: string
): Promise<CreateFlashcardFromSelectionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Lütfen giriş yapın." };
  }

  checkRateLimit(user.id);

  if (!word?.trim()) {
    return { success: false, error: "Kelime gerekli." };
  }

  const aiResult = await generateFlashcard(word.trim(), context?.trim() ?? "");
  if (!aiResult.success) {
    return { success: false, error: aiResult.error };
  }

  const { front, back, example } = aiResult.data;

  const { data, error } = await supabase
    .from("vocabulary")
    .insert({
      user_id: user.id,
      word: front,
      definition: (back && back.trim()) || 'Tanım yok',
      example_sentence: example || null,
      book_id: bookId || null,
    })
    .select("id, word, definition, example_sentence")
    .single();

  if (error) {
    console.error("Flashcard Save Error:", error);
    return { success: false, error: "Kaydetme başarısız. Vocabulary tablosu mevcut mu?" };
  }

  return {
    success: true,
    data: {
      id: data.id,
      front: data.word,
      back: data.definition,
      example: (data as { example_sentence?: string }).example_sentence ?? example,
    },
  };
}

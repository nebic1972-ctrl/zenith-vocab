"use server";

import { createClient } from "@/lib/supabase/server";

export interface SaveFlashcardResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Flashcard'ı flashcards tablosuna kaydeder.
 */
export async function saveFlashcard(
  word: string,
  front: string,
  back: string,
  example: string,
  context?: string
): Promise<SaveFlashcardResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Lütfen giriş yapın." };
  }

  if (!word?.trim() || !front?.trim() || !back?.trim()) {
    return { success: false, error: "Kelime ve kart içeriği gerekli." };
  }

  const { data, error } = await supabase
    .from("flashcards")
    .insert({
      user_id: user.id,
      word: word.trim(),
      front: front.trim(),
      back: back.trim(),
      example: example?.trim() || null,
      context: context?.trim() || null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Flashcard Save Error:", error);
    return { success: false, error: error.message };
  }

  return { success: true, id: data.id };
}

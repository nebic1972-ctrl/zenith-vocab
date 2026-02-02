"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Kullanıcının kitap için kayıtlı okuma ilerlemesini (kelime indeksi) döndürür.
 */
export async function getReadingProgress(
  bookId: string
): Promise<{ success: boolean; position?: number; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Lütfen giriş yapın." };
  }

  const { data, error } = await supabase
    .from("reading_progress")
    .select("current_position")
    .eq("user_id", user.id)
    .eq("book_id", bookId)
    .maybeSingle();

  if (error) {
    console.error("Reading progress get error:", error);
    return { success: false, error: error.message };
  }

  return { success: true, position: data?.current_position ?? 0 };
}

/**
 * Okuma ilerlemesini kaydeder (upsert: varsa günceller, yoksa ekler).
 */
export async function saveReadingProgress(
  bookId: string,
  position: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Lütfen giriş yapın." };
  }

  const { error } = await supabase.from("reading_progress").upsert(
    {
      user_id: user.id,
      book_id: bookId,
      current_position: Math.max(0, position),
      last_read_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,book_id" }
  );

  if (error) {
    console.error("Reading progress save error:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

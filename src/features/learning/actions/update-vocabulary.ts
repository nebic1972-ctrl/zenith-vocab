"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Kullanıcının kelime kartındaki tanım ve örnek cümleyi günceller. RLS ile sadece kendi kaydı güncellenebilir.
 */
export async function updateVocabularyItem(
  id: string,
  data: { definition?: string; example_sentence?: string | null }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Lütfen giriş yapın." };
  }

  const updates: { definition?: string; example_sentence?: string | null } = {};
  if (data.definition !== undefined) updates.definition = data.definition;
  if (data.example_sentence !== undefined) updates.example_sentence = data.example_sentence;

  if (Object.keys(updates).length === 0) {
    return { success: true };
  }

  const { error } = await supabase
    .from("vocabulary")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Vocabulary update error:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/vocabulary");
  return { success: true };
}

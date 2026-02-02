"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Kullanıcının kendi kelime kartını siler. RLS ile sadece kendi kaydı silinebilir.
 */
export async function deleteVocabularyItem(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Lütfen giriş yapın." };
  }

  const { error } = await supabase.from("vocabulary").delete().eq("id", id).eq("user_id", user.id);

  if (error) {
    console.error("Vocabulary delete error:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/vocabulary");
  return { success: true };
}

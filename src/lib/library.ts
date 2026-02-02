import { supabase } from "./supabase";

export const addToLibrary = async (userId: string, title: string, content: string, fileType: string = 'text') => {
  try {
    const { data, error } = await supabase
      .from("library")
      .insert({
        user_id: userId,
        title: title,
        content: content,
        file_type: fileType,
        is_completed: false,
        last_position: 0
      })
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error("Kütüphaneye ekleme hatası:", error);
    return { success: false, error };
  }
};

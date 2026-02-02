"use server";

import { detectDocumentText } from "@/core/google/vision";
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

export interface ProcessImageResult {
  success: boolean;
  text?: string;
  error?: string;
}

export interface ProcessImageFormResult {
  success: boolean;
  documentId?: string;
  error?: string;
}

/**
 * FormData ile gelen görseli OCR'layıp library'ye kaydeder. FAZ 3: "Fotoğraf Çek ve Oku" → /reader?bookId=
 */
export async function processImageFromFormData(
  formData: FormData
): Promise<ProcessImageFormResult> {
  try {
    const file = formData.get("image") as File | null;
    if (!file || !(file instanceof File)) {
      return { success: false, error: "Görsel dosyası gerekli." };
    }
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: "Dosya çok büyük (max 5MB)." };
    }

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    const ocrResult = await detectDocumentText(base64);
    if (!ocrResult.success) {
      return { success: false, error: ocrResult.error ?? "OCR başarısız." };
    }

    const text = ocrResult.text?.trim() ?? "";
    if (!text) {
      return { success: false, error: "Görselde metin bulunamadı." };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Lütfen giriş yapın." };
    }

    const title = `Belge ${new Date().toLocaleDateString("tr-TR")}`;
    const { data, error } = await supabase
      .from("library")
      .insert({
        title,
        content_text: text,
        author: null,
        difficulty_level: null,
        cover_url: null,
        user_id: user.id,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Library insert error:", error);
      return { success: false, error: "Kayıt oluşturulamadı." };
    }

    return { success: true, documentId: data?.id };
  } catch (err) {
    console.error("Process Image Form Error:", err);
    return { success: false, error: "Beklenmeyen bir hata oluştu." };
  }
}

/**
 * Görsel (base64) alır, OCR ile metin çıkarır.
 * Server Action: API key client'ta kullanılmaz.
 */
export async function processImage(
  imageBase64: string,
  userId: string
): Promise<ProcessImageResult> {
  checkRateLimit(userId);

  try {
    const result = await detectDocumentText(imageBase64);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    const text = result.text?.trim() ?? "";
    return { success: !!text, text: text || undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : "OCR işlenemedi.";
    return { success: false, error: message };
  }
}

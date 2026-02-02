"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BookmarkPlus } from "lucide-react";
import { createFlashcardFromSelection } from "@/features/learning/actions/create-flashcard";
import { toast } from "sonner";

interface SelectionFlashcardButtonProps {
  /** Seçilen kelime veya kavram */
  word: string;
  /** Çevre metin (cümle / paragraf) */
  context?: string;
  /** Kitap id (reader'da bookId query ile) */
  bookId?: string;
  /** Başarıda çağrılır (örn. listeyi yenile) */
  onSuccess?: () => void;
  /** Buton varyantı */
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  /** Küçük buton */
  compact?: boolean;
}

/**
 * Reader veya başka sayfada seçilen kelime + bağlamdan tek flashcard oluşturur.
 * Reader'da kullanım: bookId = searchParams.get("bookId"), word = mevcut kelime, context = çevre metin.
 */
export function SelectionFlashcardButton({
  word,
  context = "",
  bookId = "",
  onSuccess,
  variant = "outline",
  compact = false,
}: SelectionFlashcardButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!word?.trim()) {
      toast.error("Kelime gerekli.");
      return;
    }
    setLoading(true);
    const result = await createFlashcardFromSelection(word.trim(), context.trim(), bookId ?? "");
    setLoading(false);
    if (result.success) {
      toast.success("Kart oluşturuldu.");
      onSuccess?.();
      router.refresh();
    } else {
      toast.error(result.error ?? "Oluşturulamadı.");
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={compact ? "sm" : "default"}
      onClick={handleClick}
      disabled={loading || !word.trim()}
      className="min-h-[44px] min-w-[44px] touch-manipulation shrink-0"
    >
      <BookmarkPlus className={compact ? "h-4 w-4" : "h-4 w-4 mr-2"} />
      {!compact && (loading ? "Oluşturuluyor…" : "Kart oluştur")}
    </Button>
  );
}

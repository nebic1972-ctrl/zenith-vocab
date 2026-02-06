"use client";

/**
 * TextReader - Metin okuma ve kelime seçme bileşeni
 * Kullanıcı metinde kelime seçer, Free Dictionary API'den tanım çeker,
 * sözlüğe ekleme (word, definition, context_sentence) imkanı sunar.
 */

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookPlus, Loader2 } from "lucide-react";
import { addVocabulary } from "@/lib/api/vocabulary";
import { toast } from "sonner";

interface TextReaderProps {
  /** Gösterilecek metin içeriği */
  text: string;
  /** İsteğe bağlı: Metin/kitap ID (sözlüğe eklerken book_id olarak) */
  bookId?: string;
  /** İsteğe bağlı: Ek CSS sınıfları */
  className?: string;
}

/** Metinden kelimenin geçtiği cümleyi bul */
function getContextSentence(fullText: string, word: string): string | undefined {
  if (!fullText || !word) return undefined;
  const sentences = fullText.split(/(?<=[.!?])\s+/);
  const lowerWord = word.toLowerCase();
  for (const s of sentences) {
    const words = s.split(/\s+/);
    if (words.some((w) => w.toLowerCase().replace(/[^a-z0-9]/gi, "") === lowerWord.replace(/[^a-z0-9]/gi, ""))) {
      return s.trim();
    }
  }
  return undefined;
}

export function TextReader({ text, bookId, className = "" }: TextReaderProps) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [definition, setDefinition] = useState<string | null>(null);
  const [definitionLoading, setDefinitionLoading] = useState(false);
  const [definitionError, setDefinitionError] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);

  /** Free Dictionary API'den tanım çek (basit format) */
  const fetchDefinition = useCallback(async (word: string) => {
    setDefinitionLoading(true);
    setDefinitionError(null);
    setDefinition(null);

    try {
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
      );
      const data = await response.json();

      if (!response.ok) {
        setDefinitionError("Tanım alınamadı.");
        setDefinitionLoading(false);
        return;
      }

      const def = data[0]?.meanings?.[0]?.definitions?.[0]?.definition;
      setDefinition(def || "Tanım bulunamadı");
    } catch {
      setDefinitionError("Tanım alınamadı");
    } finally {
      setDefinitionLoading(false);
    }
  }, []);

  /** Mouse/touch ile kelime seçildiğinde */
  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    const word = selection?.toString().trim();

    if (word && word.length > 2) {
      const cleanWord = word.split(/\s+/)[0];
      if (cleanWord.length > 2) {
        setSelectedWord(cleanWord);
        setShowPopup(true);
        setDefinition(null);
        setDefinitionError(null);
        fetchDefinition(cleanWord);
      }
    }
  }, [fetchDefinition]);

  /** Popup kapatıldığında state sıfırla */
  const handleClosePopup = useCallback(() => {
    setShowPopup(false);
    setSelectedWord(null);
    setDefinition(null);
    setDefinitionError(null);
    setDefinitionLoading(false);
    setAddLoading(false);
    window.getSelection()?.removeAllRanges();
  }, []);

  /** Sözlüğe ekle: word, definition, context_sentence, user_id */
  const handleAddToVocabulary = useCallback(async () => {
    if (!selectedWord || !definition) return;

    setAddLoading(true);
    try {
      const contextSentence = getContextSentence(text, selectedWord);

      const result = await addVocabulary(
        selectedWord,
        definition,
        contextSentence ?? undefined,
        bookId ?? undefined
      );

      if (result.success) {
        toast.success("Kelime eklendi!");
        handleClosePopup();
      } else {
        toast.error(result.error || "Eklenirken hata oluştu.");
      }
    } catch (err) {
      console.error("[TextReader] Sözlüğe ekleme hatası:", err);
      toast.error("Beklenmeyen bir hata oluştu.");
    } finally {
      setAddLoading(false);
    }
  }, [selectedWord, definition, text, bookId, handleClosePopup]);

  return (
    <>
      {/* Metin alanı - seçilebilir, mobilde touch events */}
      <div
        className={`select-text whitespace-pre-wrap break-words text-base leading-relaxed ${className}`}
        onMouseUp={handleMouseUp}
        onTouchEnd={handleMouseUp}
      >
        {text}
      </div>

      {/* Kelime seçim popup'ı */}
      <Dialog open={showPopup} onOpenChange={(open) => !open && handleClosePopup()}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">
              {selectedWord}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 min-h-[60px]">
            {definitionLoading && (
              <p className="text-muted-foreground text-center flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Tanım yükleniyor...
              </p>
            )}

            {definitionError && !definitionLoading && (
              <p className="text-destructive text-center">{definitionError}</p>
            )}

            {definition && !definitionLoading && (
              <div className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
                {definition}
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleClosePopup} disabled={addLoading}>
              İptal
            </Button>
            <Button
              onClick={handleAddToVocabulary}
              disabled={!definition || addLoading || definitionLoading}
              className="min-h-[44px] touch-manipulation"
            >
              {addLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Ekleniyor...
                </>
              ) : (
                <>
                  <BookPlus className="w-4 h-4 mr-2" />
                  Sözlüğe Ekle
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

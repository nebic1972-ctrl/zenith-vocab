"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { saveFlashcard } from "@/features/learning/actions/save-flashcard";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

interface FlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  flashcard: {
    front: string;
    back: string;
    example: string;
  };
  word?: string;
  context?: string;
}

export function FlashcardModal({ isOpen, onClose, flashcard, word, context }: FlashcardModalProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const canSave = word && !saved;

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setIsFlipped(false);
      setSaved(false);
      onClose();
    }
  };

  const handleSave = async () => {
    if (!word || saved) return;
    setIsSaving(true);
    try {
      const result = await saveFlashcard(
        word,
        flashcard.front,
        flashcard.back,
        flashcard.example ?? "",
        context
      );
      if (result.success) {
        setSaved(true);
        toast.success("Kart kaydedildi!");
      } else {
        toast.error(result.error ?? "Kaydetme başarısız.");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Bir hata oluştu.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md [&>button]:text-zinc-400">
        <div
          className="relative h-48 w-full cursor-pointer"
          style={{ perspective: "1000px" }}
          onClick={() => setIsFlipped(!isFlipped)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setIsFlipped(!isFlipped)}
          aria-label={isFlipped ? "Arka yüzü göster" : "Ön yüzü göster"}
        >
          <div
            className="relative h-full w-full transition-transform duration-500"
            style={{
              transformStyle: "preserve-3d",
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            {/* Front */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center rounded-xl border border-white/10 bg-zinc-800/80 p-6 shadow-lg"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(0deg)",
              }}
            >
              <h2 className="text-center text-xl font-bold text-white">{flashcard.front}</h2>
              <p className="mt-2 text-sm text-zinc-400">Tıklayarak çevir</p>
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 flex flex-col rounded-xl border border-white/10 bg-zinc-800/80 p-6 shadow-lg"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <h3 className="text-lg font-semibold text-amber-400">{flashcard.back}</h3>
              {flashcard.example && (
                <p className="mt-3 text-sm italic text-zinc-300">{flashcard.example}</p>
              )}
              <p className="mt-auto pt-2 text-xs text-zinc-500">Tıklayarak geri dön</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {canSave && (
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-amber-600 text-white hover:bg-amber-500"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Kaydet
                </>
              )}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={onClose}
            className={`border-zinc-700 text-white ${canSave ? "flex-1" : "w-full"}`}
          >
            Kapat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

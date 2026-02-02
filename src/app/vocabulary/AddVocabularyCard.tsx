"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { createFlashcardFromSelection } from "@/features/learning/actions/create-flashcard";
import { toast } from "sonner";

interface AddVocabularyCardProps {
  /** Opsiyonel: kitap id (reader'dan gelirse dolu) */
  bookId?: string;
}

export function AddVocabularyCard({ bookId = "" }: AddVocabularyCardProps) {
  const router = useRouter();
  const [word, setWord] = useState("");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim()) {
      toast.error("Kelime gerekli.");
      return;
    }
    setLoading(true);
    const result = await createFlashcardFromSelection(word.trim(), context.trim(), bookId);
    setLoading(false);
    if (result.success) {
      toast.success("Kart oluşturuldu.");
      setWord("");
      setContext("");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error ?? "Oluşturulamadı.");
    }
  };

  return (
    <Card className="border-white/10 bg-[#111]">
      <CardHeader className="py-3 px-4">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 text-left w-full text-white font-medium min-h-[44px] touch-manipulation"
        >
          <Plus className="h-5 w-5 text-blue-400 shrink-0" />
          Yeni kart oluştur (AI)
        </button>
      </CardHeader>
      {open && (
        <CardContent className="px-4 pb-4 pt-0 space-y-3">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="add-word" className="block text-xs text-gray-400 mb-1">
                Kelime / kavram
              </label>
              <Input
                id="add-word"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="örn. merhaba"
                className="bg-black/40 border-white/20 text-white min-h-[44px] touch-manipulation"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="add-context" className="block text-xs text-gray-400 mb-1">
                Bağlam (opsiyonel)
              </label>
              <Textarea
                id="add-context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Cümle veya paragraf..."
                rows={3}
                className="bg-black/40 border-white/20 text-white resize-y min-h-[44px] touch-manipulation"
                disabled={loading}
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !word.trim()}
              className="w-full min-h-[44px] touch-manipulation"
            >
              {loading ? "Oluşturuluyor…" : "Kart oluştur"}
            </Button>
          </form>
        </CardContent>
      )}
    </Card>
  );
}

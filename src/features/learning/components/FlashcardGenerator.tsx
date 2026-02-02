"use client";

import { useState } from "react";
import { createFlashcard } from "../actions/create-flashcard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface FlashcardGeneratorProps {
  userId: string;
  initialText?: string;
}

export function FlashcardGenerator({ userId, initialText = "" }: FlashcardGeneratorProps) {
  const [text, setText] = useState(initialText);
  const [cards, setCards] = useState<Array<{ front: string; back: string }>>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});

  const handleGenerate = async () => {
    setErrorMessage(null);
    setStatus("loading");
    const result = await createFlashcard(text, userId);
    setStatus("idle");

    if (result.success && result.cards?.length) {
      setCards(result.cards);
      setFlipped({});
    } else {
      setErrorMessage(result.error ?? "Kart oluşturulamadı.");
    }
  };

  const toggleFlip = (index: number) => {
    setFlipped((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="mb-2 block text-sm font-medium">Metin (flashcard üretilecek)</label>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Metni buraya yapıştırın veya kamera ile okutun..."
          rows={5}
          className="w-full resize-y"
        />
      </div>

      <Button
        type="button"
        onClick={handleGenerate}
        disabled={status === "loading" || !text.trim()}
        className="min-h-[44px] min-w-[44px] touch-manipulation"
      >
        {status === "loading" ? "Oluşturuluyor…" : "Flashcard Oluştur"}
      </Button>

      {errorMessage && (
        <p className="text-sm text-red-500" role="alert">
          {errorMessage}
        </p>
      )}

      {cards.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {cards.map((card, index) => (
            <Card
              key={index}
              className="min-h-[44px] cursor-pointer touch-manipulation"
              onClick={() => toggleFlip(index)}
            >
              <CardHeader className="py-2 text-xs text-muted-foreground">
                Kart {index + 1}
              </CardHeader>
              <CardContent className="py-2">
                {flipped[index] ? (
                  <p className="text-sm">{card.back}</p>
                ) : (
                  <p className="text-sm font-medium">{card.front}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

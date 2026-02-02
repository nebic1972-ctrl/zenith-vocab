"use client";

import { useState } from "react";
import { MobileCamera } from "@/features/vision/components/MobileCamera";
import { FlashcardGenerator } from "@/features/learning/components/FlashcardGenerator";

interface CaptureViewProps {
  userId: string;
}

export function CaptureView({ userId }: CaptureViewProps) {
  const [extractedText, setExtractedText] = useState("");

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Kamera ile metin oku</h2>
        <MobileCamera userId={userId} onTextExtracted={setExtractedText} />
      </section>

      {extractedText && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            Metinden flashcard oluştur
          </h2>
          <FlashcardGenerator userId={userId} initialText={extractedText} />
        </section>
      )}
    </div>
  );
}

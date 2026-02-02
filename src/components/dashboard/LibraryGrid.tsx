"use client";

import { useState } from "react";
import { BookOpen, Play } from "lucide-react";
import { useNeuroStore } from "@/store/useNeuroStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import ReaderModal from "@/components/rsvp/ReaderModal";
import { cn } from "@/lib/utils";
import type { Library } from "@/types";
import { createClient } from "@/lib/supabase/client";

type LibraryGridProps = {
  onAddContent?: () => void;
  onBookClick?: (item: Library) => void;
};

export default function LibraryGrid({ onAddContent, onBookClick }: LibraryGridProps) {
  const { user } = useNeuroStore();
  const library = useNeuroStore((s) => s.library);
  const isLoading = useNeuroStore((s) => (s as Record<string, unknown>).isLoading as boolean | undefined) ?? false;
  const [selectedBook, setSelectedBook] = useState<Library | null>(null);

  const handleBookClick = (item: Library) => {
    if (onBookClick) {
      onBookClick(item);
    } else {
      setSelectedBook(item);
    }
  };

  const handleCloseReader = () => {
    setSelectedBook(null);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    alert('Yükleme Başlıyor...');

    if (!user?.id) {
      alert("HATA: Kullanıcı bilgisi bulunamadı.");
      return;
    }

    try {
      const text = await file.text();
      const userId = String(user.id);
      const fileName = file.name;

      const supabase = createClient();
      const { error } = await supabase.from("library").insert({
        user_id: userId,
        title: fileName,
        content_text: text,
        file_type: "txt",
      });

      if (error) {
        alert("HATA: " + error.message);
      } else {
        alert('Başarılı!');
        window.location.reload();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Bilinmeyen hata";
      alert("HATA: " + errorMessage);
    }
  };

  return (
    <Card className={cn("overflow-hidden border-white/10 bg-zinc-900/80")}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <h2 className="text-lg font-semibold">Kütüphane</h2>
          <p className="text-xs text-zinc-500">İçerikleriniz</p>
        </div>
      </CardHeader>
      <CardContent>
        {/* Visible File Input */}
        <input
          type="file"
          onChange={handleFileUpload}
          accept=".txt,.md"
          className="text-white block mb-4"
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-amber-500 border-r-transparent"></div>
              <p className="text-sm text-zinc-500">Yükleniyor...</p>
            </div>
          </div>
        ) : library.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="bg-zinc-800/50 border-2 border-dashed border-zinc-600 rounded-2xl p-8 max-w-md w-full text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-zinc-500" />
              <h3 className="text-lg font-semibold text-zinc-200 mb-2">Henüz kitabın yok</h3>
              <p className="text-sm text-zinc-500 mb-6">İlk dosyanı yükle ve hızlı okumaya başla!</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {library.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "group relative flex flex-col gap-3 rounded-xl border border-white/5 bg-zinc-800/50 p-4",
                  "transition hover:border-amber-500/40 hover:bg-zinc-800"
                )}
              >
                <button
                  type="button"
                  onClick={() => handleBookClick(item)}
                  className="flex items-start gap-3 text-left"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-500">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-zinc-100">{item.title || "İsimsiz"}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500">
                      {(item.content_text || "").slice(0, 80)}
                      {(item.content_text?.length ?? 0) > 80 ? "…" : ""}
                    </p>
                  </div>
                </button>
                <Button
                  onClick={() => handleBookClick(item)}
                  size="sm"
                  className="w-full gap-2 bg-amber-600 font-semibold hover:bg-amber-500"
                >
                  <Play className="h-4 w-4" />
                  Okumaya Başla
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* RSVP Reader Modal */}
      <ReaderModal
        libraryItem={selectedBook}
        isOpen={selectedBook !== null}
        onClose={handleCloseReader}
      />
    </Card>
  );
}

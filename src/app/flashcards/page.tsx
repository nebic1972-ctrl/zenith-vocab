"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useNeuroStore } from "@/store/useNeuroStore";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, BookOpen, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import UserProgress from "@/components/dashboard/UserProgress";
import DailyGoals from "@/components/dashboard/DailyGoals";
import AISettings from "@/components/dashboard/AISettings";

export const dynamic = "force-dynamic";

interface Flashcard {
  id: string;
  bookId?: string;
  question: string;
  answer: string;
  options?: string[];
}

export default function FlashcardsPage() {
  const router = useRouter();
  const { syncProfile } = useNeuroStore();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [savedFlashcards, setSavedFlashcards] = useState<Flashcard[]>([]);
  const [library] = useState<{ id: string; title: string }[]>([]);

  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await syncProfile();
      const supabase = createClient();
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u ? { id: u.id } : null);
      setLoading(false);
    };
    init();
  }, [syncProfile]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-xl font-bold animate-pulse">Yükleniyor...</div>
      </div>
    );
  }

  if (!user) {
    router.replace("/");
    return null;
  }

  const removeFlashcard = (cardId: string) => {
    setSavedFlashcards((prev) => prev.filter((c) => c.id !== cardId));
  };

  const toggleFlip = (cardId: string) => {
    setFlippedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  const handleDelete = (cardId: string) => {
    if (confirm('Bu kartı silmek istediğinize emin misiniz?')) {
      removeFlashcard(cardId);
    }
  };

  const getBookTitle = (bookId?: string) => {
    if (!bookId) return 'Bilinmeyen Kitap';
    const book = library.find(b => b.id === bookId);
    return book?.title || 'Bilinmeyen Kitap';
  };

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <header className="flex justify-between items-center mb-12 py-4 border-b border-white/10">
          <div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Bilgi Kartlarım
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            AI ile oluşturduğun çalışma kartları
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Sidebar */}
          <aside className="w-full md:w-[300px] md:flex-shrink-0">
            <div className="sticky top-6 space-y-6">
              <UserProgress />
              <DailyGoals />
              <AISettings />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {savedFlashcards.length === 0 ? (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <BookOpen className="w-16 h-16 text-zinc-600 mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">
                    Henüz hiç kart kaydetmedin
                  </h3>
                  <p className="text-zinc-400 text-center max-w-md mb-6">
                    Okuma yaparken AI asistanı kullanarak kart oluşturabilirsin.
                  </p>
                  <Button
                    onClick={() => router.push('/library')}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
                  >
                    Kütüphaneye Git
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Stats */}
                <div className="flex items-center justify-between">
                  <p className="text-zinc-400">
                    Toplam <span className="text-white font-bold">{savedFlashcards.length}</span> kart
                  </p>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedFlashcards.map((card) => {
                    const isFlipped = flippedCards.has(card.id);
                    
                    return (
                      <Card
                        key={card.id}
                        className={cn(
                          "bg-zinc-900 border-zinc-800 transition-all duration-300 hover:border-purple-500/50",
                          "relative overflow-hidden"
                        )}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-sm font-semibold text-zinc-400 mb-1">
                                {getBookTitle(card.bookId)}
                              </CardTitle>
                            </div>
                            <button
                              onClick={() => handleDelete(card.id)}
                              className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors rounded hover:bg-zinc-800"
                              title="Kartı Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Front Side - Question */}
                          {!isFlipped && (
                            <div className="space-y-3">
                              <div className="bg-zinc-800/50 rounded-lg p-4 min-h-[120px] flex items-center">
                                <p className="text-white font-medium text-sm leading-relaxed">
                                  {card.question}
                                </p>
                              </div>
                              <Button
                                onClick={() => toggleFlip(card.id)}
                                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Cevabı Göster
                              </Button>
                            </div>
                          )}

                          {/* Back Side - Answer */}
                          {isFlipped && (
                            <div className="space-y-3">
                              <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4 min-h-[120px]">
                                <p className="text-green-400 font-semibold text-sm mb-2">
                                  Doğru Cevap:
                                </p>
                                <p className="text-white font-medium text-sm leading-relaxed mb-3">
                                  {card.answer}
                                </p>
                                {card.options && card.options.length > 0 && (
                                  <div className="mt-3 pt-3 border-t border-green-700/30">
                                    <p className="text-xs text-zinc-400 mb-2">Tüm Seçenekler:</p>
                                    <div className="space-y-1">
                                      {card.options.map((option, idx) => (
                                        <div
                                          key={idx}
                                          className={cn(
                                            "text-xs px-2 py-1 rounded",
                                            option === card.answer
                                              ? "bg-green-900/30 text-green-400 font-semibold"
                                              : "bg-zinc-800/50 text-zinc-300"
                                          )}
                                        >
                                          {String.fromCharCode(65 + idx)}. {option}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <Button
                                onClick={() => toggleFlip(card.id)}
                                variant="outline"
                                className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                              >
                                <EyeOff className="w-4 h-4 mr-2" />
                                Soruyu Göster
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

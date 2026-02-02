import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowLeft } from "lucide-react";
import { VocabularySearch } from "./VocabularySearch";
import { AddVocabularyCard } from "./AddVocabularyCard";
import { ExportVocabularyCSV } from "./ExportVocabularyCSV";

interface VocabularyItem {
  id: string;
  word: string;
  definition: string;
  example_sentence: string | null;
  book_id: string | null;
  created_at: string;
}

export default async function VocabularyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: items, error } = await supabase
    .from("vocabulary")
    .select("id, word, definition, example_sentence, book_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="container mx-auto p-8 min-h-screen">
        <p className="text-red-500">Veri hatası: {error.message}. Vocabulary tablosu oluşturuldu mu?</p>
        <Link href="/dashboard" className="mt-4 inline-block text-blue-400 hover:underline">
          Dashboard&apos;a dön
        </Link>
      </div>
    );
  }

  const list = (items ?? []) as VocabularyItem[];
  const bookIds = [...new Set(list.map((i) => i.book_id).filter(Boolean))] as string[];
  let books: { id: string; title: string }[] = [];
  if (bookIds.length > 0) {
    const { data: bookRows } = await supabase
      .from("library")
      .select("id, title")
      .in("id", bookIds);
    books = (bookRows ?? []) as { id: string; title: string }[];
  }

  return (
    <div className="container mx-auto p-8 min-h-screen pb-24">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="min-h-[44px] min-w-[44px] touch-manipulation p-2 rounded-lg hover:bg-white/10 inline-flex items-center justify-center text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="p-3 bg-blue-600/20 rounded-xl">
            <BookOpen className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Kelimelerim</h1>
            <p className="text-sm text-gray-400">Kaydettiğin kelime kartları</p>
          </div>
          <ExportVocabularyCSV items={list} />
        </div>
      </div>

      <div className="mb-6">
        <AddVocabularyCard />
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#111] p-12 text-center">
          <p className="text-gray-400 mb-4">Henüz kelime kartı yok.</p>
          <p className="text-sm text-gray-500">
            Reader&apos;da metin okuyup kelime seçerek veya Capture sayfasında OCR + Flashcard ile kart oluşturabilirsin.
          </p>
          <Link href="/library" className="mt-6 inline-block">
            <Button variant="outline" className="min-h-[44px] touch-manipulation">
              Kütüphaneye git
            </Button>
          </Link>
        </div>
      ) : (
        <VocabularySearch items={list} books={books} />
      )}
    </div>
  );
}

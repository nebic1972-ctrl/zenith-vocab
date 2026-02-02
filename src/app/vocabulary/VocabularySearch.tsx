"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { VocabularyList } from "./VocabularyList";

interface VocabularyItem {
  id: string;
  word: string;
  definition: string;
  example_sentence: string | null;
  book_id: string | null;
  created_at: string;
}

type SortOption = "newest" | "oldest" | "word";

export function VocabularySearch({
  items,
  books = [],
}: {
  items: VocabularyItem[];
  books?: { id: string; title: string }[];
}) {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterBookId, setFilterBookId] = useState<string>("");

  const filteredAndSorted = useMemo(() => {
    let list = items;
    if (filterBookId === "none") {
      list = list.filter((item) => item.book_id == null);
    } else if (filterBookId) {
      list = list.filter((item) => item.book_id === filterBookId);
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (item) =>
          item.word.toLowerCase().includes(q) ||
          item.definition.toLowerCase().includes(q) ||
          (item.example_sentence?.toLowerCase().includes(q) ?? false)
      );
    }
    const sorted = [...list];
    if (sortBy === "newest") {
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === "oldest") {
      sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else {
      sorted.sort((a, b) => a.word.localeCompare(b.word, "tr"));
    }
    return sorted;
  }, [items, query, sortBy, filterBookId]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Kelime veya açıklamada ara..."
            className="pl-9 bg-[#111] border-white/10 text-white min-h-[44px] touch-manipulation"
            aria-label="Kelimelerde ara"
          />
        </div>
        {(books.length > 0 || items.some((i) => i.book_id == null)) && (
          <select
            value={filterBookId}
            onChange={(e) => setFilterBookId(e.target.value)}
            className="bg-[#111] border border-white/10 text-white rounded-md px-3 py-2 min-h-[44px] touch-manipulation text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Kitaba göre filtre"
          >
            <option value="">Tüm kitaplar</option>
            {items.some((i) => i.book_id == null) && (
              <option value="none">Kitapsız</option>
            )}
            {books.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}
              </option>
            ))}
          </select>
        )}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="bg-[#111] border border-white/10 text-white rounded-md px-3 py-2 min-h-[44px] touch-manipulation text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Sıralama"
        >
          <option value="newest">En yeni</option>
          <option value="oldest">En eski</option>
          <option value="word">Kelime A-Z</option>
        </select>
      </div>
      {query.trim() && (
        <p className="text-sm text-gray-400">
          {filteredAndSorted.length} sonuç
        </p>
      )}
      <VocabularyList items={filteredAndSorted} />
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface VocabularyItem {
  id: string;
  word: string;
  definition: string;
  example_sentence: string | null;
  book_id: string | null;
  created_at: string;
}

function escapeCsvCell(value: string): string {
  if (value.includes('"') || value.includes(",") || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function ExportVocabularyCSV({ items }: { items: VocabularyItem[] }) {
  const handleExport = () => {
    const header = "word,definition,example_sentence,created_at";
    const rows = items.map(
      (item) =>
        [
          escapeCsvCell(item.word),
          escapeCsvCell(item.definition),
          escapeCsvCell(item.example_sentence ?? ""),
          escapeCsvCell(new Date(item.created_at).toLocaleDateString("tr-TR")),
        ].join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kelimelerim-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleExport}
      disabled={items.length === 0}
      className="min-h-[44px] touch-manipulation shrink-0"
    >
      <Download className="mr-2 h-4 w-4" />
      CSV indir
    </Button>
  );
}

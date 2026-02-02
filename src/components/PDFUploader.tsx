"use client";

import { useState } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as pdfjsLib from "pdfjs-dist";

// PDF.js Worker ayarı (Okuma motoru)
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PDFUploaderProps {
  onTextExtracted: (text: string, title: string) => void;
}

export function PDFUploader({ onTextExtracted }: PDFUploaderProps) {
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Lütfen sadece PDF dosyası yükleyin.");
      return;
    }

    setLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = "";
      
      // Sayfa sayfa gezip metinleri topla
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        fullText += pageText + " ";
      }

      // Gereksiz boşlukları temizle
      const cleanText = fullText.replace(/\s+/g, " ").trim();
      
      // Ana sisteme metni gönder (Dosya adını başlık yap)
      onTextExtracted(cleanText, file.name.replace(".pdf", ""));

    } catch (error) {
      console.error("PDF Okuma Hatası:", error);
      alert("PDF okunurken bir hata oluştu. Lütfen şifresiz ve metin içeren bir PDF deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <input
        type="file"
        id="pdf-upload"
        accept=".pdf"
        className="hidden"
        onChange={handleFileChange}
      />
      <label htmlFor="pdf-upload">
        <Button variant="outline" className="cursor-pointer bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-white" asChild disabled={loading}>
          <span>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            {loading ? "Taranıyor..." : "PDF Yükle"}
          </span>
        </Button>
      </label>
    </div>
  );
}

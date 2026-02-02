"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Loader2, File } from "lucide-react";
import { Card } from "@/components/ui/card";

// PDF kütüphanesini çağır
import * as pdfjsLib from "pdfjs-dist";

// --- KRİTİK DÜZELTME ---
// Worker sürümünü 3.11.174 olarak sabitliyoruz (Çökmemesi için şart)
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

interface FileUploaderProps {
  onTextLoaded: (text: string) => void;
}

export function FileUploader({ onTextLoaded }: FileUploaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setFileName(file.name);

    try {
      let extractedText = "";

      // 1. Eğer TXT dosyasıysa
      if (file.type === "text/plain") {
        extractedText = await file.text();
      }
      // 2. Eğer PDF dosyasıysa
      else if (file.type === "application/pdf") {
        const arrayBuffer = await file.arrayBuffer();
        
        // PDF dökümanını yükle
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        // Tüm sayfaları gez ve metinleri topla
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            // Sayfadaki kelimeleri birleştir
            const pageText = textContent.items.map((item: any) => item.str).join(" ");
            extractedText += pageText + "\n\n";
        }
      } else {
        alert("Şimdilik sadece .txt ve .pdf destekliyoruz Ortağım!");
        setIsLoading(false);
        return;
      }

      // Metni ana sisteme gönder
      if (extractedText.trim().length > 0) {
        onTextLoaded(extractedText);
      } else {
        alert("Bu dosya boş veya okunamadı. Resim tabanlı bir PDF olabilir.");
      }

    } catch (error) {
      console.error("Dosya okuma hatası:", error);
      alert("Dosya yüklenirken bir hata oluştu. Lütfen sayfayı yenileyip tekrar dene.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-zinc-900/50 border-zinc-800 mb-8 text-center border-dashed border-2 hover:border-zinc-600 transition-colors group cursor-pointer relative overflow-hidden">
      <input
        type="file"
        accept=".txt,.pdf"
        id="file-upload"
        className="hidden"
        onChange={handleFileUpload}
      />
      
      <label 
        htmlFor="file-upload" 
        className="cursor-pointer flex flex-col items-center justify-center gap-4 w-full h-full py-8 relative z-10"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
            <p className="text-zinc-400 animate-pulse">Yapay Zeka Metni Ayrıştırıyor...</p>
          </>
        ) : fileName ? (
          <>
            <FileText className="w-10 h-10 text-green-500" />
            <p className="text-green-400 font-mono">"{fileName}" Hazır!</p>
            <p className="text-zinc-500 text-xs">Başka dosya seçmek için tıkla</p>
          </>
        ) : (
          <>
            <div className="p-4 bg-zinc-800 rounded-full group-hover:bg-zinc-700 transition-colors shadow-lg shadow-black/50">
                <Upload className="w-6 h-6 text-zinc-300" />
            </div>
            <div>
                <p className="text-lg font-bold text-zinc-200">Dosya Sürükle veya Seç</p>
                <p className="text-zinc-500 text-sm mt-1 font-mono">PDF veya TXT</p>
            </div>
          </>
        )}
      </label>
    </Card>
  );
}

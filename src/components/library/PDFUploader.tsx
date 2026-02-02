"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, FileText, Loader2, X, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNeuroStore } from "@/store/useNeuroStore";
import { createClient } from "@/lib/supabase/client";
import { analyzeText } from "@/lib/text-analysis";

export default function PDFUploader() {
  const profile = useNeuroStore((s) => s.profile);
  const fetchUserData = useNeuroStore((s) => s.fetchUserData);
  const userSettings = useNeuroStore((s) => s.userSettings);
  
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract text from PDF
  const extractTextFromPDF = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    try {
      // Dynamic import to avoid SSR issues
      const pdfJS = await import('pdfjs-dist');
      
      // Configure worker source
      pdfJS.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      
      const pdf = await pdfJS.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";

      // Loop through all pages
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Smart Join: Handle hyphenated line breaks properly
        const items = textContent.items.map((item: any) => item.str);
        let pageText = "";
        
        for (let j = 0; j < items.length; j++) {
          const current = items[j];
          const next = items[j + 1];
          
          // If current item ends with hyphen and next exists, merge without space
          if (current.endsWith('-') && next) {
            pageText += current.slice(0, -1); // Remove hyphen
          } else {
            pageText += current;
            // Add space only if not at end and next item exists
            if (j < items.length - 1 && !current.endsWith('-')) {
              pageText += " ";
            }
          }
        }
        
        fullText += pageText + " ";
      }

      return cleanText(fullText);
    } catch (error) {
      console.error("PDF parsing error:", error);
      throw new Error("PDF okunamadı, lütfen dosyanın şifreli veya bozuk olmadığından emin olun.");
    }
  };

  // Clean and preprocess text
  const cleanText = (text: string): string => {
    if (!text || typeof text !== 'string') return '';
    
    return text
      // Remove null bytes and control characters
      .replace(/\u0000/g, '')
      .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, '')
      
      // Fix hyphenation - Merge words split by hyphens
      .replace(/-\s*\n\s*/g, '')
      .replace(/-\s+/g, '')
      .replace(/(\w)-\s*(\w)/g, '$1$2')
      
      // Normalize line endings
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      
      // Remove excessive whitespace
      .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
      .replace(/[ \t]+/g, ' ') // Multiple spaces/tabs to single space
      .replace(/[ \t]+\n/g, '\n') // Remove trailing spaces before newlines
      .replace(/\n[ \t]+/g, '\n') // Remove leading spaces after newlines
      
      // Remove page numbers (common patterns)
      .replace(/\n\s*\d+\s*\n/g, '\n') // Standalone numbers on lines
      .replace(/^\d+\s*$/gm, '') // Lines with only numbers
      .replace(/\bPage\s+\d+\b/gi, '') // "Page 1", "Page 2", etc.
      .replace(/\b\d+\s*\/\s*\d+\b/g, '') // "1/10", "2/10", etc.
      
      // Trim and clean up
      .trim();
  };

  // Process file (PDF or TXT)
  const processFile = async (file: File) => {
    if (!profile?.id) {
      setUploadStatus({ type: 'error', message: 'Kullanıcı bilgisi bulunamadı. Lütfen giriş yapın.' });
      return;
    }

    setIsProcessing(true);
    setFileName(file.name);
    setUploadStatus({ type: null, message: '' });

    try {
      let extractedText = "";

      // Handle TXT files
      if (file.type === "text/plain" || file.name.endsWith('.txt')) {
        extractedText = await file.text();
        extractedText = cleanText(extractedText);
      }
      // Handle PDF files
      else if (file.type === "application/pdf" || file.name.endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        extractedText = await extractTextFromPDF(arrayBuffer);
      } else {
        setUploadStatus({ 
          type: 'error', 
          message: 'Desteklenmeyen dosya formatı. Lütfen .pdf veya .txt dosyası yükleyin.' 
        });
        setIsProcessing(false);
        return;
      }

      // Validate extracted text
      if (!extractedText || extractedText.trim().length < 10) {
        setUploadStatus({ 
          type: 'error', 
          message: 'Dosya boş veya okunamadı. Resim tabanlı bir PDF olabilir.' 
        });
        setIsProcessing(false);
        return;
      }

      // Calculate difficulty based on average characters per word (readability score)
      const words = extractedText.trim().split(/\s+/).filter(w => w.length > 0);
      const wordCount = words.length;
      const totalChars = extractedText.replace(/\s+/g, '').length;
      const avgChars = wordCount > 0 ? totalChars / wordCount : 0;
      
      // Determine difficulty level based on readability thresholds
      let difficultyLevel: string;
      if (avgChars < 5.0) {
        difficultyLevel = 'Kolay'; // Level 1 - Çocuk Kitabı
      } else if (avgChars >= 5.0 && avgChars < 6.2) {
        difficultyLevel = 'Orta'; // Level 3 - Roman
      } else {
        difficultyLevel = 'Zor'; // Level 5 - Akademik
      }

      // Analyze text complexity for estimated time
      const userWpm = userSettings?.wpm_speed ?? 200;
      const analysis = analyzeText(extractedText, userWpm);

      // Extract title from filename (remove extension)
      const title = file.name.replace(/\.[^/.]+$/, "");

      // Save to Supabase
      const supabase = createClient();
      const { data, error } = await supabase
        .from('library')
        .insert({
          user_id: profile.id,
          title: title || 'İsimsiz Döküman',
          content_text: extractedText,
          file_type: file.name.endsWith('.pdf') ? 'pdf' : 'txt',
          difficulty_level: difficultyLevel, // Use calculated difficulty
          estimated_time: analysis.estimatedTimeMinutes,
        })
        .select()
        .single();

      if (error) {
        console.error('Library insert error:', error);
        setUploadStatus({ 
          type: 'error', 
          message: `Kayıt hatası: ${error.message}` 
        });
      } else {
        setUploadStatus({ 
          type: 'success', 
          message: `"${title}" başarıyla kütüphaneye eklendi!` 
        });
        
        // Refresh library data
        if (profile.id) {
          await fetchUserData(profile.id);
        }

        // Reset after 3 seconds
        setTimeout(() => {
          setUploadStatus({ type: null, message: '' });
          setFileName(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }, 3000);
      }
    } catch (error) {
      console.error('File processing error:', error);
      setUploadStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Dosya işlenirken bir hata oluştu.' 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }, []);

  // Trigger file input
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <Card
        className={cn(
          "relative overflow-hidden border-2 border-dashed transition-all cursor-pointer",
          isDragging
            ? "border-purple-500 bg-purple-500/10 scale-[1.02]"
            : "border-zinc-700 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-900/70",
          isProcessing && "pointer-events-none opacity-75"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt"
          className="hidden"
          onChange={handleFileChange}
          disabled={isProcessing}
        />

        <div className="p-8 flex flex-col items-center justify-center gap-4 text-center">
          {isProcessing ? (
            <>
              <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
              <div>
                <p className="text-lg font-semibold text-white">
                  {fileName ? `"${fileName}" işleniyor...` : "Dosya işleniyor..."}
                </p>
                <p className="text-sm text-zinc-400 mt-1">
                  Metin çıkarılıyor ve temizleniyor...
                </p>
              </div>
            </>
          ) : uploadStatus.type === 'success' ? (
            <>
              <CheckCircle2 className="w-12 h-12 text-green-400" />
              <div>
                <p className="text-lg font-semibold text-green-400">
                  Başarılı!
                </p>
                <p className="text-sm text-zinc-400 mt-1">
                  {uploadStatus.message}
                </p>
              </div>
            </>
          ) : uploadStatus.type === 'error' ? (
            <>
              <AlertCircle className="w-12 h-12 text-red-400" />
              <div>
                <p className="text-lg font-semibold text-red-400">
                  Hata
                </p>
                <p className="text-sm text-zinc-400 mt-1">
                  {uploadStatus.message}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setUploadStatus({ type: null, message: '' });
                  setFileName(null);
                }}
                className="mt-2"
              >
                <X className="w-4 h-4 mr-2" />
                Kapat
              </Button>
            </>
          ) : (
            <>
              <div className={cn(
                "p-4 rounded-full transition-colors",
                isDragging
                  ? "bg-purple-500/20"
                  : "bg-zinc-800 group-hover:bg-zinc-700"
              )}>
                <Upload className={cn(
                  "w-8 h-8 transition-colors",
                  isDragging ? "text-purple-400" : "text-zinc-300"
                )} />
              </div>
              <div>
                <p className="text-lg font-bold text-white">
                  Dosya Sürükle veya Seç
                </p>
                <p className="text-sm text-zinc-400 mt-1">
                  PDF veya TXT dosyaları desteklenir
                </p>
              </div>
              <Button
                variant="outline"
                className="mt-2 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick();
                }}
              >
                <FileText className="w-4 h-4 mr-2" />
                Dosya Seç
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { useNeuroStore } from "@/store/useNeuroStore";
import { createClient } from "@/lib/supabase/client";
import { BookOpen, Plus, Play, Loader2, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { analyzeText } from "@/lib/text-analysis";
import type { Library } from "@/types";
import PDFUploader from "@/components/library/PDFUploader";
import AddBookModal from "@/components/library/AddBookModal";

interface LibraryManagerProps {
  onSelectBook?: (book: Library) => void;
}

export default function LibraryManager({ onSelectBook }: LibraryManagerProps) {
  const { user, loadUserData } = useNeuroStore();
  const library = useNeuroStore((s) => s.library);
  const isLoading = useNeuroStore((s) => (s as Record<string, unknown>).isLoading as boolean | undefined) ?? false;
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.id) loadUserData();
  }, [user?.id, loadUserData]);

  // Helper: Extract text from PDF (Dynamic import to avoid SSR issues)
  const extractTextFromPDF = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    try {
      // Dynamic import - only load when actually processing a PDF
      const pdfJS = await import('pdfjs-dist');
      
      // Configure worker source (CDN to avoid Next.js build errors)
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
            // Don't add space, next word will continue
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

      // Apply robust text cleaning before returning
      return cleanText(fullText);
    } catch (error) {
      console.error("PDF parsing error:", error);
      throw new Error("PDF okunamadı, lütfen dosyanın şifreli veya bozuk olmadığından emin olun.");
    }
  };

  // Robust Text Cleaner: Fixes hyphenation, newlines, spaces, and control characters
  // This ensures words like "pro-gram" appear as "program" in the reader
  const cleanText = (text: string): string => {
    if (!text || typeof text !== 'string') return '';
    
    return text
      // Step 1: Remove null bytes and invisible control characters (causes database errors)
      .replace(/\u0000/g, '') // Remove null bytes
      .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, '') // Remove control chars (preserve \n and \t for now)
      
      // Step 2: Fix hyphenation - Merge words split by hyphens (e.g., "pro-\ngram" -> "program")
      .replace(/-\s*\n\s*/g, '') // Remove hyphen + newline (word-\n -> word)
      .replace(/-\s+/g, '') // Remove hyphen + any whitespace (word- word -> wordword)
      .replace(/(\w)-\s*(\w)/g, '$1$2') // Merge hyphenated words on same line (pro-gram -> program)
      
      // Step 3: Normalize line endings
      .replace(/\r\n/g, '\n') // Windows line endings
      .replace(/\r/g, '\n') // Old Mac line endings
      
      // Step 4: Handle newlines (preserve paragraphs, but normalize)
      .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines (paragraphs)
      .replace(/\n/g, ' ') // Convert single newlines to spaces
      .replace(/\s{2,}/g, ' ') // Collapse multiple spaces (including from newlines)
      
      // Step 5: Final whitespace cleanup
      .replace(/\s+/g, ' ') // Collapse any remaining multiple spaces
      .trim(); // Remove leading/trailing whitespace
  };

  // PRESERVE THE EXACT WORKING LOGIC FROM BRUTE FORCE TEST + PDF SUPPORT
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploading(true);

    try {
      let text: string;
      let fileType: string;

      // Handle PDF files
      if (file.type === 'application/pdf') {
        try {
          const arrayBuffer = await file.arrayBuffer();
          text = await extractTextFromPDF(arrayBuffer);
          fileType = 'pdf';
        } catch (pdfError) {
          console.error('PDF processing error:', pdfError);
          const errorMessage = pdfError instanceof Error ? pdfError.message : 'PDF okunamadı';
          const message = errorMessage.includes('PDF okunamadı') 
            ? 'PDF okunamadı, lütfen dosyanın şifreli veya bozuk olmadığından emin olun.'
            : 'PDF işlenirken bir hata oluştu. Lütfen tekrar deneyin veya .txt formatında yükleyin.';
          setUploadStatus({ type: 'error', message });
          setIsUploading(false);
          setTimeout(() => setUploadStatus({ type: null, message: '' }), 5000);
          return;
        }
      } 
      // Handle text files
      else if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        const rawText = await file.text();
        text = cleanText(rawText); // Apply cleaning immediately
        fileType = 'txt';
      } 
      // Unsupported file type
      else {
        setUploadStatus({ type: 'error', message: 'Desteklenmeyen dosya türü. Lütfen .txt, .md veya .pdf dosyası yükleyin.' });
        setIsUploading(false);
        setTimeout(() => setUploadStatus({ type: null, message: '' }), 5000);
        return;
      }

      // Final cleanup (already cleaned for PDF/TXT, but ensure it's clean)
      text = cleanText(text);

      if (!text || text.length === 0) {
        setUploadStatus({ type: 'error', message: 'Dosya boş veya okunamadı.' });
        setIsUploading(false);
        setTimeout(() => setUploadStatus({ type: null, message: '' }), 5000);
        return;
      }
      
      if (!user?.id) {
        setUploadStatus({ type: 'error', message: 'Kullanıcı bilgisi bulunamadı.' });
        setIsUploading(false);
        setTimeout(() => setUploadStatus({ type: null, message: '' }), 5000);
        return;
      }

      // Clean title: Remove file extension (.pdf, .txt, .md)
      const cleanTitle = file.name.replace(/\.(pdf|txt|md)$/i, '');

      // Analyze text complexity
      const userSettings = useNeuroStore.getState().userSettings;
      const userWpm = userSettings?.wpm_speed ?? 200; // Default to 200 WPM
      const analysis = analyzeText(text, userWpm);

      const supabase = createClient();
      // @ts-ignore - Type definition mismatch, but runtime works correctly
      const { error } = await supabase.from('library').insert({
        user_id: String(user.id),
        title: cleanTitle,
        content_text: text,
        file_type: fileType,
        last_position: 0, // Initialize progress tracking
        difficulty_level: analysis.difficultyLevel,
        estimated_time: analysis.estimatedTimeMinutes,
      });

      if (error) {
        console.error('Upload error:', error);
        setUploadStatus({ type: 'error', message: error.message });
        setIsUploading(false);
        setTimeout(() => setUploadStatus({ type: null, message: '' }), 5000);
      } else {
        setUploadStatus({ type: 'success', message: 'Dosya başarıyla yüklendi!' });
        // Auto-refresh the list
        await loadUserData();
        setIsUploading(false);
        setTimeout(() => setUploadStatus({ type: null, message: '' }), 3000);
      }
    } catch (err) {
      console.error('Upload error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
      setUploadStatus({ type: 'error', message: errorMessage });
      setIsUploading(false);
      setTimeout(() => setUploadStatus({ type: null, message: '' }), 5000);
    }
  };

  const handleAddContentClick = () => {
    fileInputRef.current?.click();
  };

  const handleBookClick = (item: Library) => {
    if (onSelectBook) {
      onSelectBook(item);
    }
  };

  const handleDelete = async (bookId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering book click
    
    // Confirm deletion
    if (!confirm('Bu kitabı silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      const supabase = createClient();
      // @ts-ignore - Type definition mismatch, but runtime works correctly
      const { error } = await supabase
        .from('library')
        .delete()
        // @ts-ignore - Type definition mismatch, but runtime works correctly
        .eq('id', bookId);

      if (error) {
        console.error('Delete error:', error);
        setUploadStatus({ type: 'error', message: error.message });
        setTimeout(() => setUploadStatus({ type: null, message: '' }), 5000);
      } else {
        // Update local state immediately (remove from library array)
        const updatedLibrary = library.filter((item) => item.id !== bookId);
        useNeuroStore.setState({ library: updatedLibrary });
        
        setUploadStatus({ type: 'success', message: 'Kitap başarıyla silindi!' });
        setTimeout(() => setUploadStatus({ type: null, message: '' }), 3000);
      }
    } catch (err) {
      console.error('Delete error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
      setUploadStatus({ type: 'error', message: errorMessage });
      setTimeout(() => setUploadStatus({ type: null, message: '' }), 5000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden" 
        accept=".txt,.md,.pdf"
      />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-white bg-clip-text text-transparent">
            Nöro-Kütüphane
          </h2>
          <p className="text-zinc-500 text-sm mt-1">
            Beyin antrenmanınız için kategorize edilmiş içerikler.
          </p>
        </div>
      </div>

      {/* Document Uploader */}
      <PDFUploader />

      {/* Upload Status Message */}
      {uploadStatus.type && (
        <div className={cn(
          "rounded-lg p-4 border backdrop-blur-sm transition-all",
          uploadStatus.type === 'success' 
            ? "bg-green-500/10 border-green-500/30 text-green-400"
            : "bg-red-500/10 border-red-500/30 text-red-400"
        )}>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{uploadStatus.type === 'success' ? '✅' : '❌'}</span>
            <span className="text-sm">{uploadStatus.message}</span>
          </div>
        </div>
      )}

      {/* Library Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-amber-500 border-r-transparent"></div>
            <p className="text-sm text-zinc-500">Yükleniyor...</p>
          </div>
        </div>
      ) : library.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="bg-zinc-800/50 border-2 border-dashed border-zinc-600 rounded-2xl p-8 max-w-md w-full text-center backdrop-blur-sm">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-zinc-500" />
            <h3 className="text-lg font-semibold text-zinc-200 mb-2">Henüz kitabın yok</h3>
            <p className="text-sm text-zinc-500 mb-6">İlk dosyanı yükle ve hızlı okumaya başla!</p>
            <Button
              onClick={handleAddContentClick}
              className="gap-2 bg-amber-600 font-semibold hover:bg-amber-500"
              disabled={isUploading}
            >
              <Plus className="h-4 w-4" />
              {isUploading ? "Yükleniyor..." : "İlk Dosyayı Yükle"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Yeni İçerik Ekle Card - FIRST ITEM with Orange Plus Icon */}
          <button
            type="button"
            onClick={() => setShowAddBookModal(true)}
            disabled={isUploading}
            className={cn(
              "flex min-h-[140px] flex-col items-center justify-center gap-3 rounded-xl",
              "border-2 border-dashed border-zinc-600 text-zinc-500",
              "transition hover:border-amber-500/50 hover:bg-amber-500/5 hover:text-amber-500",
              "backdrop-blur-sm bg-zinc-800/30",
              isUploading && "opacity-50 cursor-not-allowed"
            )}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                <span className="text-sm font-medium">Yükleniyor...</span>
              </>
            ) : (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 text-amber-500">
                  <Plus className="h-6 w-6" />
                </div>
                <span className="text-sm font-semibold">+ Kitap Ekle</span>
              </>
            )}
          </button>

          {/* Library Books */}
          {library.map((item) => (
            <div
              key={item.id}
              className={cn(
                "group relative flex flex-col gap-3 rounded-xl border border-white/5 bg-zinc-800/50 p-4 backdrop-blur-sm",
                "transition hover:border-amber-500/40 hover:bg-zinc-800/70 hover:shadow-lg hover:shadow-amber-500/10"
              )}
            >
              {/* Delete Button - Top Right */}
              <button
                type="button"
                onClick={(e) => handleDelete(item.id, e)}
                className={cn(
                  "absolute top-2 right-2 p-1.5 rounded-lg transition",
                  "text-zinc-500 hover:text-red-500 hover:bg-red-500/10",
                  "opacity-0 group-hover:opacity-100"
                )}
                title="Kitabı Sil"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => handleBookClick(item)}
                className="flex items-start gap-3 text-left"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-500">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1 pr-6">
                  <p className="truncate font-medium text-zinc-100">{item.title || "İsimsiz"}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500">
                    {(item.content_text || "").slice(0, 80)}
                    {(item.content_text?.length ?? 0) > 80 ? "…" : ""}
                  </p>
                  
                  {/* Difficulty and Time Badges */}
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    {/* Difficulty Badge */}
                    {item.difficulty_level && (
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                          item.difficulty_level === 'Çok Kolay' || item.difficulty_level === 'Kolay'
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : item.difficulty_level === 'Orta'
                            ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                        )}
                      >
                        {item.difficulty_level === 'Çok Kolay' ? 'Kolay' : 
                         item.difficulty_level === 'Akademik' ? 'Zor' : 
                         item.difficulty_level}
                      </span>
                    )}
                    
                    {/* Estimated Time */}
                    {item.estimated_time && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs text-zinc-400 bg-zinc-700/50">
                        <Clock className="h-3 w-3" />
                        {item.estimated_time} dk
                      </span>
                    )}
                  </div>
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
      
      {/* Add Book Modal */}
      <AddBookModal 
        isOpen={showAddBookModal} 
        onClose={() => {
          setShowAddBookModal(false);
          // Refresh library after modal closes
          if (user?.id) {
            loadUserData();
          }
        }} 
      />
    </div>
  );
}

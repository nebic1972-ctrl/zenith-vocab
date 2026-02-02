"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Clock, FileText, BarChart3, Zap } from "lucide-react";

interface TextPreviewProps {
  content: string;
  userWpm: number;
  onStart: () => void;
  onCancel: () => void;
}

export function TextPreview({ content, userWpm, onStart, onCancel }: TextPreviewProps) {
  // Metin Analizi
  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
  const estimatedMinutes = Math.ceil(wordCount / (userWpm || 250)); // Dakika hesabı
  
  // Zorluk Tahmini (Kelime uzunluğuna göre basit bir heuristik)
  const avgWordLength = wordCount > 0 ? content.length / wordCount : 0;
  const difficulty = avgWordLength > 6.5 ? "Akademik/Zor" : avgWordLength > 5 ? "Orta" : "Basit";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <Card className="w-full max-w-4xl h-[80vh] bg-zinc-900 border-zinc-800 flex flex-col shadow-2xl overflow-hidden">
        
        {/* --- HEADER: Görev Brifingi --- */}
        <div className="p-6 border-b border-zinc-800 bg-zinc-950 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-purple-500" /> Metin Analizi
            </h2>
            <p className="text-zinc-400 text-sm mt-1">Okumaya başlamadan önce içeriği ve yapıyı tarayın (Skimming).</p>
          </div>
          
          <div className="flex gap-4 text-sm font-mono">
            <div className="text-right">
              <div className="text-zinc-500 flex items-center justify-end gap-1"><Zap className="w-3 h-3" /> Kelime</div>
              <div className="text-white font-bold">{wordCount}</div>
            </div>
            <div className="text-right">
              <div className="text-zinc-500 flex items-center justify-end gap-1"><Clock className="w-3 h-3" /> Süre</div>
              <div className="text-green-400 font-bold">~{estimatedMinutes} dk</div>
            </div>
            <div className="text-right">
              <div className="text-zinc-500 flex items-center justify-end gap-1"><BarChart3 className="w-3 h-3" /> Seviye</div>
              <div className={`font-bold ${difficulty.includes("Zor") ? "text-red-400" : "text-blue-400"}`}>{difficulty}</div>
            </div>
          </div>
        </div>

        {/* --- BODY: Metin Önizleme (Scroll) --- */}
        <div className="flex-1 overflow-hidden bg-zinc-900/50">
          <div className="h-full overflow-y-auto p-8">
            <div className="max-w-3xl mx-auto text-zinc-300 text-lg leading-relaxed font-serif selection:bg-purple-500/30">
              {/* Paragrafları düzgün göstermek için */}
              {content.split('\n').map((para, i) => (
                para.trim() ? <p key={i} className="mb-4">{para}</p> : <br key={i} />
              ))}
            </div>
          </div>
        </div>

        {/* --- FOOTER: Aksiyon --- */}
        <div className="p-6 border-t border-zinc-800 bg-zinc-950 flex justify-between items-center gap-4">
          <Button variant="ghost" onClick={onCancel} className="text-zinc-500 hover:text-white hover:bg-zinc-800">
            İptal / Geri Dön
          </Button>
          
          <Button onClick={onStart} size="lg" className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 text-lg shadow-lg shadow-green-900/20">
            <Play className="w-5 h-5 mr-2 fill-current" /> RSVP Motorunu Başlat
          </Button>
        </div>

      </Card>
    </div>
  );
}
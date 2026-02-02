"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Trophy, Clock, Zap, Target, CheckCircle2, Save } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useNeuroStore } from "@/store/useNeuroStore";

interface SessionResultProps {
  wpm: number;
  wordCount: number;
  durationSeconds: number;
  quizScore?: number; // ✅ Quiz skoru (opsiyonel)
  onClose: () => void;
}

export function SessionResult({ wpm, wordCount, durationSeconds, quizScore, onClose }: SessionResultProps) {
  const { user } = useNeuroStore();
  const [comprehension, setComprehension] = useState(quizScore || 70); // Quiz skoru varsa onu kullan
  const [isSaving, setIsSaving] = useState(false);

  // ERS (Effective Reading Speed) Hesabı: Hız x Anlama Oranı
  const ers = Math.round(wpm * (comprehension / 100));

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);

    // 1. Veritabanına Kaydet
    const { error } = await supabase.from("readings").insert({
      user_id: user!.id,
      wpm: wpm,
      quiz_score: comprehension, // Şimdilik öz-değerlendirme puanı
      // duration: durationSeconds, (Eğer tablonda duration sütunu varsa ekle)
      created_at: new Date().toISOString()
    });

    // 2. Profildeki 'Son Hız'ı güncelle
    if (!error) {
       await supabase.from("user_profiles").update({
         last_ers_score: ers
       }).eq("user_id", user!.id);
    }

    setIsSaving(false);
    onClose(); // Ana sayfaya dön ve grafikleri yenile
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in zoom-in-95">
      <Card className="w-full max-w-lg bg-zinc-900 border-zinc-800 p-8 shadow-2xl relative overflow-hidden">
        
        {/* Dekoratif Arka Plan */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-blue-500"></div>
        
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-green-500/10 rounded-full mb-4 border border-green-500/20">
             <Trophy className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-3xl font-black text-white italic">SEANS TAMAMLANDI</h2>
          <p className="text-zinc-400">Beyniniz bu antrenmanı başarıyla tamamladı.</p>
        </div>

        {/* İstatistik Grid */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-center">
             <Zap className="w-5 h-5 text-purple-500 mx-auto mb-2" />
             <div className="text-2xl font-bold text-white">{wpm}</div>
             <div className="text-[10px] text-zinc-500 uppercase">Hız (WPM)</div>
          </div>
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-center">
             <Clock className="w-5 h-5 text-blue-500 mx-auto mb-2" />
             <div className="text-2xl font-bold text-white">{Math.round(durationSeconds)}sn</div>
             <div className="text-[10px] text-zinc-500 uppercase">Süre</div>
          </div>
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-center relative overflow-hidden">
             {/* ERS Vurgusu */}
             <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent"></div>
             <Target className="w-5 h-5 text-green-500 mx-auto mb-2 relative z-10" />
             <div className="text-2xl font-bold text-green-400 relative z-10">{ers}</div>
             <div className="text-[10px] text-zinc-500 uppercase relative z-10">Net Hız (ERS)</div>
          </div>
        </div>

        {/* Öz Değerlendirme Slider */}
        <div className="space-y-4 mb-8">
           <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-white flex items-center gap-2">
                 <CheckCircle2 className="w-4 h-4 text-purple-400" /> Ne kadar anladınız?
              </label>
              <span className="text-xl font-bold text-purple-400">%{comprehension}</span>
           </div>
           
           <Slider 
              defaultValue={[70]} 
              max={100} 
              step={5} 
              onValueChange={(val) => setComprehension(val[0])}
              className="py-4"
           />
           <p className="text-xs text-zinc-500 text-center">
              Dürüst cevap vermeniz, yapay zekanın (AI) size uygun metin önermesi için önemlidir.
           </p>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="w-full py-6 text-lg font-bold bg-white text-black hover:bg-zinc-200"
        >
           {isSaving ? "Kaydediliyor..." : "Kaydet ve Ana Sayfaya Dön"} <Save className="w-5 h-5 ml-2" />
        </Button>

      </Card>
    </div>
  );
}
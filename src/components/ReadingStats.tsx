"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Activity, Calendar, Zap, BrainCircuit } from "lucide-react";
import { useNeuroStore } from "@/store/useNeuroStore";

interface ReadingData {
  id: number;
  wpm: number;
  date: string;
  fullDate: string;
  score: number;
}

export function ReadingStats({ refreshTrigger }: { refreshTrigger: number }) {
  const { user } = useNeuroStore();
  const [data, setData] = useState<ReadingData[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<ReadingData | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      const { data: readings } = await supabase
        .from("readings")
        .select("id, wpm, created_at, quiz_score")
        .eq("user_id", user!.id)
        .gt("wpm", 50) // Hatalı verileri ele
        .order("created_at", { ascending: true }) // Eskiden yeniye
        .limit(10); // Son 10 okuma (Grafik sıkışmasın)

      if (readings && readings.length > 0) {
        const formatted = readings.map((r) => ({
          id: r.id,
          wpm: r.wpm,
          score: r.quiz_score || 0,
          fullDate: new Date(r.created_at).toLocaleString("tr-TR"),
          date: new Date(r.created_at).toLocaleDateString("tr-TR", { day: 'numeric', month: 'short' })
        }));
        setData(formatted);
        setSelectedPoint(formatted[formatted.length - 1]); // En son veriyi seçili getir
      }
    };

    fetchStats();
  }, [refreshTrigger, user?.id]);

  // --- SVG HESAPLAMALARI (Dinamik Çizim) ---
  const width = 100; // SVG Viewbox genişliği
  const height = 50; // SVG Viewbox yüksekliği
  
  // WPM değerlerini 0-100 arasına normalize et
  const maxWpm = Math.max(...data.map(d => d.wpm), 300);
  const minWpm = Math.min(...data.map(d => d.wpm), 100);
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    // Y eksenini ters çeviriyoruz (SVG'de 0 en üsttür)
    const y = height - ((d.wpm - minWpm) / (maxWpm - minWpm || 1)) * (height - 10) - 5; 
    return `${x},${y}`;
  }).join(" ");

  // Alan grafiği için altı kapat
  const areaPoints = `${points} ${width},${height} 0,${height}`;

  return (
    <Card className="bg-zinc-900 border-zinc-800 p-6 h-full flex flex-col justify-between shadow-xl">
       {/* Başlık ve Seçili Veri Özeti */}
       <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Activity className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm tracking-wide">NÖRO-GELİŞİM</h3>
              <p className="text-zinc-500 text-[10px]">Son 10 Oturum Analizi</p>
            </div>
          </div>
          
          {selectedPoint && (
             <div className="text-right animate-in fade-in slide-in-from-right-4">
                <div className="text-2xl font-black text-white leading-none">{selectedPoint.wpm} <span className="text-[10px] text-zinc-500 font-normal">WPM</span></div>
                <div className="text-[10px] text-zinc-400 font-mono mt-1 flex items-center justify-end gap-1">
                   <BrainCircuit className="w-3 h-3 text-green-500" /> Skor: %{selectedPoint.score}
                </div>
             </div>
          )}
       </div>

       {/* GRAFİK ALANI */}
       <div className="relative w-full h-32 select-none">
          {data.length < 2 ? (
            <div className="flex items-center justify-center h-full text-zinc-600 text-xs italic">Veri toplanıyor...</div>
          ) : (
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
              {/* Gradient Tanımı */}
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Dolgulu Alan */}
              <polygon points={areaPoints} fill="url(#gradient)" />

              {/* Çizgi */}
              <polyline points={points} fill="none" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

              {/* Noktalar (Tıklanabilir) */}
              {data.map((d, i) => {
                const x = (i / (data.length - 1)) * width;
                const y = height - ((d.wpm - minWpm) / (maxWpm - minWpm || 1)) * (height - 10) - 5;
                const isSelected = selectedPoint?.id === d.id;

                return (
                  <g key={d.id} onClick={() => setSelectedPoint(d)} className="cursor-pointer group">
                    {/* Görünmez geniş tıklama alanı */}
                    <circle cx={x} cy={y} r="6" fill="transparent" />
                    
                    {/* Görünür Nokta */}
                    <circle 
                      cx={x} cy={y} 
                      r={isSelected ? 2.5 : 1.5} 
                      fill={isSelected ? "#fff" : "#a855f7"} 
                      stroke="#a855f7" 
                      strokeWidth={isSelected ? 1 : 0}
                      className="transition-all duration-300 ease-out group-hover:r-3"
                    />
                  </g>
                );
              })}
            </svg>
          )}
       </div>

       {/* Alt Bilgi (Tarih) */}
       {selectedPoint && (
          <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500 font-mono">
             <div className="flex items-center gap-2">
                <Calendar className="w-3 h-3" /> {selectedPoint.fullDate}
             </div>
             <div className="flex items-center gap-1 text-purple-400">
                <Zap className="w-3 h-3" /> Detay
             </div>
          </div>
       )}
    </Card>
  );
}

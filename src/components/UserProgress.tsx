"use client";

import { Card } from "@/components/ui/card";
import { Trophy, Zap, Crown, Medal } from "lucide-react";

interface UserProgressProps {
  currentWpm: number;
  masteryLevel: string;
}

export function UserProgress({ currentWpm, masteryLevel }: UserProgressProps) {
  // Rütbe Mantığı
  let nextLevel = "";
  let target = 0;
  let min = 0;
  let icon = <Medal className="w-5 h-5 text-zinc-500" />;
  let color = "bg-zinc-500";

  if (currentWpm < 300) {
    min = 0; target = 300; nextLevel = "ADEPT (Usta)"; 
    icon = <Zap className="w-5 h-5 text-yellow-500" />;
    color = "bg-yellow-500";
  } else if (currentWpm < 600) {
    min = 300; target = 600; nextLevel = "ELITE (Seçkin)";
    icon = <Trophy className="w-5 h-5 text-purple-500" />;
    color = "bg-purple-500";
  } else if (currentWpm < 900) {
    min = 600; target = 900; nextLevel = "GENIUS (Dahi)";
    icon = <Crown className="w-5 h-5 text-red-500" />;
    color = "bg-red-500";
  } else {
    // Zirve
    min = 900; target = 1500; nextLevel = "NÖRO-EFSANE";
    icon = <Crown className="w-5 h-5 text-green-400" />;
    color = "bg-green-400";
  }

  // Yüzde Hesabı
  const progress = Math.min(100, Math.max(0, ((currentWpm - min) / (target - min)) * 100));
  const remaining = target - currentWpm;

  return (
    <div className="mb-6 animate-in slide-in-from-top-4">
      <div className="flex justify-between items-end mb-2">
        <div>
           <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
             Mevcut Seviye
           </h3>
           <div className="text-2xl font-black text-white flex items-center gap-2 mt-1">
              {masteryLevel.toUpperCase()} <span className="text-zinc-600 text-sm font-mono">({currentWpm} WPM)</span>
           </div>
        </div>
        
        <div className="text-right">
           <div className="text-xs text-zinc-500 mb-1">Sonraki Hedef: <span className="text-white font-bold">{nextLevel}</span></div>
           {remaining > 0 ? (
             <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded">
               +{remaining} WPM Kaldı
             </span>
           ) : (
             <span className="text-xs font-bold text-yellow-400">Zirvedesin!</span>
           )}
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="h-4 w-full bg-zinc-900 rounded-full border border-zinc-800 relative overflow-hidden">
        {/* Arka plan ızgarası */}
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(90deg, transparent 90%, #000 90%)', backgroundSize: '10% 100%' }}></div>
        
        {/* Doluluk Çubuğu */}
        <div 
          className={`h-full ${color} transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(255,255,255,0.3)] relative`}
          style={{ width: `${progress}%` }}
        >
            <div className="absolute right-0 top-0 h-full w-1 bg-white/50"></div>
        </div>
      </div>
    </div>
  );
}
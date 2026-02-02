"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Trophy, Medal, Crown, Zap, User } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface LeaderboardUser {
  user_id: string;
  username: string; // E-posta veya Ad
  max_speed: number; // max_comprehension_speed
  mastery: string;   // novice, adept, elite, genius
}

export function Leaderboard() {
  const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const fetchLeaderboard = async () => {
      // Profil tablosundan en hızlı okuyucuları çek
      const { data } = await supabase
        .from("user_profiles")
        .select("user_id, max_comprehension_speed, mastery_level")
        .order("max_comprehension_speed", { ascending: false })
        .limit(5);

      if (data) {
        // Not: Gerçek uygulamada 'users' tablosundan isim çekilir. 
        // Şimdilik ID'nin ilk kısmını veya 'Anonim Nöron' kullanacağız.
        // Eğer readings tablosunda username varsa oradan JOIN yapılabilir ama 
        // şu an basit tutup ID'yi kısaltarak gösterelim.
        
        const formatted = data.map(u => ({
          user_id: u.user_id,
          username: `Nöro-Okuyucu #${u.user_id.slice(-4).toUpperCase()}`, // Örn: Nöro-Okuyucu #A1B2
          max_speed: u.max_comprehension_speed || 0,
          mastery: u.mastery_level || 'novice'
        }));
        setLeaders(formatted);
      }
    };

    fetchLeaderboard();
  }, []);

  if (!mounted) return null;

  // Rütbe Rengi ve İkonu Yardımcısı
  const getBadge = (mastery: string) => {
    switch (mastery) {
      case 'genius': return { icon: <Crown className="w-3 h-3" />, color: "text-red-400 bg-red-500/10 border-red-500/20" };
      case 'elite': return { icon: <Trophy className="w-3 h-3" />, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" };
      case 'adept': return { icon: <Zap className="w-3 h-3" />, color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" };
      default: return { icon: <User className="w-3 h-3" />, color: "text-zinc-400 bg-zinc-800 border-zinc-700" };
    }
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800 p-0 overflow-hidden h-full flex flex-col">
       {/* Başlık */}
       <div className="p-4 border-b border-zinc-800 bg-zinc-950/50 flex justify-between items-center">
          <div className="flex items-center gap-2">
             <Trophy className="w-5 h-5 text-yellow-500" />
             <h3 className="font-bold text-white tracking-wide">TOP 5 NÖRO-LİG</h3>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono uppercase">Canlı Sıralama</span>
       </div>

       {/* Liste */}
       <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {leaders.length === 0 ? (
            <div className="text-center py-10 text-zinc-600 text-xs">Henüz şampiyon yok...</div>
          ) : (
            leaders.map((leader, index) => {
              const badge = getBadge(leader.mastery);
              const isTop3 = index < 3;
              
              return (
                <div key={leader.user_id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-950/30 border border-zinc-800/50 hover:bg-zinc-800 transition-colors group">
                   
                   {/* Sol Taraf: Sıra ve İsim */}
                   <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 flex items-center justify-center rounded-full font-bold text-xs 
                        ${index === 0 ? 'bg-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 
                          index === 1 ? 'bg-zinc-400 text-black' : 
                          index === 2 ? 'bg-orange-700 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                         {index + 1}
                      </div>
                      
                      <div>
                         <div className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors">
                            {leader.username}
                         </div>
                         {/* Rütbe Rozeti */}
                         <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold border mt-1 ${badge.color}`}>
                            {badge.icon} {leader.mastery}
                         </div>
                      </div>
                   </div>

                   {/* Sağ Taraf: Skor */}
                   <div className="text-right">
                      <div className="text-sm font-black text-white font-mono">{leader.max_speed}</div>
                      <div className="text-[9px] text-zinc-600 uppercase">MAX WPM</div>
                   </div>
                </div>
              );
            })
          )}
       </div>
    </Card>
  );
}
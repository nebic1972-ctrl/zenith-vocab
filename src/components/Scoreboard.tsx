"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Trophy, Crown, Medal } from "lucide-react";

export function Scoreboard() {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaders() {
      // Supabase'den en çok okuyan ilk 5 kişiyi çek
      const { data } = await supabase
        .from("user_profiles")
        .select("user_id, email, total_words_read, mastery_level")
        .order("total_words_read", { ascending: false })
        .limit(5);

      if (data) setLeaders(data);
      setLoading(false);
    }
    fetchLeaders();
  }, []);

  // Email gizleme fonksiyonu (kvkk dostu)
  const maskEmail = (email: string) => {
    if (!email) return "Anonim Okuyucu";
    const [name, domain] = email.split("@");
    return `${name.substring(0, 3)}***@${domain}`;
  };

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800">
        <div className="p-2 bg-yellow-500/10 rounded-lg">
            <Trophy className="w-6 h-6 text-yellow-500" />
        </div>
        <div>
            <h2 className="text-xl font-bold text-white">Liderlik Tablosu</h2>
            <p className="text-xs text-zinc-500">En hızlı nöronlar</p>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
             {[1,2,3].map(i => <div key={i} className="h-12 bg-zinc-800/50 rounded-xl animate-pulse"/>)}
          </div>
        ) : leaders.length === 0 ? (
          <div className="text-zinc-500 text-center py-4">Henüz veri yok. İlk sen ol!</div>
        ) : (
          leaders.map((leader, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-black/40 hover:bg-zinc-800/40 transition group border border-transparent hover:border-zinc-700">
              <div className="flex items-center gap-4">
                {/* Sıralama Rozeti */}
                <div className={`w-8 h-8 flex items-center justify-center rounded-full font-black text-sm
                  ${index === 0 ? "bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.3)]" : 
                    index === 1 ? "bg-zinc-300 text-black" : 
                    index === 2 ? "bg-amber-700 text-white" : "bg-zinc-800 text-zinc-500"}`}>
                  {index === 0 ? <Crown className="w-4 h-4"/> : index + 1}
                </div>
                
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-zinc-200 group-hover:text-white transition">
                    {maskEmail(leader.email)}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-purple-500">
                    {leader.mastery_level}
                  </span>
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-mono font-black text-white text-lg">
                  {(leader.total_words_read || 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-zinc-500 font-medium">KELİME</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

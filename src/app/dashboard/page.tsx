"use client";

import { useEffect, useState } from "react";
import { useNeuroStore } from "@/store/useNeuroStore";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Trophy, Flame, BookOpen, Clock, Zap, ArrowRight, Target, Calendar, Camera, BookMarked, Dumbbell } from "lucide-react";
import Link from "next/link";
import { ReadingReminderCard } from "@/features/pwa/components/ReadingReminderCard";

export default function DashboardPage() {
  const router = useRouter();
  const { xp, level, syncProfile } = useNeuroStore();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("Kaptan");
  const [lastReadBook, setLastReadBook] = useState<{ id: string; title: string; position: number } | null>(null);

  const motivationalQuotes = [
    "Okumak, zihni spor salonuna götürmektir.",
    "Bir kitap, cebinizde taşıdığınız bir bahçedir.",
    "Hız sadece başlangıç, odaklanmak ise hedeftir.",
    "Bugün okuduğun her kelime, yarınki zekandır."
  ];
  const [quote, setQuote] = useState("");

  useEffect(() => {
    setQuote(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
    const init = async () => {
      await syncProfile();
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.username) setUserName(String(user.user_metadata.username));
      else if (user?.email) setUserName(user.email.split("@")[0]);

      if (user?.id) {
        try {
          const { data: progress, error: progressError } = await supabase
            .from("reading_progress")
            .select("book_id, current_position")
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (!progressError && progress?.book_id && (progress.current_position ?? 0) > 0) {
            const { data: book } = await supabase
              .from("library")
              .select("id, title")
              .eq("id", progress.book_id)
              .single();
            if (book?.title) setLastReadBook({ id: book.id, title: book.title, position: progress.current_position ?? 0 });
          }
        } catch {
          // reading_progress tablosu yoksa veya hata varsa devam et
        }
      }
      setLoading(false);
    };
    init();
  }, [syncProfile]);

  if (loading) return <div className="min-h-screen bg-[#050505] pl-20 md:pl-72 flex items-center justify-center text-white">Veriler Yükleniyor...</div>;

  const xpForNextLevel = 1000;
  const currentLevelProgress = (xp % xpForNextLevel) / xpForNextLevel * 100;
  const stats = { xp, level, streak: 0 };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 pb-24 font-sans pl-24 md:pl-72 transition-all duration-300 overflow-x-hidden">
      
      <div className="max-w-7xl mx-auto w-full">
        
        {/* 👋 KARŞILAMA HEADER */}
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                    Hoş geldin, <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">{userName}</span> 👋
                </h1>
                <p className="text-gray-400 text-sm italic">&quot;{quote}&quot;</p>
            </div>
            
            <div className="flex items-center gap-4 bg-[#111] border border-white/10 px-4 py-2 rounded-xl">
                <div className="flex flex-col items-end">
                    <span className="text-xs text-gray-400 font-bold uppercase">Seviye İlerlemesi</span>
                    <span className="text-blue-400 font-mono font-bold">{Math.floor(stats.xp % 1000)} / 1000 XP</span>
                </div>
                <div className="w-12 h-12 relative flex items-center justify-center">
                    {/* Dairesel Progress (SVG) */}
                    <svg className="transform -rotate-90 w-full h-full">
                        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-800" />
                        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={125} strokeDashoffset={125 - (125 * currentLevelProgress) / 100} className="text-blue-500 transition-all duration-1000 ease-out" />
                    </svg>
                    <span className="absolute text-xs font-bold">{level}</span>
                </div>
            </div>
        </header>

        {/* 📊 İSTATİSTİK GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {/* Kart 1: XP */}
            <div className="bg-[#111] p-5 rounded-2xl border border-white/5 flex items-center gap-4 hover:border-blue-500/30 transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                    <Zap size={24} />
                </div>
                <div>
                    <p className="text-gray-400 text-xs uppercase font-bold">Toplam XP</p>
                    <p className="text-2xl font-bold text-white">{Math.floor(xp)}</p>
                </div>
            </div>

            {/* Kart 2: Streak (Seri) */}
            <div className="bg-[#111] p-5 rounded-2xl border border-white/5 flex items-center gap-4 hover:border-orange-500/30 transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
                    <Flame size={24} />
                </div>
                <div>
                    <p className="text-gray-400 text-xs uppercase font-bold">Günlük Seri</p>
                    <p className="text-2xl font-bold text-white">{stats.streak} Gün</p>
                </div>
            </div>

             {/* Kart 3: Okunan Kelime */}
             <div className="bg-[#111] p-5 rounded-2xl border border-white/5 flex items-center gap-4 hover:border-purple-500/30 transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                    <BookOpen size={24} />
                </div>
                <div>
                    <p className="text-gray-400 text-xs uppercase font-bold">Okunan Kelime</p>
                    <p className="text-2xl font-bold text-white">{(xp * 5).toLocaleString()}</p> {/* Tahmini */}
                </div>
            </div>

            {/* Kart 4: Odak Süresi (Tahmini) */}
            <div className="bg-[#111] p-5 rounded-2xl border border-white/5 flex items-center gap-4 hover:border-green-500/30 transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 group-hover:scale-110 transition-transform">
                    <Clock size={24} />
                </div>
                <div>
                    <p className="text-gray-400 text-xs uppercase font-bold">Odak Süresi</p>
                    <p className="text-2xl font-bold text-white">{Math.floor((xp * 5) / 200)} Dk</p> {/* Tahmini */}
                </div>
            </div>
        </div>

        {/* 🚀 AKSİYON ALANLARI */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* SOL: HEDEF & AKTİVİTE */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* Kaldığı yerden devam (son okunan kitap varsa) */}
                <div
                  className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-6 rounded-3xl border border-blue-500/20 relative overflow-hidden group cursor-pointer"
                  onClick={() => router.push(lastReadBook ? `/reader?bookId=${lastReadBook.id}` : "/library")}
                >
                    <div className="absolute top-0 right-0 p-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    
                    <div className="relative z-10 flex justify-between items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold mb-4">
                                <Target size={12} /> SIRADAKİ HEDEF
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Okumaya Devam Et</h3>
                            <p className="text-gray-400 mb-6 max-w-md">
                              {lastReadBook
                                ? `"${lastReadBook.title}" kaldığın yerden devam et.`
                                : "Kaldığın yerden devam et ve serini bozma. Beynin antrenman bekliyor."}
                            </p>
                            
                            <button
                              type="button"
                              suppressHydrationWarning
                              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 group-hover:gap-3"
                            >
                              {lastReadBook ? "Kitaba devam et" : "Kütüphaneye Git"} <ArrowRight size={18} />
                            </button>
                        </div>
                        <div className="hidden sm:block text-blue-500/20 transform group-hover:scale-110 transition-transform duration-500">
                            <BookOpen size={120} />
                        </div>
                    </div>
                </div>

                {/* Belge Tara Kartı */}
                <Link href="/capture" className="block">
                  <div className="bg-[#111] p-6 rounded-2xl border border-white/5 hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/10 transition-all cursor-pointer group">
                    <div className="flex items-center justify-center w-16 h-16 bg-blue-500/10 rounded-full mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Camera className="w-8 h-8 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-center mb-2 text-white">Belge Tara</h3>
                    <p className="text-center text-gray-400 text-sm">Kameranla kitap sayfası veya notlarını çek</p>
                  </div>
                </Link>

                {/* Kelimelerim & Gym kısayolları */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Link href="/vocabulary" className="block">
                    <div className="bg-[#111] p-6 rounded-2xl border border-white/5 hover:border-amber-500/30 transition-all cursor-pointer group">
                      <BookMarked className="w-10 h-10 text-amber-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                      <h3 className="text-xl font-semibold text-center mb-2 text-white">Kelimelerim</h3>
                      <p className="text-center text-gray-400 text-sm">Kelime kartlarını görüntüle ve çalış</p>
                    </div>
                  </Link>
                  <Link href="/gym" className="block">
                    <div className="bg-[#111] p-6 rounded-2xl border border-white/5 hover:border-green-500/30 transition-all cursor-pointer group">
                      <Dumbbell className="w-10 h-10 text-green-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                      <h3 className="text-xl font-semibold text-center mb-2 text-white">Neuro Gym</h3>
                      <p className="text-center text-gray-400 text-sm">Göz ve hafıza egzersizleri</p>
                    </div>
                  </Link>
                </div>

                {/* Okuma hatırlatması */}
                <ReadingReminderCard />

                {/* Haftalık Aktivite (Dummy Chart) */}
                <div className="bg-[#111] p-6 rounded-3xl border border-white/5">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-lg flex items-center gap-2"><Calendar size={20} className="text-gray-400"/> Haftalık Aktivite</h3>
                        <span className="text-xs text-gray-500">Son 7 Gün</span>
                    </div>
                    <div className="flex items-end justify-between h-32 gap-2">
                        {[40, 70, 30, 85, 50, 90, 60].map((height, i) => (
                            <div key={i} className="w-full bg-gray-800/50 rounded-t-lg relative group overflow-hidden">
                                <div 
                                    className="absolute bottom-0 w-full bg-blue-500/80 hover:bg-blue-400 transition-all duration-500 rounded-t-lg" 
                                    style={{ height: `${height}%` }}
                                ></div>
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                                    {height} XP
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-3 font-mono">
                        <span>Pzt</span><span>Sal</span><span>Çar</span><span>Per</span><span>Cum</span><span>Cmt</span><span>Paz</span>
                    </div>
                </div>

            </div>

            {/* SAĞ: TOPLULUK / LİDERLİK (Dummy) */}
            <div className="bg-[#111] p-6 rounded-3xl border border-white/5 flex flex-col h-full">
                <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><Trophy size={20} className="text-yellow-500"/> Liderlik Tablosu</h3>
                
                <div className="flex-1 space-y-4">
                    {[
                        { name: userName + " (Sen)", xp: Math.floor(xp), rank: 1, me: true },
                        { name: "Atlas", xp: Math.floor(xp * 0.9), rank: 2, me: false },
                        { name: "Nova", xp: Math.floor(xp * 0.8), rank: 3, me: false },
                        { name: "Cosmos", xp: Math.floor(xp * 0.7), rank: 4, me: false },
                        { name: "Luna", xp: Math.floor(xp * 0.5), rank: 5, me: false },
                    ].map((player, i) => (
                        <div key={i} className={`flex items-center justify-between p-3 rounded-xl ${player.me ? 'bg-white/10 border border-white/20' : 'hover:bg-white/5'}`}>
                            <div className="flex items-center gap-3">
                                <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${i < 3 ? 'bg-yellow-500/20 text-yellow-500' : 'bg-gray-700 text-gray-400'}`}>
                                    {player.rank}
                                </span>
                                <span className={`text-sm ${player.me ? 'font-bold text-white' : 'text-gray-400'}`}>{player.name}</span>
                            </div>
                            <span className="text-xs font-mono text-gray-500">{player.xp} XP</span>
                        </div>
                    ))}
                </div>
                
                <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-center">
                    <p className="text-yellow-200 text-xs">Bu hafta ilk %5 dilimindesin!</p>
                </div>
            </div>

        </div>

      </div>
    </div>
  );
}
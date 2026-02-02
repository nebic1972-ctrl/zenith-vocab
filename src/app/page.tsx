"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useNeuroStore } from "@/store/useNeuroStore";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight, Zap, Brain, Trophy, Eye } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function LandingPage() {
  const router = useRouter();
  const { syncProfile } = useNeuroStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // OAuth callback bazen root'a düşer (?code=... veya ?error=...). Auth callback sayfasına yönlendir.
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const error = params.get("error");
      if (code || error) {
        const qs = window.location.search;
        router.replace(`/auth/callback${qs ? qs : ""}`);
        return;
      }
    }

    const checkUser = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        await syncProfile();
        router.replace("/dashboard");
      } else {
        setLoading(false);
      }
    };
    checkUser();
  }, [syncProfile, router]);

  const handleLogin = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "")}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      const isProviderDisabled =
        /provider is not enabled|Unsupported provider/i.test(msg);
      if (isProviderDisabled) {
        toast.error(
          "Google girişi Supabase'de etkin değil. Misafir olarak devam et veya Dashboard → Auth → Providers → Google'ı aç."
        );
      } else {
        toast.error("Giriş hatası: " + msg);
      }
    }
  };

  const handleGuestLogin = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      await syncProfile();
      router.replace("/dashboard");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error("Misafir girişi başarısız: " + msg);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-400 animate-pulse">Nöro-Sistem Başlatılıyor...</p>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30">

      {/* 🌌 ARKA PLAN (LAVA LAMP LITE) */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
         <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
         <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>
      </div>

      {/* 🧭 NAV BAR */}
      <nav className="relative z-10 w-full max-w-6xl mx-auto p-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain size={18} className="text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">NeuroRead</span>
        </div>
        <button
            onClick={handleLogin}
            className="px-5 py-2 rounded-full border border-white/10 hover:bg-white/10 transition-all text-sm font-medium"
        >
            Giriş Yap
        </button>
      </nav>

      {/* 🔥 HERO SECTION */}
      <main className="relative z-10 w-full max-w-4xl mx-auto px-6 pt-20 pb-32 flex flex-col items-center text-center">

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <Zap size={12} fill="currentColor" /> YENİ NESİL HIZLI OKUMA
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-b from-white via-white to-gray-500 bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
            Beyninin Hızına <br className="hidden md:block"/> Yetiş.
        </h1>

        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            DEHB ve Disleksi dostu teknolojilerle okuma hızını 3 katına çıkar.
            Biyonik okuma, akıllı ritim ve oyunlaştırma ile odaklanmayı yeniden keşfet.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <button
                onClick={handleLogin}
                className="group relative px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:scale-105 transition-transform flex items-center justify-center gap-2 overflow-hidden"
            >
                <span className="relative z-10">Hemen Başla</span>
                <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-10 transition-opacity"></div>
            </button>

            <Link href="/library" className="px-8 py-4 bg-[#111] border border-white/10 rounded-full font-bold text-lg hover:bg-[#222] transition-colors flex items-center justify-center text-gray-300">
                 Kütüphaneyi Gez
            </Link>
        </div>
        <button
          onClick={handleGuestLogin}
          className="mt-4 text-sm text-gray-500 hover:text-gray-300 transition-colors underline underline-offset-2"
        >
          Misafir olarak devam et
        </button>

        {/* 📊 ÖZELLİK KARTLARI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 w-full text-left">
            <div className="p-6 rounded-2xl bg-[#111] border border-white/5 hover:border-white/10 transition-colors group">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                    <Eye size={20} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Biyonik Okuma</h3>
                <p className="text-sm text-gray-400">Gözünün kelimeleri taraması yerine beyninin tamamlamasını sağlar. <span className="text-white font-bold">Da--ha hız--lı o--ku.</span></p>
            </div>

            <div className="p-6 rounded-2xl bg-[#111] border border-white/5 hover:border-white/10 transition-colors group">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                    <Zap size={20} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Akıllı Ritim</h3>
                <p className="text-sm text-gray-400">Metnin zorluğuna göre hızı otomatik ayarlar. Uzun kelimelerde yavaşlar, bağlaçlarda uçar.</p>
            </div>

            <div className="p-6 rounded-2xl bg-[#111] border border-white/5 hover:border-white/10 transition-colors group">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center text-yellow-400 mb-4 group-hover:scale-110 transition-transform">
                    <Trophy size={20} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Oyunlaştırma</h3>
                <p className="text-sm text-gray-400">Okudukça XP kazan, seviye atla ve yeni kitapların kilidini aç. Serini (streak) bozma!</p>
            </div>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="w-full border-t border-white/5 py-8 text-center text-gray-600 text-sm relative z-10">
        <p>© 2024 NeuroRead. Dikkat Eksikliği Olan Süper Kahramanlar İçin Üretildi.</p>
      </footer>

    </div>
  );
}

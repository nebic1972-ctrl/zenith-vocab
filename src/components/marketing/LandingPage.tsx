'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Rocket, Zap, Brain, Globe, Trophy, ArrowRight, Star } from 'lucide-react';
import OnboardingModal from '@/components/onboarding/OnboardingModal';
import { useNeuroStore } from '@/store/useNeuroStore';

export default function LandingPage() {
  const { userName } = useNeuroStore();

  // Eğer kullanıcı zaten giriş yaptıysa bu sayfa hiç görünmesin (Güvenlik)
  if (userName) return null;

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-purple-500/30">
      
      {/* ONBOARDING MODAL (Gizli durur, 'Başla' deyince tetiklenir) */}
      <OnboardingModal />

      {/* NAVBAR */}
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <Brain size={20} className="text-white" />
          </div>
          NeuroRead
        </div>
        <div className="flex gap-4">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hidden md:block text-zinc-400 hover:text-white transition-colors">Özellikler</button>
          <button className="px-5 py-2 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-colors">Giriş Yap</button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-20 pb-32 overflow-hidden px-6 text-center">
        {/* Arka Plan Işıkları */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-sm mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            Yapay Zeka Destekli Okuma Koçu
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Okuma Hızını <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">İkiye Katla.</span>
          </h1>
          
          <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Sıradan okuma devri bitti. Biyonik okuma, yapay zeka özetleri ve nöro-esneklik egzersizleri ile beyninin gerçek potansiyelini keşfet.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="px-8 py-4 bg-white text-black font-bold text-lg rounded-xl hover:scale-105 transition-transform flex items-center gap-2 shadow-[0_0_40px_rgba(255,255,255,0.3)]">
              <Rocket size={20} /> Hemen Başla
            </button>
            <button className="px-8 py-4 bg-zinc-900 border border-zinc-800 text-white font-bold text-lg rounded-xl hover:bg-zinc-800 transition-colors">
              Nasıl Çalışır?
            </button>
          </div>

          {/* İstatistikler */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-zinc-800 pt-8 max-w-3xl mx-auto">
             {[
               { val: '3x', label: 'Daha Hızlı' },
               { val: '%80', label: 'Daha İyi Odak' },
               { val: '10K+', label: 'Kelime Hazinesi' },
               { val: 'AI', label: 'Akıllı Analiz' }
             ].map((stat, i) => (
               <div key={i}>
                 <div className="text-3xl font-bold text-white mb-1">{stat.val}</div>
                 <div className="text-sm text-zinc-500 uppercase tracking-wider">{stat.label}</div>
               </div>
             ))}
          </div>
        </motion.div>
      </section>

      {/* ÖZELLİKLER GRİDİ */}
      <section className="py-24 bg-zinc-900/30 border-y border-zinc-800 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Sadece Okuma Değil, <span className="text-purple-400">Beyin İnşası.</span></h2>
            <p className="text-zinc-400">Modern dünyanın bilgi akışına yetişmek için ihtiyacın olan her şey.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: "Biyonik Okuma", desc: "Gözünün kelimeler üzerinde kaymasını sağlayan özel vurgulama teknolojisi." },
              { icon: Brain, title: "AI Özet & Çeviri", desc: "Gemini AI ile kitapları saniyeler içinde özetle, anlamadığın yerleri anında çevir." },
              { icon: Trophy, title: "Lig & Arena", desc: "Diğer 'Nöro-Atlet'lerle yarış, lig atla ve botlara meydan oku." },
              { icon: Globe, title: "Web Entegrasyonu", desc: "İnternetteki herhangi bir makaleyi link vererek kütüphanene ekle." },
              { icon: Star, title: "Kelime Hazinesi", desc: "Bilmediğin kelimeleri topla, yapay zeka ile anlamlarını öğren ve test et." },
              { icon: Rocket, title: "Kişisel Planlar", desc: "Sınav, iş veya hobi için sana özel 7-30 günlük kamp programları." }
            ].map((feat, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800 hover:border-purple-500/30 transition-colors group"
              >
                <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-600 transition-colors text-white">
                  <feat.icon size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">{feat.title}</h3>
                <p className="text-zinc-400 leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA (Alt Kısım) */}
      <section className="py-32 px-6 text-center">
        <div className="max-w-3xl mx-auto bg-gradient-to-br from-purple-900/50 to-blue-900/50 p-12 rounded-3xl border border-white/10 relative overflow-hidden">
           
           <h2 className="text-3xl md:text-5xl font-bold mb-6 relative z-10">Potansiyelini Açığa Çıkar</h2>
           <p className="text-lg text-zinc-300 mb-8 relative z-10">Sınırlarını zorlamaya hazır mısın? Ücretsiz başla, farkı gör.</p>
           
           <button className="px-10 py-4 bg-white text-black font-bold text-lg rounded-xl hover:bg-zinc-200 transition-colors relative z-10 flex items-center gap-2 mx-auto">
             Ücretsiz Kayıt Ol <ArrowRight size={20} />
           </button>
        </div>
      </section>

      <footer className="py-8 text-center text-zinc-600 text-sm border-t border-zinc-900">
        <p>&copy; 2024 NeuroRead Platform. Tüm hakları saklıdır.</p>
      </footer>

    </div>
  );
}

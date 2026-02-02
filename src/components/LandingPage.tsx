"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookOpen, Brain, TrendingUp, Zap, Users, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-black"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32">
          <div className="text-center space-y-6">
            <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Beyninin Potansiyelini Keşfet
            </h1>
            <p className="text-xl md:text-2xl text-zinc-300 max-w-3xl mx-auto">
              Yapay Zeka Destekli Hızlı Okuma ve Odaklanma Platformu
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
              <Link href="/">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold text-lg px-8 py-6 shadow-lg shadow-purple-500/30"
                >
                  Ücretsiz Başla
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button
                onClick={() => router.push('/library')}
                variant="outline"
                size="lg"
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-900 font-semibold px-8 py-6"
              >
                Daha Fazla Bilgi
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 hover:border-purple-500/50 transition-all">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Hızlı Okuma</h3>
            <p className="text-zinc-400 leading-relaxed">
              RSVP teknolojisi ile kelimeleri tek tek göstererek okuma hızını 3-5 katına çıkar. 
              Göz kaslarını güçlendir ve odaklanma süreni artır.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 hover:border-purple-500/50 transition-all">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mb-4">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Nöro-Egzersizler</h3>
            <p className="text-zinc-400 leading-relaxed">
              Schulte Tablosu ve Stroop Testi ile beynini çalıştır. 
              Görsel algı, dikkat ve reaksiyon hızını geliştir.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 hover:border-purple-500/50 transition-all">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">İlerleme Takibi</h3>
            <p className="text-zinc-400 leading-relaxed">
              Detaylı analizler ve istatistiklerle ilerlemeni görselleştir. 
              Günlük hedefler, seri takibi ve başarımlarla motivasyonunu artır.
            </p>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="bg-zinc-900/30 border-y border-zinc-800 py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-purple-400" />
              <div className="text-left">
                <div className="text-3xl font-bold text-white">10.000+</div>
                <div className="text-zinc-400 text-sm">Okuma Yapıldı</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-400" />
              <div className="text-left">
                <div className="text-3xl font-bold text-white">500+</div>
                <div className="text-zinc-400 text-sm">Aktif Kullanıcı</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8 text-pink-400" />
              <div className="text-left">
                <div className="text-3xl font-bold text-white">50.000+</div>
                <div className="text-zinc-400 text-sm">Egzersiz Tamamlandı</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-2xl p-12 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Hemen Başla, Potansiyelini Keşfet
          </h2>
          <p className="text-zinc-300 text-lg mb-8 max-w-2xl mx-auto">
            Ücretsiz hesap oluştur ve beyninin sınırlarını zorla. 
            Yapay zeka destekli öğrenme deneyimi seni bekliyor.
          </p>
          <Link href="/">
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold text-lg px-10 py-6 shadow-lg shadow-purple-500/30"
            >
              Ücretsiz Başla
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-zinc-400 text-sm">
              © 2024 Neuro-Read. Tüm hakları saklıdır.
            </div>
            <div className="flex gap-6 text-sm">
              <a href="#" className="text-zinc-400 hover:text-white transition">Gizlilik</a>
              <a href="#" className="text-zinc-400 hover:text-white transition">Şartlar</a>
              <a href="#" className="text-zinc-400 hover:text-white transition">İletişim</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

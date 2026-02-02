'use client';

import { Sparkles, CheckCircle2 } from 'lucide-react';

export default function PremiumPaywall({
  featureName,
  onClose,
}: {
  featureName: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/20 rounded-full blur-[80px]" />

        <div className="relative z-10 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Sparkles className="text-white" size={32} />
          </div>

          <h2 className="text-2xl font-medium text-white mb-2 italic">Premium Deneyim</h2>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            <span className="text-blue-400 font-bold">{featureName}</span> özelliği ile bilişsel
            sınırlarınızı bilimsel verilerle genişletin.
          </p>

          <div className="space-y-4 mb-10 text-left">
            {[
              'AI Duygu Durum Analizi',
              'Sınırsız Bilişsel Radar Verisi',
              'Gelişmiş Nöro-Yorgunluk Takibi',
              'Öncelikli Yeni Egzersizler',
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3 text-xs text-gray-300">
                <CheckCircle2 size={14} className="text-blue-500 shrink-0" />
                {text}
              </div>
            ))}
          </div>

          <button
            type="button"
            className="w-full py-4 bg-white text-black rounded-2xl font-bold text-sm hover:bg-gray-200 transition-all transform active:scale-95 shadow-xl mb-4"
          >
            Aylık ₺199 / Başlat
          </button>

          <button
            type="button"
            onClick={onClose}
            className="text-[10px] text-gray-600 font-bold uppercase tracking-widest hover:text-gray-400 transition"
          >
            Belki Daha Sonra
          </button>
        </div>
      </div>
    </div>
  );
}

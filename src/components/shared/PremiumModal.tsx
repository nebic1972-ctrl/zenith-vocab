'use client';

import React from 'react';
import { useNeuroStore } from '@/store/useNeuroStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Crown } from 'lucide-react';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PremiumModal({ isOpen, onClose }: PremiumModalProps) {
  const { activatePremium } = useNeuroStore();

  const handlePurchase = () => {
    // Gerçek ödeme sistemi (Stripe/Iyzico) buraya bağlanır
    // Şimdilik simülasyon yapıyoruz
    activatePremium();
    alert("Tebrikler! Artık Premium üyesin. Tüm kilitler açıldı! 🎉");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-2xl bg-zinc-900 border border-yellow-500/30 rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-[0_0_50px_rgba(234,179,8,0.2)]"
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white z-10"><X /></button>

          {/* SOL: GÖRSEL */}
          <div className="w-full md:w-2/5 bg-gradient-to-br from-yellow-600 to-yellow-800 p-8 flex flex-col justify-center items-center text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-lg">
               <Crown size={40} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">NeuroRead PRO</h2>
            <p className="text-yellow-100 text-sm">Sınırları kaldır, potansiyeline ulaş.</p>
          </div>

          {/* SAĞ: FİYAT VE ÖZELLİKLER */}
          <div className="w-full md:w-3/5 p-8 bg-zinc-900">
            <h3 className="text-xl font-bold text-white mb-6">Neden Pro?</h3>
            <ul className="space-y-4 mb-8">
              {[
                "Sınırsız AI Çeviri & Sözlük",
                "Özel 'Deep Work' Kitaplığı",
                "Gelişmiş İstatistikler & Isı Haritası",
                "Reklamsız Deneyim"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-zinc-300">
                  <div className="p-1 bg-green-500/20 rounded-full text-green-500"><Check size={14}/></div>
                  {item}
                </li>
              ))}
            </ul>

            <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700 mb-6 flex justify-between items-center">
              <div>
                 <div className="text-sm text-zinc-400 line-through">₺999 / Yıl</div>
                 <div className="text-2xl font-bold text-white">₺499 <span className="text-sm font-normal text-zinc-400">/ Yıl</span></div>
              </div>
              <div className="px-3 py-1 bg-yellow-500/20 text-yellow-500 text-xs font-bold rounded-lg uppercase">
                %50 İndirim
              </div>
            </div>

            <button 
              onClick={handlePurchase}
              className="w-full py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold rounded-xl transition-all shadow-lg shadow-yellow-900/20"
            >
              Hemen Yükselt 🚀
            </button>
            <p className="text-center text-xs text-zinc-500 mt-4">İstediğin zaman iptal et.</p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

'use client';

import React from 'react';
import { useNeuroStore } from '@/store/useNeuroStore';
import { motion } from 'framer-motion';

export default function ActivityHeatmap() {
  const { history } = useNeuroStore();

  // Son 90 günü hesapla
  const days = Array.from({ length: 90 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (89 - i)); // Bugünden geriye doğru
    return d.toISOString().split('T')[0];
  });

  // Aktivite seviyesini bul (0-4 arası)
  const getActivityLevel = (date: string) => {
    // O tarihteki kayıtları bul
    const entries = history.filter(h => h.date === date);
    if (entries.length === 0) return 0;
    
    // Toplam aktivite sayısı veya WPM'e göre yoğunluk
    // Basit mantık: Kayıt varsa 1, 3'ten fazla kayıt varsa 2...
    if (entries.length > 5) return 4;
    if (entries.length > 3) return 3;
    if (entries.length > 1) return 2;
    return 1;
  };

  const getColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-zinc-800'; // Boş
      case 1: return 'bg-green-900'; // Az
      case 2: return 'bg-green-700';
      case 3: return 'bg-green-500';
      case 4: return 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]'; // Çok (Parlayan)
      default: return 'bg-zinc-800';
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-8 overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-zinc-300">Antrenman Sürekliliği</h3>
        <span className="text-xs text-zinc-500">Son 3 Ay</span>
      </div>

      <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
        {days.map((date, index) => {
          const level = getActivityLevel(date);
          return (
            <motion.div
              key={date}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.005 }}
              title={`${date}: ${level > 0 ? 'Aktif' : 'Boş'}`}
              className={`w-3 h-3 sm:w-4 sm:h-4 rounded-sm ${getColor(level)} transition-colors hover:scale-125 hover:border hover:border-white/50 cursor-pointer`}
            />
          );
        })}
      </div>

      <div className="flex items-center gap-2 mt-4 text-[10px] text-zinc-500 justify-end">
        <span>Az</span>
        <div className="w-3 h-3 bg-green-900 rounded-sm" />
        <div className="w-3 h-3 bg-green-700 rounded-sm" />
        <div className="w-3 h-3 bg-green-500 rounded-sm" />
        <div className="w-3 h-3 bg-green-400 rounded-sm shadow-[0_0_5px_rgba(74,222,128,0.5)]" />
        <span>Çok</span>
      </div>
    </div>
  );
}

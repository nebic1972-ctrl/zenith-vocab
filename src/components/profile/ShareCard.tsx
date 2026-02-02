'use client';

import React, { useState } from 'react';
import { useNeuroStore } from '@/store/useNeuroStore';
import { Share2, Check } from 'lucide-react';

export default function ShareCard() {
  const { userName, level, xp, dailyStats } = useNeuroStore();
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const text = `🚀 NeuroRead İstatistiklerim:\n\n👤 Kaptan: ${userName || 'Anonim'}\n🏆 Seviye: ${level} (${xp} XP)\n🔥 Seri: ${dailyStats.lastLoginDate === new Date().toISOString().split('T')[0] ? 'Devam Ediyor' : 'Mola'}\n📚 Bugün Okunan: ${dailyStats.wordsRead} Kelime\n\nSen de beynini geliştir!`;
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleShare}
      className="group relative flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-purple-600 rounded-xl text-zinc-400 hover:text-white transition-all font-bold text-sm border border-zinc-700 hover:border-purple-500"
    >
      {copied ? <Check size={16} /> : <Share2 size={16} />}
      {copied ? 'Kopyalandı!' : 'Karneni Paylaş'}
      
      {/* Tooltip */}
      <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Metin olarak kopyala
      </span>
    </button>
  );
}

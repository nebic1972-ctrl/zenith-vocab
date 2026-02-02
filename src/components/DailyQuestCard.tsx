'use client';

import { useNeuroStore } from '@/store/useNeuroStore';
import { generateDailyQuest } from '@/lib/aiProvider';
import { Target, ArrowRight } from 'lucide-react';

export default function DailyQuestCard() {
  const { stats } = useNeuroStore();
  const quest = generateDailyQuest(stats);

  return (
    <div className="bg-[#111] border border-blue-500/20 rounded-[2.5rem] p-8 relative overflow-hidden group hover:border-blue-500/40 transition-all duration-500">
      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
        <Target size={120} className="text-blue-500" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <span className="bg-blue-500/10 text-blue-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
            Günün Görevi
          </span>
          <span className="text-[10px] text-gray-600 font-bold">+{quest.xpReward} XP</span>
        </div>

        <h2 className="text-2xl font-medium text-white mb-6 max-w-xs leading-tight">
          {quest.title}
        </h2>

        <button
          type="button"
          className="flex items-center gap-2 text-xs font-bold text-white bg-blue-600 px-6 py-3 rounded-xl hover:bg-blue-500 transition-colors"
        >
          Görevi Başlat <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

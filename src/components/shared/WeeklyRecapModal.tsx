'use client';

import { generateWeeklyRecap, type WeeklyDataPoint } from '@/lib/recapEngine';
import { TrendingUp, Clock, Brain, X } from 'lucide-react';

type WeeklyRecapModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

/** Örnek haftalık veri (store’dan veya API’den gelebilir). */
function getDefaultWeeklyData(): WeeklyDataPoint[] {
  return [
    { date: 'Pzt', speed: 380, comprehension: 82, focus: 45 },
    { date: 'Sal', speed: 420, comprehension: 88, focus: 72 },
    { date: 'Çar', speed: 350, comprehension: 75, focus: 38 },
    { date: 'Per', speed: 410, comprehension: 80, focus: 55 },
    { date: 'Cum', speed: 395, comprehension: 85, focus: 50 },
    { date: 'Cmt', speed: 360, comprehension: 78, focus: 42 },
    { date: 'Paz', speed: 340, comprehension: 70, focus: 35 },
  ];
}

export default function WeeklyRecapModal({ isOpen, onClose }: WeeklyRecapModalProps) {
  const weeklyData = getDefaultWeeklyData();
  const { avgSpeed, bestDay, insight } = generateWeeklyRecap(weeklyData);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] bg-black/90 backdrop-blur-2xl p-8 flex items-center justify-center animate-in fade-in duration-500">
      <div className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[3rem] p-10 relative overflow-hidden shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors"
          aria-label="Kapat"
        >
          <X size={20} />
        </button>

        <header className="mb-12">
          <span className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.3em] mb-2 block">
            Analiz Raporu
          </span>
          <h2 className="text-3xl font-medium text-white italic">Haftalık Bilişsel Karne</h2>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white/5 rounded-3xl p-6 border border-white/5">
            <div className="flex items-center gap-3 mb-4 text-orange-400">
              <TrendingUp size={20} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Ortalama Hız</span>
            </div>
            <div className="text-4xl font-light text-white mb-2">
              {Math.round(avgSpeed)}{' '}
              <span className="text-sm text-gray-500">WPM</span>
            </div>
            <p className="text-[10px] text-green-500 font-bold uppercase">+12% Geçen Haftaya Göre</p>
          </div>

          <div className="bg-white/5 rounded-3xl p-6 border border-white/5">
            <div className="flex items-center gap-3 mb-4 text-blue-400">
              <Clock size={20} />
              <span className="text-[10px] font-bold uppercase tracking-widest">En Verimli Gün</span>
            </div>
            <div className="text-4xl font-light text-white mb-2">{bestDay.date || '—'}</div>
            <p className="text-[10px] text-gray-500 font-bold uppercase">Anlama %{bestDay.comprehension}</p>
          </div>
        </div>

        <div className="bg-blue-600/10 border border-blue-500/20 rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-4">
            <Brain size={24} className="text-blue-400 shrink-0" />
            <h4 className="text-sm font-bold text-white uppercase tracking-widest">Silver&apos;ın Notu</h4>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed italic">&quot;{insight}&quot;</p>
        </div>
      </div>
    </div>
  );
}

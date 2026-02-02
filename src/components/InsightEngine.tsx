'use client';

import { useRouter } from 'next/navigation';
import { useNeuroStore } from '@/store/useNeuroStore';
import { Sparkles, TrendingUp } from 'lucide-react';

export default function InsightEngine() {
  const router = useRouter();
  const { stats, activities } = useNeuroStore();

  const generateInsight = () => {
    if (stats.comprehensionScore > stats.focusScore * 1.5) {
      return {
        type: 'strategy',
        text: "Analiz gücünüz harika, ancak akışta kalma süreniz düşük. Bir sonraki seansı 'Akışta Kal' diyerek tamamlamayı deneyin.",
        icon: <Sparkles className="text-blue-400" />,
      };
    }
    return {
      type: 'praise',
      text: 'Dengeli bir gelişim sergiliyorsunuz. Bilişsel radarınız ideal bir daireye yaklaşıyor.',
      icon: <TrendingUp className="text-green-400" />,
    };
  };

  const insight = generateInsight();

  return (
    <div className="bg-gradient-to-br from-blue-600/10 to-transparent border border-white/10 rounded-[2rem] p-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-white/5 rounded-xl">{insight.icon}</div>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          Bilişsel Rehber
        </span>
      </div>
      <p className="text-sm text-gray-200 leading-relaxed font-medium">&quot;{insight.text}&quot;</p>
      <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center">
        <span className="text-[10px] text-gray-600 font-bold uppercase">Tavsiye Edilen Aksiyon:</span>
        <button
          type="button"
          className="text-[10px] text-blue-400 font-bold hover:underline"
          onClick={() => router.push('/exercises')}
        >
          Antrenmana Başla &rarr;
        </button>
      </div>
    </div>
  );
}

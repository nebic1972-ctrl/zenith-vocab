'use client';

import { analyzeSentiment } from '@/lib/aiProvider';

export default function SentimentBadge({
  content,
  isPremium,
}: {
  content: string;
  isPremium: boolean;
}) {
  const sentiment = analyzeSentiment(content);

  if (!isPremium) {
    return (
      <div className="text-[9px] text-gray-700 uppercase">Analiz İçin Yükselt</div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-md border border-white/10">
      <div className={`w-1.5 h-1.5 rounded-full ${sentiment.color}`} />
      <span className="text-[10px] text-gray-400 font-bold uppercase">{sentiment.label}</span>
    </div>
  );
}

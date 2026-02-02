'use client';

import { Zap } from 'lucide-react';

export default function WarmUpSuggestion({
  onStartExercise,
  onSkip,
}: {
  onStartExercise: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-md flex items-center justify-center p-6">
      <div className="bg-[#111] border border-blue-500/20 w-full max-w-sm rounded-[2.5rem] p-8 text-center shadow-2xl">
        <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-400">
          <Zap size={32} />
        </div>
        <h2 className="text-xl font-medium text-white mb-2">Isınma Önerilir</h2>
        <p className="text-xs text-gray-500 mb-8 leading-relaxed">
          Bu metin standartların üzerinde bir bilişsel yoğunluğa sahip. Göz kaslarınızı hazırlamak
          için 60 saniyelik bir egzersiz ister misiniz?
        </p>
        <div className="space-y-3">
          <button
            onClick={onStartExercise}
            className="w-full py-4 bg-white text-black rounded-2xl font-bold text-sm hover:bg-gray-200 transition"
          >
            Isınmayı Başlat
          </button>
          <button
            onClick={onSkip}
            className="w-full py-4 bg-white/5 text-gray-500 rounded-2xl font-bold text-sm hover:bg-white/10 transition"
          >
            Doğrudan Okumaya Geç
          </button>
        </div>
      </div>
    </div>
  );
}

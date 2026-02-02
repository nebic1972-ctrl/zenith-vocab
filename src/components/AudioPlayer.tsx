'use client';

import { useState, useEffect, useCallback } from 'react';
import { Play, Pause, X, Headphones } from 'lucide-react';
import { voiceEngine } from '@/lib/ttsEngine';

type AudioPlayerProps = {
  text: string;
  onClose: () => void;
};

export default function AudioPlayer({ text, onClose }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1.0);

  const handlePlay = useCallback(() => {
    if (isPlaying) {
      voiceEngine.pause();
      setIsPlaying(false);
    } else {
      if (typeof window !== 'undefined' && window.speechSynthesis.paused) {
        voiceEngine.resume();
      } else {
        voiceEngine.speak(text, speed, () => setIsPlaying(false));
      }
      setIsPlaying(true);
    }
  }, [isPlaying, text, speed]);

  const changeSpeed = useCallback(() => {
    const newSpeed = speed >= 2 ? 0.8 : speed + 0.2;
    setSpeed(newSpeed);
    voiceEngine.cancel();
    if (text) {
      voiceEngine.speak(text, newSpeed, () => setIsPlaying(false));
      setIsPlaying(true);
    }
  }, [text, speed]);

  useEffect(() => {
    if (text) {
      voiceEngine.speak(text, speed, () => setIsPlaying(false));
      setIsPlaying(true);
    }
    return () => voiceEngine.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-[100] bg-[#111]/90 backdrop-blur-xl border-t border-white/10 p-4 pb-8 animate-in slide-in-from-bottom-full duration-500"
      role="region"
      aria-label="Sesli okuma"
    >
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center relative overflow-hidden">
            <div
              className={`flex items-end gap-1 ${isPlaying ? 'opacity-100' : 'opacity-50'}`}
              aria-hidden
            >
              <div className="w-1 h-3 bg-blue-500 animate-[bounce_1s_infinite]" />
              <div className="w-1 h-5 bg-blue-400 animate-[bounce_1.2s_infinite]" />
              <div className="w-1 h-2 bg-blue-600 animate-[bounce_0.8s_infinite]" />
            </div>
          </div>
          <div>
            <h3 className="text-white text-sm font-medium">Sesli Okuma Modu</h3>
            <span className="text-xs text-blue-400 flex items-center gap-1">
              <Headphones size={10} className="shrink-0" /> Neural Engine
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={changeSpeed}
            className="text-xs font-mono font-bold text-gray-400 hover:text-white border border-white/10 px-2 py-1 rounded-lg transition"
            aria-label={`Hız: ${speed.toFixed(1)}x`}
          >
            {speed.toFixed(1)}x
          </button>

          <button
            type="button"
            onClick={handlePlay}
            className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform shrink-0"
            aria-label={isPlaying ? 'Duraklat' : 'Oynat'}
          >
            {isPlaying ? (
              <Pause fill="currentColor" size={20} />
            ) : (
              <Play fill="currentColor" size={20} />
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-white p-2 transition-colors"
            aria-label="Kapat"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

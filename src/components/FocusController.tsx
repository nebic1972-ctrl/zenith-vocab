'use client';

import { useState } from 'react';
import { ambientMixer } from '@/lib/ambientEngine';
import type { SoundType } from '@/lib/ambientEngine';
import { Waves, Volume2, CloudRain, BrainCircuit } from 'lucide-react';

const SOUNDS: { id: SoundType; name: string; icon: React.ReactNode }[] = [
  { id: 'gamma_40hz', name: 'Derin Odak (40Hz)', icon: <BrainCircuit size={18} /> },
  { id: 'alpha_10hz', name: 'Akış Modu (Alpha)', icon: <Waves size={18} /> },
  { id: 'brown_noise', name: 'ADHD Kalkanı', icon: <Volume2 size={18} /> },
  { id: 'rain', name: 'Yağmur Sesi', icon: <CloudRain size={18} /> },
];

export default function FocusController() {
  const [activeSound, setActiveSound] = useState<SoundType | null>(null);
  const [volume, setVolume] = useState(0.5);

  const toggleSound = (id: SoundType) => {
    if (activeSound === id) {
      ambientMixer.stop();
      setActiveSound(null);
    } else {
      ambientMixer.play(id);
      setActiveSound(id);
    }
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    ambientMixer.setVolume(val);
  };

  return (
    <div className="bg-[#111]/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 w-64">
      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
        <Waves size={12} className="text-blue-500 shrink-0" /> Nöro-Akustik
        Katman
      </h3>

      <div className="space-y-2 mb-4">
        {SOUNDS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => toggleSound(s.id)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-medium transition-all ${
              activeSound === s.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {s.icon}
            {s.name}
            {activeSound === s.id && (
              <div
                className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse shrink-0"
                aria-hidden
              />
            )}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 text-gray-500" role="group" aria-label="Ses seviyesi">
        <Volume2 size={14} className="shrink-0" />
        <input
          type="range"
          min={0}
          max={1}
          step={0.1}
          value={volume}
          onChange={handleVolume}
          className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          aria-label="Ambient ses seviyesi"
        />
      </div>
    </div>
  );
}

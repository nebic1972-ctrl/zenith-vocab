'use client';

import { useNeuroStore } from '@/store/useNeuroStore';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts';

const cap = (v: number, max = 1000) => Math.min(max, Math.max(0, v));

export default function CognitiveRadar() {
  const xp = useNeuroStore((s) => s.xp);
  // Store'da stats yok; xp'den türetilmiş varsayılan değerlerle radar göster
  const focusScore = Math.min(1000, (xp % 1000) * 0.5);
  const comprehensionScore = Math.min(1000, (xp % 1000) * 0.4);
  const speedScore = 300 + (xp % 500);
  const streak = 0;
  const visualSpan = 400;

  const data = [
    { subject: 'Odak', A: cap(focusScore), fullMark: 1000 },
    { subject: 'Anlama', A: cap(comprehensionScore), fullMark: 1000 },
    { subject: 'Hız', A: cap(speedScore), fullMark: 1000 },
    { subject: 'İstikrar', A: cap(streak * 100), fullMark: 1000 },
    { subject: 'Görsel Alan', A: cap(visualSpan), fullMark: 1000 },
  ];

  return (
    <div className="w-full h-[300px] bg-[#111] border border-white/5 rounded-[2rem] p-6 flex flex-col">
      <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">
        Bilişsel Profil
      </h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid stroke="#333" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 10 }} />
            <Radar
              name="Profil"
              dataKey="A"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.3}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

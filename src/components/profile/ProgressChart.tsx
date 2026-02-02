'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useNeuroStore } from '@/store/useNeuroStore';

export default function ProgressChart() {
  const { history } = useNeuroStore();

  // Veriyi hazırla (Son 10 kayıt)
  const data = history.slice(-10).map((item, index) => ({
    name: index + 1,
    wpm: item.wpm,
    date: item.date
  }));

  if (data.length < 2) {
    return (
      <div className="h-64 flex items-center justify-center text-zinc-500 bg-zinc-900/50 rounded-3xl border border-zinc-800 border-dashed">
        <p>Grafik için en az 2 okuma yapmalısın.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-64 bg-zinc-900 border border-zinc-800 rounded-3xl p-4 relative overflow-hidden">
      <h3 className="text-sm font-bold text-zinc-400 mb-4 absolute top-6 left-6">Gelişim Eğrisi (WPM)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <defs>
            <linearGradient id="colorWpm" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
          <XAxis dataKey="name" hide />
          <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '12px', color: '#fff' }}
            itemStyle={{ color: '#a78bfa' }}
          />
          <Line 
            type="monotone" 
            dataKey="wpm" 
            stroke="#8b5cf6" 
            strokeWidth={3} 
            dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0 }} 
            activeDot={{ r: 8 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

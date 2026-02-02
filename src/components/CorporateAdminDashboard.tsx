'use client';

import { ShieldCheck } from 'lucide-react';

export default function CorporateAdminDashboard() {
  const departmentStats = [
    { name: 'Yazılım', focus: 88, speed: 450, accuracy: 92 },
    { name: 'Pazarlama', focus: 72, speed: 380, accuracy: 85 },
    { name: 'İK', focus: 95, speed: 310, accuracy: 98 },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-gray-400 p-10">
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-white text-3xl font-medium tracking-tight">Kurumsal Analitik</h1>
          <p className="text-xs text-gray-600 mt-2 uppercase tracking-widest font-bold">
            Organizasyonel Bilişsel Performans
          </p>
        </div>
        <div className="px-6 py-3 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex items-center gap-3">
          <ShieldCheck className="text-blue-500 shrink-0" size={20} />
          <span className="text-xs text-blue-500 font-bold uppercase tracking-tighter italic font-serif">
            GDPR Uyumlu / Anonim Veri
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {departmentStats.map((dept, i) => (
          <div
            key={i}
            className="bg-[#111] border border-white/5 p-8 rounded-[2.5rem] hover:border-white/10 transition-all group"
          >
            <h3 className="text-white text-xl font-medium mb-6">{dept.name} Departmanı</h3>
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-gray-600 uppercase">Odaklanma</span>
                <span className="text-white font-mono">{dept.focus}%</span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-1000"
                  style={{ width: `${dept.focus}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                <div>
                  <span className="block text-[8px] text-gray-600 uppercase font-bold mb-1">
                    Ort. Hız
                  </span>
                  <span className="text-sm text-gray-300 font-mono">{dept.speed} WPM</span>
                </div>
                <div>
                  <span className="block text-[8px] text-gray-600 uppercase font-bold mb-1">
                    Anlama
                  </span>
                  <span className="text-sm text-gray-300 font-mono">%{dept.accuracy}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

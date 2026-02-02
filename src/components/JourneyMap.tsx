'use client';

import { useNeuroStore } from '@/store/useNeuroStore';
import { Mountain, Flag, CheckCircle2 } from 'lucide-react';

export default function JourneyMap() {
  const { achievements } = useNeuroStore();

  return (
    <div className="bg-[#111] border border-white/5 rounded-[2rem] p-8">
      <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-8">
        Gelişim Yolculuğu
      </h3>
      <div className="relative space-y-12 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-blue-500 before:to-transparent before:content-['']">
        {achievements.map((ach) => (
          <div key={ach.id} className="relative flex items-center justify-between group">
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#111] z-10 transition-colors ${
                  ach.isUnlocked ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-500'
                }`}
              >
                {ach.isUnlocked ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <Mountain size={16} />
                )}
              </div>
              <div className="ml-6">
                <h4
                  className={`text-sm font-bold ${
                    ach.isUnlocked ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  {ach.title}
                </h4>
                <p className="text-[10px] text-gray-500">{ach.description}</p>
              </div>
            </div>
            {ach.isUnlocked && (
              <Flag size={14} className="text-blue-500 opacity-50 shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

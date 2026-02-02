"use client";
import { Trophy } from "lucide-react";

export default function CognitiveLeague() {
  return (
    <div className="bg-[#111] border border-white/5 rounded-[2.5rem] p-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-500/10 rounded-xl text-yellow-500">
            <Trophy size={20} />
          </div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Global Lig: Bronze</span>
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02]">
           <span className="text-sm font-medium text-gray-400">User_882</span>
           <span className="text-xs font-mono text-gray-300">1250 XP</span>
        </div>
        <div className="flex items-center justify-between p-4 rounded-2xl bg-blue-600/10 border border-blue-500/20">
           <span className="text-sm font-medium text-white">Siz</span>
           <span className="text-xs font-mono text-white">0 XP</span>
        </div>
      </div>
    </div>
  );
}
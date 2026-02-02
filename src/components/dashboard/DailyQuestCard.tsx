"use client";

export default function DailyQuestCard() {
  return (
    <div className="bg-[#111] border border-blue-500/20 rounded-[2.5rem] p-8">
      <h2 className="text-white text-xl font-bold">Günün Görevi</h2>
      <p className="text-gray-400 text-sm mb-4">20 Dakika Odaklanma</p>
      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
        Başlat
      </button>
    </div>
  );
}
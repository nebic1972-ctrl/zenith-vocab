'use client';

import { Moon, Volume2, Type, Bell } from 'lucide-react';

const settingsItems = [
  {
    icon: Moon,
    label: 'Karanlık Mod',
    desc: 'Sistem varsayılanı kullanılıyor',
  },
  {
    icon: Type,
    label: 'Font Seçimi',
    desc: 'Disleksi dostu font aktif',
  },
  {
    icon: Volume2,
    label: 'Ses Efektleri',
    desc: 'Arayüz sesleri',
  },
  {
    icon: Bell,
    label: 'Bildirimler',
    desc: 'Haftalık rapor e-postaları',
  },
];

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-[#050505] pl-72 pr-8 py-8 text-white">
      <h1 className="text-3xl font-medium mb-10">Uygulama Ayarları</h1>

      <div className="bg-[#111] border border-white/5 rounded-[2rem] overflow-hidden">
        {settingsItems.map((item, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-6 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/5 rounded-xl text-gray-400">
                <item.icon size={20} />
              </div>
              <div>
                <h4 className="font-medium">{item.label}</h4>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            </div>
            <button
              type="button"
              aria-label={`${item.label} aç/kapat`}
              className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer flex-shrink-0"
            >
              <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-md" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

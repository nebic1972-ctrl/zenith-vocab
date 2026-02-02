'use client';

import React, { useState } from 'react';
import { useNeuroStore } from '@/store/useNeuroStore';
import { X, Key, Save, ShieldCheck, Settings2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface GlobalSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSettings({ isOpen, onClose }: GlobalSettingsProps) {
  const { apiKey, setApiKey } = useNeuroStore();
  const [tempKey, setTempKey] = useState(apiKey || '');

  const handleSave = () => {
    setApiKey(tempKey);
    onClose();
    alert("Ayarlar kaydedildi ve sistem güncellendi! 🚀");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings2 size={24} className="text-purple-500"/> Sistem Ayarları
          </h2>
          <button onClick={onClose}><X className="text-zinc-500 hover:text-white"/></button>
        </div>

        <div className="space-y-6">
          {/* API KEY BÖLÜMÜ */}
          <div>
            <label className="text-sm font-bold text-zinc-400 mb-2 block flex items-center gap-2">
              <Key size={16}/> Gemini API Anahtarı
            </label>
            <div className="relative">
              <input 
                type="password" 
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                placeholder="AI özellikleri için anahtar girin..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:border-purple-500 outline-none pr-10"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                {apiKey && <ShieldCheck size={18} />}
              </div>
            </div>
            <p className="text-xs text-zinc-600 mt-2">
              Anahtarınız sadece tarayıcınızda (LocalStorage) saklanır. Sunucuya gönderilmez.
            </p>
          </div>

          <button 
            onClick={handleSave}
            className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <Save size={18} /> Kaydet ve Çık
          </button>
        </div>
      </motion.div>
    </div>
  );
}
